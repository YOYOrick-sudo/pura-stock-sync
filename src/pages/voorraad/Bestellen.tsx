import { useEffect, useMemo, useRef, useState } from 'react';
import { SidebarLayout } from '@/components/SidebarLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useUserLocation } from '@/contexts/UserLocationContext';
import { toast } from 'sonner';
import { AlertTriangle, ArrowLeft, Check, ClipboardList, Plus, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  RouteArtikel,
  useRouteArtikelen,
  useSaveTelregel,
  useStartTelronde,
  useTelregels,
  useTelronde,
  vandaagNL,
} from '@/hooks/useBestelronde';
import {
  bestellijstTekst,
  DashboardRoute,
  ROUTE_STATUS_LABEL,
  useBesteldMarkeren,
  useConceptOrder,
  useInkoopVersturen,
  useInternVersturen,
  useIsBeheerder,
  useRegelAantal,
  useRegelVerwijderen,
  useRouteDashboard,
  useTellingAfronden,
  useTellingHeropenen,
  useVoorstelDraaien,
} from '@/hooks/useVoorraadModule';

import { ExtraBestellenDialog } from '@/components/voorraad/ExtraBestellenDialog';

const STATUS_KLEUR: Record<string, string> = {
  te_tellen: 'bg-muted text-muted-foreground',
  telling_open: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
  niets_nodig: 'bg-muted text-muted-foreground',
  concept: 'bg-primary/10 text-primary',
  onderweg: 'bg-primary/10 text-primary',
};

export default function VoorraadBestellen() {
  const { userLocation } = useUserLocation();
  const navigate = useNavigate();
  const datum = vandaagNL();
  const [routeKey, setRouteKey] = useState<string | null>(null);
  const [extraOpen, setExtraOpen] = useState(false);

  const { data: routes = [], isLoading, refetch } = useRouteDashboard(userLocation ?? undefined, datum);
  const voorstel = useVoorstelDraaien();
  const gedraaid = useRef(false);

  // Voorstel één keer per bezoek bijwerken; de cron doet dit ook, dit is de vangnet-run.
  useEffect(() => {
    if (!userLocation || gedraaid.current) return;
    gedraaid.current = true;
    voorstel.mutateAsync({ vestiging: userLocation, datum }).catch(() => {
      /* stil: de lijst blijft bruikbaar, cron draait later opnieuw */
    });
  }, [userLocation, datum]);

  const route = routes.find((r) => r.key === routeKey) ?? null;

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
        <div className="flex items-center gap-3">
          {route && (
            <Button variant="ghost" size="icon" onClick={() => setRouteKey(null)} aria-label="Terug">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-semibold">{route ? route.naam : 'Bestellen'}</h1>
            <p className="text-sm text-muted-foreground">
              {userLocation} ·{' '}
              {new Date(`${datum}T12:00:00`).toLocaleDateString('nl-NL', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </p>
          </div>
          {!route && (
            <Button variant="outline" className="h-11" onClick={() => setExtraOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Extra
            </Button>
          )}
        </div>

        {!route && (
          <>
            {isLoading && <Card className="p-4 text-sm">Laden…</Card>}
            {!isLoading && routes.length === 0 && (
              <Card className="p-4 text-sm text-muted-foreground">
                Nog geen routes ingesteld. Voeg leveranciers en besteldagen toe via Instellingen → Voorraadketen.
              </Card>
            )}

            {routes.some((r) => r.vandaag) && (
              <h2 className="text-sm font-medium text-muted-foreground pt-2">Vandaag aan de beurt</h2>
            )}
            <div className="space-y-2">
              {routes
                .filter((r) => r.vandaag)
                .map((r) => (
                  <RouteKaart key={r.key} route={r} onClick={() => setRouteKey(r.key)} />
                ))}
            </div>

            {routes.some((r) => !r.vandaag) && (
              <h2 className="text-sm font-medium text-muted-foreground pt-4">Overige routes</h2>
            )}
            <div className="space-y-2">
              {routes
                .filter((r) => !r.vandaag)
                .map((r) => (
                  <RouteKaart key={r.key} route={r} onClick={() => setRouteKey(r.key)} />
                ))}
            </div>
          </>
        )}

        {route && (
          <RouteDetail
            route={route}
            vestiging={userLocation}
            datum={datum}
            onVernieuw={() => refetch()}
            onNaarOnderweg={() => navigate('/voorraad/onderweg')}
          />
        )}
      </div>

      <ExtraBestellenDialog
        open={extraOpen}
        onOpenChange={setExtraOpen}
        vestiging={userLocation}
        routes={routes}
      />
    </SidebarLayout>
  );
}

function RouteKaart({ route, onClick }: { route: DashboardRoute; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full text-left">
      <Card className="p-4 flex items-center gap-3 hover:bg-muted/40 min-h-[72px]">
        {route.type === 'leverancier' ? (
          <Truck className="h-5 w-5 text-muted-foreground shrink-0" />
        ) : (
          <ClipboardList className="h-5 w-5 text-muted-foreground shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{route.naam}</div>
          <div className="text-xs text-muted-foreground">
            {route.artikelen} artikelen
            {route.deadline ? ` · deadline ${route.deadline.slice(0, 5)}` : ''}
            {route.conceptRegels > 0 ? ` · ${route.conceptRegels} op het voorstel` : ''}
            {route.onderweg > 0 ? ` · ${route.onderweg} onderweg` : ''}
          </div>
        </div>
        <Badge className={`${STATUS_KLEUR[route.status]} border-0`}>{ROUTE_STATUS_LABEL[route.status]}</Badge>
      </Card>
    </button>
  );
}

function RouteDetail({
  route,
  vestiging,
  datum,
  onVernieuw,
  onNaarOnderweg,
}: {
  route: DashboardRoute;
  vestiging: string;
  datum: string;
  onVernieuw: () => void;
  onNaarOnderweg: () => void;
}) {
  const { data: telronde } = useTelronde(vestiging, route as any, datum);
  const { data: artikelen = [], isLoading } = useRouteArtikelen(vestiging, route as any);
  const { data: regels } = useTelregels(telronde?.id);
  const { data: concept } = useConceptOrder(route, vestiging);
  const { data: isBeheerder } = useIsBeheerder();
  const startRonde = useStartTelronde();
  const saveRegel = useSaveTelregel();
  const voorstel = useVoorstelDraaien();
  const wijzigAantal = useRegelAantal();
  const verwijderRegel = useRegelVerwijderen();
  const internVersturen = useInternVersturen();
  const afronden = useTellingAfronden();
  const heropenen = useTellingHeropenen();
  const inkoopVersturen = useInkoopVersturen();
  const besteldMarkeren = useBesteldMarkeren();

  const geteld = regels ? regels.size : 0;
  const voortgang = artikelen.length ? Math.round((geteld / artikelen.length) * 100) : 0;
  const nietGeteld = useMemo(
    () => artikelen.filter((a) => !regels?.has(a.artikel_id)).map((a) => a.naam),
    [artikelen, regels],
  );
  const afgerond = telronde?.status === 'afgerond';
  const dicht = route.rondeDicht;
  const [gekopieerd, setGekopieerd] = useState(false);


  const opslaan = async (artikel: RouteArtikel, waarde: string) => {
    // Na een geplaatste bestelling is de ronde definitief dicht: tellen start een nieuwe ronde.
    let rondeId = afgerond && dicht ? undefined : telronde?.id;
    if (!rondeId) {
      try {
        const nieuw = await startRonde.mutateAsync({ vestiging, route: route as any, datum });
        rondeId = nieuw.id;
      } catch (e: any) {
        toast.error('Tellen starten mislukt', { description: e.message });
        return;
      }
    }

    const aantal = Number(waarde.replace(',', '.'));
    if (!Number.isFinite(aantal)) return;
    try {
      await saveRegel.mutateAsync({ telrondeId: rondeId!, artikel, aantal });
      onVernieuw();
    } catch (e: any) {
      toast.error('Opslaan mislukt', { description: e.message });
    }
  };

  const klaarMetTellen = async () => {
    if (!telronde?.id) {
      toast.error('Er is nog niets geteld');
      return;
    }
    try {
      await afronden.mutateAsync({ telrondeId: telronde.id, vestiging, datum });
      toast.success('Telling afgerond — bekijk het voorstel');
      onVernieuw();
    } catch (e: any) {
      toast.error('Afronden mislukt', { description: e.message });
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span>
            {geteld} van {artikelen.length} geteld
          </span>
          <Badge className={`${STATUS_KLEUR[route.status]} border-0`}>{ROUTE_STATUS_LABEL[route.status]}</Badge>
        </div>
        <Progress value={voortgang} />
        <p className="text-xs text-muted-foreground">
          {afgerond
            ? dicht
              ? 'Deze ronde is besteld en daarmee klaar. Nieuw tellen start een nieuwe ronde.'
              : 'Telling afgerond. Hieronder staat het voorstel.'
            : 'Vul in wat er nog staat. Klaar? Rond de telling onderaan af.'}
        </p>
        {afgerond && !dicht && (
          <Button
            variant="outline"
            className="w-full h-12"
            disabled={heropenen.isPending}
            onClick={() =>
              heropenen
                .mutateAsync(telronde.id)
                .then(() => onVernieuw())
                .catch((e) => toast.error('Verder tellen mislukt', { description: e.message }))
            }
          >
            Verder tellen
          </Button>
        )}
      </Card>


      {isLoading && <Card className="p-4 text-sm">Laden…</Card>}
      {!isLoading && artikelen.length === 0 && (
        <Card className="p-4 text-sm text-muted-foreground">
          Geen artikelen op deze route. Koppel ze via Instellingen → Voorraadketen.
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
                  Bestelgrens {a.min_voorraad} · aanvullen tot {a.max_voorraad} {a.basis_eenheid_code}
                </div>
                {a.conversie_ontbreekt && (
                  <div className="flex items-center gap-1 text-xs text-amber-600 mt-1">
                    <AlertTriangle className="h-4 w-4" />
                    Omrekening ontbreekt — staat op de fixlijst
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  inputMode="decimal"
                  defaultValue={regel?.geteld_aantal ?? ''}
                  onBlur={(e) => e.target.value !== '' && opslaan(a, e.target.value)}
                  className="w-24 h-12 text-lg text-right"
                />
                <span className="w-12 text-sm text-muted-foreground">{a.tel_eenheid_code}</span>
                {regel && <Check className="h-5 w-5 text-primary" />}
              </div>
            </Card>
          );
        })}
      </div>

      {!afgerond && artikelen.length > 0 && (
        <Button
          size="lg"
          className="w-full h-14"
          disabled={afronden.isPending || geteld === 0}
          onClick={klaarMetTellen}
        >
          Klaar met tellen
        </Button>
      )}
      {!afgerond && geteld > 0 && nietGeteld.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          {nietGeteld.length} artikelen nog niet geteld — die blijven straks als "niet geteld" staan.
        </p>
      )}

      {afgerond && (
      <Card className="p-4 space-y-3">

        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Wat wordt besteld</h2>
          {concept?.leverdatum && (
            <span className="text-sm text-muted-foreground">
              levering {new Date(`${concept.leverdatum}T12:00:00`).toLocaleDateString('nl-NL', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              })}
            </span>
          )}
        </div>

        {!concept && (
          <p className="text-sm text-muted-foreground">
            Nog niets nodig op deze route — alles zit boven de bestelgrens.
          </p>
        )}

        {concept?.regels.map((r) => (
          <div key={r.id} className="flex items-center gap-3 border-b border-border last:border-0 py-2">
            <div className="flex-1 min-w-0">
              <div className="truncate">{r.omschrijving}</div>
              <div className="text-xs text-muted-foreground">
                {r.bron === 'handmatig' ? 'Handmatig toegevoegd' : 'Voorstel'}
                {r.handmatig_aangepast && r.bron !== 'handmatig' ? ' · aangepast' : ''}
              </div>
            </div>
            <Input
              type="number"
              inputMode="decimal"
              defaultValue={r.aantal}
              className="w-24 h-12 text-lg text-right"
              onBlur={(e) => {
                const waarde = Number(e.target.value.replace(',', '.'));
                if (!Number.isFinite(waarde) || waarde === r.aantal) return;
                wijzigAantal
                  .mutateAsync({ type: concept.type, regelId: r.id, aantal: waarde })
                  .catch((err) => toast.error('Aanpassen mislukt', { description: err.message }));
              }}
            />
            <span className="w-12 text-sm text-muted-foreground">{r.eenheid}</span>
            {isBeheerder && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  verwijderRegel
                    .mutateAsync({ type: concept.type, regelId: r.id })
                    .catch((err) => toast.error('Verwijderen mislukt', { description: err.message }))
                }
              >
                Weg
              </Button>
            )}
          </div>
        ))}

        {concept && nietGeteld.length > 0 && (
          <div className="rounded-polar bg-amber-50 dark:bg-amber-950/30 p-3 text-xs">
            <span className="font-medium">Nog niet geteld ({nietGeteld.length}): </span>
            {nietGeteld.join(', ')}
          </div>
        )}

        {concept && concept.type === 'intern' && (
          <Button
            size="lg"
            className="w-full h-14"
            disabled={internVersturen.isPending || concept.regels.length === 0}
            onClick={() =>
              internVersturen
                .mutateAsync(concept.id)
                .then(() => {
                  toast.success('Aanvraag verstuurd naar ' + concept.titel);
                  onVernieuw();
                  onNaarOnderweg();
                })
                .catch((e) => toast.error('Versturen mislukt', { description: e.message }))
            }
          >
            Stuur naar {concept.titel}
          </Button>
        )}

        {concept && concept.type === 'inkoop' && (route.kanaal === 'portal' || route.kanaal === 'mail') && (
          <div className="space-y-2">
            {!gekopieerd ? (
              <Button
                size="lg"
                className="w-full h-14"
                disabled={concept.regels.length === 0}
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(bestellijstTekst(concept, vestiging));
                    setGekopieerd(true);
                    toast.success('Bestellijst gekopieerd — plak hem in de portal of de mail');
                  } catch {
                    toast.error('Kopiëren mislukt — selecteer de lijst handmatig');
                  }
                }}
              >
                Kopieer bestellijst
              </Button>
            ) : (
              <Button
                size="lg"
                className="w-full h-14"
                disabled={besteldMarkeren.isPending}
                onClick={() =>
                  besteldMarkeren
                    .mutateAsync(concept.id)
                    .then(() => {
                      toast.success('Genoteerd als besteld');
                      onVernieuw();
                      onNaarOnderweg();
                    })
                    .catch((e) => toast.error('Markeren mislukt', { description: e.message }))
                }
              >
                Gemarkeerd als besteld
              </Button>
            )}
          </div>
        )}

        {concept && concept.type === 'inkoop' && route.kanaal === 'api' && (
          <div className="space-y-2">
            <Button
              size="lg"
              className="w-full h-14"
              disabled={!isBeheerder || inkoopVersturen.isPending || concept.regels.length === 0}
              onClick={() =>
                inkoopVersturen
                  .mutateAsync(concept.id)
                  .then(() => {
                    toast.success('Bestelling verstuurd naar ' + concept.titel);
                    onVernieuw();
                    onNaarOnderweg();
                  })
                  .catch((e) => toast.error('Versturen mislukt', { description: e.message }))
              }
            >
              Verstuur naar {concept.titel}
            </Button>
            {!isBeheerder && (
              <p className="text-xs text-muted-foreground text-center">Een manager verstuurt deze bestelling.</p>
            )}
          </div>
        )}

        {concept && concept.type === 'inkoop' && !['portal', 'mail', 'api'].includes(route.kanaal ?? '') && (
          <div className="text-sm text-muted-foreground">
            Er staat nog geen bestelkanaal bij deze leverancier. Stel dat in via Instellingen → Voorraadketen.
          </div>
        )}
      </Card>
      )}
    </div>
  );

}
