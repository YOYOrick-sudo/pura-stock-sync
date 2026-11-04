import { useEffect, useMemo, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState, FoutRegel, KaartKop, KengetalVerdeling, LijstKaart, PaginaBalk, segmentTabsKlasse } from '@/components/pura';
import { BarChart3 } from 'lucide-react';
import { OmzetGrafiek, type GrafiekVorm } from './OmzetGrafiek';
import {
  bouwOmzetBeeld,
  formatAantal,
  formatEuro,
  formatEuroVerschil,
  formatProcent,
  MAAND_KORT,
  procent1,
  type OmzetRegel,
  type Verschil,
  type VestigingKeuze,
} from '@/lib/omzet';

const VOET = 'Kassacijfers uit Lightspeed, excl btw; wijkt ongeveer 5% af van de boekhouding.';

type Toon = 'goed' | 'let-op' | 'neutraal';

function toonVan(procent: number | null): Toon {
  if (procent == null || procent1(procent) === 0) return 'neutraal';
  return procent > 0 ? 'goed' : 'let-op';
}

function hoofdletter(tekst: string): string {
  return tekst.charAt(0).toUpperCase() + tekst.slice(1);
}

export function OmzetInhoud({
  regels,
  jaar,
  jaren,
  onJaar,
  keuze,
  onKeuze,
  vandaag,
  startTab = 'maanden',
  laden = false,
  fout = false,
  onOpnieuw,
  melding,
}: {
  regels: OmzetRegel[];
  jaar: number;
  jaren: number[];
  onJaar: (jaar: number) => void;
  keuze: VestigingKeuze;
  onKeuze: (keuze: VestigingKeuze) => void;
  vandaag: string;
  startTab?: 'maanden' | 'maand' | 'jaar';
  laden?: boolean;
  fout?: boolean;
  onOpnieuw?: () => void;
  melding?: string;
}) {
  const [tab, setTab] = useState(startTab);
  const [vorm, setVorm] = useState<GrafiekVorm>('lijn');
  const [gekozenMaand, setGekozenMaand] = useState<number | null>(null);
  useEffect(() => { setGekozenMaand(null); }, [jaar]);
  const beeld = useMemo(() => bouwOmzetBeeld(regels, keuze, jaar, vandaag, gekozenMaand ?? undefined), [regels, keuze, jaar, vandaag, gekozenMaand]);
  const midsland = useMemo(() => bouwOmzetBeeld(regels, 'Midsland', jaar, vandaag, gekozenMaand ?? undefined), [regels, jaar, vandaag, gekozenMaand]);
  const west = useMemo(() => bouwOmzetBeeld(regels, 'West', jaar, vandaag, gekozenMaand ?? undefined), [regels, jaar, vandaag, gekozenMaand]);
  const maandNaam = hoofdletter(beeld.maand.naam);
  const leeg = !laden && !fout && regels.length === 0;

  return (
    <div className="space-y-4">
      {melding && <p className="rounded-polar-md border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">{melding}</p>}
      <PaginaBalk
        links={
          <Tabs value={keuze} onValueChange={(waarde) => onKeuze(waarde as VestigingKeuze)}>
            <TabsList className={segmentTabsKlasse} aria-label="Vestiging">
              <TabsTrigger value="Totaal">Totaal</TabsTrigger>
              <TabsTrigger value="Midsland">Midsland</TabsTrigger>
              <TabsTrigger value="West">West</TabsTrigger>
            </TabsList>
          </Tabs>
        }
        actie={
          <Select value={String(jaar)} onValueChange={(waarde) => onJaar(Number(waarde))}>
            <SelectTrigger className="h-11 w-28" aria-label="Jaar">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {jaren.map((optie) => (
                <SelectItem key={optie} value={String(optie)} className="min-h-11">{optie}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {laden ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Laden">
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
          <Skeleton className="h-36" />
        </div>
      ) : fout ? (
        <LijstKaart><FoutRegel tekst="De kassacijfers zijn niet geladen." onOpnieuw={onOpnieuw} /></LijstKaart>
      ) : leeg ? (
        <EmptyState icon={BarChart3} title="Nog geen kassadata" description="Er zijn geen Lightspeed-cijfers zichtbaar voor deze jaren." />
      ) : (
        <Tabs value={tab} onValueChange={(waarde) => setTab(waarde as typeof startTab)}>
          <TabsList className={`${segmentTabsKlasse} sm:justify-start`} aria-label="Overzicht">
            <TabsTrigger value="maanden">Maanden</TabsTrigger>
            <TabsTrigger value="maand">{maandNaam}</TabsTrigger>
            <TabsTrigger value="jaar">{jaar}</TabsTrigger>
          </TabsList>
          <div className="mt-4">
            <TabsContent value="maanden" className="mt-0 space-y-4">
              <LijstKaart
                kop={<KaartKop titel="Per maand" />}
                voet={beeld.dichtMaanden.length > 0 ? `Dicht in ${jaar}: ${beeld.dichtMaanden.map((m) => MAAND_KORT[m - 1]).join(', ')}` : undefined}
              >
                <div className="min-w-0 px-2 py-3 sm:px-4">
                  <Tabs value={vorm} onValueChange={(waarde) => setVorm(waarde as GrafiekVorm)}>
                    <TabsList className="mb-3 flex h-auto w-full justify-start gap-0 p-1 sm:w-fit [&>button]:min-h-11 [&>button]:flex-1 [&>button]:px-4 sm:[&>button]:flex-none" aria-label="Grafiek">
                      <TabsTrigger value="staaf">Staaf</TabsTrigger>
                      <TabsTrigger value="lijn">Lijn</TabsTrigger>
                    </TabsList>
                  </Tabs>
                  <OmzetGrafiek
                    punten={beeld.maanden}
                    jaren={jaren}
                    jaar={jaar}
                    vorm={vorm}
                    gekozen={beeld.maand.jaar === jaar ? beeld.maand.maand : 0}
                    onKies={setGekozenMaand}
                  />
                  <ul className="sr-only">
                    {beeld.maanden.map((punt) => (
                      <li key={punt.maand}>
                        {punt.label}: {punt.ditJaar == null ? 'dicht' : formatEuro(punt.ditJaar)}, vorig jaar {punt.vorigJaar == null ? 'dicht' : formatEuro(punt.vorigJaar)}
                        {punt.procent != null ? `, ${formatProcent(punt.procent)}` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              </LijstKaart>
              <MaandKaarten keuze={keuze} jaar={jaar} beeld={beeld} midsland={midsland} west={west} />
            </TabsContent>
            <TabsContent value="maand" className="mt-0">
              <MaandKaarten keuze={keuze} jaar={jaar} beeld={beeld} midsland={midsland} west={west} />
            </TabsContent>
            <TabsContent value="jaar" className="mt-0">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <KengetalVerdeling
                  label="Tot nu toe"
                  waarde={beeld.ytd.nu.dicht ? 'dicht' : formatEuro(beeld.ytd.nu.omzet)}
                  regels={vergelijkRegels(beeld.ytd.nu.dicht, beeld.ytd.verschil, beeld.ytd.toen.dicht ? null : beeld.ytd.toen.omzet, jaar - 1)}
                />
                <KengetalVerdeling
                  label={beeld.gelijk.label ? `${beeld.gelijk.label}, beide open` : 'Beide jaren open'}
                  waarde={formatProcent(beeld.gelijk.verschil.procent)}
                  regels={beeld.gelijk.maanden.length === 0 ? [] : [
                    { naam: String(jaar), waarde: formatEuro(beeld.gelijk.nu) },
                    { naam: String(jaar - 1), waarde: formatEuro(beeld.gelijk.toen) },
                    { naam: 'Verschil', waarde: formatEuroVerschil(beeld.gelijk.verschil.euro), toon: toonVan(beeld.gelijk.verschil.procent) },
                  ]}
                />
                {keuze === 'Totaal' ? (
                  <KengetalVerdeling
                    label="Gemiddelde bon"
                    waarde={beeld.ytd.gemBonNu == null ? 'dicht' : formatEuro(beeld.ytd.gemBonNu, true)}
                    regels={[
                      { naam: 'Bonnen', waarde: beeld.ytd.nu.bonnen > 0 ? formatAantal(beeld.ytd.nu.bonnen) : 'dicht' },
                      { naam: 'Midsland', waarde: midsland.ytd.gemBonNu == null ? 'dicht' : formatEuro(midsland.ytd.gemBonNu, true) },
                      { naam: 'West', waarde: west.ytd.gemBonNu == null ? 'dicht' : formatEuro(west.ytd.gemBonNu, true) },
                    ]}
                  />
                ) : (
                  <KengetalVerdeling
                    label="Per open dag"
                    waarde={beeld.ytd.perDagNu == null ? 'dicht' : formatEuro(beeld.ytd.perDagNu)}
                    regels={[
                      { naam: 'Open dagen', waarde: beeld.ytd.nu.dicht ? 'dicht' : formatAantal(beeld.ytd.nu.openDagen) },
                      { naam: 'Tegen vorig jaar', waarde: formatProcent(beeld.ytd.perDagVerschil.procent), toon: toonVan(beeld.ytd.perDagVerschil.procent) },
                      { naam: 'Gemiddelde bon', waarde: beeld.ytd.gemBonNu == null ? 'dicht' : formatEuro(beeld.ytd.gemBonNu, true) },
                    ]}
                  />
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      )}
      <p className="text-xs text-muted-foreground">{VOET}</p>
    </div>
  );
}

function MaandKaarten({
  keuze, jaar, beeld, midsland, west,
}: {
  keuze: VestigingKeuze;
  jaar: number;
  beeld: ReturnType<typeof bouwOmzetBeeld>;
  midsland: ReturnType<typeof bouwOmzetBeeld>;
  west: ReturnType<typeof bouwOmzetBeeld>;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <KengetalVerdeling
        label={beeld.maand.loopt ? 'Omzet · loopt nog' : 'Omzet'}
        waarde={beeld.maand.nu.dicht ? 'dicht' : formatEuro(beeld.maand.nu.omzet)}
        regels={vergelijkRegels(beeld.maand.nu.dicht, beeld.maand.verschil, beeld.maand.toen.dicht ? null : beeld.maand.toen.omzet, jaar - 1)}
      />
      <KengetalVerdeling
        label="Open dagen"
        waarde={openDagenWaarde(keuze, beeld.maand.nu.dicht, beeld.maand.nu.openDagen, midsland.maand.nu.openDagen, west.maand.nu.openDagen)}
        regels={keuze === 'Totaal'
          ? [
            { naam: 'Vorig jaar', waarde: `${formatAantal(midsland.maand.toen.openDagen)} · ${formatAantal(west.maand.toen.openDagen)}` },
            { naam: 'Midsland per dag', waarde: formatProcent(midsland.maand.perDagVerschil.procent), toon: toonVan(midsland.maand.perDagVerschil.procent) },
            { naam: 'West per dag', waarde: formatProcent(west.maand.perDagVerschil.procent), toon: toonVan(west.maand.perDagVerschil.procent) },
          ]
          : [
            { naam: 'Vorig jaar', waarde: beeld.maand.toen.dicht ? 'dicht' : formatAantal(beeld.maand.toen.openDagen) },
            { naam: 'Per dag', waarde: beeld.maand.perDagNu == null ? 'dicht' : formatEuro(beeld.maand.perDagNu) },
            { naam: 'Tegen vorig jaar', waarde: formatProcent(beeld.maand.perDagVerschil.procent), toon: toonVan(beeld.maand.perDagVerschil.procent) },
          ]}
      />
      <KengetalVerdeling
        label="Gemiddelde bon"
        waarde={beeld.maand.gemBonNu == null ? 'dicht' : formatEuro(beeld.maand.gemBonNu, true)}
        regels={[
          { naam: 'Bonnen', waarde: beeld.maand.nu.bonnen > 0 ? formatAantal(beeld.maand.nu.bonnen) : 'dicht' },
          { naam: 'Vorig jaar', waarde: beeld.maand.gemBonToen == null ? 'dicht' : formatEuro(beeld.maand.gemBonToen, true) },
        ]}
      />
    </div>
  );
}

function vergelijkRegels(dicht: boolean, verschil: Verschil, vorig: number | null, vorigJaar: number) {
  if (dicht) return [];
  return [
    { naam: 'Verschil', waarde: formatEuroVerschil(verschil.euro), toon: toonVan(verschil.procent) },
    { naam: 'Procent', waarde: formatProcent(verschil.procent), toon: toonVan(verschil.procent) },
    { naam: String(vorigJaar), waarde: vorig == null ? 'dicht' : formatEuro(vorig) },
  ];
}

function openDagenWaarde(keuze: VestigingKeuze, dicht: boolean, samen: number, midsland: number, west: number) {
  if (dicht) return 'dicht';
  if (keuze === 'Totaal') return `${formatAantal(midsland)} · ${formatAantal(west)}`;
  return formatAantal(samen);
}
