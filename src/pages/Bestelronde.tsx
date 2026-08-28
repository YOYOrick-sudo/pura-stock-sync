import { useMemo, useState } from 'react';
import { SidebarLayout } from '@/components/SidebarLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useUserLocation } from '@/contexts/UserLocationContext';
import { toast } from 'sonner';
import { AlertTriangle, ArrowLeft, Check, ClipboardList, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  BestelRoute,
  RouteArtikel,
  VoorstelResultaat,
  useAfrondenEnVoorstel,
  useBestelRoutes,
  useRouteArtikelen,
  useSaveTelregel,
  useStartTelronde,
  useTelregels,
  useTelronde,
  vandaagNL,
} from '@/hooks/useBestelronde';

export default function Bestelronde() {
  const { userLocation } = useUserLocation();
  const navigate = useNavigate();
  const [route, setRoute] = useState<BestelRoute | null>(null);
  const [voorstel, setVoorstel] = useState<VoorstelResultaat | null>(null);
  const datum = vandaagNL();

  const { data: routes = [], isLoading: routesLaden } = useBestelRoutes(userLocation ?? undefined);
  const { data: telronde } = useTelronde(userLocation ?? undefined, route, datum);
  const { data: artikelen = [], isLoading: artikelenLaden } = useRouteArtikelen(userLocation ?? undefined, route);
  const { data: regels } = useTelregels(telronde?.id);
  const startRonde = useStartTelronde();
  const saveRegel = useSaveTelregel();
  const afronden = useAfrondenEnVoorstel();

  const geteldAantal = useMemo(() => (regels ? regels.size : 0), [regels]);
  const voortgang = artikelen.length ? Math.round((geteldAantal / artikelen.length) * 100) : 0;

  const startOfPak = async () => {
    if (!route || !userLocation) return;
    if (telronde) return;
    try {
      await startRonde.mutateAsync({ vestiging: userLocation, route, datum });
    } catch (e: any) {
      toast.error('Telronde starten mislukt', { description: e.message });
    }
  };

  const opslaan = async (artikel: RouteArtikel, waarde: string) => {
    if (!telronde) return;
    const aantal = Number(waarde.replace(',', '.'));
    if (!Number.isFinite(aantal)) return;
    try {
      await saveRegel.mutateAsync({ telrondeId: telronde.id, artikel, aantal });
    } catch (e: any) {
      toast.error('Opslaan mislukt', { description: e.message });
    }
  };

  const rondAf = async () => {
    if (!telronde || !userLocation) return;
    try {
      const res = await afronden.mutateAsync({ telrondeId: telronde.id, vestiging: userLocation, datum });
      setVoorstel(res);
      toast.success('Bestelvoorstel gemaakt');
    } catch (e: any) {
      toast.error('Voorstel maken mislukt', { description: e.message });
    }
  };

  if (!userLocation) {
    return (
      <SidebarLayout>
        <div className="p-6 text-muted-foreground">Vestiging onbekend.</div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout>
      <div className="p-4 md:p-6 space-y-4 max-w-4xl mx-auto">
        <div className="flex items-center gap-3">
          {route && (
            <Button variant="ghost" size="icon" onClick={() => { setRoute(null); setVoorstel(null); }}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-semibold">Bestelronde-check</h1>
            <p className="text-sm text-muted-foreground">
              {route ? `${route.naam} — ${userLocation} — ${datum}` : `${userLocation} — ${datum}`}
            </p>
          </div>
        </div>

        {!route && (
          <Card className="p-4 space-y-3">
            <p className="text-sm text-muted-foreground">Kies de leverancier of interne route die je gaat tellen.</p>
            {routesLaden && <p className="text-sm">Laden…</p>}
            {!routesLaden && routes.length === 0 && (
              <div className="text-sm text-muted-foreground">
                Nog geen routes. Voeg leveranciers toe via Instellingen → Voorraadketen, of zet artikelen op de bron
                "interne order".
              </div>
            )}
            <div className="grid gap-2 sm:grid-cols-2">
              {routes.map((r) => (
                <button
                  key={r.key}
                  onClick={() => setRoute(r)}
                  className="flex items-center gap-3 rounded-polar border border-border p-4 text-left hover:bg-muted/50 min-h-[64px]"
                >
                  {r.type === 'leverancier' ? <Truck className="h-5 w-5" /> : <ClipboardList className="h-5 w-5" />}
                  <span className="font-medium">{r.naam}</span>
                  {r.kanaal && <Badge variant="secondary" className="ml-auto">{r.kanaal}</Badge>}
                </button>
              ))}
            </div>
          </Card>
        )}

        {route && !telronde && (
          <Card className="p-6 space-y-4 text-center">
            <p className="text-muted-foreground">Nog geen telronde voor vandaag op deze route.</p>
            <Button size="lg" onClick={startOfPak} disabled={startRonde.isPending}>
              Telronde starten
            </Button>
          </Card>
        )}

        {route && telronde && (
          <>
            <Card className="p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>{geteldAantal} van {artikelen.length} geteld</span>
                <Badge variant={telronde.status === 'afgerond' ? 'default' : 'secondary'}>
                  {telronde.status === 'afgerond' ? 'Afgerond' : 'Open'}
                </Badge>
              </div>
              <Progress value={voortgang} />
            </Card>

            {artikelenLaden && <p className="text-sm">Laden…</p>}
            {!artikelenLaden && artikelen.length === 0 && (
              <Card className="p-4 text-sm text-muted-foreground">
                Geen artikelen op deze route. Koppel artikelen aan de leverancier via Instellingen → Voorraadketen.
              </Card>
            )}

            <div className="space-y-2">
              {artikelen.map((a) => {
                const regel = regels?.get(a.artikel_id);
                return (
                  <Card key={a.artikel_id} className="p-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{a.naam}</div>
                      <div className="text-xs text-muted-foreground">
                        Minimum (bestelgrens) {a.min_voorraad} · Aanvullen tot {a.max_voorraad} · {a.basis_eenheid_code}
                      </div>
                      {a.conversie_ontbreekt && (
                        <div className="flex items-center gap-1 text-xs text-amber-600 mt-1">
                          <AlertTriangle className="h-4 w-4" />
                          Omrekening ontbreekt — staat op de fixlijst, telling wordt niet omgerekend
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        inputMode="decimal"
                        defaultValue={regel?.geteld_aantal ?? ''}
                        disabled={telronde.status === 'afgerond'}
                        onBlur={(e) => e.target.value !== '' && opslaan(a, e.target.value)}
                        className="w-24 h-12 text-lg text-right"
                      />
                      <span className="w-14 text-sm text-muted-foreground">{a.tel_eenheid_code}</span>
                      {regel && <Check className="h-5 w-5 text-primary" />}
                    </div>
                  </Card>
                );
              })}
            </div>

            {artikelen.length > 0 && telronde.status !== 'afgerond' && (
              <Button size="lg" className="w-full h-14" onClick={rondAf} disabled={afronden.isPending}>
                Ronde afronden en bestelvoorstel maken
              </Button>
            )}
          </>
        )}

        {voorstel && (
          <Card className="p-4 space-y-3">
            <h2 className="font-semibold">Bestelvoorstel</h2>
            {voorstel.orders.length === 0 && (
              <p className="text-sm text-muted-foreground">Niets te bestellen — alles zit boven de bestelgrens.</p>
            )}
            {voorstel.orders.map((o) => (
              <div key={o.order_id} className="flex items-center justify-between text-sm">
                <span>
                  {o.type === 'inkoop' ? 'Leveranciersbestelling' : 'Interne bestelling'} — {o.regels} regels
                  {o.leverdatum ? ` — levering ${o.leverdatum}` : ' — geen leverdatum bekend'}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(o.type === 'inkoop' ? '/inkooporders' : '/internal-orders')}
                >
                  Bekijken
                </Button>
              </div>
            ))}

            {voorstel.niet_geteld.length > 0 && (
              <div className="rounded-polar bg-amber-50 dark:bg-amber-950/30 p-3">
                <div className="text-sm font-medium mb-1">Niet geteld ({voorstel.niet_geteld.length})</div>
                <p className="text-xs text-muted-foreground mb-1">
                  Deze artikelen zijn deze ronde niet geteld en staan dus niet op het voorstel.
                </p>
                <div className="text-xs">{voorstel.niet_geteld.map((n) => n.naam).join(', ')}</div>
              </div>
            )}

            {voorstel.geen_leverancier.length > 0 && (
              <div className="rounded-polar bg-destructive/10 p-3">
                <div className="text-sm font-medium mb-1">
                  Geen leverancier gekoppeld ({voorstel.geen_leverancier.length})
                </div>
                <div className="text-xs">{voorstel.geen_leverancier.map((n) => n.naam).join(', ')}</div>
              </div>
            )}
          </Card>
        )}
      </div>
    </SidebarLayout>
  );
}
