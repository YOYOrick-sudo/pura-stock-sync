import { useMemo, useState } from 'react';
import { SidebarLayout } from '@/components/SidebarLayout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useUserLocation } from '@/contexts/UserLocationContext';
import { useLaatstGeteld } from '@/hooks/useVoorraadModule';
import { useIsMobile } from '@/hooks/use-mobile';
import { KaartKop, LijstKaart } from '@/components/pura';

export default function VoorraadStand() {
  const isMobile = useIsMobile();
  const { userLocation } = useUserLocation();
  const { data: regels = [], isLoading } = useLaatstGeteld(userLocation ?? undefined);
  const [zoek, setZoek] = useState('');

  const zichtbaar = useMemo(
    () => regels.filter((r) => r.naam.toLowerCase().includes(zoek.toLowerCase())),
    [regels, zoek],
  );

  const gegroepeerd = useMemo(() => {
    const map = new Map<string, typeof zichtbaar>();
    zichtbaar.forEach((r) => {
      const key = r.categorie ?? 'Overig';
      map.set(key, [...(map.get(key) ?? []), r]);
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [zichtbaar]);

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
        <p className="text-sm text-muted-foreground">
          Wat er bij de laatste telling stond. Dit is geen live voorraad — verbruik wordt niet bijgehouden.
        </p>

        <Input
          placeholder="Zoek artikel…"
          value={zoek}
          onChange={(e) => setZoek(e.target.value)}
          className={isMobile ? 'h-11 min-w-0 text-base' : 'h-12'}
        />

        {isLoading && <Card className="p-4 text-sm">Laden…</Card>}
        {!isLoading && zichtbaar.length === 0 && (
          <Card className="p-4 text-sm text-muted-foreground">Geen artikelen gevonden.</Card>
        )}

        {gegroepeerd.map(([categorie, items]) => (
          isMobile ? <LijstKaart key={categorie} kop={<KaartKop titel={categorie} />}>
            <div className="divide-y divide-border">
              {items.map((r) => (
                <div key={r.artikel_id} className="flex min-h-12 min-w-0 items-center gap-2 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{r.naam}</div>
                    <div className="truncate text-xs text-muted-foreground">
                      {r.route}
                      {r.datum ? ` · geteld ${new Date(`${r.datum}T12:00:00`).toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}` : ' · nog nooit geteld'}
                    </div>
                  </div>
                  {r.aantal === null ? <Badge variant="secondary">—</Badge> : (
                    <div className="shrink-0 text-right font-semibold tabular-nums">
                      {r.aantal} <span className="text-xs font-normal text-muted-foreground">{r.eenheid}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </LijstKaart> :
          <div key={categorie} className="space-y-2">
            <h2 className="text-sm font-medium text-muted-foreground pt-2">{categorie}</h2>
            {items.map((r) => (
              <Card key={r.artikel_id} className="p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{r.naam}</div>
                  <div className="text-xs text-muted-foreground">
                    {r.route}
                    {r.datum
                      ? ` · geteld ${new Date(`${r.datum}T12:00:00`).toLocaleDateString('nl-NL', {
                          day: 'numeric',
                          month: 'short',
                        })}`
                      : ' · nog nooit geteld'}
                  </div>
                </div>
                {r.aantal === null ? (
                  <Badge variant="secondary">—</Badge>
                ) : (
                  <div className="text-lg font-semibold tabular-nums">
                    {r.aantal} <span className="text-sm font-normal text-muted-foreground">{r.eenheid}</span>
                  </div>
                )}
              </Card>
            ))}
          </div>
        ))}
      </div>
    </SidebarLayout>
  );
}
