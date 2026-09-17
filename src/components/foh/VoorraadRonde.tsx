import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  ArrowRight,
  Check,
  ChefHat,
  ClipboardList,
  Loader2,
  Minus,
  Plus,
  Snowflake,
  ShoppingCart,
  Truck,
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
  vervolgactieVoorRegel,
  doelAantal,
  HERKOMST_LABEL,
  type DrukteModus,
  type KoelcelCheckItem,
  type VoorraadPlek,
} from '@/hooks/useKoelcelCheck';
import { useCreateStickerPrintJob } from '@/hooks/useStickerProducten';
import { aantalLabel, formaatLabel } from '@/lib/voorraad-formaat';

type ItemMetCategorie = KoelcelCheckItem & { categorie?: string | null; formaat?: string | null };

/** De plekken in de volgorde waarin je er fysiek langsloopt. */
const PLEK_VOLGORDE: { plek: VoorraadPlek; titel: string; alleenMaandag?: boolean }[] = [
  { plek: 'werkbank', titel: 'Koelwerkbank' },
  { plek: 'werkblad', titel: 'Toppings' },
  { plek: 'koelcel', titel: 'Koelcel' },
  { plek: 'vriezer', titel: 'Vriescel', alleenMaandag: true },
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

/** Eén productregel: standaard "ligt er", tik om te tellen wat er écht ligt. */
function TelRegel({
  item,
  doel,
  geteld,
  onderweg,
  onZet,
  onHerstel,
}: {
  item: ItemMetCategorie;
  doel: number;
  geteld: number | undefined;
  onderweg: number;
  onZet: (aantal: number) => void;
  onHerstel: () => void;
}) {
  const afwijkend = geteld !== undefined;
  const waarde = geteld ?? doel;

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
        <span className="min-w-0">
          <span className="block truncate text-[15px] font-semibold text-foreground">{item.naam}</span>
          <span className="block truncate text-[12px] text-muted-foreground">
            {formaatLabel(doel, item.eenheid, item.formaat ?? item.bak_maat)}
            {onderweg > 0 ? ` · ${aantalLabel(onderweg, item.eenheid)} onderweg` : ''}
          </span>
        </span>
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
            afwijkend ? 'bg-amber-400/20 text-amber-700 dark:text-amber-300' : 'bg-muted text-muted-foreground'
          }`}
        >
          {afwijkend ? <Check size={18} /> : <Minus size={18} />}
        </span>
      </button>

      {afwijkend && (
        <div className="flex items-center justify-between gap-3 border-t border-amber-400/40 px-3 py-2">
          <span className="text-[13px] font-medium text-foreground">Hoeveel ligt er?</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Minder"
              onClick={() => onZet(Math.max(waarde - 1, 0))}
              className="flex h-11 w-11 items-center justify-center rounded-[12px] border border-border bg-card"
            >
              <Minus size={18} />
            </button>
            <span className="min-w-[56px] text-center text-[17px] font-bold tabular-nums text-foreground">
              {waarde}
            </span>
            <button
              type="button"
              aria-label="Meer"
              onClick={() => onZet(Math.min(waarde + 1, doel))}
              className="flex h-11 w-11 items-center justify-center rounded-[12px] border border-border bg-card"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Eén categorie binnen een plek: klapt dicht zodra hij bevestigd is. */
function CategorieBlok({
  titel,
  items,
  drukte,
  telling,
  onderwegMap,
  bevestigd,
  onBevestig,
  onHeropen,
  onZet,
  onHerstel,
}: {
  titel: string;
  items: ItemMetCategorie[];
  drukte: DrukteModus;
  telling: Record<string, number>;
  onderwegMap: Record<string, number>;
  bevestigd: boolean;
  onBevestig: () => void;
  onHeropen: () => void;
  onZet: (id: string, aantal: number) => void;
  onHerstel: (id: string) => void;
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
        <span className="flex items-center gap-2 text-[15px] font-semibold text-foreground">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check size={14} />
          </span>
          {titel}
        </span>
        <span className="text-[12px] text-muted-foreground">
          {afwijkingen > 0 ? `${afwijkingen} aangepast` : `${items.length} op peil`}
        </span>
      </button>
    );
  }

  return (
    <div className="rounded-[18px] border border-border bg-muted/30 p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <h4 className="text-[15px] font-bold text-foreground">{titel}</h4>
        <Badge variant="secondary" className="text-[11px]">
          {items.length} {items.length === 1 ? 'product' : 'producten'}
        </Badge>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {items.map((item) => (
          <TelRegel
            key={item.id}
            item={item}
            doel={doelAantal(item, drukte)}
            geteld={telling[item.id]}
            onderweg={onderwegMap[item.naam.trim().toLowerCase()] ?? 0}
            onZet={(a) => onZet(item.id, a)}
            onHerstel={() => onHerstel(item.id)}
          />
        ))}
      </div>

      <Button onClick={onBevestig} className="mt-3 h-12 w-full rounded-[14px] text-[15px] font-semibold">
        <Check size={18} className="mr-1" />
        {afwijkingen > 0 ? 'Categorie klaar' : 'Klopt, ligt er'}
      </Button>
    </div>
  );
}

type BonSoort = 'vriescel' | 'koelcel' | 'mep' | 'midsland' | 'bestelbord';

interface BonRegel {
  item: ItemMetCategorie;
  onderItem: ItemMetCategorie | null;
  tekort: number;
  geteld: number;
  doel: number;
  soort: BonSoort;
}

const BON_GROEPEN: { soort: BonSoort; titel: string; uitleg: string; icoon: typeof Snowflake }[] = [
  { soort: 'vriescel', titel: 'Halen uit de vriescel', uitleg: 'Eén rondje — stickers "Ontdooid" worden geprint', icoon: Snowflake },
  { soort: 'koelcel', titel: 'Halen uit de koelcel', uitleg: 'Bijvullen vanuit de koelcel', icoon: PackageCheck },
  { soort: 'mep', titel: 'Zelf maken (mise-en-place)', uitleg: 'Komt op de MEP-lijst', icoon: ChefHat },
  { soort: 'midsland', titel: 'Bestellen bij Midsland', uitleg: 'Gaat naar de interne bestellijst', icoon: Truck },
  { soort: 'bestelbord', titel: 'Op het bestelbord', uitleg: 'Inkoop pakt dit op', icoon: ShoppingCart },
];

/**
 * Voorraadronde West: eerst tellen (medewerker), daarna de aanvulbon (systeem rekent).
 * De aanvulbon bundelt alles wat uit de vriescel moet in één ophaallijst.
 */
export function VoorraadRonde({ vestiging, datum }: { vestiging: string; datum: string }) {
  const itemsQuery = useKoelcelCheckItems(vestiging);
  const onderwegQuery = useOpenstaandeBestellingen(vestiging);
  const checksQuery = useKoelcelChecks(vestiging, datum);
  const drukteQuery = useDrukteModus(vestiging);
  const drukte: DrukteModus = drukteQuery.data ?? 'rustig';
  const printSticker = useCreateStickerPrintJob();

  const items = useMemo(
    () => (itemsQuery.data ?? []) as ItemMetCategorie[],
    [itemsQuery.data],
  );
  const { meldOp, vulAanUitNiveau, zetAllesAanwezig } = useKoelcelCheckMutaties(vestiging, datum, items);

  const opslagSleutel = `voorraadronde-${vestiging}-${datum}`;
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
        const perCategorie = new Map<string, ItemMetCategorie[]>();
        for (const item of p.items) {
          const cat = categorieVan(item);
          perCategorie.set(cat, [...(perCategorie.get(cat) ?? []), item]);
        }
        const gesorteerd = [...perCategorie.entries()].sort(
          (a, b) => CATEGORIE_VOLGORDE.indexOf(a[0]) - CATEGORIE_VOLGORDE.indexOf(b[0]),
        );
        return { ...p, categorieen: gesorteerd };
      }),
    [plekken],
  );

  const alleSleutels = useMemo(
    () => categorieGroepen.flatMap((p) => p.categorieen.map(([cat]) => `${p.plek}:${cat}`)),
    [categorieGroepen],
  );
  const klaarAantal = alleSleutels.filter((s) => bevestigd.includes(s)).length;
  const allesBevestigd = alleSleutels.length > 0 && klaarAantal === alleSleutels.length;

  const bon: BonRegel[] = useMemo(() => {
    const regels: BonRegel[] = [];
    for (const item of items) {
      const geteld = telling[item.id];
      if (geteld === undefined) continue;
      const doel = doelAantal(item, drukte);
      const tekort = Math.max(doel - geteld, 0);
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
          soort: onder.plek === 'vriezer' ? 'vriescel' : 'koelcel',
        });
      } else {
        regels.push({ item, onderItem: null, tekort, geteld, doel, soort: vervolg.soort as BonSoort });
      }
    }
    return regels;
  }, [items, telling, drukte]);

  if (itemsQuery.isLoading || items.length === 0) return null;

  const zet = (id: string, aantal: number) => setTelling((t) => ({ ...t, [id]: aantal }));
  const herstel = (id: string) =>
    setTelling((t) => {
      const kopie = { ...t };
      delete kopie[id];
      return kopie;
    });

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
      vriescel: 0, koelcel: 0, mep: 0, midsland: 0, bestelbord: 0,
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
          await meldOp.mutateAsync({ item: regel.item, doel: regel.doel, aanwezig: regel.geteld });
        }
        telling2[regel.soort] += 1;
      }

      const afgehandeld = new Set(bon.map((r) => r.item.id));
      const rest = items.filter((i) => !afgehandeld.has(i.id));
      if (rest.length) await zetAllesAanwezig.mutateAsync(rest);

      setSamenvatting(telling2);
      setStap('klaar');
      localStorage.removeItem(opslagSleutel);
    } catch (e: any) {
      toast.error('Niet alles is doorgezet: ' + (e?.message ?? 'onbekende fout'));
    } finally {
      setBezig(false);
    }
  };

  // ---------- Klaar ----------
  if (stap === 'klaar') {
    return (
      <div className="mt-4 rounded-[20px] border border-primary/30 bg-primary/5 p-5 text-center">
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
      <div className="mt-4 rounded-[20px] border border-border bg-card p-4">
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
                          {r.onderItem && (
                            <span className="block truncate text-[12px] text-muted-foreground">
                              uit {HERKOMST_LABEL[r.onderItem.plek]}
                              {r.item.formaat ? ` · ${r.item.formaat}` : ''}
                            </span>
                          )}
                        </span>
                        <span className="shrink-0 text-[14px] font-bold tabular-nums text-primary">
                          {aantalLabel(r.tekort, r.item.eenheid)}
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
    <div className="mt-4 rounded-[20px] border border-border bg-card p-4">
      <div className="mb-1 flex items-center justify-between gap-2">
        <h3 className="text-[17px] font-bold text-foreground">Voorraadronde</h3>
        <span className="text-[13px] font-semibold text-muted-foreground tabular-nums">
          {klaarAantal}/{alleSleutels.length}
        </span>
      </div>
      <p className="mb-3 text-[13px] text-muted-foreground">
        Loop de kasten langs en bevestig per categorie. Tik alleen een product aan als er minder ligt.
      </p>
      <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${alleSleutels.length ? (klaarAantal / alleSleutels.length) * 100 : 0}%` }}
        />
      </div>

      <div className="space-y-5">
        {categorieGroepen.map((p) => (
          <div key={p.plek}>
            <p className="mb-2 text-[12px] font-bold uppercase tracking-wide text-muted-foreground">
              {p.titel}
            </p>
            <div className="space-y-2">
              {p.categorieen.map(([cat, catItems]) => {
                const sleutel = `${p.plek}:${cat}`;
                return (
                  <CategorieBlok
                    key={sleutel}
                    titel={cat}
                    items={catItems}
                    drukte={drukte}
                    telling={telling}
                    onderwegMap={onderwegMap}
                    bevestigd={bevestigd.includes(sleutel)}
                    onBevestig={() => setBevestigd((b) => [...new Set([...b, sleutel])])}
                    onHeropen={() => setBevestigd((b) => b.filter((s) => s !== sleutel))}
                    onZet={zet}
                    onHerstel={herstel}
                  />
                );
              })}
            </div>
          </div>
        ))}
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
          `Nog ${alleSleutels.length - klaarAantal} ${
            alleSleutels.length - klaarAantal === 1 ? 'categorie' : 'categorieën'
          } te gaan`
        )}
      </Button>
    </div>
  );
}

export default VoorraadRonde;
