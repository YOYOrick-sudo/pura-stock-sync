import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Check, ChevronDown, MoreVertical, Minus, Plus, Undo2, X } from 'lucide-react';
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
  useBestelSignalen, useBestelbordMutaties, useLeveranciers, useVestigingOpenDagen, useArtikelVormen, zoekBordSuggesties, useBestelAdvies,
  type BestelSignaal, type ArtikelVorm, type BordSuggestie, type BestelAdvies,
} from '@/hooks/useBestelbord';
import { Voorraadproef } from '@/components/kitchen/Voorraadproef';
import { useVoorraadproef } from '@/hooks/useVoorraadproef';
import { PrijsPijl } from '@/components/kitchen/PrijsPijl';
import { usePrijsSignalen } from '@/hooks/usePrijsSignalen';
import { useRole } from '@/hooks/useRole';
import { duurderWaarschuwing, pijlRichting, zoekSignaal, type PrijsSignaal } from '@/lib/prijsSignaal';

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

function AdviesRij({ a, bezig, onOpBord }: { a: BestelAdvies; bezig: boolean; onOpBord: () => void }) {
  const [heel, setHeel] = useState(false);
  const nul = Number(a.hoeveelheid) <= 0;
  return (
    <div className={cn('flex min-h-12 items-center gap-2 px-3 py-1', nul && 'opacity-60')}>
      <button type="button" className="min-w-0 flex-1 text-left" onClick={() => setHeel((h) => !h)} title={a.reden ?? undefined}>
        <span className="flex items-center gap-1.5">
          <span className="min-w-0 truncate text-[15px] font-medium">
            <span className="tabular-nums">{Number(a.hoeveelheid)}</span> {a.eenheid ?? ''} {a.artikel}
          </span>
          {nul && <Badge variant="outline" className="shrink-0 font-normal">niet nodig</Badge>}
          {a.onzeker && <Badge variant="outline" className="shrink-0 font-normal">onzeker</Badge>}
        </span>
        {a.reden && <span className={cn('block text-[12px] text-muted-foreground', !heel && 'truncate')}>{a.reden}</span>}
      </button>
      {a.op_bord_regel_id ? (
        <span className="flex h-9 shrink-0 items-center gap-1 px-2 text-[13px] text-primary">
          op bord <Check className="h-3.5 w-3.5" />
        </span>
      ) : (
        <Button variant="outline" size="sm" className="h-9 shrink-0 text-[13px]" disabled={bezig} onClick={onOpBord}>
          Op bord
        </Button>
      )}
    </div>
  );
}

function AdviesGroepen({ regels, bezig, onOpBord }: { regels: BestelAdvies[]; bezig: boolean; onOpBord: (a: BestelAdvies) => void }) {
  const groepen = new Map<string, BestelAdvies[]>();
  for (const a of regels) {
    const k = a.leverancier ?? '';
    if (!groepen.has(k)) groepen.set(k, []);
    groepen.get(k)!.push(a);
  }
  const nodig = (a: BestelAdvies) => (Number(a.hoeveelheid) > 0 ? 0 : 1);
  return (
    <>
      {[...groepen.entries()].map(([lev, rs]) => (
        <div key={lev}>
          <p className={cn('bg-muted/40 px-3 py-1 text-[12px] font-semibold uppercase tracking-wide text-muted-foreground', !lev && 'font-normal normal-case')}>
            {lev || 'Leverancier onbekend'}
          </p>
          <div className="divide-y divide-border/60">
            {[...rs].sort((x, y) => nodig(x) - nodig(y)).map((a) => <AdviesRij key={a.id} a={a} bezig={bezig} onOpBord={() => onOpBord(a)} />)}
          </div>
        </div>
      ))}
    </>
  );
}

type Bak = { totaal: number; zonder: number; regels: number };
type Opvallend = { id: string; naam: string; eenheid: string | null; sig: PrijsSignaal; waarschuwing: string | null };
type LeverancierTotaal = { titel: string; open: Bak; onderweg: Bak; geleverd: Bak; opvallend: Opvallend[] };

function bedrag(b: Bak): string {
  if (b.regels === 0) return '';
  if (b.zonder === b.regels) return '–';
  return euro(b.totaal);
}

/** Eén leverancier: bedragen rechts; prijs ontbreekt en prijswaarschuwingen samengevat. */
function TotaalRij({ t }: { t: LeverancierTotaal }) {
  const zonder = t.open.zonder + t.onderweg.zonder;
  const waarschuwingen = t.opvallend.filter((o) => o.waarschuwing);
  const duurder = t.opvallend.filter((o) => pijlRichting(o.sig) === 'omhoog').length;
  const goedkoper = t.opvallend.filter((o) => pijlRichting(o.sig) === 'omlaag').length;
  const onbekend = t.titel === 'Onbekende leverancier';
  return (
    <div className="px-3 py-1.5">
      <div className="flex min-h-9 items-center gap-2 text-[14px]">
        <span className={cn('min-w-0 flex-1 truncate font-medium', onbekend && 'font-normal text-muted-foreground')}>
          {onbekend ? 'Leverancier onbekend' : t.titel}
        </span>
        <span className="w-20 text-right tabular-nums">{bedrag(t.open)}</span>
        <span className="w-20 text-right tabular-nums text-muted-foreground">{bedrag(t.onderweg)}</span>
      </div>
      {zonder > 0 && (
        <p className="text-[12px] text-muted-foreground">prijs ontbreekt bij {zonder} {zonder === 1 ? 'regel' : 'regels'}</p>
      )}
      {waarschuwingen.length > 0 && (
        <Collapsible>
          <CollapsibleTrigger className="group flex min-h-9 items-center gap-1 text-[12px] font-medium text-warning">
            <ChevronDown className="h-3.5 w-3.5 transition-transform group-data-[state=open]:rotate-180" />
            {[duurder > 0 && `${duurder} duurder`, goedkoper > 0 && `${goedkoper} goedkoper`].filter(Boolean).join(', ') || 'prijs afwijkend'}
          </CollapsibleTrigger>
          <CollapsibleContent>
            <ul className="space-y-0.5 pb-1">
              {t.opvallend.map((o) => (
                <li key={o.id} className="text-[12px]">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <PrijsPijl signaal={o.sig} eenheid={o.eenheid} />
                    <span className="truncate">{o.naam}</span>
                  </span>
                  {o.waarschuwing && <span className="block font-medium text-warning">{o.waarschuwing}</span>}
                </li>
              ))}
            </ul>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}

const ONBEKEND = 'Onbekende leverancier';
type Prijs = { vorm: ArtikelVorm; totaal: number } | null;

function kortDatum(d: Date): string {
  return d.toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' });
}

function leverDatumLabel(datum: string | null): string {
  if (!datum) return 'geen datum';
  return kortDatum(parseYmd(datum));
}

/** Kop van één leveranciersgroep: naam + aantal regels, rechts het groepstotaal (als er prijzen zijn). */
function GroepKop({ titel, regels, prijzen, sub, rechts }: { titel: string; regels: number; prijzen: Prijs[]; sub?: string; rechts?: React.ReactNode }) {
  const onbekend = titel === ONBEKEND;
  const bekend = prijzen.filter((p): p is NonNullable<Prijs> => !!p);
  return (
    <div className={cn('flex min-h-9 items-center gap-2 bg-muted/40 px-3 py-1 text-[12px]', onbekend && 'opacity-70')}>
      <span className="min-w-0 flex-1 truncate">
        <span className={cn('font-semibold text-foreground', onbekend && 'font-normal text-muted-foreground')}>{onbekend ? 'Leverancier onbekend' : titel}</span>
        <span className="text-muted-foreground"> · {regels}{sub ? ` · ${sub}` : ''}</span>
      </span>
      {bekend.length > 0 && <span className="shrink-0 font-medium tabular-nums text-muted-foreground">{euro(bekend.reduce((t, p) => t + p.totaal, 0))}</span>}
      {rechts}
    </div>
  );
}

/** Eén compacte tabelrij: vinkje | product | aantal | datum | prijs | actie. */
function TabelRij({
  vinkje, naam, doorgestreept, onNaam, extra, aantal, eenheid, datum, datumMobiel, onDatum, datumRood, prijs, pijl, actie, titel,
}: {
  vinkje: React.ReactNode;
  naam: string;
  doorgestreept?: boolean;
  onNaam?: () => void;
  extra?: React.ReactNode;
  aantal: number;
  eenheid: string | null;
  datum: string;
  datumMobiel: boolean;
  onDatum?: () => void;
  datumRood?: boolean;
  prijs: Prijs;
  pijl?: React.ReactNode;
  actie: React.ReactNode;
  titel?: string;
}) {
  const datumCls = cn('text-[12px] tabular-nums', datumRood ? 'font-medium text-destructive' : 'text-muted-foreground');
  const datumEl = (cls: string) => onDatum
    ? <button type="button" onClick={onDatum} aria-label="Verwachte leverdatum aanpassen" className={cn(datumCls, 'rounded-md text-left underline-offset-2 hover:underline', cls)}>{datum}</button>
    : <span className={cn(datumCls, cls)}>{datum}</span>;
  return (
    <div className="flex min-h-11 items-center gap-1 pr-1" title={titel}>
      {vinkje}
      <div className="min-w-0 flex-1">
        <button type="button" disabled={!onNaam} onClick={onNaam} className="flex min-h-9 w-full min-w-0 items-center gap-1.5 text-left">
          <span className={cn('truncate text-[15px]', doorgestreept ? 'text-muted-foreground line-through' : 'font-medium')}>{naam}</span>
          {extra}
        </button>
        {datumMobiel && datumEl('-mt-1.5 block sm:hidden')}
      </div>
      <span className="w-16 shrink-0 text-right text-[13px] tabular-nums text-muted-foreground sm:w-20">
        {aantal} {eenheid}
      </span>
      {datumEl('hidden w-24 shrink-0 text-right sm:block')}
      <span className="w-[4.5rem] shrink-0 text-right sm:w-24" title={prijs ? prijsTip(prijs.vorm) : undefined}>
        <span className="flex items-center justify-end gap-1 text-[14px] font-medium tabular-nums">
          {prijs && pijl}
          {prijs ? euro(prijs.totaal) : '–'}
        </span>
        {prijs && <span className="hidden truncate text-[11px] leading-tight text-muted-foreground sm:block">{prijsTip(prijs.vorm)}</span>}
      </span>
      <span className="flex w-9 shrink-0 justify-center">{actie}</span>
    </div>
  );
}

function Cirkel({ aan, label, onClick }: { aan: boolean; label: string; onClick?: () => void }) {
  const binnen = (
    <span className={cn('flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors',
      aan ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/40')}>
      {aan && <Check className="h-4 w-4" />}
    </span>
  );
  if (!onClick) return <span className="flex h-11 w-11 shrink-0 items-center justify-center" aria-label={label}>{binnen}</span>;
  return (
    <button type="button" onClick={onClick} aria-label={label} className="flex h-11 w-11 shrink-0 items-center justify-center">{binnen}</button>
  );
}

function Rij({
  signaal, prijs, prijsSignaal, vandaagYmd, onBesteld, onVervallen, onBewerk,
}: {
  signaal: BestelSignaal;
  prijs: Prijs;
  prijsSignaal?: PrijsSignaal | null;
  vandaagYmd: string;
  onBesteld: (besteld: boolean) => void;
  onVervallen?: () => void;
  onBewerk?: () => void;
}) {
  const besteld = signaal.status === 'besteld';
  return (
    <TabelRij
      vinkje={<Cirkel aan={besteld} label={besteld ? 'Terug naar open' : 'Besteld'} onClick={() => onBesteld(!besteld)} />}
      naam={signaal.naam}
      doorgestreept={besteld}
      onNaam={onBewerk}
      extra={signaal.bron === 'sluitlijst' ? <Badge variant="outline" className="shrink-0 px-1.5 py-0 text-[11px] font-normal">sluitlijst</Badge> : null}
      aantal={Number(signaal.aantal)}
      eenheid={signaal.eenheid}
      datum={datumLabel(signaal.created_at)}
      datumMobiel={ymd(new Date(signaal.created_at)) !== vandaagYmd}
      prijs={prijs}
      pijl={<PrijsPijl signaal={prijsSignaal ?? null} eenheid={signaal.eenheid} />}
      actie={onVervallen && (
        <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-muted-foreground" onClick={onVervallen} aria-label="Toch niet nodig">
          <X className="h-4 w-4" />
        </Button>
      )}
    />
  );
}

/** Groep bestelde regels van één leverancier + ordernummer, met "Alles geleverd". */
function LeveringGroep({
  titel, regels, dagenTeLaatVan, prijsVan, signaalVan, onAllesGeleverd, onGeleverd, onDatum, onNietGeleverd, onDeelsGeleverd,
}: {
  titel: string;
  regels: BestelSignaal[];
  dagenTeLaatVan: (s: BestelSignaal) => number;
  prijsVan: (s: BestelSignaal) => Prijs;
  signaalVan: (s: BestelSignaal) => PrijsSignaal | null;
  onAllesGeleverd: (ids: string[]) => void;
  onGeleverd: (s: BestelSignaal) => void;
  onDatum: (s: BestelSignaal) => void;
  onNietGeleverd: (s: BestelSignaal) => void;
  onDeelsGeleverd: (s: BestelSignaal) => void;
}) {
  const besteldOp = regels[0]?.besteld_op;
  const referentie = regels[0]?.bestelreferentie;
  const groepDatum = regels[0]?.verwachte_levering ?? null;
  return (
    <div>
      <GroepKop
        titel={titel}
        regels={regels.length}
        prijzen={regels.map(prijsVan)}
        sub={[besteldOp ? `besteld ${datumLabel(besteldOp)}` : 'besteld', referentie].filter(Boolean).join(' · ')}
        rechts={
          <Button variant="ghost" size="sm" className="h-9 shrink-0 px-2 text-[12px]" onClick={() => onAllesGeleverd(regels.map((r) => r.id))}>
            <Check className="h-3.5 w-3.5 mr-1" /> Alles geleverd
          </Button>
        }
      />
      <div className="divide-y divide-border/60">
        {regels.map((s) => {
          const teLaat = dagenTeLaatVan(s);
          return (
            <TabelRij
              key={s.id}
              vinkje={<Cirkel aan={false} label="Geleverd" onClick={() => onGeleverd(s)} />}
              naam={s.naam}
              aantal={Number(s.aantal)}
              eenheid={s.eenheid}
              datum={`${leverDatumLabel(s.verwachte_levering)}${teLaat > 0 ? ` · ${teLaat}d te laat` : ''}`}
              datumMobiel={teLaat > 0 || s.verwachte_levering !== groepDatum}
              datumRood={teLaat > 0}
              onDatum={() => onDatum(s)}
              prijs={prijsVan(s)}
              pijl={<PrijsPijl signaal={signaalVan(s)} eenheid={s.eenheid} />}
              actie={
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-muted-foreground" aria-label="Meer opties">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onDatum(s)}>Leverdatum aanpassen</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onNietGeleverd(s)}>Niet geleverd</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDeelsGeleverd(s)}>Deels geleverd</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              }
            />
          );
        })}
      </div>
    </div>
  );
}

/** Groepeer regels per leverancier (onbekend onderaan). */
function perLeverancier(regels: BestelSignaal[], leveranciers?: Map<string, string>) {
  const m = new Map<string, BestelSignaal[]>();
  for (const s of regels) {
    const t = (s.leverancier_id && leveranciers?.get(s.leverancier_id)) || ONBEKEND;
    if (!m.has(t)) m.set(t, []);
    m.get(t)!.push(s);
  }
  return [...m.entries()]
    .map(([titel, r]) => ({ titel, regels: r }))
    .sort((a, b) => (a.titel === ONBEKEND ? 1 : b.titel === ONBEKEND ? -1 : a.titel.localeCompare(b.titel)));
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
  const { isOwner } = useRole();
  const [suggesties, setSuggesties] = useState<BordSuggestie[]>([]);
  const [lijstOpen, setLijstOpen] = useState(false);
  const [actief, setActief] = useState(-1);
  const [gekozen, setGekozen] = useState<BordSuggestie | null>(null);
  const [vormId, setVormId] = useState<string | null>(null);
  const [bewerkVormId, setBewerkVormId] = useState<string | null>(null);
  const zoekNr = useRef(0);
  const { standen } = useVoorraadproef(vestiging);
  const vandaagStr = ymd(new Date());
  const advies = useBestelAdvies(vestiging || null, vandaagStr);
  const [adviesBezig, setAdviesBezig] = useState(false);

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
    return [...m.entries()]
      .map(([key, r]) => ({ titel: key.split('|')[0], regels: r }))
      .sort((a, b) => (a.titel === ONBEKEND ? 1 : b.titel === ONBEKEND ? -1 : a.titel.localeCompare(b.titel)));
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

  const totalen = useMemo((): LeverancierTotaal[] => {
    const nieuw = (): Bak => ({ totaal: 0, zonder: 0, regels: 0 });
    const m = new Map<string, LeverancierTotaal>();
    const tel = (lijst: BestelSignaal[], k: 'open' | 'onderweg' | 'geleverd') => {
      for (const s of lijst) {
        const id = s.leverancier_id ?? '';
        const titel = (s.leverancier_id && leveranciers?.get(s.leverancier_id)) || 'Onbekende leverancier';
        if (!m.has(id)) m.set(id, { titel, open: nieuw(), onderweg: nieuw(), geleverd: nieuw(), opvallend: [] });
        const b = m.get(id)![k];
        b.regels++;
        const p = prijsVan(s);
        if (p) b.totaal += p.totaal;
        else b.zonder++;
        if (p && k === 'open') {
          const sig = signaalVan(s);
          const waarschuwing = isOwner ? duurderWaarschuwing(sig, Number(s.aantal)) : null;
          if (sig && (pijlRichting(sig) || waarschuwing)) m.get(id)!.opvallend.push({ id: s.id, naam: s.naam, eenheid: s.eenheid, sig, waarschuwing });
        }
      }
    };
    tel(open, 'open');
    tel(besteld, 'onderweg');
    tel(geleverd, 'geleverd');
    return [...m.values()].sort((a, b) =>
      a.titel === 'Onbekende leverancier' ? 1 : b.titel === 'Onbekende leverancier' ? -1 : a.titel.localeCompare(b.titel),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, besteld, geleverd, leveranciers, vormen, prijsSignalen, isOwner]);

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
    prijsVan,
    signaalVan,
  };

  const openBewerk = (s: BestelSignaal) => {
    setBewerk(s);
    setBewerkAantal(Math.max(1, Number(s.aantal) || 1));
    setBewerkSoort(s.eenheid);
    setBewerkVormId(s.artikel_vorm_id);
  };

  const adviesRegels = advies.data?.regels ?? [];
  const tellenAantal = (standen.data ?? []).filter((a) => a.tellen_nodig).length;
  const naar = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const chips: { id: string; label: string; n: number }[] = [
    { id: 'blok-bord', label: 'Op het bord', n: open.length },
    { id: 'blok-advies', label: 'Advies', n: adviesRegels.length },
    { id: 'blok-tellen', label: 'Tellen', n: tellenAantal },
    { id: 'blok-onderweg', label: 'Onderweg', n: besteld.length },
  ];
  const kop = (titel: string, n?: number) => (
    <p className="px-1 text-[13px] font-semibold text-muted-foreground">{titel}{n != null && ` (${n})`}</p>
  );

  return (
    <SidebarLayout>
      <div className="space-y-4">
        <div className="flex gap-1.5 overflow-x-auto" aria-label="Samenvatting">
          {chips.map((c) => (
            <button key={c.id} type="button" onClick={() => naar(c.id)}
              className="flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-3 text-[13px] text-muted-foreground hover:bg-muted">
              {c.label} <span className="font-semibold tabular-nums text-foreground">{c.n}</span>
            </button>
          ))}
        </div>

        <section id="blok-bord" className="scroll-mt-20 space-y-2">
          {kop('Op het bord', open.length)}
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
          {isLoading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Laden…</p>
          ) : (
            <Card className="overflow-hidden">
              {open.length === 0 ? (
                <p className="px-3 py-3 text-sm text-muted-foreground">Niets openstaand.</p>
              ) : (
                perLeverancier(open, leveranciers).map((g) => (
                  <div key={g.titel}>
                    <GroepKop titel={g.titel} regels={g.regels.length} prijzen={g.regels.map(prijsVan)} />
                    <div className={cn('divide-y divide-border/60', g.titel === ONBEKEND && 'opacity-80')}>
                      {g.regels.map((s) => (
                        <Rij key={s.id} signaal={s} prijs={prijsVan(s)} prijsSignaal={signaalVan(s)} vandaagYmd={vandaagStr} onBesteld={(b) => markeerBesteld(s, b)} onVervallen={() => vervallen(s)} onBewerk={() => openBewerk(s)} />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </Card>
          )}
        </section>

        <section id="blok-advies" className="scroll-mt-20">
          <Card className="overflow-hidden">
            <Collapsible key={adviesRegels.length > 0 ? 'met' : 'zonder'} defaultOpen={adviesRegels.length > 0}>
              <CollapsibleTrigger className="group flex min-h-12 w-full items-center gap-2 px-3 py-2 text-left">
                <span className="min-w-0 flex-1 truncate text-[15px] font-semibold">
                  {advies.isLoading
                    ? 'Advies laden…'
                    : advies.data?.leverdag
                    ? `Advies voor ${leverDatumLabel(advies.data.leverdag)}`
                    : 'Nog geen advies'}
                </span>
                {adviesRegels.length > 0 && <Badge variant="secondary" className="font-normal tabular-nums">{adviesRegels.length}</Badge>}
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
              </CollapsibleTrigger>
              {adviesRegels.length > 0 && (
                <CollapsibleContent>
                  <div className="border-t border-border/60 pb-1">
                    <AdviesGroepen regels={adviesRegels} bezig={adviesBezig} onOpBord={adviesOpBord} />
                  </div>
                </CollapsibleContent>
              )}
            </Collapsible>
          </Card>
        </section>

        <section id="blok-tellen" className="scroll-mt-20">
          <Voorraadproef key={vestiging} vestiging={vestiging} />
        </section>

        {!isLoading && (
          <>
            <section id="blok-onderweg" className="scroll-mt-20 space-y-3">
              {besteld.length === 0 ? (
                <>
                  {kop('Onderweg', 0)}
                  <p className="px-1 text-sm text-muted-foreground">Niets onderweg.</p>
                </>
              ) : (
                <>
                  {teChecken.length > 0 && (
                    <div className="space-y-2">
                      {kop('Vandaag te checken', teChecken.length)}
                      <Card className=\"overflow-hidden\">{groepeer(teChecken).map((g) => <LeveringGroep key={g.titel + (g.regels[0]?.bestelreferentie ?? '')} {...g} {...groepProps} />)}</Card>
                    </div>
                  )}
                  {onderweg.length > 0 && (
                    <div className="space-y-2">
                      {kop('Onderweg', onderweg.length)}
                      <Card className=\"overflow-hidden\">{groepeer(onderweg).map((g) => <LeveringGroep key={g.titel + (g.regels[0]?.bestelreferentie ?? '')} {...g} {...groepProps} />)}</Card>
                    </div>
                  )}
                  {zonderDatum.length > 0 && (
                    <div className="space-y-2">
                      {kop('Zonder datum', zonderDatum.length)}
                      <Card className=\"overflow-hidden\">{groepeer(zonderDatum).map((g) => <LeveringGroep key={g.titel + (g.regels[0]?.bestelreferentie ?? '')} {...g} {...groepProps} />)}</Card>
                    </div>
                  )}
                </>
              )}
            </section>

            {totalen.length > 0 && (
              <section className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                  <p className="flex-1 text-[13px] font-semibold text-muted-foreground">Per leverancier (indicatie)</p>
                  <span className="text-[12px] text-muted-foreground">excl. btw</span>
                </div>
                <Card className="overflow-hidden">
                  <div className="flex items-center gap-2 border-b border-border/60 px-3 py-1.5 text-[12px] text-muted-foreground">
                    <span className="flex-1">Leverancier</span>
                    <span className="w-20 text-right">Open</span>
                    <span className="w-20 text-right">Onderweg</span>
                  </div>
                  <div className="divide-y divide-border/60">
                    {totalen.map((t) => <TotaalRij key={t.titel} t={t} />)}
                  </div>
                </Card>
              </section>
            )}

            {geleverd.length > 0 && (
              <Collapsible>
                <CollapsibleTrigger className="group flex h-11 w-full items-center gap-2 px-1 text-[13px] font-semibold text-muted-foreground">
                  <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
                  Geleverd ({geleverd.length})
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <Card className="overflow-hidden">
                    {perLeverancier(geleverd, leveranciers).map((g) => (
                      <div key={g.titel}>
                        <GroepKop titel={g.titel} regels={g.regels.length} prijzen={g.regels.map(prijsVan)} />
                        <div className="divide-y divide-border/60">
                          {g.regels.map((s) => (
                            <TabelRij
                              key={s.id}
                              vinkje={<Cirkel aan label="Geleverd" />}
                              naam={s.naam}
                              doorgestreept
                              titel={[s.geleverd_door && namen?.get(s.geleverd_door), s.levering_opmerking].filter(Boolean).join(' · ') || undefined}
                              extra={s.levering_status === 'deels' ? <Badge variant="outline" className="shrink-0 px-1.5 py-0 text-[11px] font-normal">deels</Badge> : null}
                              aantal={Number(s.aantal)}
                              eenheid={s.eenheid}
                              datum={s.geleverd_op ? datumLabel(s.geleverd_op) : ''}
                              datumMobiel={false}
                              prijs={prijsVan(s)}
                              actie={
                                <Button variant="ghost" size="sm" className="h-9 w-9 p-0 text-muted-foreground" aria-label="Toch niet geleverd, terug naar onderweg" onClick={() => terugNaarBesteld.mutate(s.id)}>
                                  <Undo2 className="h-4 w-4" />
                                </Button>
                              }
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </Card>
                </CollapsibleContent>
              </Collapsible>
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
