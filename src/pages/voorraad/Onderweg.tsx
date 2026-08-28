import { useState } from 'react';
import { SidebarLayout } from '@/components/SidebarLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useUserLocation } from '@/contexts/UserLocationContext';
import { toast } from 'sonner';
import { OnderwegOrder, useOnderweg, useOntvangstVastleggen } from '@/hooks/useVoorraadModule';

export default function VoorraadOnderweg() {
  const { userLocation } = useUserLocation();
  const { data: orders = [], isLoading } = useOnderweg(userLocation ?? undefined);
  const [open, setOpen] = useState<string | null>(null);

  const lopend = orders.filter((o) => !o.historie);
  const historie = orders.filter((o) => o.historie).slice(0, 20);

  if (!userLocation) {
    return (
      <SidebarLayout>
        <div className="p-6 text-muted-foreground">Vestiging onbekend.</div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="p-4 md:p-6 space-y-4 max-w-4xl mx-auto pb-24">
        <div>
          <h1 className="text-2xl font-semibold">Onderweg</h1>
          <p className="text-sm text-muted-foreground">Verstuurde bestellingen en wat er binnenkomt.</p>
        </div>

        {isLoading && <Card className="p-4 text-sm">Laden…</Card>}
        {!isLoading && lopend.length === 0 && (
          <Card className="p-4 text-sm text-muted-foreground">Er is niets onderweg.</Card>
        )}

        <div className="space-y-2">
          {lopend.map((o) => (
            <OrderKaart
              key={o.id}
              order={o}
              open={open === o.id}
              onToggle={() => setOpen(open === o.id ? null : o.id)}
            />
          ))}
        </div>

        {historie.length > 0 && (
          <>
            <h2 className="text-sm font-medium text-muted-foreground pt-4">Afgehandeld</h2>
            <div className="space-y-2">
              {historie.map((o) => (
                <OrderKaart
                  key={o.id}
                  order={o}
                  open={open === o.id}
                  onToggle={() => setOpen(open === o.id ? null : o.id)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </SidebarLayout>
  );
}

function OrderKaart({ order, open, onToggle }: { order: OnderwegOrder; open: boolean; onToggle: () => void }) {
  const vastleggen = useOntvangstVastleggen();
  const [waarden, setWaarden] = useState<Record<string, string>>({});

  const bevestig = async (allesCompleet: boolean) => {
    const regels = order.regels.map((r) => {
      const ingevuld = waarden[r.id];
      const ontvangen = allesCompleet
        ? r.aantal
        : ingevuld === undefined || ingevuld === ''
          ? (r.ontvangen ?? r.aantal)
          : Number(ingevuld.replace(',', '.'));
      return { id: r.id, besteld: r.aantal, ontvangen: Number.isFinite(ontvangen) ? ontvangen : r.aantal };
    });
    try {
      const status = await vastleggen.mutateAsync({ order, regels });
      toast.success(
        status === 'ontvangen' || status === 'delivered' ? 'Ontvangst vastgelegd' : 'Deels ontvangen vastgelegd',
      );
    } catch (e: any) {
      toast.error('Vastleggen mislukt', { description: e.message });
    }
  };

  const afgehandeld = order.historie;

  return (
    <Card className="p-4 space-y-3">
      <button onClick={onToggle} className="w-full flex items-center gap-3 text-left min-h-[48px]">
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{order.titel}</div>
          <div className="text-xs text-muted-foreground">
            {order.nummer} · {order.regels.length} regels
            {order.leverdatum
              ? ` · ${new Date(`${order.leverdatum}T12:00:00`).toLocaleDateString('nl-NL', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                })}`
              : ''}
            {order.aangevraagdDoor ? ` · door ${order.aangevraagdDoor}` : ''}
          </div>
        </div>
        <Badge variant="secondary">{order.statusLabel}</Badge>
      </button>

      {open && (
        <div className="space-y-2">
          {order.regels.map((r) => (
            <div key={r.id} className="flex items-center gap-3 border-b border-border last:border-0 py-2">
              <div className="flex-1 min-w-0">
                <div className="truncate">{r.omschrijving}</div>
                <div className="text-xs text-muted-foreground">
                  besteld {r.aantal} {r.eenheid}
                  {r.ontvangen !== null ? ` · ontvangen ${r.ontvangen}` : ''}
                  {r.backorder ? ' · nalevering' : ''}
                </div>
              </div>
              {!afgehandeld && (
                <Input
                  type="number"
                  inputMode="decimal"
                  placeholder={String(r.aantal)}
                  value={waarden[r.id] ?? ''}
                  onChange={(e) => setWaarden((w) => ({ ...w, [r.id]: e.target.value }))}
                  className="w-24 h-12 text-lg text-right"
                />
              )}
            </div>
          ))}

          {!afgehandeld && (
            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <Button size="lg" className="h-14 flex-1" disabled={vastleggen.isPending} onClick={() => bevestig(true)}>
                Alles ontvangen
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-14 flex-1"
                disabled={vastleggen.isPending}
                onClick={() => bevestig(false)}
              >
                Deels ontvangen opslaan
              </Button>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
