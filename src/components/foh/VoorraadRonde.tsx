import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  ArrowRight,
  Check,
  ChefHat,
  ChevronDown,
  ClipboardList,
  Loader2,
  Minus,
  Plus,
  Refrigerator,
  Snowflake,
  Soup,
  ShoppingCart,
  Truck,
  Utensils,
  PackageCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  useKoelcelCheckItems,
  useKoelcelChecks,
  useKoelcelCheckMutaties,
  useDrukteModus,
  useOpenstaandeBestellingen,
  onderwegVoorItem,
  useBestelbordOpen,
  useMepOpenNamen,
  vervolgactieVoorRegel,
  doelAantal,
  isReserveItem,
  isVulItem,
  reserveDoel,
  vulnormWaarde,
  vulnormLabel,
  batchGrootte,
  bestelOpdracht,
  meldNodig,

  HERKOMST_LABEL,
  ketenKortLabel,
  type DrukteModus,
  type KoelcelCheckItem,
  type VoorraadPlek,
} from '@/hooks/useKoelcelCheck';
import { useCreateStickerPrintJob } from '@/hooks/useStickerProducten';
import { aantalLabel, getalLabel, formaatLabel, bakjeLabel } from '@/lib/voorraad-formaat';
import { useVoorraadLades, positieLabel, type VoorraadLade } from '@/hooks/useVoorraadLades';
import { LadePositie } from '@/components/voorraad/LadePositie';

type ItemMetCategorie = KoelcelCheckItem & { categorie?: string | null; formaat?: string | null };

/**
 * Waar de grijze ketenchip iets toevoegt. In de koelwerkbanklades niet: daar is
 * het bijvullen zelf al de boodschap en kost een extra label alleen ruimte.
 */
const KETEN_PLEKKEN: VoorraadPlek[] = ['koelcel', 'vriezer', 'magazijn', 'werkblad'];

/** Eén telblok binnen een opslagplek: een lade (koelwerkbank) of een categorie. */
interface Groep {
  sleutel: string;
  titel: string;
  subtitel: string | null;
  lade: VoorraadLade | null;
  items: ItemMetCategorie[];
  /** Lade die je wel ziet maar niet telt: leeg of bewust overgeslagen. */
  overslaan?: { reden: string; uitleg: string };
}

/** De plekken in de volgorde waarin je er fysiek langsloopt. */
const PLEK_VOLGORDE: {
  plek: VoorraadPlek;
  titel: string;
  icoon: typeof Refrigerator;
  alleenMaandag?: boolean;
}[] = [
  { plek: 'werkbank', titel: 'Koelwerkbank', icoon: Utensils },
  { plek: 'werkblad', titel: 'Toppings', icoon: Soup },
  { plek: 'koelcel', titel: 'Koelcel', icoon: Refrigerator },
  { plek: 'magazijn', titel: 'Magazijn', icoon: PackageCheck, alleenMaandag: true },
  { plek: 'vriezer', titel: 'Vriescel', icoon: Snowflake, alleenMaandag: true },
];

/** Vaste categorievolgorde. Zoet staat altijd onderaan. */
const CATEGORIE_VOLGORDE = [
  'Eiwitten',
  'Zuivel & kaas',
  'Spreads & mayonaises',
  'Groente & fruit',
  'Soep',
  'Brood',
  'Droog & overig',
  'Zoet',
];

/** De drie toestanden van een aangebroken bak. */
const REST_KEUZES: { label: string; waarde: number }[] = [
  { label: 'vol', waarde: 0 },
  { label: 'half', waarde: 0.5 },
  { label: 'bodempje', waarde: 0.25 },
];

/** Hoe vol het werkbakje van de koelwerkbank erbij staat. */
const VUL_KEUZES: { label: string; waarde: number }[] = [
  { label: 'vol', waarde: 1 },
  { label: 'half', waarde: 0.5 },
  { label: 'bodempje', waarde: 0.25 },
  { label: 'leeg', waarde: 0 },
];

/** Hoe een product geteld wordt. */
type TelModus = 'reserve' | 'vulling' | 'bakken';

/** "half" / "bodempje" / "leeg" — wat er geteld is bij een werkbakje. */
function vulKeuzeLabel(waarde: number): string {
  return VUL_KEUZES.find((k) => Math.abs(k.waarde - waarde) < 0.001)?.label ?? getalLabel(waarde);
}

function telModus(item: KoelcelCheckItem): TelModus {
  if (isReserveItem(item)) return 'reserve';
  if (isVulItem(item)) return 'vulling';
  return 'bakken';
}

function isMaandag(datum: string): boolean {
  const d = new Date(`${datum}T12:00:00`);
  return !Number.isNaN(d.getTime()) && d.getDay() === 1;
}

function stickerDatum(d: Date): string {
  return d
    .toLocaleDateString('nl-NL', { weekday: 'short', day: '2-digit', month: '2-digit' })
    .replace('.', '');
}

function categorieVan(item: ItemMetCategorie): string {
  return (item.categorie ?? '').trim() || 'Droog & overig';
}

/**
 * Hoeveel er nog gehaald moet worden: altijd hele bakken, naar boven afgerond.
 * Wat er al onderweg is (besteld, nog niet geleverd) telt mee als voorraad.
 */
function tekortVan(doel: number, geteld: number, onderweg = 0): number {
  return Math.max(Math.ceil(doel - geteld - onderweg - 0.001), 0);
}

/** Bij een werkbakje telt het verschil met de vulnorm, niet in hele bakken. */
function vulTekort(doel: number, geteld: number): number {
  return Math.max(Math.round((doel - geteld) * 100) / 100, 0);
}

/**
 * Waarop we tellen: reservebakjes (reserve), de vulnorm van het werkbakje
 * (koelwerkbank zonder reserve), of het dagdoel in hele bakken.
 */
function telDoel(item: ItemMetCategorie, drukte: DrukteModus): number {
  const modus = telModus(item);
  if (modus === 'reserve') return reserveDoel(item);
  if (modus === 'vulling') return vulnormWaarde(item);
  return doelAantal(item, drukte);
}

/** Tekort volgens de manier waarop dit product geteld wordt. */
function tekortVoor(
  item: ItemMetCategorie,
  doel: number,
  geteld: number,
  onderweg = 0,
): number {
  return telModus(item) === 'vulling'
    ? vulTekort(doel, geteld)
    : tekortVan(doel, geteld, onderweg);
}

/**
 * Eén chip-model voor de hele ronde:
 * grijs = informatie, groen = hier loopt al iets, amber = jij moet nu iets doen.
 */
function VoorraadChip({
  variant,
  children,
}: {
  variant: 'info' | 'klaar' | 'actie';
  children: React.ReactNode;
}) {
  const stijl =
    variant === 'info'
      ? 'bg-muted text-muted-foreground'
      : variant === 'klaar'
        ? 'bg-primary/10 text-primary'
        : 'bg-amber-400/15 text-amber-700 dark:text-amber-300';
  return (
    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${stijl}`}>
      {children}
    </span>
  );
}

/** Eén productregel: standaard "ligt er", tik om te tellen wat er écht ligt. */
function TelRegel({
  item,
  doel,
  geteld,
  onderweg,
  opBestelbord,
  inMep,
  keten,
  modus,
  onZet,
  onHerstel,
}: {
  item: ItemMetCategorie;
  doel: number;
  geteld: number | undefined;
  onderweg: number;
  opBestelbord: boolean;
  inMep: boolean;
  /** Waar de aanvulling vandaan komt (grijze ketenchip), of null. */
  keten: string | null;
  /** Hoe dit product geteld wordt. */
  modus: TelModus;
  onZet: (aantal: number) => void;
  onHerstel: () => void;
}) {
  const reserve = modus === 'reserve';
  const vulling = modus === 'vulling';
  const afwijkend = geteld !== undefined;
  const waarde = geteld ?? doel;
  const heel = Math.floor(waarde + 0.001);
  const rest = reserve || vulling ? 0 : Math.round((waarde - heel) * 100) / 100;

  const zetHeel = (n: number) => onZet(Math.max(n, 0) + rest);
  const zetRest = (r: number) => onZet(heel + r);

  // Eén statuschip rechts: onderweg > bestelbord > MEP. Altijd "hier loopt al iets".
  const statusTekst =
    onderweg > 0
      ? `${aantalLabel(onderweg, item.eenheid)} onderweg`
      : opBestelbord
        ? 'op het bestelbord'
        : inMep
          ? 'op de MEP'
          : null;
  const statusChip = statusTekst ? <VoorraadChip variant="klaar">{statusTekst}</VoorraadChip> : null;

  const bakje = bakjeLabel(item.formaat ?? item.bak_maat);
  const maatTekst = bakje?.code
    ? bakje.hoogte
      ? `${bakje.kort}, ${bakje.hoogte}`
      : bakje.kort
    : null;
  const kopRegel = (
    <span className="min-w-0">
      <span className="block truncate text-[15px] font-semibold text-foreground">{item.naam}</span>
      <span className="flex min-w-0 items-center gap-1.5 text-[12px] text-muted-foreground">
        <span className="truncate">
          {reserve
            ? `reserve ${getalLabel(doel)} ${doel === 1 ? 'bakje' : 'bakjes'}`
            : vulling
              ? `${vulnormLabel(item)}${maatTekst ? ` · ${maatTekst}` : ''}`
              : formaatLabel(doel, item.eenheid, item.formaat ?? item.bak_maat).replace(
                  / \(GN [^)]+\)$/,
                  '',
                )}
        </span>
        {bakje?.code && (
          <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {bakje.code}
          </span>
        )}
        {keten && <VoorraadChip variant="info">{keten}</VoorraadChip>}
      </span>
    </span>
  );

  // Besteld maar nog niet binnen: de rij begint niet op "ligt er", maar vraagt
  // expliciet of de levering is aangekomen. Overslaan = niets doen.
  if (onderweg > 0 && !afwijkend) {
    return (
      <div className="space-y-2 rounded-[14px] border border-amber-400/70 bg-amber-50/70 p-3 dark:bg-amber-500/10">
        <div className="flex items-center gap-2">
          {kopRegel}
          <span className="ml-auto flex shrink-0 items-center gap-1.5">
            {statusChip}
            <Truck size={18} className="shrink-0 text-amber-600 dark:text-amber-300" />
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onZet(doel)}
            className="flex items-center justify-center gap-1.5 rounded-[12px] border border-primary bg-primary text-[14px] font-semibold text-primary-foreground"
            style={{ minHeight: 44 }}
          >
            <Check size={16} />
            Binnengekomen
          </button>
          <button
            type="button"
            onClick={() => onZet(0)}
            className="flex items-center justify-center rounded-[12px] border border-border bg-card text-[14px] font-semibold text-foreground"
            style={{ minHeight: 44 }}
          >
            Nog niet binnen
          </button>
        </div>
      </div>
    );
  }

  // Koelwerkbank zonder reserve: je kijkt in het bakje en tikt wat je ziet.
  if (vulling) {
    const tekort = afwijkend && waarde < doel - 0.001;
    return (
      <div
        className={`rounded-[14px] border bg-card p-3 transition-colors ${
          tekort ? 'border-amber-400/50' : 'border-border'
        }`}
      >
        <div className="mb-2 flex items-center gap-2">
          {kopRegel}
          {(statusChip || tekort || afwijkend) && (
            <span className="ml-auto flex shrink-0 items-center gap-1.5">
              {statusChip}
              {tekort && <VoorraadChip variant="actie">bijvullen</VoorraadChip>}
              {afwijkend && (
                <button
                  type="button"
                  onClick={onHerstel}
                  className="shrink-0 text-[12px] font-medium text-muted-foreground underline-offset-2 hover:underline"
                >
                  wissen
                </button>
              )}
            </span>
          )}
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {VUL_KEUZES.map((k) => {
            const actief = afwijkend && Math.abs(waarde - k.waarde) < 0.001;
            return (
              <button
                key={k.label}
                type="button"
                onClick={() => onZet(k.waarde)}
                className={`flex items-center justify-center rounded-[12px] border text-[13px] font-semibold capitalize ${
                  actief
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-card text-foreground'
                }`}
                style={{ minHeight: 44 }}
              >
                {k.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-[14px] border transition-colors ${
        afwijkend ? 'border-amber-400/70 bg-amber-50/70 dark:bg-amber-500/10' : 'border-border bg-card'
      }`}
    >
      <button
        type="button"
        onClick={() => (afwijkend ? onHerstel() : onZet(Math.max(doel - 1, 0)))}
        className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left"
        style={{ minHeight: 56 }}
      >
        {kopRegel}
        <span className="flex shrink-0 items-center gap-2">
          {statusChip}
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
              afwijkend ? 'bg-amber-400/20 text-amber-700 dark:text-amber-300' : 'bg-muted text-muted-foreground'
            }`}
          >
            {afwijkend ? <Check size={18} /> : <Minus size={18} />}
          </span>
        </span>
      </button>

      {afwijkend && (
        <div className="space-y-2 border-t border-amber-400/40 px-3 py-2">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[13px] font-medium text-foreground">
              {reserve ? 'Hoeveel reserve staat er?' : 'Hoeveel ligt er?'}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Minder"
                onClick={() => zetHeel(heel - 1)}
                className="flex h-11 w-11 items-center justify-center rounded-[12px] border border-border bg-card"
              >
                <Minus size={18} />
              </button>
              <span className="min-w-[64px] text-center text-[17px] font-bold tabular-nums text-foreground">
                {getalLabel(waarde)}
              </span>
              <button
                type="button"
                aria-label="Meer"
                onClick={() => zetHeel(heel + 1)}
                className="flex h-11 w-11 items-center justify-center rounded-[12px] border border-border bg-card"
              >
                <Plus size={18} />
              </button>
            </div>
          </div>

          {!reserve && (
            <div>
              <p className="mb-1 text-[12px] text-muted-foreground">Laatste, aangebroken bak</p>
              <div className="grid grid-cols-3 gap-2">
                {REST_KEUZES.map((k) => {
                  const actief = rest === k.waarde;
                  return (
                    <button
                      key={k.label}
                      type="button"
                      onClick={() => zetRest(k.waarde)}
                      className={`flex items-center justify-center rounded-[12px] border text-[14px] font-semibold capitalize ${
                        actief
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-card text-foreground'
                      }`}
                      style={{ minHeight: 44 }}
                    >
                      {k.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Eén categorie binnen een plek: klapt dicht zodra hij bevestigd is. */
function CategorieBlok({
  titel,
  items,
  alleItems,
  drukte,
  telling,
  onderwegMap,
  bestelbordMap,
  mepTitels,
  bevestigd,
  onBevestig,
  onHeropen,
  onZet,
  onHerstel,
  subtitel,
  lade,
}: {
  titel: string;
  items: ItemMetCategorie[];
  /** Alle actieve items: nodig om de keten (waar komt het vandaan) te bepalen. */
  alleItems: ItemMetCategorie[];
  drukte: DrukteModus;
  telling: Record<string, number>;
  onderwegMap: Record<string, number>;
  bestelbordMap: Record<string, number>;
  mepTitels: string[];
  bevestigd: boolean;
  onBevestig: () => void;
  onHeropen: () => void;
  onZet: (id: string, aantal: number) => void;
  onHerstel: (id: string) => void;
  subtitel?: string | null;
  lade?: VoorraadLade | null;
}) {
  const afwijkingen = items.filter((i) => telling[i.id] !== undefined).length;

  if (bevestigd) {
    return (
      <button
        type="button"
        onClick={onHeropen}
        className="flex w-full items-center justify-between rounded-[14px] border border-primary/30 bg-primary/5 px-3 py-3 text-left"
        style={{ minHeight: 52 }}
      >
        <span className="flex min-w-0 items-center gap-2 text-[15px] font-semibold text-foreground">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check size={14} />
          </span>
          <span className="truncate">{titel}</span>
          {lade && <LadePositie lade={lade} metNaam={false} className="shrink-0" />}
        </span>
        <span className="shrink-0 text-[12px] text-muted-foreground">
          {afwijkingen > 0 ? `${afwijkingen} aangepast` : `${items.length} op peil`}
        </span>
      </button>
    );
  }

  return (
    <div className="rounded-[18px] border border-border bg-muted/30 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {lade && <LadePositie lade={lade} metNaam={false} className="shrink-0" />}
          <div className="min-w-0">
            <h4 className="truncate text-[15px] font-bold text-foreground">{titel}</h4>
            {subtitel && (
              <p className="truncate text-[11px] uppercase tracking-wide text-muted-foreground">{subtitel}</p>
            )}
          </div>
        </div>
        <Badge variant="secondary" className="shrink-0 text-[11px]">
          {items.length} {items.length === 1 ? 'product' : 'producten'}
        </Badge>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <TelRegel
            key={item.id}
            item={item}
            doel={telDoel(item, drukte)}
            modus={telModus(item)}
            geteld={telling[item.id]}
            onderweg={onderwegVoorItem(item, onderwegMap)}
            opBestelbord={(bestelbordMap[item.naam.trim().toLowerCase()] ?? 0) > 0}
            inMep={mepTitels.some((t) => t.includes(item.naam.trim().toLowerCase()))}
            keten={KETEN_PLEKKEN.includes(item.plek) ? ketenKortLabel(item, alleItems) : null}
            onZet={(a) => onZet(item.id, a)}
            onHerstel={() => onHerstel(item.id)}
          />
        ))}
      </div>

      <Button onClick={onBevestig} className="mt-3 h-12 w-full rounded-[14px] text-[15px] font-semibold">
        <Check size={18} className="mr-1" />
        {afwijkingen > 0 ? 'Klaar' : 'Klopt, ligt er'}
      </Button>
    </div>
  );
}

type BonSoort = 'vriescel' | 'koelcel' | 'magazijn' | 'mep' | 'midsland' | 'bestelbord';

interface BonRegel {
  item: ItemMetCategorie;
  onderItem: ItemMetCategorie | null;
  tekort: number;
  geteld: number;
  doel: number;
  soort: BonSoort;
  /** Alleen bij MEP: 1 = vandaag maken, 2 = mag morgen. */
  prioriteit?: number;
  /** Alleen bij MEP: hele batch in plaats van het rekenkundige tekort. */
  batch?: number;
  /** Alleen bij inkoop: "2 dozen (16 st.)". */
  bestelLabel?: string;
}


/**
 * Zelf maken gaat per hele batch. Is het bakje nog half, dan mag het morgen;
 * bij een bodempje of leeg moet het vandaag. Zo maak je nooit "een beetje bij",
 * en grijp je ook niet mis.
 */
function mepOpdracht(
  item: ItemMetCategorie,
  doel: number,
  geteld: number,
  tekort: number,
): { prioriteit: number; batch: number } {
  const aandeel = doel > 0 ? geteld / doel : 0;
  // Is er een batchgrootte vastgelegd, dan maak je altijd die hoeveelheid.
  const vast = batchGrootte(item);
  return {
    prioriteit: aandeel >= 0.5 - 0.001 ? 2 : 1,
    // Een werkbakje vul je met één hele batch; bij hele bakken telt het tekort.
    batch: vast ?? (telModus(item) === 'vulling' ? 1 : Math.max(Math.ceil(tekort - 0.001), 1)),
  };
}



const BON_GROEPEN: { soort: BonSoort; titel: string; uitleg: string; icoon: typeof Snowflake }[] = [
  { soort: 'vriescel', titel: 'Halen uit de vriescel', uitleg: 'Eén rondje — stickers "Ontdooid" worden geprint', icoon: Snowflake },
  { soort: 'koelcel', titel: 'Halen uit de koelcel', uitleg: 'Bijvullen vanuit de koelcel', icoon: PackageCheck },
  { soort: 'magazijn', titel: 'Halen uit het magazijn', uitleg: 'Bijvullen vanuit het magazijn', icoon: PackageCheck },
  { soort: 'mep', titel: 'Zelf maken (mise-en-place)', uitleg: 'Komt op de MEP-lijst', icoon: ChefHat },
  { soort: 'midsland', titel: 'Bestellen bij Midsland', uitleg: 'Gaat naar de interne bestellijst', icoon: Truck },
  { soort: 'bestelbord', titel: 'Op het bestelbord', uitleg: 'Inkoop pakt dit op', icoon: ShoppingCart },
];

/**
 * Voorraadronde West: eerst tellen (medewerker), daarna de aanvulbon (systeem rekent).
 * Zit als blok in de keukensectie van de sluitlijst: ingeklapt tot je hem opent.
 */
export function VoorraadRonde({ vestiging, datum }: { vestiging: string; datum: string }) {
  const itemsQuery = useKoelcelCheckItems(vestiging);
  const onderwegQuery = useOpenstaandeBestellingen(vestiging);
  const bestelbordQuery = useBestelbordOpen(vestiging);
  const mepNamenQuery = useMepOpenNamen(vestiging);
  const checksQuery = useKoelcelChecks(vestiging, datum);
  const drukteQuery = useDrukteModus(vestiging);
  const drukte: DrukteModus = drukteQuery.data ?? 'rustig';
  const printSticker = useCreateStickerPrintJob();
  const ladesQuery = useVoorraadLades(vestiging);
  const lades = useMemo(() => ladesQuery.data ?? [], [ladesQuery.data]);

  const items = useMemo(() => (itemsQuery.data ?? []) as ItemMetCategorie[], [itemsQuery.data]);
  const { meldOp, vulAanUitNiveau, zetAllesAanwezig } = useKoelcelCheckMutaties(vestiging, datum, items);

  const opslagSleutel = `voorraadronde-${vestiging}-${datum}`;
  const [open, setOpen] = useState(false);
  const [stap, setStap] = useState<'tellen' | 'bon' | 'klaar'>('tellen');
  const [telling, setTelling] = useState<Record<string, number>>({});
  const [bevestigd, setBevestigd] = useState<string[]>([]);
  const [bezig, setBezig] = useState(false);
  const [samenvatting, setSamenvatting] = useState<Record<BonSoort, number> | null>(null);

  // Tussenstand bewaren: de ronde overleeft een herstart van de iPad.
  useEffect(() => {
    try {
      const ruw = localStorage.getItem(opslagSleutel);
      if (ruw) {
        const data = JSON.parse(ruw);
        setTelling(data.telling ?? {});
        setBevestigd(data.bevestigd ?? []);
        if (data.klaar) setStap('klaar');
      }
    } catch {
      /* stille fallback */
    }
  }, [opslagSleutel]);

  useEffect(() => {
    try {
      localStorage.setItem(opslagSleutel, JSON.stringify({ telling, bevestigd }));
    } catch {
      /* stille fallback */
    }
  }, [opslagSleutel, telling, bevestigd]);

  const maandag = isMaandag(datum);
  const onderwegMap = onderwegQuery.data ?? {};
  const bestelbordMap = bestelbordQuery.data ?? {};
  const mepTitels = useMemo(() => mepNamenQuery.data ?? [], [mepNamenQuery.data]);

  const plekken = useMemo(
    () =>
      PLEK_VOLGORDE.filter((p) => !p.alleenMaandag || maandag)
        .map((p) => ({
          ...p,
          items: items.filter(
            (i) => (i.plek ?? (i.type === 'vriezer' ? 'vriezer' : 'koelcel')) === p.plek,
          ),
        }))
        .filter((p) => p.items.length > 0),
    [items, maandag],
  );

  const categorieGroepen = useMemo(
    () =>
      plekken.map((p) => {
        // Koelwerkbank tel je per lade: je trekt een lade open, niet een categorie.
        if (p.plek === 'werkbank' && lades.length > 0) {
          const groepen: Groep[] = [];
          // Altijd dezelfde looproute: kolom voor kolom, van boven naar beneden.
          const gesorteerd = [...lades.filter((l) => l.actief)].sort((a, b) => a.volgorde - b.volgorde);
          for (const lade of gesorteerd) {
            const ladeItems = p.items.filter((i) => i.lade_id === lade.id);
            const nietTellen = lade.rol === 'niet_tellen';
            // Lades die je niet telt of die nog leeg zijn blijven zichtbaar,
            // maar ingeklapt: je ziet dat ze bestaan zonder ze af te hoeven vinken.
            const overslaan = nietTellen
              ? {
                  reden: 'wordt niet geteld · aangebroken bakjes',
                  uitleg: 'Hier staan de bakjes waar je uit schept. De reserve tel je bij Midden onder.',
                }
              : !ladeItems.length
                ? {
                    reden: 'nog niets ingedeeld',
                    uitleg: 'Deel deze lade in bij Koelwerkbank indelen, dan telt hij vanzelf mee.',
                  }
                : undefined;
            groepen.push({
              sleutel: `werkbank:lade:${lade.id}`,
              titel: lade.naam,
              subtitel: `${positieLabel(lade)}${lade.rol === 'reserve' ? ' · reservelade' : ''}`,
              lade,
              items: overslaan ? [] : ladeItems,
              overslaan,
            });
          }
          // Producten zonder lade vallen nooit weg: die tel je per categorie, onderaan.
          const rest = p.items.filter((i) => !i.lade_id || !lades.some((l) => l.actief && l.id === i.lade_id));
          if (rest.length) {
            const perCat = new Map<string, ItemMetCategorie[]>();
            for (const item of rest) {
              const cat = categorieVan(item);
              perCat.set(cat, [...(perCat.get(cat) ?? []), item]);
            }
            for (const [cat, catItems] of [...perCat.entries()].sort(
              (a, b) => CATEGORIE_VOLGORDE.indexOf(a[0]) - CATEGORIE_VOLGORDE.indexOf(b[0]),
            )) {
              groepen.push({
                sleutel: `werkbank:cat:${cat}`,
                titel: cat,
                subtitel: 'Nog geen vaste lade',
                lade: null,
                items: catItems,
              });
            }
          }
          return { ...p, groepen };
        }

        const perCategorie = new Map<string, ItemMetCategorie[]>();
        for (const item of p.items) {
          const cat = categorieVan(item);
          perCategorie.set(cat, [...(perCategorie.get(cat) ?? []), item]);
        }
        const groepen: Groep[] = [...perCategorie.entries()]
          .sort((a, b) => CATEGORIE_VOLGORDE.indexOf(a[0]) - CATEGORIE_VOLGORDE.indexOf(b[0]))
          .map(([cat, catItems]) => ({
            sleutel: `${p.plek}:${cat}`,
            titel: cat,
            subtitel: null,
            lade: null,
            items: catItems,
          }));
        return { ...p, groepen };
      }),
    [plekken, lades],
  );

  // Lades zonder telwerk tellen niet mee in de voortgang: ze blokkeren de ronde niet.
  const alleSleutels = useMemo(
    () =>
      categorieGroepen.flatMap((p) => p.groepen.filter((g) => !g.overslaan).map((g) => g.sleutel)),
    [categorieGroepen],
  );
  const klaarAantal = alleSleutels.filter((s) => bevestigd.includes(s)).length;
  const allesBevestigd = alleSleutels.length > 0 && klaarAantal === alleSleutels.length;



  const bon: BonRegel[] = useMemo(() => {
    const regels: BonRegel[] = [];
    for (const item of items) {
      const geteld = telling[item.id];
      if (geteld === undefined) continue;
      const doel = telDoel(item, drukte);
      // Besteld-en-onderweg telt mee als voorraad: niet opnieuw bestellen.
      const onderweg = onderwegVoorItem(item, onderwegMap);
      const tekort = tekortVoor(item, doel, geteld, onderweg);
      if (tekort <= 0) continue;
      const vervolg = vervolgactieVoorRegel(item, items);
      if (vervolg.soort === 'niveau') {
        const onder = vervolg.onderItem as ItemMetCategorie;
        regels.push({
          item,
          onderItem: onder,
          tekort,
          geteld,
          doel,
          soort:
            onder.plek === 'vriezer'
              ? 'vriescel'
              : onder.plek === 'magazijn'
                ? 'magazijn'
                : 'koelcel',
        });
      } else if (vervolg.soort === 'mep') {
        // Zelf maken/roosteren: pas een taak vanaf het meldpunt (halve bak mag blijven).
        if (!meldNodig(item, geteld + onderweg)) continue;
        const { prioriteit, batch } = mepOpdracht(item, doel, geteld, tekort);
        regels.push({ item, onderItem: null, tekort, geteld, doel, soort: 'mep', prioriteit, batch });
      } else if (vervolg.soort === 'bestelbord') {
        // Inkoop: pas melden vanaf het bestelpunt, en in hele verpakkingen.
        const opdracht = bestelOpdracht(item, doel, geteld, onderweg);
        if (!opdracht.meld) continue;
        regels.push({
          item,
          onderItem: null,
          tekort,
          geteld,
          doel,
          soort: 'bestelbord',
          bestelLabel: opdracht.label,
        });
      } else {
        regels.push({ item, onderItem: null, tekort, geteld, doel, soort: vervolg.soort as BonSoort });
      }


    }
    return regels;
  }, [items, telling, drukte, onderwegMap]);

  if (itemsQuery.isLoading || items.length === 0) return null;

  const zet = (id: string, aantal: number) => setTelling((t) => ({ ...t, [id]: Math.max(aantal, 0) }));
  const herstel = (id: string) =>
    setTelling((t) => {
      const kopie = { ...t };
      delete kopie[id];
      return kopie;
    });

  /** In welke lade van de koelwerkbank dit product hoort (of null). */
  const ladeVan = (item: ItemMetCategorie): VoorraadLade | null =>
    (item.lade_id ? lades.find((l) => l.id === item.lade_id) : null) ?? null;


  const printOntdooid = (item: ItemMetCategorie, aantal: number) => {
    const vandaag = new Date();
    const houdbaar = new Date(vandaag);
    houdbaar.setDate(houdbaar.getDate() + 2);
    printSticker.mutate({
      type: 'ontdooid',
      naam: item.naam,
      datum1: stickerDatum(vandaag),
      datum2: stickerDatum(houdbaar),
      aantal: Math.max(Math.round(aantal), 1),
      bron: 'koelcel_check',
    });
  };

  /** De bon uitvoeren: aanvullen, doorzetten en alles wat klopt op peil zetten. */
  const bevestigBon = async () => {
    setBezig(true);
    const telling2: Record<BonSoort, number> = {
      vriescel: 0, koelcel: 0, magazijn: 0, mep: 0, midsland: 0, bestelbord: 0,
    };
    try {
      for (const regel of bon) {
        if (regel.onderItem) {
          await vulAanUitNiveau.mutateAsync({
            item: regel.item,
            onderItem: regel.onderItem,
            aantal: regel.tekort,
          });
          if (regel.soort === 'vriescel') printOntdooid(regel.item, regel.tekort);
        } else {
          await meldOp.mutateAsync({
            item: regel.item,
            doel: regel.doel,
            aanwezig: regel.geteld,
            mepPrioriteit: regel.prioriteit,
            mepAantal: regel.batch,
          });

        }
        telling2[regel.soort] += 1;
      }

      const afgehandeld = new Set(bon.map((r) => r.item.id));
      // Alles wat niet is geteld én niets onderweg heeft, is "ligt er". Regels met
      // iets onderweg die overgeslagen zijn, laten we bewust open — nooit stil op
      // "aanwezig" zetten terwijl de levering nog moet komen.
      const rest = items.filter(
        (i) =>
          !afgehandeld.has(i.id) &&
          (telling[i.id] !== undefined ||
            onderwegVoorItem(i, onderwegMap) === 0),
      );
      if (rest.length) await zetAllesAanwezig.mutateAsync(rest);

      setSamenvatting(telling2);
      setStap('klaar');
      localStorage.setItem(opslagSleutel, JSON.stringify({ telling: {}, bevestigd: [], klaar: true }));
    } catch (e: any) {
      toast.error('Niet alles is doorgezet: ' + (e?.message ?? 'onbekende fout'));
    } finally {
      setBezig(false);
    }
  };

  const afgerond = stap === 'klaar';

  /** Kop die er net zo uitziet als een taakcategorie in de sluitlijst. */
  const kop = (
    <button
      type="button"
      onClick={() => setOpen((o) => !o)}
      className={`flex w-full items-center gap-3 rounded-[14px] border px-3.5 py-3 text-left transition-colors ${
        afgerond ? 'border-primary/30 bg-primary/5' : 'border-border bg-muted'
      }`}
      style={{ minHeight: 52 }}
    >
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
          afgerond ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground'
        }`}
      >
        {afgerond ? <Check size={16} /> : <ClipboardList size={16} />}
      </span>
      <span className="min-w-0">
        <span className="block text-[15px] font-bold text-foreground">Voorraadronde</span>
        <span className="block text-[12px] text-muted-foreground">
          {afgerond
            ? 'Afgerond — aanvulbon is doorgezet'
            : `${klaarAantal}/${alleSleutels.length} onderdelen geteld`}
        </span>
      </span>
      <ChevronDown
        size={20}
        className={`ml-auto shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`}
      />
    </button>
  );

  const inhoud = () => {
    // ---------- Klaar ----------
    if (stap === 'klaar') {
      return (
        <div className="mt-2 rounded-[18px] border border-primary/30 bg-primary/5 p-5 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check size={24} />
          </div>
          <h3 className="text-[17px] font-bold text-foreground">Voorraadronde afgerond</h3>
          <p className="mt-1 text-[14px] text-muted-foreground">
            {samenvatting
              ? BON_GROEPEN.filter((g) => (samenvatting[g.soort] ?? 0) > 0)
                  .map((g) => `${samenvatting[g.soort]} ${g.titel.toLowerCase()}`)
                  .join(' · ') || 'Alles lag er — niets door te zetten.'
              : 'Alles verwerkt.'}
          </p>
        </div>
      );
    }

    // ---------- Aanvulbon ----------
    if (stap === 'bon') {
      return (
        <div className="mt-2 rounded-[18px] border border-border bg-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <ClipboardList size={20} className="text-primary" />
            <h3 className="text-[17px] font-bold text-foreground">Aanvulbon</h3>
          </div>

          {bon.length === 0 ? (
            <p className="text-[14px] text-muted-foreground">
              Alles lag er. Er hoeft niets gehaald of besteld te worden.
            </p>
          ) : (
            <div className="space-y-3">
              {BON_GROEPEN.map((groep) => {
                const regels = bon.filter((r) => r.soort === groep.soort);
                if (!regels.length) return null;
                const Icoon = groep.icoon;
                return (
                  <div key={groep.soort} className="rounded-[16px] border border-border bg-muted/30 p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <Icoon size={18} className="text-primary" />
                      <div className="min-w-0">
                        <p className="text-[15px] font-bold text-foreground">{groep.titel}</p>
                        <p className="text-[12px] text-muted-foreground">{groep.uitleg}</p>
                      </div>
                      <Badge variant="secondary" className="ml-auto text-[11px]">{regels.length}</Badge>
                    </div>
                    <div className="space-y-1.5">
                      {regels.map((r) => (
                        <div
                          key={r.item.id}
                          className="flex items-center justify-between gap-3 rounded-[12px] bg-card px-3 py-2.5"
                        >
                          <span className="min-w-0">
                            <span className="block truncate text-[14px] font-semibold text-foreground">
                              {r.item.naam}
                            </span>
                            <span className="block truncate text-[12px] text-muted-foreground">
                              {telModus(r.item) === 'vulling'
                                ? `bakje ${vulKeuzeLabel(r.geteld)}`
                                : `${getalLabel(r.doel)} nodig · ${getalLabel(r.geteld)} geteld`}
                               {r.onderItem ? ` · uit ${HERKOMST_LABEL[r.onderItem.plek]}` : ''}
                               {r.soort === 'bestelbord' && r.item.leverancier
                                 ? ` · ${r.item.leverancier}`
                                 : ''}
                             </span>
                            {ladeVan(r.item) && (
                              <LadePositie lade={ladeVan(r.item)} className="mt-0.5" />
                            )}
                          </span>
                          <span
                            className={`shrink-0 text-right text-[14px] font-bold ${
                              r.soort === 'mep' && r.prioriteit === 1
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-primary'
                            }`}
                          >
                            {r.soort === 'mep'
                              ? `bijmaken (${r.prioriteit === 1 ? 'vandaag' : 'mag morgen'})`
                              : r.bestelLabel
                                ? r.bestelLabel
                                : telModus(r.item) === 'vulling'
                                  ? `bijvullen tot ${vulnormWaarde(r.item) === 0.5 ? 'half' : 'vol'}`
                                  : aantalLabel(r.tekort, r.item.eenheid)}

                          </span>

                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <Button variant="outline" className="h-12 flex-1 rounded-[14px]" onClick={() => setStap('tellen')} disabled={bezig}>
              Terug
            </Button>
            <Button className="h-12 flex-[2] rounded-[14px] text-[15px] font-semibold" onClick={bevestigBon} disabled={bezig}>
              {bezig ? <Loader2 size={18} className="mr-1 animate-spin" /> : <Check size={18} className="mr-1" />}
              {bon.length === 0 ? 'Ronde afsluiten' : 'Bevestigen en doorzetten'}
            </Button>
          </div>
        </div>
      );
    }

    // ---------- Tellen ----------
    return (
      <div className="mt-2 rounded-[18px] border border-border bg-card p-4">
        <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${alleSleutels.length ? (klaarAantal / alleSleutels.length) * 100 : 0}%` }}
          />
        </div>

        <div className="space-y-6">
          {categorieGroepen.map((p) => {
            const PlekIcoon = p.icoon;
            const telGroepen = p.groepen.filter((g) => !g.overslaan);
            const klaarHier = telGroepen.filter((g) => bevestigd.includes(g.sleutel)).length;
            return (
              <div key={p.plek}>
                <div className="sticky top-0 z-10 -mx-1 mb-3 rounded-[14px] border border-border bg-card/95 px-3 py-2.5 backdrop-blur">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <PlekIcoon size={20} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Loop nu langs
                      </span>
                      <span className="block truncate text-[18px] font-bold leading-tight text-foreground">
                        {p.titel}
                      </span>
                    </span>
                    <span className="ml-auto shrink-0 rounded-full bg-muted px-2.5 py-1 text-[12px] font-semibold tabular-nums text-muted-foreground">
                      {klaarHier}/{telGroepen.length}
                    </span>
                  </div>
                </div>
                <div className="space-y-2 pl-2">
                  {p.groepen.map((g) => (
                    <div key={g.sleutel} className="scroll-mt-24 rounded-[18px]">

                      <CategorieBlok
                        titel={g.titel}
                        overslaan={g.overslaan}
                        subtitel={g.subtitel}
                        lade={g.lade}
                        items={g.items}
                        alleItems={items}
                        drukte={drukte}
                        telling={telling}
                        onderwegMap={onderwegMap}
                        bestelbordMap={bestelbordMap}
                        mepTitels={mepTitels}
                        bevestigd={bevestigd.includes(g.sleutel)}
                        onBevestig={() => setBevestigd((b) => [...new Set([...b, g.sleutel])])}
                        onHeropen={() => setBevestigd((b) => b.filter((s) => s !== g.sleutel))}
                        onZet={zet}
                        onHerstel={herstel}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <Button
          className="mt-4 h-14 w-full rounded-[16px] text-[16px] font-bold"
          disabled={!allesBevestigd}
          onClick={() => setStap('bon')}
        >
          {allesBevestigd ? (
            <>
              Naar de aanvulbon
              <ArrowRight size={20} className="ml-1" />
            </>
          ) : (
            `Nog ${alleSleutels.length - klaarAantal} te gaan`
          )}
        </Button>
      </div>
    );
  };

  return (
    <div className="mb-6">
      {kop}
      {open && inhoud()}
    </div>
  );
}

export default VoorraadRonde;
