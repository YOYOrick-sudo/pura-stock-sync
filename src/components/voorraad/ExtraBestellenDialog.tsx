import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { DashboardRoute, useExtraBestellen, useRouteArtikelKeuze } from '@/hooks/useVoorraadModule';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vestiging: string;
  routes: DashboardRoute[];
}

export function ExtraBestellenDialog({ open, onOpenChange, vestiging, routes }: Props) {
  const [routeKey, setRouteKey] = useState<string | null>(null);
  const [artikelId, setArtikelId] = useState<string | null>(null);
  const [aantal, setAantal] = useState('1');
  const [zoek, setZoek] = useState('');

  const route = routes.find((r) => r.key === routeKey) ?? null;
  const { data: artikelen = [] } = useRouteArtikelKeuze(vestiging, route);
  const extra = useExtraBestellen();

  const sluit = () => {
    setRouteKey(null);
    setArtikelId(null);
    setAantal('1');
    setZoek('');
    onOpenChange(false);
  };

  const bevestig = async () => {
    if (!route || !artikelId) return;
    const waarde = Number(aantal.replace(',', '.'));
    if (!Number.isFinite(waarde) || waarde <= 0) {
      toast.error('Vul een aantal groter dan nul in');
      return;
    }
    try {
      const res = await extra.mutateAsync({ vestiging, route, artikelId, aantal: waarde });
      toast.success('Toegevoegd aan de bestelling', { description: res?.melding ?? undefined });
      sluit();
    } catch (e: any) {
      toast.error('Toevoegen mislukt', { description: e.message });
    }
  };

  const zichtbaar = artikelen.filter((a: any) => a.naam.toLowerCase().includes(zoek.toLowerCase()));

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(true) : sluit())}>
      <DialogContent className="max-w-[650px]">
        <DialogHeader>
          <DialogTitle>Extra bestellen</DialogTitle>
        </DialogHeader>

        {!route && (
          <div className="space-y-2">
            <Label>Waar bestel je het?</Label>
            {routes.length === 0 && (
              <p className="text-sm text-muted-foreground">Er zijn nog geen routes ingesteld.</p>
            )}
            {routes.map((r) => (
              <button
                key={r.key}
                onClick={() => setRouteKey(r.key)}
                className="w-full flex items-center justify-between rounded-polar border border-border p-4 text-left hover:bg-muted/50 min-h-[56px]"
              >
                <span className="font-medium">{r.naam}</span>
                {r.vandaag && <span className="text-xs text-primary">vandaag aan de beurt</span>}
              </button>
            ))}
          </div>
        )}

        {route && (
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              Route: <span className="font-medium text-foreground">{route.naam}</span>{' '}
              <button className="underline ml-2" onClick={() => { setRouteKey(null); setArtikelId(null); }}>
                wijzigen
              </button>
            </div>

            <div className="space-y-2">
              <Label>Artikel</Label>
              <Input placeholder="Zoeken…" value={zoek} onChange={(e) => setZoek(e.target.value)} className="h-12" />
              <div className="max-h-56 overflow-auto space-y-1">
                {zichtbaar.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Geen artikelen gevonden op deze route. Koppel ze via Instellingen → Voorraadketen.
                  </p>
                )}
                {zichtbaar.map((a: any) => (
                  <button
                    key={a.id}
                    onClick={() => setArtikelId(a.id)}
                    className={`w-full rounded-polar border p-3 text-left min-h-[48px] ${
                      artikelId === a.id ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted/50'
                    }`}
                  >
                    {a.naam}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Aantal</Label>
              <Input
                type="number"
                inputMode="decimal"
                value={aantal}
                onChange={(e) => setAantal(e.target.value)}
                className="h-12 w-32 text-lg"
              />
            </div>

            <Button
              size="lg"
              className="w-full h-14"
              disabled={!artikelId || extra.isPending}
              onClick={bevestig}
            >
              Toevoegen aan bestelling
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
