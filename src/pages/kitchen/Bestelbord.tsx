import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Check, ChevronDown, MoreVertical, Minus, Plus, Truck, Undo2, X } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { SidebarLayout } from '@/components/SidebarLayout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { dagenTeLaat, parseYmd, ymd } from '@/lib/leverdatum';
import { useUserLocation } from '@/contexts/UserLocationContext';
import {
  useBestelSignalen, useBestelbordMutaties, useLeveranciers, useVestigingOpenDagen, useArtikelVormen, zoekBordSuggesties,
  type BestelSignaal, type ArtikelVorm, type BordSuggestie,
} from '@/hooks/useBestelbord';
import { BestelLeverancierLabel } from '@/components/kitchen/BestelLeverancierLabel';

const SOORTEN = ['stuks', 'doos', 'zak', 'fles', 'pak', 'bak', 'emmer', 'kg', 'bos', 'tray', 'rol', 'fust'] as const;

function datumLabel(iso: string): string {
  return new Date(iso).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' });
}

const norm = (s: string) => s.trim().toLowerCase();

function Stepper({ waarde, onChange }: { waarde: number; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      <Button type="button" variant="outline" className="h-11 w-11 p-0" aria-label="Minder" onClick={() => onChange(Math.max(1, waarde - 1))}>
        <Minus className="h-4 w-4" />
      </Button>
      <Input
        value={String(waarde)}
        onChange={(e) => onChange(Math.max(1, Number(e.target.value.replace(/[^0-9]/g, '')) || 1))}
        inputMode="numeric"
        className="h-11 w-14 text-center text-[16px] font-semibold"
        aria-label="Aantal"
      />
      <Button type="button" variant="outline" className="h-11 w-11 p-0" aria-label="Meer" onClick={() => onChange(waarde + 1)}>
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}

function SoortKeuze({ waarde, onChange }: { waarde: string | null; onChange: (s: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {SOORTEN.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          className={cn(
            'h-11 rounded-[14px] border px-3.5 text-[14px] font-medium transition-colors',
            waarde === s ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-foreground hover:bg-muted',
          )}
        >
          {s}
        </button>
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
          <button
            key={v.id}
            type="button"
            role="radio"
            aria-checked={gekozen === v.id}
            onClick={() => onKies(v)}
            className={cn(
              'min-h-11 rounded-[14px] border px-3 py-1.5 text-left text-[14px] transition-colors',
              gekozen === v.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-background text-foreground hover:bg-muted',
            )}
          >
            {[v.vorm, lev, v.prijs != null ? `${euro(Number(v.prijs))} excl.` : '–'].filter(Boolean).join(' · ')}
          </button>
        );
      })}
    </div>
  );
}

function Rij({
  signaal,
  prijs,
  onBesteld,
  onVervallen,
  onBewerk,
}: {
  signaal: BestelSignaal;
  prijs: { vorm: ArtikelVorm; totaal: number } | null;
  onBesteld: (besteld: boolean) => void;
  onVervallen?: () => void;
  onBewerk?: () => void;
}) {
  const besteld = signaal.status === 'besteld';
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 min-h-[56px]">
      <button
        type="button"
        onClick={() => onBesteld(!besteld)}
        aria-label={besteld ? 'Terug naar open' : 'Besteld'}
        className="flex h-11 w-11 shrink-0 items-center justify-center"
      >
        <span className={cn('flex h-7 w-7 items-center justify-center rounded-full border-2 transition-colors',
          besteld ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/40')}>
          {besteld && <Check className="h-4 w-4" />}
        </span>
      </button>
      <button type="button" disabled={!onBewerk} onClick={onBewerk} className="min-w-0 flex-1 text-left" style={{ minHeight: 44 }}>
        <span className={cn('block', besteld ? 'text-[15px] text-muted-foreground line-through' : 'text-[16px] font-medium')}>
          {signaal.naam}
        </span>
        <BestelLeverancierLabel signaalId={signaal.id} vestiging={signaal.vestiging} />
        <div className="mt-0.5 flex items-center gap-2 text-[13px] text-muted-foreground">
          <span>
            {Number(signaal.aantal)} {signaal.eenheid} · {datumLabel(signaal.created_at)}
          </span>
          {signaal.bron === 'sluitlijst' && <Badge variant="secondary" className="font-normal">Sluitlijst</Badge>}
        </div>
      </button>
      <div className="shrink-0 text-right" title={prijs ? prijsTip(prijs.vorm) : undefined}>
        <span className="block text-[14px] font-medium tabular-nums">{prijs ? euro(prijs.totaal) : '–'}</span>
        {prijs && <span className="block text-[11px] text-muted-foreground">{prijsTip(prijs.vorm)}</span>}
      </div>
      {onVervallen && (
        <Button variant="ghost" className="h-11 w-11 p-0 text-muted-foreground" onClick={onVervallen} aria-label="Toch niet nodig">
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

function leverDatumLabel(datum: string | null): string {
  if (!datum) return 'geen datum';
  return parseYmd(datum).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' });
}

/** Eén bestelde regel in het Onderweg-overzicht: afvinken geleverd, datum aanpassen, niet/deels geleverd. */
function OnderwegRij({
  signaal,
  teLaat,
  onGeleverd,
  onDatum,
  onNietGeleverd,
  onDeelsGeleverd,
}: {
  signaal: BestelSignaal;
  teLaat: number;
  onGeleverd: () => void;
  onDatum: () => void;
  onNietGeleverd: () => void;
  onDeelsGeleverd: () => void;
}) {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 min-h-[56px]">
      <button
        type="button"
        onClick={onGeleverd}
        aria-label="Geleverd"
        className="flex h-11 w-11 shrink-0 items-center justify-center"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-muted-foreground/40 transition-colors" />
      </button>
      <div className="min-w-0 flex-1">
        <span className="block text-[16px] font-medium">{signaal.naam}</span>
        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
          <span>{Number(signaal.aantal)} {signaal.eenheid}</span>
          <button
            type="button"
            onClick={onDatum}
            className="rounded-full border border-border px-2 py-0.5 text-[13px] hover:bg-muted"
            aria-label="Verwachte leverdatum aanpassen"
          >
            {leverDatumLabel(signaal.verwachte_levering)}
          </button>
          {teLaat > 0 && <Badge variant="destructive" className="font-normal">{teLaat} {teLaat === 1 ? 'dag' : 'dagen'} te laat</Badge>}
        </div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-11 w-11 p-0 text-muted-foreground" aria-label="Meer opties">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onNietGeleverd}>Niet geleverd</DropdownMenuItem>
          <DropdownMenuItem onClick={onDeelsGeleverd}>Deels geleverd</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

/** Groep bestelde regels van één leverancier + ordernummer, met "Alles geleverd". */
function LeveringGroep({
  titel,
  regels,
  dagenTeLaatVan,
  onAllesGeleverd,
  onGeleverd,
  onDatum,
  onNietGeleverd,
  onDeelsGeleverd,
}: {
  titel: string;
  regels: BestelSignaal[];
  dagenTeLaatVan: (s: BestelSignaal) => number;
  onAllesGeleverd: (ids: string[]) => void;
  onGeleverd: (s: BestelSignaal) => void;
  onDatum: (s: BestelSignaal) => void;
  onNietGeleverd: (s: BestelSignaal) => void;
  onDeelsGeleverd: (s: BestelSignaal) => void;
}) {
  const besteldOp = regels[0]?.besteld_op;
  const referentie = regels[0]?.bestelreferentie;
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border/60 px-3 py-2">
        <Truck className="h-4 w-4 shrink-0 text-muted-foreground" />
        <div className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-semibold">{titel}</span>
          <span className="block text-[13px] text-muted-foreground">
            {besteldOp ? `besteld ${datumLabel(besteldOp)}` : 'besteld'}
            {referentie ? ` · ${referentie}` : ''}
          </span>
        </div>
        <Button variant="outline" className="h-11 shrink-0" onClick={() => onAllesGeleverd(regels.map((r) => r.id))}>
          <Check className="h-4 w-4 mr-1" /> Alles geleverd
        </Button>
      </div>
      <div className="divide-y divide-border/60">
        {regels.map((s) => (
          <OnderwegRij
            key={s.id}
            signaal={s}
            teLaat={dagenTeLaatVan(s)}
            onGeleverd={() => onGeleverd(s)}
            onDatum={() => onDatum(s)}
            onNietGeleverd={() => onNietGeleverd(s)}
            onDeelsGeleverd={() => onDeelsGeleverd(s)}
          />
        ))}
      </div>
    </Card>
  );
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
  const [suggesties, setSuggesties] = useState<BordSuggestie[]>([]);
  const [lijstOpen, setLijstOpen] = useState(false);
  const [actief, setActief] = useState(-1);
  const [gekozen, setGekozen] = useState<BordSuggestie | null>(null);
  const [vormId, setVormId] = useState<string | null>(null);
  const [bewerkVormId, setBewerkVormId] = useState<string | null>(null);
  const zoekNr = useRef(0);

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

  /** Groepeer bestelde regels per leverancier + ordernummer. */
  const groepeer = (regels: BestelSignaal[]) => {
    const m = new Map<string, BestelSignaal[]>();
    for (const s of regels) {
      const lev = (s.leverancier_id && leveranciers?.get(s.leverancier_id)) || 'Onbekende leverancier';
      const key = `${lev}|${s.bestelreferentie ?? ''}`;
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(s);
    }
    return [...m.entries()].map(([key, r]) => ({ titel: key.split('|')[0], regels: r }));
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

  const totalen = useMemo(() => {
    type Bak = { totaal: number; zonder: number; regels: number };
    const nieuw = (): Bak => ({ totaal: 0, zonder: 0, regels: 0 });
    const m = new Map<string, { titel: string; open: Bak; onderweg: Bak; geleverd: Bak }>();
    const tel = (lijst: BestelSignaal[], k: 'open' | 'onderweg' | 'geleverd') => {
      for (const s of lijst) {
        const id = s.leverancier_id ?? '';
        const titel = (s.leverancier_id && leveranciers?.get(s.leverancier_id)) || 'Onbekende leverancier';
        if (!m.has(id)) m.set(id, { titel, open: nieuw(), onderweg: nieuw(), geleverd: nieuw() });
        const b = m.get(id)![k];
        b.regels++;
        const p = prijsVan(s);
        if (p) b.totaal += p.totaal;
        else b.zonder++;
      }
    };
    tel(open, 'open');
    tel(besteld, 'onderweg');
    tel(geleverd, 'geleverd');
    return [...m.values()].sort((a, b) =>
      a.titel === 'Onbekende leverancier' ? 1 : b.titel === 'Onbekende leverancier' ? -1 : a.titel.localeCompare(b.titel),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, besteld, geleverd, leveranciers, vormen]);

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

  return (
    <SidebarLayout>
      <div className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground">
            {open.length} nog bestellen
            {besteld.length > 0 && ` · ${besteld.length} besteld`}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[200px] flex-1">
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
                className="h-11 w-full text-[16px]"
                role="combobox"
                aria-expanded={lijstOpen && suggesties.length > 0}
                aria-autocomplete="list"
              />
              {lijstOpen && naam.trim().length > 0 && suggesties.length > 0 && (
                <div role="listbox" className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-[14px] border border-border bg-popover shadow-md">
                  {suggesties.map((s, i) => {
                    const std = s.vormen.find((v) => v.is_standaard) ?? s.vormen[0];
                    const levNaam = std?.leverancier_naam ?? (std?.leverancier_id ? leveranciers?.get(std.leverancier_id) : null);
                    return (
                      <button
                        key={s.artikel_id}
                        type="button"
                        role="option"
                        aria-selected={i === actief}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => kiesArtikel(s)}
                        className={cn('block w-full px-3 py-2 text-left min-h-[48px]', i === actief ? 'bg-muted' : 'hover:bg-muted/60')}
                      >
                        <span className="block text-[15px] font-medium text-foreground">{s.naam}</span>
                        {(std || levNaam) && (
                          <span className="block text-[13px] text-muted-foreground">
                            {[std?.vorm, levNaam].filter(Boolean).join(' · ')}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <Stepper waarde={aantal} onChange={setAantal} />
            <Select value={soort ?? 'stuks'} onValueChange={setSoort}>
              <SelectTrigger className="h-11 w-[110px]" aria-label="Verpakking"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SOORTEN.map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button className="h-11" onClick={voegToe} disabled={naam.trim().length < 2 || !vestiging || isLoading}>
              <Plus className="h-4 w-4 mr-1" /> Erbij
            </Button>
          </div>
          {eerderSuggesties.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto">
              {eerderSuggesties.map((s) => (
                <button key={s.id} type="button" onClick={() => kiesEerder(s)}
                  className="h-9 shrink-0 rounded-full bg-muted px-3 text-[14px] text-foreground hover:bg-muted/70">
                  {s.naam} · {Number(s.aantal)} {s.eenheid}
                </button>
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

        {isLoading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Laden…</p>
        ) : (
          <>
            <Card className="divide-y divide-border/60 overflow-hidden">
              {open.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">Niets openstaand.</p>
              ) : (
                open.map((s) => (
                  <Rij key={s.id} signaal={s} prijs={prijsVan(s)} onBesteld={(b) => markeerBesteld(s, b)} onVervallen={() => vervallen(s)} onBewerk={() => openBewerk(s)} />
                ))
              )}
            </Card>

            {besteld.length > 0 && (
              <div className="space-y-3">
                {teChecken.length > 0 && (
                  <div className="space-y-2">
                    <p className="px-1 text-sm font-semibold">Vandaag te checken ({teChecken.length})</p>
                    {groepeer(teChecken).map((g) => <LeveringGroep key={g.titel + (g.regels[0]?.bestelreferentie ?? '')} {...g} {...groepProps} />)}
                  </div>
                )}
                {onderweg.length > 0 && (
                  <div className="space-y-2">
                    <p className="px-1 text-sm font-semibold">Onderweg ({onderweg.length})</p>
                    {groepeer(onderweg).map((g) => <LeveringGroep key={g.titel + (g.regels[0]?.bestelreferentie ?? '')} {...g} {...groepProps} />)}
                  </div>
                )}
                {zonderDatum.length > 0 && (
                  <div className="space-y-2">
                    <p className="px-1 text-sm font-semibold text-muted-foreground">Zonder datum ({zonderDatum.length})</p>
                    {groepeer(zonderDatum).map((g) => <LeveringGroep key={g.titel + (g.regels[0]?.bestelreferentie ?? '')} {...g} {...groepProps} />)}
                  </div>
                )}
              </div>
            )}

            {geleverd.length > 0 && (
              <Collapsible>
                <CollapsibleTrigger className="group flex h-11 w-full items-center gap-2 px-1 text-sm font-medium text-muted-foreground">
                  <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
                  Geleverd ({geleverd.length})
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <Card className="divide-y divide-border/60 overflow-hidden">
                    {geleverd.map((s) => (
                      <div key={s.id} className="flex items-center gap-2 px-2 py-1.5 min-h-[56px]">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-primary bg-primary text-primary-foreground">
                            <Check className="h-4 w-4" />
                          </span>
                        </span>
                        <div className="min-w-0 flex-1">
                          <span className="block text-[15px] text-muted-foreground line-through">{s.naam}</span>
                          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[13px] text-muted-foreground">
                            <span>
                              {Number(s.aantal)} {s.eenheid}
                              {s.geleverd_op && ` · ${datumLabel(s.geleverd_op)}`}
                              {s.geleverd_door && namen?.get(s.geleverd_door) ? ` · ${namen.get(s.geleverd_door)}` : ''}
                            </span>
                            {s.levering_status === 'deels' && <Badge variant="secondary" className="font-normal">Deels</Badge>}
                            {s.levering_opmerking && <span className="truncate">{s.levering_opmerking}</span>}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          className="h-11 w-11 p-0 text-muted-foreground"
                          aria-label="Toch niet geleverd, terug naar onderweg"
                          onClick={() => terugNaarBesteld.mutate(s.id)}
                        >
                          <Undo2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </Card>
                </CollapsibleContent>
              </Collapsible>
            )}

            {totalen.length > 0 && (
              <Card className="overflow-hidden">
                <div className="border-b border-border/60 px-3 py-2">
                  <span className="block text-[15px] font-semibold">Indicatie per leverancier</span>
                  <span className="block text-[13px] text-muted-foreground">Prijzen zijn een indicatie (laatst betaalde prijs, excl. btw).</span>
                </div>
                <div className="divide-y divide-border/60">
                  {totalen.map((t) => (
                    <div key={t.titel} className="px-3 py-2">
                      <span className="block text-[15px] font-medium">{t.titel}</span>
                      <div className="mt-0.5 flex flex-wrap gap-x-4 gap-y-0.5 text-[13px] text-muted-foreground">
                        {(['open', 'onderweg', 'geleverd'] as const).map((k) =>
                          t[k].regels > 0 ? (
                            <span key={k}>
                              {k === 'open' ? 'Open' : k === 'onderweg' ? 'Onderweg' : 'Geleverd'}:{' '}
                              <span className="font-medium text-foreground">{euro(t[k].totaal)}</span>
                              {t[k].zonder > 0 && ` · ${t[k].zonder} ${t[k].zonder === 1 ? 'regel' : 'regels'} zonder prijs`}
                            </span>
                          ) : null,
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </>
        )}
      </div>

      <Dialog open={!!bewerk} onOpenChange={(o) => !o && setBewerk(null)}>
        <DialogContent className="max-w-[650px] rounded-[24px]">
          <DialogHeader>
            <DialogTitle>{bewerk?.naam}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
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
        </DialogContent>
      </Dialog>
      <Dialog open={!!datumVoor} onOpenChange={(o) => !o && setDatumVoor(null)}>
        <DialogContent className="max-w-[650px] rounded-[24px]">
          <DialogHeader>
            <DialogTitle>Verwachte levering — {datumVoor?.naam}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              type="date"
              value={datumKeuze}
              min={ymd(new Date())}
              onChange={(e) => setDatumKeuze(e.target.value)}
              className="h-12 text-[16px]"
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
        <DialogContent className="max-w-[650px] rounded-[24px]">
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
              className="text-[16px]"
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
