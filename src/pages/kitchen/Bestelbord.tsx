import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Minus, Plus, Truck, ClipboardList, Calculator, Sparkles, Check, AlertCircle, Search, ChefHat, Hourglass } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useOntvangstModus, useOntvangstData, useKeukenAdvies } from '@/hooks/useOntvangstV2';
import { NageleverdKaart, EindcheckKaart } from '@/components/kitchen/bestelbord/OntvangstOnderweg';
import { MandjeVragen } from '@/components/kitchen/bestelbord/MandjeVragen';
import { bordRestStatusPerSignaal, onderwegMetRest, onderwegTellers } from '@/lib/ontvangstV2';
import { KeukenAdviesTabel } from '@/components/kitchen/bestelbord/KeukenAdviesTabel';
import { DetailLade, KaartKop, LaadRijen, LijstKaart, Invoerbalk, segmentTabsKlasse } from '@/components/pura/patronen';
import { TabelVoet } from '@/components/pura/lijst';
import { EmptyState } from '@/components/pura/EmptyState';
import { Stappen } from '@/components/pura/blokken';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { SidebarLayout } from '@/components/SidebarLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { dagenTeLaat, parseYmd, ymd } from '@/lib/leverdatum';
import { useUserLocation } from '@/contexts/UserLocationContext';
import {
  useBestelSignalen, useBestelbordMutaties, useLeveranciers, useVestigingOpenDagen, useArtikelVormen, zoekBordSuggesties, useBestelAdvies, useBordRegelInfo,
  type BestelSignaal, type ArtikelVorm, type BordSuggestie, type BestelAdvies,
} from '@/hooks/useBestelbord';
import { Voorraadproef } from '@/components/kitchen/Voorraadproef';
import { usePrijsSignalen } from '@/hooks/usePrijsSignalen';
import { zoekSignaal, type PrijsSignaal } from '@/lib/prijsSignaal';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useIsMobile } from '@/hooks/use-mobile';
import { BordTabel } from '@/components/kitchen/bestelbord/BordTabel';
import { OnderwegTabel } from '@/components/kitchen/bestelbord/OnderwegTabel';
import { AdviesTabel } from '@/components/kitchen/bestelbord/AdviesTabel';
import { LeveranciersOverzicht } from '@/components/kitchen/bestelbord/LeveranciersOverzicht';
import { eerderVrijeRegels, filterEerderSuggesties } from '@/lib/bordSnelkeuze';
import { leverancierNaam } from '@/components/kitchen/bestelbord/presentatie';
import { useBesteldeadlines } from '@/hooks/useBesteldeadlines';
import { RegelInfo } from '@/components/kitchen/bestelbord/RegelInfo';
import { verpakkingWeergave, eenheidLabel } from '@/components/kitchen/bestelbord/verpakking';

const SOORTEN = ['stuks', 'doos', 'zak', 'fles', 'pak', 'bak', 'emmer', 'kg', 'bos', 'tray', 'rol', 'fust'] as const;

function datumLabel(iso: string): string {
  return new Date(iso).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' });
}

const norm = (s: string) => s.trim().toLowerCase();

function Stepper({ waarde, onChange, eenheid, uit }: { waarde: number | null; onChange: (n: number | null) => void; eenheid?: string; uit?: boolean }) {
  return (
    <div className={cn('flex items-center gap-1', eenheid !== undefined && 'gap-0 rounded-polar-lg border border-input bg-background')}>
      <Button type="button" variant="ghost" className="h-11 w-11 p-0" aria-label="Minder" disabled={uit} onClick={() => onChange(Math.max(1, (waarde ?? 1) - 1))}>
        <Minus className="h-4 w-4" />
      </Button>
      {eenheid !== undefined ? (
        <label className={cn('flex h-11 min-w-[6.5rem] cursor-text items-baseline justify-center gap-1 px-1', uit && 'opacity-50')}>
          {uit ? <span className="self-center text-sm text-muted-foreground">kies verpakking</span> : <>
            <input
              value={waarde == null ? '' : String(waarde)}
              onChange={(e) => { const d = e.target.value.replace(/[^0-9]/g, ''); onChange(d ? Math.max(1, Number(d) || 1) : null); }}
              inputMode="numeric"
              style={{ width: `${Math.max(1, String(waarde ?? '').length)}ch` }}
              className="self-center bg-transparent p-0 text-center text-lg font-semibold tabular-nums text-foreground outline-none"
              aria-label="Aantal"
            />
            <span className="self-center text-sm text-muted-foreground">{eenheid}</span>
          </>}
        </label>
      ) : (
        <Input
          value={waarde == null ? '' : String(waarde)}
          onChange={(e) => { const d = e.target.value.replace(/[^0-9]/g, ''); onChange(d ? Math.max(1, Number(d) || 1) : null); }}
          inputMode="numeric"
          className="h-11 w-14 text-center text-base font-semibold"
          aria-label="Aantal"
        />
      )}
      <Button type="button" variant="ghost" className="h-11 w-11 p-0" aria-label="Meer" disabled={uit} onClick={() => onChange((waarde ?? 0) + 1)}>
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}

/** Eén rustige regel: wat je met dit aantal krijgt. */
function VerpakkingRegel({ vorm, aantal }: { vorm: ArtikelVorm; aantal: number | null }) {
  const w = verpakkingWeergave(vorm, aantal);
  const delen = [
    w.inhoud ? `${aantal ?? 1} ${w.eenheid} = ${aantal && aantal > 1 ? `${aantal} × ` : ''}${w.inhoud}` : null,
    w.totaal ? `${w.totaal} totaal` : null,
    w.prijs,
  ].filter(Boolean);
  if (!delen.length) return null;
  return <p className="text-sm text-muted-foreground tabular-nums">{delen.join('  ·  ')}</p>;
}

function SoortKeuze({ waarde, onChange }: { waarde: string | null; onChange: (s: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {SOORTEN.map((s) => (
        <Button variant={waarde === s ? 'default' : 'outline'}
          key={s}
          type="button"
          onClick={() => onChange(s)}
          className="h-11 px-3.5"
        >
          {s}
        </Button>
      ))}
    </div>
  );
}

const euroFmt = new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' });
const euro = (n: number) => euroFmt.format(n);

function prijsTip(v: ArtikelVorm): string {
  if (v.prijs == null) return '';
  if (v.prijs_bron === 'horeko') return `Horeko-prijs · ${euro(Number(v.prijs))}`;
  const d = v.prijs_datum ? parseYmd(v.prijs_datum).toLocaleDateString('nl-NL', { day: '2-digit', month: '2-digit', year: 'numeric' }) : null;
  return `laatst ${euro(Number(v.prijs))}${d ? ` · ${d}` : ''}`;
}

/** Keuze tussen verpakkingsvormen van één artikel: vorm · leverancier · prijs. */
function VormKeuze({
  vormen, gekozen, leveranciers, onKies,
}: {
  vormen: ArtikelVorm[];
  gekozen: string | null;
  leveranciers?: Map<string, string>;
  onKies: (v: ArtikelVorm) => void;
}) {
  return (
    <div className="w-full space-y-1.5">
      <p className="text-sm font-medium text-foreground">Bestellen per</p>
      <div className="grid w-full grid-cols-2 gap-2" role="radiogroup" aria-label="Verpakkingsvorm">
        {vormen.map((v) => {
          const lev = v.leverancier_naam ?? (v.leverancier_id ? leveranciers?.get(v.leverancier_id) : null);
          const geblokkeerd = !!v.geblokkeerd;
          const actief = gekozen === v.id;
          const w = verpakkingWeergave(v, 1);
          const titel = v.eenheid.charAt(0).toUpperCase() + v.eenheid.slice(1);
          return (
            <button
              key={v.id}
              type="button"
              role="radio"
              aria-checked={actief}
              disabled={geblokkeerd}
              onClick={() => onKies(v)}
              className={cn(
                'flex min-h-14 w-full flex-col items-start gap-0.5 rounded-polar-md border px-3 py-2.5 text-left transition-colors duration-150',
                actief ? 'border-primary bg-primary/10 ring-1 ring-primary' : 'border-border bg-card hover:bg-muted/60',
                geblokkeerd && 'cursor-not-allowed opacity-50',
              )}
            >
              <span className="flex w-full items-center justify-between gap-2">
                <span className="text-base font-semibold leading-tight text-foreground">{titel}</span>
                {actief && <Check className="h-4 w-4 text-primary" />}
              </span>
              <span className="text-sm text-foreground tabular-nums">
                {[w.inhoud, w.totaal && w.inhoud !== w.totaal ? `= ${w.totaal}` : null].filter(Boolean).join(' ') || '—'}
              </span>
              <span className="text-xs text-muted-foreground tabular-nums">
                {geblokkeerd ? 'controleren' : [w.prijs, w.perBasis, lev].filter(Boolean).join(' · ') || '–'}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function leverDatumLabel(datum: string | null): string {
  if (!datum) return 'geen datum';
  return parseYmd(datum).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' });
}

export default function Bestelbord() {
  const { userLocation } = useUserLocation();
  const vestiging = userLocation ?? '';
  const deadlineVoor = useBesteldeadlines(vestiging);
  const { data: signalen = [], isLoading } = useBestelSignalen(vestiging || null);
  const {
    toevoegen, zetBesteld, verwijderen, herstel, wijzig,
    markeerGeleverd, nietGeleverd, deelsGeleverd, terugNaarBesteld, zetVerwachteLevering,
  } = useBestelbordMutaties(vestiging);
  const { data: leveranciers } = useLeveranciers();
  // Ontvangst v2: alleen actief bij schakelaar aan of testmodus; uit = huidig gedrag.
  const modus = useOntvangstModus(vestiging);
  const v2 = modus.ontvangstV2;
  const test = modus.test;
  const ontvangst = useOntvangstData(modus);
  const keukenAdvies = useKeukenAdvies(modus);
  const restanten = v2 ? ontvangst.restanten.data ?? [] : [];
  const restStatusPerSignaal = bordRestStatusPerSignaal(restanten);
  const nageleverdArtikelen = new Set(restanten.filter((x) => x.telt_als_onderweg && !x.opnieuw_besteld && x.artikel_id).map((x) => x.artikel_id as string));
  const restTellers = onderwegTellers(restanten);
  const { isOpen } = useVestigingOpenDagen(vestiging || null);
  const [naam, setNaam] = useState('');
  const [aantal, setAantal] = useState<number | null>(1);
  const [soort, setSoort] = useState<string | null>(null);
  const [bewerk, setBewerk] = useState<BestelSignaal | null>(null);
  const [bewerkAantal, setBewerkAantal] = useState<number | null>(1);
  const [bewerkSoort, setBewerkSoort] = useState<string | null>(null);
  const [datumVoor, setDatumVoor] = useState<BestelSignaal | null>(null);
  const [datumKeuze, setDatumKeuze] = useState('');
  const [leveringActie, setLeveringActie] = useState<{ signaal: BestelSignaal; type: 'niet' | 'deels' } | null>(null);
  const [leveringOpmerking, setLeveringOpmerking] = useState('');
  const [deelsOntvangen, setDeelsOntvangen] = useState(1);
  const invoer = useRef<HTMLInputElement>(null);
  const { data: vormen } = useArtikelVormen(vestiging || null);
  const { data: regelInfoMap } = useBordRegelInfo(vestiging || null);
  const regelInfo = (s: BestelSignaal) => regelInfoMap?.get(s.id);
  const { data: prijsSignalen = [] } = usePrijsSignalen(vestiging || null);
  const [suggesties, setSuggesties] = useState<BordSuggestie[]>([]);
  const [lijstOpen, setLijstOpen] = useState(false);
  const [actief, setActief] = useState(-1);
  const [gekozen, setGekozen] = useState<BordSuggestie | null>(null);
  const [vormId, setVormId] = useState<string | null>(null);
  const [bewerkVormId, setBewerkVormId] = useState<string | null>(null);
  const zoekNr = useRef(0);
  const vandaagStr = ymd(new Date());
  const advies = useBestelAdvies(vestiging || null, vandaagStr);
  const [adviesBezig, setAdviesBezig] = useState(false);
  const [tabKeuze, setTabKeuze] = useState<string | null>(null);
  const zoek = '';
  const [alleenZonderPrijs, setAlleenZonderPrijs] = useState(false);
  const [telOverzicht, setTelOverzicht] = useState({ open: 0, geladen: false });
  const rapporteerTellen = useCallback((a: { open: number; geladen: boolean }) => setTelOverzicht(a), []);
  useEffect(() => { setTabKeuze(null); }, [vestiging]);


  const vandaag = useMemo(() => new Date(), []);
  const teLaatVan = (s: BestelSignaal) => dagenTeLaat(s.verwachte_levering, vandaag, isOpen);

  const { open, besteld, geleverd } = useMemo(
    () => ({
      open: signalen.filter((s) => s.status === 'open'),
      besteld: signalen.filter((s) => s.status === 'besteld'),
      geleverd: signalen.filter((s) => s.status === 'geleverd').slice(0, 30),
    }),
    [signalen],
  );

  // Namen van wie leveringen heeft afgevinkt.
  const geleverdDoorIds = useMemo(
    () => [...new Set(geleverd.map((s) => s.geleverd_door).filter((x): x is string => !!x))],
    [geleverd],
  );
  const { data: namen } = useQuery({
    queryKey: ['namen', geleverdDoorIds],
    enabled: geleverdDoorIds.length > 0,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase.rpc('rpc_namen_voor_users', { _ids: geleverdDoorIds });
      return new Map((data ?? []).map((r: { user_id: string; naam: string | null }) => [r.user_id, r.naam ?? '']));
    },
  });

  /** Alleen presentatie: leverancier uit signaal, dan artikelvorm; order blijft apart. */
  const leverancier = (s: BestelSignaal) => leverancierNaam(s, leveranciers, vormById);
  const groepeer = (regels: BestelSignaal[]) => {
    const m = new Map<string, BestelSignaal[]>();
    for (const s of regels) {
      const key = `${leverancier(s)}|${s.bestelreferentie ?? s.besteld_op ?? ''}`;
      m.set(key, [...(m.get(key) ?? []), s]);
    }
    return [...m.entries()].map(([key, regels]) => ({ key, titel: leverancier(regels[0]), regels })).sort((a, b) => a.titel === b.titel ? 0 : a.titel === 'Leverancier onbekend' ? 1 : b.titel === 'Leverancier onbekend' ? -1 : a.titel.localeCompare(b.titel));
  };

  const { teChecken, onderweg, zonderDatum } = useMemo(() => {
    const vandaagYmd = ymd(vandaag);
    return {
      teChecken: besteld.filter((s) => s.verwachte_levering && s.verwachte_levering <= vandaagYmd),
      onderweg: besteld.filter((s) => s.verwachte_levering && s.verwachte_levering > vandaagYmd),
      zonderDatum: besteld.filter((s) => !s.verwachte_levering),
    };
  }, [besteld, vandaag]);

  // Keuzelijst uit de productdatabase: debounce 150 ms, oude antwoorden negeren.
  useEffect(() => {
    const q = naam.trim();
    if (!q || !vestiging || gekozen) {
      setSuggesties([]);
      return;
    }
    const nr = ++zoekNr.current;
    const t = setTimeout(() => {
      zoekBordSuggesties(vestiging, q)
        .then((r) => {
          if (nr !== zoekNr.current) return;
          setSuggesties(r);
          setActief(-1);
        })
        .catch(() => nr === zoekNr.current && setSuggesties([]));
    }, 150);
    return () => clearTimeout(t);
  }, [naam, vestiging, gekozen]);

  const wijzigNaam = (v: string) => {
    setNaam(v);
    setLijstOpen(true);
    if (gekozen && v !== gekozen.naam) {
      // Handmatig gewijzigd: koppeling met artikel/vorm vervalt.
      setGekozen(null);
      setVormId(null);
    }
  };

  // Eerder vrij getypte bordregels (zonder artikel), nieuwste eerst — snelkeuze zoals vroeger.
  const eerderVrij = useMemo(() => eerderVrijeRegels(signalen), [signalen]);
  const eerderSuggesties = useMemo(
    () => (gekozen ? [] : filterEerderSuggesties(eerderVrij, naam, suggesties.map((s) => s.naam))),
    [naam, gekozen, eerderVrij, suggesties],
  );

  const kiesEerder = (s: BestelSignaal) => {
    setNaam(s.naam);
    setSoort(null);
    setGekozen(null);
    setVormId(null);
    setSuggesties([]);
    setLijstOpen(false);
  };

  const vormNodig = !!gekozen && gekozen.vormen.length > 1 && !vormId;
  const gekozenVorm = gekozen && vormId ? gekozen.vormen.find((x) => x.id === vormId) ?? null : null;
  const metBlokkade = (vs: ArtikelVorm[]) => vs.map((v) => ({ ...v, geblokkeerd: v.geblokkeerd ?? vormById.get(v.id)?.geblokkeerd ?? false }));

  const kiesArtikel = (s: BordSuggestie) => {
    // Geen voorkeuze: alleen bij precies één vorm ligt die vast.
    const enige = s.vormen.length === 1 ? s.vormen[0] : null;
    setNaam(s.naam);
    setGekozen(s);
    setVormId(enige?.id ?? null);
    setSoort(enige ? enige.eenheid : s.vormen.length > 1 ? null : s.standaard_eenheid ?? soort);
    setSuggesties([]);
    setLijstOpen(false);
    setActief(-1);
  };

  const leeg = () => {
    setNaam('');
    setAantal(1);
    setSoort(null);
    setGekozen(null);
    setVormId(null);
    setSuggesties([]);
    invoer.current?.focus();
  };

  const voegToe = () => {
    const n = naam.trim();
    if (test || n.length < 2 || !vestiging || isLoading || aantal == null || vormNodig) return;
    const eenheid = soort ?? 'stuks';
    const v = gekozen && vormId ? gekozen.vormen.find((x) => x.id === vormId) : undefined;
    const koppeling = gekozen
      ? { artikel_id: gekozen.artikel_id, leverancier_id: v?.leverancier_id ?? gekozen.leverancier_id ?? null, artikel_vorm_id: v && v.eenheid === eenheid ? v.id : null }
      : null;
    const bestaand = open.find((s) => norm(s.naam) === norm(n) && (s.artikel_vorm_id ?? null) === (koppeling?.artikel_vorm_id ?? null));
    if (bestaand) {
      toast(`Staat er al (${Number(bestaand.aantal)} ${bestaand.eenheid})`, {
        action: {
          label: `+${aantal} erbij`,
          onClick: () =>
            wijzig.mutate({ id: bestaand.id, aantal: Number(bestaand.aantal) + aantal, eenheid: bestaand.eenheid }),
        },
      });
      leeg();
      return;
    }
    const onderwegMatch = besteld.find((s) => norm(s.naam) === norm(n));
    if (onderwegMatch) {
      toast(`Let op: al onderweg, verwacht ${leverDatumLabel(onderwegMatch.verwachte_levering)}`);
    }
    toevoegen.mutate(
      { naam: n, aantal, eenheid, koppeling },
      {
        onSuccess: () => toast.success(`${n} — ${aantal} ${eenheid} staat erop`),
        onError: (e: any) => toast.error('Niet opgeslagen: ' + (e?.message ?? 'onbekende fout')),
      },
    );
    leeg();
  };

  /** Advies op het bord: gewone open regel (of ophogen bij dezelfde naam), nooit besteld. */
  const adviesOpBord = async (a: BestelAdvies) => {
    if (test || !vestiging || isLoading || adviesBezig) return;
    const v = a.artikel_vorm_id ? vormById.get(a.artikel_vorm_id) : undefined;
    const eenheid = v?.eenheid ?? a.eenheid ?? 'stuks';
    const aantalA = Number(a.hoeveelheid) > 0 ? Number(a.hoeveelheid) : 1;
    setAdviesBezig(true);
    try {
      const bestaand = open.find((s) => norm(s.naam) === norm(a.artikel) && (s.artikel_vorm_id ?? null) === (v?.id ?? null));
      if (bestaand) {
        const oud = Number(bestaand.aantal);
        await wijzig.mutateAsync({ id: bestaand.id, aantal: oud + aantalA, eenheid: bestaand.eenheid });
        await advies.zetOpBord.mutateAsync({ id: a.id, regelId: bestaand.id });
        toast.success(`${a.artikel}: +${aantalA} erbij`, {
          action: {
            label: 'Ongedaan maken',
            onClick: () => {
              wijzig.mutate({ id: bestaand.id, aantal: oud, eenheid: bestaand.eenheid });
              advies.zetOpBord.mutate({ id: a.id, regelId: null });
            },
          },
        });
      } else {
        const koppeling = v
          ? { artikel_id: v.artikel_id, leverancier_id: v.leverancier_id, artikel_vorm_id: v.id }
          : { artikel_id: a.artikel_id, leverancier_id: a.leverancier_id, artikel_vorm_id: null };
        const id = await toevoegen.mutateAsync({ naam: a.artikel, aantal: aantalA, eenheid, koppeling });
        await advies.zetOpBord.mutateAsync({ id: a.id, regelId: id });
        toast.success(`${a.artikel} — ${aantalA} ${eenheid} staat erop`);
      }
    } catch (e: any) {
      toast.error('Niet opgeslagen: ' + (e?.message ?? 'onbekende fout'));
    } finally {
      setAdviesBezig(false);
    }
  };

  // Indicatieprijs per regel.
  const vormById = useMemo(() => new Map((vormen ?? []).map((v) => [v.id, v])), [vormen]);
  const deadlineHint = (s: BestelSignaal | BestelAdvies) => deadlineVoor(s.leverancier_id ?? (s.artikel_vorm_id ? vormById.get(s.artikel_vorm_id)?.leverancier_id : null));
  const prijsVan = (s: BestelSignaal): { vorm: ArtikelVorm; totaal: number } | null => {
    let v: ArtikelVorm | undefined;
    if (s.artikel_vorm_id) v = vormById.get(s.artikel_vorm_id);
    else if (s.artikel_id) {
      const kand = (vormen ?? []).filter((x) => x.artikel_id === s.artikel_id && x.eenheid === s.eenheid);
      if (kand.length === 1) v = kand[0];
    }
    if (!v || v.prijs == null || v.eenheid !== s.eenheid) return null;
    return { vorm: v, totaal: Number(s.aantal) * Number(v.prijs) };
  };

  const signaalVan = (s: BestelSignaal): PrijsSignaal | null =>
    zoekSignaal(prijsSignalen, {
      leverancier_id: s.leverancier_id, artikel_id: s.artikel_id, naam: s.naam,
      vorm: s.artikel_vorm_id ? vormById.get(s.artikel_vorm_id)?.vorm ?? null : null,
    });

  const bewerkVormen = useMemo(
    () => (bewerk?.artikel_id ? (vormen ?? []).filter((v) => v.artikel_id === bewerk.artikel_id) : []),
    [bewerk, vormen],
  );

  const markeerBesteld = (s: BestelSignaal, b: boolean) =>
    !test && zetBesteld.mutate(
      { id: s.id, besteld: b },
      {
        onSuccess: () =>
          b && toast.success(`${s.naam} besteld`, {
            action: { label: 'Ongedaan maken', onClick: () => zetBesteld.mutate({ id: s.id, besteld: false }) },
          }),
      },
    );

  const vervallen = (s: BestelSignaal) =>
    !test && verwijderen.mutate(s.id, {
      onSuccess: () =>
        toast(`${s.naam} van de lijst`, { action: { label: 'Ongedaan maken', onClick: () => herstel.mutate(s.id) } }),
    });

  const vinkGeleverd = (ids: string[], label: string) =>
    !test && markeerGeleverd.mutate(ids, {
      onSuccess: () =>
        toast.success(`${label} geleverd`, {
          action: { label: 'Ongedaan maken', onClick: () => ids.forEach((id) => terugNaarBesteld.mutate(id)) },
        }),
      onError: (e: any) => toast.error('Niet opgeslagen: ' + (e?.message ?? 'onbekende fout')),
    });

  const openDatum = (s: BestelSignaal) => {
    setDatumVoor(s);
    setDatumKeuze(s.verwachte_levering ?? ymd(new Date(Date.now() + 24 * 60 * 60 * 1000)));
  };

  const openLeveringActie = (s: BestelSignaal, type: 'niet' | 'deels') => {
    setLeveringActie({ signaal: s, type });
    setLeveringOpmerking('');
    setDeelsOntvangen(Math.max(1, Number(s.aantal) - 1));
  };

  const bevestigLeveringActie = () => {
    if (!leveringActie || test) return;
    const { signaal: s, type } = leveringActie;
    if (type === 'niet') {
      nietGeleverd.mutate({ id: s.id, opmerking: leveringOpmerking.trim() }, {
        onSuccess: () => toast(`${s.naam} staat weer op het bord`),
        onError: (e: any) => toast.error('Niet opgeslagen: ' + (e?.message ?? 'onbekende fout')),
      });
    } else {
      deelsGeleverd.mutate({ signaal: s, ontvangen: deelsOntvangen, opmerking: leveringOpmerking.trim() }, {
        onSuccess: () => toast.success(`${s.naam}: ${deelsOntvangen} ${s.eenheid} binnen, restant staat weer op het bord`),
        onError: (e: any) => toast.error('Niet opgeslagen: ' + (e?.message ?? 'onbekende fout')),
      });
    }
    setLeveringActie(null);
  };

  const groepProps = {
    regelInfo,
    deadlineHint,
    dagenTeLaatVan: teLaatVan,
    onAllesGeleverd: (ids: string[]) => vinkGeleverd(ids, `${ids.length} ${ids.length === 1 ? 'regel' : 'regels'}`),
    onGeleverd: (s: BestelSignaal) => vinkGeleverd([s.id], s.naam),
    onDatum: openDatum,
    onNietGeleverd: (s: BestelSignaal) => openLeveringActie(s, 'niet'),
    onDeelsGeleverd: (s: BestelSignaal) => openLeveringActie(s, 'deels'),
  };

  const openBewerk = (s: BestelSignaal) => {
    if (test) return;
    setBewerk(s);
    setBewerkAantal(Math.max(1, Number(s.aantal) || 1));
    setBewerkSoort(s.eenheid);
    const heeftVormen = !!s.artikel_id && (vormen ?? []).some((v) => v.artikel_id === s.artikel_id);
    setBewerkVormId(regelInfo(s)?.eenheid_controleren && heeftVormen ? null : s.artikel_vorm_id);
  };

  const isMobile = useIsMobile();
  const tab = tabKeuze ?? (!isLoading && telOverzicht.geladen && telOverzicht.open > 0 && open.length === 0 ? 'tellen' : 'bord');
  const adviesRegels = advies.data?.regels ?? [];
  const leveranciersTabel = <LeveranciersOverzicht open={open} onderweg={besteld} leverancier={leverancier} prijsVan={prijsVan} />;
  const bordProps = { ...(v2 ? { restStatus: (s: BestelSignaal) => restStatusPerSignaal.get(s.id) ?? null, alleenLezen: test } : {}), regelInfo, leverancier, deadlineHint, prijsVan, prijsSignaal: signaalVan, prijsTip, onBesteld: markeerBesteld, onBewerk: openBewerk, onVervallen: vervallen };
  const positieveAdviezen = adviesRegels.filter((a) => Number(a.hoeveelheid) > 0 && !(v2 && a.artikel_id && nageleverdArtikelen.has(a.artikel_id)));
  const nulAdviezen = adviesRegels.filter((a) => Number(a.hoeveelheid) <= 0);
  const openPrijzen = open.map(prijsVan).filter((p) => p != null);
    const zonderPrijs = [...open, ...besteld].filter((s) => !prijsVan(s)).length;
  const q = zoek.trim().toLowerCase();
  const filter = (r: BestelSignaal[]) => r.filter((s) => (!q || s.naam.toLowerCase().includes(q)) && (!alleenZonderPrijs || !prijsVan(s)));
  const onbekendZicht = filter(open).filter((s) => leverancier(s) === 'Leverancier onbekend');
  const openZicht = filter(open).filter((s) => leverancier(s) !== 'Leverancier onbekend');
  const teCheckenZicht = filter(teChecken);
  const onderwegZicht = filter(onderweg);
  const onderwegGroepZicht = v2 ? onderwegMetRest(teCheckenZicht, onderwegZicht, restStatusPerSignaal) : onderwegZicht;
  const zonderDatumZicht = filter(zonderDatum);
  const geleverdZicht = filter(geleverd);
  const besteldZicht = [...teCheckenZicht, ...onderwegZicht, ...zonderDatumZicht];
  const filterAan = !!q || alleenZonderPrijs;
  const openTotaal = openPrijzen.length ? euro(openPrijzen.reduce((n, p) => n + p.totaal, 0)) : '—';
    const leegKaart = (titel: string) => <EmptyState icon={filterAan ? Search : ClipboardList} title={filterAan ? 'Niets gevonden' : titel} description={filterAan ? 'Pas je zoekopdracht of filter aan.' : ''} className="border-0 shadow-none" action={filterAan ? <Button variant="outline" size="touch" onClick={() => { setAlleenZonderPrijs(false); }}>Filter wissen</Button> : undefined} />;

  return (
    <SidebarLayout>
      <div className="space-y-4">
        <Tabs value={tab} onValueChange={setTabKeuze}>
          <div className="flex flex-wrap items-center gap-2">
            <div className={isMobile ? '-mx-1 w-full overflow-x-auto px-1 [scrollbar-width:none]' : 'contents'}>
            <TabsList className={isMobile ? cn(segmentTabsKlasse, 'w-max min-w-full flex-nowrap [&>button]:flex-none [&>button]:whitespace-nowrap') : segmentTabsKlasse}>
              {[{ id: 'bord', naam: 'Op het bord', kort: 'Bord', Icoon: ClipboardList, n: open.length }, { id: 'advies', naam: 'Advies', kort: 'Advies', Icoon: Sparkles, n: positieveAdviezen.length }, ...(modus.keukenadvies ? [{ id: 'keuken', naam: 'Advies keuken', kort: 'Keuken', Icoon: ChefHat, n: keukenAdvies.data?.length ?? 0 }] : []), { id: 'tellen', naam: 'Tellen', kort: 'Tellen', Icoon: Calculator, n: telOverzicht.open }, { id: 'onderweg', naam: 'Onderweg', kort: 'Onderweg', Icoon: Truck, n: besteld.length }].map(({ id, naam, kort, Icoon, n }) => <TabsTrigger key={id} value={id} aria-label={`${naam} (${n})`} className="min-w-0 px-2 sm:px-3"><Icoon className="hidden h-4 w-4 shrink-0 sm:block" /><span className="truncate sm:hidden">{kort}</span><span className="hidden sm:inline">{naam}</span>{n > 0 && <span className="tabular-nums text-muted-foreground">{n}</span>}{id === 'onderweg' && v2 && restTellers.nageleverd > 0 && <span className="inline-flex items-center gap-0.5 tabular-nums text-muted-foreground"><Hourglass className="h-3 w-3" aria-hidden />{restTellers.nageleverd}</span>}{id === 'onderweg' && v2 && restTellers.mist > 0 && <span className="inline-flex items-center gap-0.5 tabular-nums text-warning" aria-label={`${restTellers.mist} mist`}><AlertCircle className="h-3 w-3" aria-hidden />{restTellers.mist}</span>}{id === 'onderweg' && teChecken.length > 0 && <span className="h-2 w-2 shrink-0 rounded-full bg-warning" aria-label={`${teChecken.length} te checken`} />}</TabsTrigger>)}
            </TabsList>
            </div>
            {test && <Badge variant="secondary">Test</Badge>}
            {zonderPrijs > 0 && (tab === 'bord' || tab === 'onderweg') && <Button variant={alleenZonderPrijs ? 'default' : 'outline'} className="ml-auto min-h-11 shrink-0 gap-1.5" aria-pressed={alleenZonderPrijs} onClick={() => setAlleenZonderPrijs((v) => !v)}><AlertCircle className={cn('h-4 w-4', !alleenZonderPrijs && 'text-warning')} /><span className="tabular-nums">{zonderPrijs}</span><span>zonder prijs</span></Button>}
          </div>
          <div className="mt-4 min-w-0">
            <div className="min-w-0 space-y-4">
              <TabsContent value="bord" className="mt-0 space-y-4">
                {v2 && modus.magBeslissen && <MandjeVragen modus={modus} vragen={ontvangst.mandje.data ?? []} />}
                <LijstKaart>
        <div className={cn('space-y-3 border-b border-border bg-muted/30 p-3', test && 'hidden')}>
          <Invoerbalk>
            <div className="relative min-w-0 basis-full sm:flex-1 sm:basis-auto">
              <Plus className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                ref={invoer}
                id="bestel-product"
                value={naam}
                onChange={(e) => wijzigNaam(e.target.value)}
                onBlur={() => setTimeout(() => setLijstOpen(false), 150)}
                onFocus={() => naam.trim() && setLijstOpen(true)}
                onKeyDown={(e) => {
                  const zichtbaar = lijstOpen && suggesties.length > 0;
                  if (e.key === 'ArrowDown' && zichtbaar) {
                    e.preventDefault();
                    setActief((i) => (i + 1) % suggesties.length);
                  } else if (e.key === 'ArrowUp' && zichtbaar) {
                    e.preventDefault();
                    setActief((i) => (i <= 0 ? suggesties.length - 1 : i - 1));
                  } else if (e.key === 'Escape') {
                    setLijstOpen(false);
                    setActief(-1);
                  } else if (e.key === 'Enter') {
                    e.preventDefault();
                    if (zichtbaar && actief >= 0) kiesArtikel(suggesties[actief]);
                    else voegToe();
                  }
                }}
                placeholder="Product toevoegen…"
                aria-label="Product toevoegen"
                className="h-11 w-full pl-9 text-base"
                role="combobox"
                aria-expanded={lijstOpen && suggesties.length > 0}
                aria-autocomplete="list"
              />
              {lijstOpen && naam.trim().length > 0 && suggesties.length > 0 && (
                <div role="listbox" className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-polar-md border border-border bg-popover shadow-md">
                  {suggesties.map((s, i) => {
                    const enige = s.vormen.length === 1 ? s.vormen[0] : null;
                    const levNaam = enige ? enige.leverancier_naam ?? (enige.leverancier_id ? leveranciers?.get(enige.leverancier_id) : null) : null;
                    const sub = s.vormen.length > 1 ? `${s.vormen.length} verpakkingen` : [enige?.vorm, levNaam].filter(Boolean).join(' · ');
                    return (
                      <Button variant="ghost"
                        key={s.artikel_id}
                        type="button"
                        role="option"
                        aria-selected={i === actief}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => kiesArtikel(s)}
                        className={cn('block w-full px-3 py-2 text-left min-h-[48px]', i === actief ? 'bg-muted' : 'hover:bg-muted/60')}
                      >
                        <span className="block text-sm font-medium text-foreground">{s.naam}</span>
                        {sub && <span className="block text-xs text-muted-foreground">{sub}</span>}
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>
            {naam.trim().length >= 2 && <>
            {gekozenVorm ? (
              <Stepper waarde={aantal} onChange={setAantal} eenheid={eenheidLabel(gekozenVorm.eenheid, aantal)} />
            ) : vormNodig ? (
              <Stepper waarde={aantal} onChange={setAantal} eenheid="" uit />
            ) : <>
              <Stepper waarde={aantal} onChange={setAantal} />
              <Select value={soort ?? 'stuks'} onValueChange={setSoort}>
                <SelectTrigger className="h-11 w-[110px] border-0 shadow-none" aria-label="Verpakking"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SOORTEN.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}
                </SelectContent>
              </Select>
            </>}
            {naam.trim().length >= 2 && !vormNodig && <Button size="touch" className="ml-auto gap-1 px-3" aria-label="Erbij zetten" onClick={voegToe} disabled={!vestiging || isLoading || aantal == null || !!gekozenVorm?.geblokkeerd || !!(gekozenVorm && vormById.get(gekozenVorm.id)?.geblokkeerd)}>
              <Check className="h-4 w-4" /><span>Toevoegen</span>
            </Button>}
            </>}
          </Invoerbalk>
          {eerderSuggesties.length > 0 && (
            <div className={isMobile ? 'flex gap-1.5 overflow-x-auto [scrollbar-width:none]' : 'flex flex-wrap gap-1.5'}>
              {eerderSuggesties.map((s) => (
                <Button variant="ghost" key={s.id} type="button" onClick={() => kiesEerder(s)}
                  className="min-h-11 shrink-0 px-3">
                  {s.naam} · {Number(s.aantal)} {s.eenheid}
                </Button>
              ))}
            </div>
          )}
          {gekozen && gekozen.vormen.length > 1 && (
            <VormKeuze
              vormen={metBlokkade(gekozen.vormen)}
              gekozen={vormId}
              leveranciers={leveranciers}
              onKies={(v) => { if (vormId && v.id !== vormId) setAantal(null); setVormId(v.id); setSoort(v.eenheid); }}
            />
          )}
          {gekozenVorm && <VerpakkingRegel vorm={gekozenVorm} aantal={aantal} />}
        </div>

                {isLoading ? <LaadRijen /> : openZicht.length ? <BordTabel regels={openZicht} {...bordProps} /> : onbekendZicht.length ? null : leegKaart('Niets openstaand')}
                {!isLoading && openZicht.length > 0 && <TabelVoet links={`${openZicht.length} ${openZicht.length === 1 ? 'product' : 'producten'}`} rechts={openTotaal} />}
                </LijstKaart>
                {!isLoading && onbekendZicht.length > 0 && <LijstKaart kop={<KaartKop icoon={Truck} titel="Leverancier kiezen" teller={onbekendZicht.length} />}><BordTabel regels={onbekendZicht} {...bordProps} /></LijstKaart>}
                {(open.length > 0 || besteld.length > 0) && <LijstKaart kop={<KaartKop icoon={ClipboardList} titel="Per leverancier" />}>{leveranciersTabel}</LijstKaart>}
              </TabsContent>
              <TabsContent value="advies" className="mt-0 space-y-4">
                <LijstKaart kop={<KaartKop icoon={Sparkles} titel={advies.data?.leverdag ? `Voor ${leverDatumLabel(advies.data.leverdag)}` : 'Advies'} />}>
                  {advies.isLoading ? <LaadRijen /> : positieveAdviezen.length ? <AdviesTabel regels={positieveAdviezen} open={open} bezig={adviesBezig || test} onOpBord={adviesOpBord} deadlineHint={deadlineHint} /> : <EmptyState icon={Sparkles} title="Geen voorstellen" description="" className="border-0 shadow-none" />}
                  {!advies.isLoading && positieveAdviezen.length > 0 && <TabelVoet links={`${positieveAdviezen.length} ${positieveAdviezen.length === 1 ? 'voorstel' : 'voorstellen'}`} />}
                </LijstKaart>
                {!!nulAdviezen.length && <LijstKaart kop={<KaartKop icoon={Check} titel="Niet nodig" teller={nulAdviezen.length} />}><AdviesTabel regels={nulAdviezen} open={open} bezig={adviesBezig} onOpBord={adviesOpBord} deadlineHint={deadlineHint} nul /></LijstKaart>}
              </TabsContent>
              {modus.keukenadvies && <TabsContent value="keuken" className="mt-0 space-y-4"><KeukenAdviesTabel regels={keukenAdvies.data ?? []} laden={keukenAdvies.isLoading} /></TabsContent>}
              <div hidden={tab !== 'tellen'}>{test ? <LijstKaart><p className="px-4 py-6 text-center text-sm text-muted-foreground">Niet beschikbaar in testmodus</p></LijstKaart> : <Voorraadproef key={vestiging} vestiging={vestiging} onOverzicht={rapporteerTellen} />}</div>
              <TabsContent value="onderweg" className="mt-0 space-y-4">
                {v2 && <><NageleverdKaart modus={modus} regels={restanten} /><EindcheckKaart modus={modus} restanten={restanten} regels={ontvangst.vandaag.data ?? []} laden={ontvangst.vandaag.isLoading} leveranciers={leveranciers} /></>}
                {[...(v2 ? [] : [{ titel: 'Vandaag te checken', regels: teCheckenZicht }]), { titel: 'Onderweg', regels: onderwegGroepZicht }, { titel: 'Zonder datum', regels: zonderDatumZicht }].filter((g) => g.regels.length).map((groep) => <LijstKaart key={groep.titel} kop={<KaartKop icoon={Truck} titel={groep.titel} teller={groep.regels.length} />}><OnderwegTabel groepen={groepeer(groep.regels)} {...groepProps} onBewerk={openBewerk} datumLabel={datumLabel} leverDatumLabel={leverDatumLabel} {...(v2 ? { zonderDeels: true, alleenLezen: test, restStatus: (s: BestelSignaal) => restStatusPerSignaal.get(s.id) ?? null } : {})} /><TabelVoet links={`${groep.regels.length} ${groep.regels.length === 1 ? 'product' : 'producten'}`} /></LijstKaart>)}
                {!v2 && !besteldZicht.length && <LijstKaart>{leegKaart('Niets onderweg')}</LijstKaart>}
                {!!geleverdZicht.length && <LijstKaart kop={<KaartKop icoon={Check} titel="Geleverd" teller={geleverdZicht.length} />}><BordTabel regels={geleverdZicht} {...bordProps} geleverd onTerug={(s) => !test && terugNaarBesteld.mutate(s.id)} detail={(s) => [s.geleverd_op ? datumLabel(s.geleverd_op) : '', s.geleverd_door ? namen?.get(s.geleverd_door) : '', s.levering_status === 'deels' ? 'Deels' : '', s.levering_opmerking].filter(Boolean).join(' · ')} /></LijstKaart>}
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </div>

      <DetailLade open={!!bewerk} onOpenChange={(o) => !o && setBewerk(null)} titel={bewerk?.naam}>
          <div className="space-y-4">
            {bewerk && <Stappen stappen={['Op bord', 'Besteld', 'Geleverd']} huidig={bewerk.status === 'geleverd' ? 2 : bewerk.status === 'besteld' ? 1 : 0} />}
            {bewerk && <RegelInfo info={regelInfo(bewerk)} detail />}
            <div className="space-y-1.5">
              {bewerkVormId && vormById.get(bewerkVormId)
                ? <Stepper waarde={bewerkAantal} onChange={setBewerkAantal} eenheid={eenheidLabel(vormById.get(bewerkVormId)!.eenheid, bewerkAantal)} />
                : <Stepper waarde={bewerkAantal} onChange={setBewerkAantal} {...(bewerkVormen.length > 0 ? { eenheid: '', uit: true } : {})} />}
              {bewerkVormId && vormById.get(bewerkVormId) && <VerpakkingRegel vorm={vormById.get(bewerkVormId)!} aantal={bewerkAantal} />}
            </div>
            {(bewerkVormen.length > 1 || (bewerkVormen.length > 0 && !bewerkVormId)) && (
              <VormKeuze
                vormen={bewerkVormen}
                gekozen={bewerkVormId}
                leveranciers={leveranciers}
                onKies={(v) => { if (bewerkVormId && v.id !== bewerkVormId) setBewerkAantal(null); setBewerkVormId(v.id); setBewerkSoort(v.eenheid); }}
              />
            )}
            {(!bewerk?.artikel_id || bewerkVormen.length === 0) && <SoortKeuze waarde={bewerkSoort} onChange={setBewerkSoort} />}
            <Button
              className="h-12 w-full"
              disabled={bewerkAantal == null || (bewerkVormen.length > 0 && !bewerkVormId)}
              onClick={() => {
                if (!bewerk || bewerkAantal == null) return;
                const controleren = !!regelInfo(bewerk)?.eenheid_controleren;
                const eenh = bewerkSoort ?? 'stuks';
                const v = bewerkVormId ? vormById.get(bewerkVormId) : undefined;
                let vorm: { artikel_vorm_id: string | null; leverancier_id: string | null; eenheid_controleren?: boolean } | undefined;
                if (v && v.eenheid === eenh) {
                  if (v.id !== bewerk.artikel_vorm_id || controleren) vorm = controleren ? { artikel_vorm_id: v.id, leverancier_id: v.leverancier_id, eenheid_controleren: false } : { artikel_vorm_id: v.id, leverancier_id: v.leverancier_id };
                } else if (bewerk.artikel_vorm_id || v) {
                  // Eenheid past niet bij de vorm: koppeling met vorm vervalt, artikel en leverancier blijven.
                  vorm = { artikel_vorm_id: null, leverancier_id: v?.leverancier_id ?? bewerk.leverancier_id };
                }
                wijzig.mutate({
                  id: bewerk.id, aantal: bewerkAantal, eenheid: bewerkSoort ?? 'stuks',
                  vorm,
                });
                setBewerk(null);
              }}
            >
              Opslaan
            </Button>
          </div>
      </DetailLade>
      <Dialog open={!!datumVoor} onOpenChange={(o) => !o && setDatumVoor(null)}>
        <DialogContent className="max-w-[650px] rounded-polar-xl">
          <DialogHeader>
            <DialogTitle>Verwachte levering — {datumVoor?.naam}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              type="date"
              value={datumKeuze}
              min={ymd(new Date())}
              onChange={(e) => setDatumKeuze(e.target.value)}
              className="h-12 text-base"
            />
            <Button
              className="h-12 w-full"
              disabled={!datumKeuze}
              onClick={() => {
                if (!datumVoor || !datumKeuze) return;
                zetVerwachteLevering.mutate({ id: datumVoor.id, datum: datumKeuze });
                setDatumVoor(null);
              }}
            >
              Opslaan
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!leveringActie} onOpenChange={(o) => !o && setLeveringActie(null)}>
        <DialogContent className="max-w-[650px] rounded-polar-xl">
          <DialogHeader>
            <DialogTitle>
              {leveringActie?.type === 'niet' ? 'Niet geleverd' : 'Deels geleverd'} — {leveringActie?.signaal.naam}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {leveringActie?.type === 'deels' && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  Hoeveel is er binnen? (besteld: {Number(leveringActie.signaal.aantal)} {leveringActie.signaal.eenheid})
                </p>
                <Stepper waarde={deelsOntvangen} onChange={(n) => setDeelsOntvangen(Math.min(n ?? 1, Number(leveringActie.signaal.aantal) - 1))} />
              </div>
            )}
            <Textarea
              value={leveringOpmerking}
              onChange={(e) => setLeveringOpmerking(e.target.value)}
              placeholder="Korte opmerking (bijv. waarom niet geleverd)"
              className="text-base"
            />
            <Button className="h-12 w-full" onClick={bevestigLeveringActie}>
              {leveringActie?.type === 'niet' ? 'Terug op het bord' : 'Restant terug op het bord'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </SidebarLayout>
  );
}
