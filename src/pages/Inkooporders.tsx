import { useState } from 'react';
import { SidebarLayout } from '@/components/SidebarLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useUserLocation } from '@/contexts/UserLocationContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Copy, Mail, Send, PackageCheck, AlertTriangle } from 'lucide-react';
import {
  INKOOP_STATUS_LABEL,
  InkoopOrder,
  bestelTekst,
  useInkoopOntvangst,
  useInkoopOrders,
  useInkoopRegels,
  useInkoopStatus,
} from '@/hooks/useBestelronde';

function StatusBadge({ status }: { status: string }) {
  const variant =
    status === 'verzenden_mislukt' ? 'destructive' : status === 'ontvangen' ? 'default' : 'secondary';
  return <Badge variant={variant as any}>{INKOOP_STATUS_LABEL[status] ?? status}</Badge>;
}

function OrderDetail({ order }: { order: InkoopOrder }) {
  const { data: regels = [] } = useInkoopRegels(order.id);
  const status = useInkoopStatus();
  const ontvangst = useInkoopOntvangst();
  const [ontvangen, setOntvangen] = useState<Record<string, string>>({});
  const [apiBezig, setApiBezig] = useState(false);

  const tekst = bestelTekst(order, regels);

  const kopieer = async () => {
    await navigator.clipboard.writeText(tekst);
    toast.success('Bestellijst gekopieerd');
  };

  const mail = () => {
    const onderwerp = `Bestelling ${order.bestelnummer} — Pura Vida ${order.vestiging}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(onderwerp)}&body=${encodeURIComponent(tekst)}`;
    status.mutate({ orderId: order.id, status: 'verzonden' });
  };

  const viaApi = async () => {
    setApiBezig(true);
    try {
      const { data, error } = await supabase.functions.invoke('bestelling-versturen-api', {
        body: { order_id: order.id },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success('Bestelling verstuurd naar de leverancier');
    } catch (e: any) {
      toast.error('Versturen mislukt', { description: e.message });
    } finally {
      setApiBezig(false);
    }
  };

  const bewaarOntvangst = async () => {
    const rijen = regels.map((r: any) => {
      const ingevuld = ontvangen[r.id];
      const waarde =
        ingevuld !== undefined && ingevuld !== ''
          ? Number(ingevuld.replace(',', '.'))
          : r.ontvangen_aantal !== null
            ? Number(r.ontvangen_aantal)
            : null;
      return { id: r.id, besteld: Number(r.aantal), ontvangen: waarde };
    });
    try {
      const nieuw = await ontvangst.mutateAsync({ orderId: order.id, regels: rijen });
      toast.success(nieuw === 'ontvangen' ? 'Volledig ontvangen' : 'Deels ontvangen vastgelegd');
    } catch (e: any) {
      toast.error('Ontvangst opslaan mislukt', { description: e.message });
    }
  };

  const magOntvangen = ['besteld', 'verzonden', 'deels_ontvangen'].includes(order.status);

  return (
    <div className="space-y-3 pt-3 border-t border-border">
      {order.laatste_fout && (
        <div className="flex items-start gap-2 rounded-polar bg-destructive/10 p-3 text-sm">
          <AlertTriangle className="h-4 w-4 mt-0.5" />
          <span>{order.laatste_fout}</span>
        </div>
      )}

      <div className="space-y-1">
        {regels.map((r: any) => (
          <div key={r.id} className="flex items-center gap-3 text-sm">
            <span className="w-24 text-muted-foreground">{r.artikelnummer ?? '—'}</span>
            <span className="flex-1 truncate">{r.omschrijving}</span>
            <span className="w-24 text-right">
              {Number(r.aantal)} {r.besteleenheid_code ?? ''}
            </span>
            {magOntvangen && (
              <Input
                type="number"
                inputMode="decimal"
                placeholder="ontv."
                defaultValue={r.ontvangen_aantal ?? ''}
                onChange={(e) => setOntvangen((s) => ({ ...s, [r.id]: e.target.value }))}
                className="w-24 h-11 text-right"
              />
            )}
            {r.is_backorder && <Badge variant="destructive">nalevering</Badge>}
          </div>
        ))}
        {regels.length === 0 && <p className="text-sm text-muted-foreground">Geen regels.</p>}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={kopieer}>
          <Copy className="h-4 w-4 mr-1" /> Kopieer bestellijst
        </Button>

        {order.kanaal === 'mail' && order.status === 'concept' && (
          <Button size="sm" onClick={mail}>
            <Mail className="h-4 w-4 mr-1" /> Mail versturen
          </Button>
        )}

        {order.kanaal === 'api' && ['concept', 'verzenden_mislukt'].includes(order.status) && (
          <Button size="sm" onClick={viaApi} disabled={apiBezig}>
            <Send className="h-4 w-4 mr-1" /> Versturen via API
          </Button>
        )}

        {order.kanaal !== 'api' && ['concept', 'verzonden'].includes(order.status) && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => status.mutate({ orderId: order.id, status: 'besteld' })}
          >
            Gemarkeerd als besteld
          </Button>
        )}

        {magOntvangen && (
          <Button size="sm" onClick={bewaarOntvangst} disabled={ontvangst.isPending}>
            <PackageCheck className="h-4 w-4 mr-1" /> Ontvangst opslaan
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Ontvangst legt alleen vast wat er binnenkwam; voorraadmutaties komen in een volgende stap.
      </p>
    </div>
  );
}

export default function Inkooporders() {
  const { userLocation } = useUserLocation();
  const { data: orders = [], isLoading } = useInkoopOrders(userLocation ?? undefined);
  const [open, setOpen] = useState<string | null>(null);

  return (
    <SidebarLayout>
      <div className="p-4 md:p-6 space-y-4 max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-semibold">Inkoopbestellingen</h1>
          <p className="text-sm text-muted-foreground">{userLocation}</p>
        </div>

        {isLoading && <p className="text-sm">Laden…</p>}
        {!isLoading && orders.length === 0 && (
          <Card className="p-4 text-sm text-muted-foreground">
            Nog geen bestellingen. Draai een bestelronde-check om een voorstel te maken.
          </Card>
        )}

        {orders.map((o) => (
          <Card key={o.id} className="p-4">
            <button
              className="w-full flex items-center gap-3 text-left"
              onClick={() => setOpen(open === o.id ? null : o.id)}
            >
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">
                  {o.leverancier_naam} · {o.bestelnummer}
                </div>
                <div className="text-xs text-muted-foreground">
                  {o.kanaal} · {o.leverdatum ? `levering ${o.leverdatum}` : 'geen leverdatum bekend'}
                </div>
              </div>
              <StatusBadge status={o.status} />
            </button>
            {open === o.id && <OrderDetail order={o} />}
          </Card>
        ))}
      </div>
    </SidebarLayout>
  );
}
