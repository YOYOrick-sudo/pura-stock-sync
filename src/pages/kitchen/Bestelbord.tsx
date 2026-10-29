import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ChevronDown, Minus, Plus, Truck, ClipboardList, Calculator, Sparkles, Building2, Check, AlertCircle } from 'lucide-react';
import { DetailLade, InklapGroep, KaartKop, LaadRijen, LegeStaat, LijstKaart, Invoerbalk, Kengetal, OverzichtKaart, segmentTabsKlasse } from '@/components/pura/patronen';
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
  useBestelSignalen, useBestelbordMutaties, useLeveranciers, useVestigingOpenDagen, useArtikelVormen, zoekBordSuggesties, useBestelAdvies,
  type BestelSignaal, type ArtikelVorm, type BordSuggestie, type BestelAdvies,
} from '@/hooks/useBestelbord';
import { Voorraadproef } from '@/components/kitchen/Voorraadproef';
import { usePrijsSignalen } from '@/hooks/usePrijsSignalen';
import { zoekSignaal, type PrijsSignaal } from '@/lib/prijsSignaal';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { BordTabel } from '@/components/kitchen/bestelbord/BordTabel';
import { OnderwegTabel } from '@/components/kitchen/bestelbord/OnderwegTabel';
import { AdviesTabel } from '@/components/kitchen/bestelbord/AdviesTabel';
import { LeveranciersOverzicht } from '@/components/kitchen/bestelbord/LeveranciersOverzicht';
import { leverancierNaam } from '@/components/kitchen/bestelbord/presentatie';

const SOORTEN = ['stuks', 'doos', 'zak', 'fles', 'pak', 'bak', 'emmer', 'kg', 'bos', 'tray', 'rol', 'fust'] as const;

function datumLabel(iso: string): string {
  return new Date(iso).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' });
}

const norm = (s: string) => s.trim().toLowerCase();

function Stepper({ waarde, onChange }: { waarde: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      <Button type="button" variant="ghost" className="h-11 w-11 p-0" aria-label="Minder" onClick={() => onChange(Math.max(1, waarde - 1))}>
        <Minus className="h-4 w-4" />
      </Button>
      <Input
        value={String(waarde)}
        onChange={(e) => onChange(Math.max(1, Number(e.target.value.replace(/[^0-9]/g, '')) || 1))}
        inputMode="numeric"
        className="h-11 w-14 text-center text-base font-semibold"
        aria-label="Aantal"
      />
      <Button type="button" variant="ghost" className="h-11 w-11 p-0" aria-label="Meer" onClick={() => onChange(waarde + 1)}>
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
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
    <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Verpakkingsvorm">
      {vormen.map((v) => {
        const lev = v.leverancier_naam ?? (v.leverancier_id ? leveranciers?.get(v.leverancier_id) : null);
        return (
          <Button variant={gekozen === v.id ? 'default' : 'outline'}
            key={v.id}
            type="button"
            role="radio"
            aria-checked={gekozen === v.id}
            onClick={() => onKies(v)}
            className="min-h-11 h-auto whitespace-normal px-3 py-1.5 text-left text-sm"
          >
            {[v.vorm, lev, v.prijs != null ? `${euro(Number(v.prijs))} excl.` : '–'].filter(Boolean).join(' · ')}
          </Button>
        );
      })}
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
  const { data: signalen = [], isLoading } = useBestelSignalen(vestiging || null);
  const {
    toevoegen, zetBesteld, verwijderen, herstel, wijzig,
    markeerGeleverd, nietGeleverd, deelsGeleverd, terugNaarBesteld, zetVerwachteLevering,
  } = useBestelbordMutaties(vestiging);
  const { data: leveranciers } = useLeveranciers();
  const { isOpen } = useVestigingOpenDagen(vestiging || null);
  const [naam, setNaam] = useState('');
  const [aantal, setAantal] = useState(1);
  const [soort, setSoort] = useState<string | null>(null);
  const [bewerk, setBewerk] = useState<BestelSignaal | null>(null);
  const [bewerkAantal, setBewerkAantal] = useState(1);
  const [bewerkSoort, setBewerkSoort] = useState<string | null>(null);
  const [datumVoor, setDatumVoor] = useState<BestelSignaal | null>(null);
  const [datumKeuze, setDatumKeuze] = useState('');
  const [leveringActie, setLeveringActie] = useState<{ signaal: BestelSignaal; type: 'niet' | 'deels' } | null>(null);
  const [leveringOpmerking, setLeveringOpmerking] = useState('');
  const [deelsOntvangen, setDeelsOntvangen] = useState(1);
  const invoer = useRef<HTMLInputElement>(null);
  const { data: vormen } = useArtikelVormen(vestiging || null);
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
  const eerderVrij = useMemo(() => {
    const m = new Map<string, BestelSignaal>();
    for (const s of signalen) if (!s.artikel_id && !m.has(norm(s.naam))) m.set(norm(s.naam), s);
    return [...m.values()];
  }, [signalen]);
  const eerderSuggesties = useMemo(() => {
    const q = norm(naam);
    if (!q || gekozen) return [];
    const inLijst = new Set(suggesties.map((s) => norm(s.naam)));
    return eerderVrij.filter((s) => norm(s.naam).includes(q) && norm(s.naam) !== q && !inLijst.has(norm(s.naam))).slice(0, 8);
  }, [naam, gekozen, eerderVrij, suggesties]);

  const kiesEerder = (s: BestelSignaal) => {
    setNaam(s.naam);
    setAantal(Math.max(1, Number(s.aantal) || 1));
    setSoort(s.eenheid);
    setGekozen(null);
    setVormId(null);
    setSuggesties([]);
    setLijstOpen(false);
  };

  const kiesArtikel = (s: BordSuggestie) => {
    const std = s.vormen.find((v) => v.is_standaard) ?? s.vormen[0] ?? null;
    setNaam(s.naam);
    setGekozen(s);
    setVormId(std?.id ?? null);
    setSoort(std?.eenheid ?? s.standaard_eenheid ?? soort);
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
    if (n.length < 2 || !vestiging || isLoading) return;
    const eenheid = soort ?? 'stuks';
    const bestaand = open.find((s) => norm(s.naam) === norm(n));
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
    const v = gekozen && vormId ? gekozen.vormen.find((x) => x.id === vormId) : undefined;
    const koppeling = gekozen
      ? { artikel_id: gekozen.artikel_id, leverancier_id: v?.leverancier_id ?? gekozen.leverancier_id ?? null, artikel_vorm_id: v && v.eenheid === eenheid ? v.id : null }
      : null;
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
    if (!vestiging || isLoading || adviesBezig) return;
    const v = a.artikel_vorm_id ? vormById.get(a.artikel_vorm_id) : undefined;
    const eenheid = v?.eenheid ?? a.eenheid ?? 'stuks';
    const aantalA = Number(a.hoeveelheid) > 0 ? Number(a.hoeveelheid) : 1;
    setAdviesBezig(true);
    try {
      const bestaand = open.find((s) => norm(s.naam) === norm(a.artikel));
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
    zetBesteld.mutate(
      { id: s.id, besteld: b },
      {
        onSuccess: () =>
          b && toast.success(`${s.naam} besteld`, {
            action: { label: 'Ongedaan maken', onClick: () => zetBesteld.mutate({ id: s.id, besteld: false }) },
          }),
      },
    );

  const vervallen = (s: BestelSignaal) =>
    verwijderen.mutate(s.id, {
      onSuccess: () =>
        toast(`${s.naam} van de lijst`, { action: { label: 'Ongedaan maken', onClick: () => herstel.mutate(s.id) } }),
    });

  const vinkGeleverd = (ids: string[], label: string) =>
    markeerGeleverd.mutate(ids, {
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
    if (!leveringActie) return;
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
    dagenTeLaatVan: teLaatVan,
    onAllesGeleverd: (ids: string[]) => vinkGeleverd(ids, `${ids.length} ${ids.length === 1 ? 'regel' : 'regels'}`),
    onGeleverd: (s: BestelSignaal) => vinkGeleverd([s.id], s.naam),
    onDatum: openDatum,
    onNietGeleverd: (s: BestelSignaal) => openLeveringActie(s, 'niet'),
    onDeelsGeleverd: (s: BestelSignaal) => openLeveringActie(s, 'deels'),
  };

  const openBewerk = (s: BestelSignaal) => {
    setBewerk(s);
    setBewerkAantal(Math.max(1, Number(s.aantal) || 1));
    setBewerkSoort(s.eenheid);
    setBewerkVormId(s.artikel_vorm_id);
  };

  const tab = tabKeuze ?? (!isLoading && telOverzicht.geladen && telOverzicht.open > 0 && open.length === 0 ? 'tellen' : 'bord');
  const adviesRegels = advies.data?.regels ?? [];
  const positieveAdviezen = adviesRegels.filter((a) => Number(a.hoeveelheid) > 0);
  const nulAdviezen = adviesRegels.filter((a) => Number(a.hoeveelheid) <= 0);
  const openPrijzen = open.map(prijsVan).filter((p) => p != null);
  const zonderPrijs = [...open, ...besteld].filter((s) => !prijsVan(s)).length;
  const leveranciersTabel = <LeveranciersOverzicht open={open} onderweg={besteld} leverancier={leverancier} prijsVan={prijsVan} />;
  const bordProps = { leverancier, prijsVan, prijsSignaal: signaalVan, prijsTip, onBesteld: markeerBesteld, onBewerk: openBewerk, onVervallen: vervallen };
  const overzicht = <OverzichtKaart kengetallen={<>
    <Kengetal icoon={Building2} label="Open" waarde={openPrijzen.length ? euro(openPrijzen.reduce((n, p) => n + p.totaal, 0)) : '—'} />
    <Kengetal icoon={Truck} label="Checken" waarde={teChecken.length} />
    <Kengetal icoon={AlertCircle} label="Geen prijs" waarde={zonderPrijs} toon={zonderPrijs ? 'let-op' : 'neutraal'} />
  </>}>{leveranciersTabel}</OverzichtKaart>;

  return (
    <SidebarLayout>
      <div className="space-y-4">
        <Tabs value={tab} onValueChange={setTabKeuze}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <TabsList className={segmentTabsKlasse}>
              {[{ id: 'bord', naam: 'Op het bord', kort: 'Bord', Icoon: ClipboardList, n: open.length }, { id: 'advies', naam: 'Advies', kort: 'Advies', Icoon: Sparkles, n: positieveAdviezen.length }, { id: 'tellen', naam: 'Tellen', kort: 'Tellen', Icoon: Calculator, n: telOverzicht.open }, { id: 'onderweg', naam: 'Onderweg', kort: 'Onderweg', Icoon: Truck, n: besteld.length }].map(({ id, naam, kort, Icoon, n }) => <TabsTrigger key={id} value={id} aria-label={`${naam} (${n})`} className="min-w-0 px-2 sm:px-3"><Icoon className="hidden h-4 w-4 shrink-0 sm:block" /><span className="truncate sm:hidden">{kort}</span><span className="hidden sm:inline">{naam}</span>{n > 0 && <span className="tabular-nums text-muted-foreground">{n}</span>}</TabsTrigger>)}
            </TabsList>
            <Button className="min-h-11 gap-1" onClick={() => { setTabKeuze('bord'); requestAnimationFrame(() => invoer.current?.focus()); }}><Plus className="h-4 w-4" /><span>Product</span></Button>
          </div>
          <div className="mt-4 grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0 space-y-4">
              <div className="lg:hidden"><InklapGroep titel="Overzicht" aantal={new Set([...open, ...besteld].map(leverancier)).size}>{overzicht}</InklapGroep></div>
              <TabsContent value="bord" className="mt-0 space-y-4">
        <div className="space-y-2">
          <Invoerbalk>
            <div className="relative min-w-0 basis-full sm:flex-1 sm:basis-auto">
              <Input
                ref={invoer}
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
                placeholder="Wat is op?"
                className="h-11 w-full text-base"
                role="combobox"
                aria-expanded={lijstOpen && suggesties.length > 0}
                aria-autocomplete="list"
              />
              {lijstOpen && naam.trim().length > 0 && suggesties.length > 0 && (
                <div role="listbox" className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-polar-md border border-border bg-popover shadow-md">
                  {suggesties.map((s, i) => {
                    const std = s.vormen.find((v) => v.is_standaard) ?? s.vormen[0];
                    const levNaam = std?.leverancier_naam ?? (std?.leverancier_id ? leveranciers?.get(std.leverancier_id) : null);
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
                        {(std || levNaam) && (
                          <span className="block text-xs text-muted-foreground">
                            {[std?.vorm, levNaam].filter(Boolean).join(' · ')}
                          </span>
                        )}
                      </Button>
                    );
                  })}
                </div>
              )}
            </div>
            <Stepper waarde={aantal} onChange={setAantal} />
            <Select value={soort ?? 'stuks'} onValueChange={setSoort}>
              <SelectTrigger className="h-11 w-[110px] border-0 shadow-none" aria-label="Verpakking"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SOORTEN.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" size="touch" className="ml-auto gap-1 px-3" aria-label="Erbij zetten" onClick={voegToe} disabled={naam.trim().length < 2 || !vestiging || isLoading}>
              <Check className="h-4 w-4" /><span className="sm:hidden">Erbij</span>
            </Button>
          </Invoerbalk>
          {eerderSuggesties.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
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
              vormen={gekozen.vormen}
              gekozen={vormId}
              leveranciers={leveranciers}
              onKies={(v) => { setVormId(v.id); setSoort(v.eenheid); }}
            />
          )}
        </div>

                <LijstKaart kop={<KaartKop icoon={ClipboardList} titel="Op het bord" />}>{isLoading ? <LaadRijen /> : open.length ? <BordTabel regels={open} {...bordProps} /> : <LegeStaat tekst="Niets openstaand." />}</LijstKaart>
              </TabsContent>
              <TabsContent value="advies" className="mt-0 space-y-4">
                <LijstKaart kop={<KaartKop icoon={Sparkles} titel={advies.data?.leverdag ? `Voor ${leverDatumLabel(advies.data.leverdag)}` : 'Advies'} />}>
                  {advies.isLoading ? <LaadRijen /> : positieveAdviezen.length ? <AdviesTabel regels={positieveAdviezen} open={open} bezig={adviesBezig} onOpBord={adviesOpBord} /> : <LegeStaat tekst="Geen voorstellen." />}
                </LijstKaart>
                {!!nulAdviezen.length && <InklapGroep titel="Niet nodig" aantal={nulAdviezen.length}><LijstKaart><AdviesTabel regels={nulAdviezen} open={open} bezig={adviesBezig} onOpBord={adviesOpBord} nul /></LijstKaart></InklapGroep>}
              </TabsContent>
              <div hidden={tab !== 'tellen'}><Voorraadproef key={vestiging} vestiging={vestiging} onOverzicht={rapporteerTellen} /></div>
              <TabsContent value="onderweg" className="mt-0 space-y-4">
                {[{ titel: 'Vandaag te checken', regels: teChecken }, { titel: 'Onderweg', regels: onderweg }, { titel: 'Zonder datum', regels: zonderDatum }].filter((g) => g.regels.length).map((groep) => <LijstKaart key={groep.titel} kop={<KaartKop icoon={Truck} titel={groep.titel} teller={groep.regels.length} />}><OnderwegTabel groepen={groepeer(groep.regels)} {...groepProps} onBewerk={openBewerk} datumLabel={datumLabel} leverDatumLabel={leverDatumLabel} /></LijstKaart>)}
                {!besteld.length && <LijstKaart><LegeStaat tekst="Niets onderweg." /></LijstKaart>}
                {!!geleverd.length && <InklapGroep titel="Geleverd" aantal={geleverd.length}><LijstKaart><BordTabel regels={geleverd} {...bordProps} geleverd onTerug={(s) => terugNaarBesteld.mutate(s.id)} detail={(s) => [s.geleverd_op ? datumLabel(s.geleverd_op) : '', s.geleverd_door ? namen?.get(s.geleverd_door) : '', s.levering_status === 'deels' ? 'Deels' : '', s.levering_opmerking].filter(Boolean).join(' · ')} /></LijstKaart></InklapGroep>}
              </TabsContent>
            </div>
            <aside className="hidden min-w-0 space-y-4 lg:block">{overzicht}</aside>
          </div>
        </Tabs>
      </div>

      <DetailLade open={!!bewerk} onOpenChange={(o) => !o && setBewerk(null)} titel={bewerk?.naam}>
          <div className="space-y-4">
            {bewerk && <Stappen stappen={['Op bord', 'Besteld', 'Geleverd']} huidig={bewerk.status === 'geleverd' ? 2 : bewerk.status === 'besteld' ? 1 : 0} />}
            <Stepper waarde={bewerkAantal} onChange={setBewerkAantal} />
            {bewerkVormen.length > 1 && (
              <VormKeuze
                vormen={bewerkVormen}
                gekozen={bewerkVormId}
                leveranciers={leveranciers}
                onKies={(v) => { setBewerkVormId(v.id); setBewerkSoort(v.eenheid); }}
              />
            )}
            <SoortKeuze waarde={bewerkSoort} onChange={setBewerkSoort} />
            <Button
              className="h-12 w-full"
              onClick={() => {
                if (!bewerk) return;
                const eenh = bewerkSoort ?? 'stuks';
                const v = bewerkVormId ? vormById.get(bewerkVormId) : undefined;
                let vorm: { artikel_vorm_id: string | null; leverancier_id: string | null } | undefined;
                if (v && v.eenheid === eenh) {
                  if (v.id !== bewerk.artikel_vorm_id) vorm = { artikel_vorm_id: v.id, leverancier_id: v.leverancier_id };
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
                <Stepper waarde={deelsOntvangen} onChange={(n) => setDeelsOntvangen(Math.min(n, Number(leveringActie.signaal.aantal) - 1))} />
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
