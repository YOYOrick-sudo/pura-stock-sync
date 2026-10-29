import { useMemo, useRef, useState } from 'react';
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
  useBestelSignalen, useBestelbordMutaties, useLeveranciers, useVestigingOpenDagen, type BestelSignaal,
} from '@/hooks/useBestelbord';
import { BestelLeverancierLabel } from '@/components/kitchen/BestelLeverancierLabel';

const SOORTEN = ['stuks', 'doos', 'zak', 'fles', 'pak', 'bak', 'emmer', 'kg'] as const;

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

function Rij({
  signaal,
  onBesteld,
  onVervallen,
  onBewerk,
}: {
  signaal: BestelSignaal;
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

  // Eerder gebruikte producten (laatste aantal + soort), nieuwste eerst.
  const eerder = useMemo(() => {
    const m = new Map<string, BestelSignaal>();
    for (const s of signalen) if (!m.has(norm(s.naam))) m.set(norm(s.naam), s);
    return [...m.values()];
  }, [signalen]);

  const suggesties = useMemo(() => {
    const q = norm(naam);
    const lijst = q ? eerder.filter((s) => norm(s.naam).includes(q) && norm(s.naam) !== q) : eerder;
    return lijst.slice(0, 8);
  }, [naam, eerder]);

  const leeg = () => {
    setNaam('');
    setAantal(1);
    setSoort(null);
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
    toevoegen.mutate(
      { naam: n, aantal, eenheid },
      {
        onSuccess: () => toast.success(`${n} — ${aantal} ${eenheid} staat erop`),
        onError: (e: any) => toast.error('Niet opgeslagen: ' + (e?.message ?? 'onbekende fout')),
      },
    );
    leeg();
  };

  const kies = (s: BestelSignaal) => {
    setNaam(s.naam);
    setAantal(Math.max(1, Number(s.aantal) || 1));
    setSoort(s.eenheid);
  };

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
            <Input
              ref={invoer}
              value={naam}
              onChange={(e) => setNaam(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  voegToe();
                }
              }}
              placeholder="Wat is op?"
              className="h-11 min-w-[200px] flex-1 text-[16px]"
            />
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
          {naam.trim().length > 0 && suggesties.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto">
              {suggesties.map((s) => (
                <button key={s.id} type="button" onClick={() => kies(s)}
                  className="h-9 shrink-0 rounded-full bg-muted px-3 text-[14px] text-foreground hover:bg-muted/70">
                  {s.naam} · {Number(s.aantal)} {s.eenheid}
                </button>
              ))}
            </div>
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
                  <Rij key={s.id} signaal={s} onBesteld={(b) => markeerBesteld(s, b)} onVervallen={() => vervallen(s)} onBewerk={() => openBewerk(s)} />
                ))
              )}
            </Card>

            {besteld.length > 0 && (
              <Collapsible>
                <CollapsibleTrigger className="group flex h-11 w-full items-center gap-2 px-1 text-sm font-medium text-muted-foreground">
                  <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
                  Besteld ({besteld.length})
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <Card className="divide-y divide-border/60 overflow-hidden">
                    {besteld.map((s) => (
                      <Rij key={s.id} signaal={s} onBesteld={(b) => markeerBesteld(s, b)} />
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
            <SoortKeuze waarde={bewerkSoort} onChange={setBewerkSoort} />
            <Button
              className="h-12 w-full"
              onClick={() => {
                if (!bewerk) return;
                wijzig.mutate({ id: bewerk.id, aantal: bewerkAantal, eenheid: bewerkSoort ?? 'stuks' });
                setBewerk(null);
              }}
            >
              Opslaan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </SidebarLayout>
  );
}
