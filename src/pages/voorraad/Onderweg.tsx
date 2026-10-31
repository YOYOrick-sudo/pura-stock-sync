import { hoeveelheid, telwoord } from '@/lib/hoeveelheid';
import { useState } from 'react';
import { SidebarLayout } from '@/components/SidebarLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useUserLocation } from '@/contexts/UserLocationContext';
import { toast } from 'sonner';
import { OnderwegOrder, useOnderweg, useOntvangstVastleggen } from '@/hooks/useVoorraadModule';
import { useIsMobile } from '@/hooks/use-mobile';

export default function VoorraadOnderweg() {
  const isMobile = useIsMobile();
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
      <div className={isMobile ? 'page-stack min-w-0 max-w-full !p-0 pb-24' : 'page-stack max-w-5xl pb-24'}>
        <p className="text-sm text-muted-foreground">Verstuurde bestellingen en wat er binnenkomt.</p>

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
  const isMobile = useIsMobile();
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
    <Card className={isMobile ? 'min-w-0 space-y-2 p-3' : 'p-4 space-y-3'}>
      <button onClick={onToggle} className={isMobile ? 'flex min-h-12 w-full min-w-0 items-center gap-2 text-left' : 'w-full flex items-center gap-3 text-left min-h-[48px]'}>
        <div className="flex-1 min-w-0">
          <div className="min-w-0 line-clamp-2 break-words font-medium">{order.titel}</div>
          <div className={isMobile ? 'break-words text-xs text-muted-foreground' : 'text-xs text-muted-foreground'}>
            {order.nummer} · {telwoord(order.regels.length, 'regel', 'regels')}
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
        <Badge variant="secondary" className={isMobile ? 'shrink-0 whitespace-nowrap' : undefined}>{order.statusLabel}</Badge>
      </button>

      {open && (
        <div className="space-y-2">
          {order.regels.map((r) => (
            <div key={r.id} className={isMobile ? 'flex min-h-12 min-w-0 flex-nowrap items-center gap-2 border-b border-border py-2 last:border-0' : 'flex flex-wrap items-center gap-3 border-b border-border py-2 last:border-0 sm:flex-nowrap'}>
              <div className="flex-1 min-w-0">
                <div className="min-w-0 line-clamp-2 break-words">{r.omschrijving}</div>
                <div className="text-xs text-muted-foreground">
                  besteld {hoeveelheid(r.aantal, r.eenheid)}
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
                  className={isMobile ? 'ml-auto h-11 w-20 shrink-0 text-right text-base tabular-nums' : 'ml-auto h-12 w-24 text-right text-lg'}
                />
              )}
            </div>
          ))}

          {!afgehandeld && (
            <div className={isMobile ? 'flex flex-col gap-2 pt-1 [&_button]:h-auto [&_button]:min-h-11 [&_button]:whitespace-normal [&_button]:py-3' : 'flex flex-col sm:flex-row gap-2 pt-1'}>
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
