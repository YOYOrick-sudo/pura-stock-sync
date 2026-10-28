import { useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Check, Minus, Plus, Undo2, X } from 'lucide-react';
import { SidebarLayout } from '@/components/SidebarLayout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useUserLocation } from '@/contexts/UserLocationContext';
import { useBestelSignalen, useBestelbordMutaties, type BestelSignaal } from '@/hooks/useBestelbord';

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
    <div className="flex items-center gap-2 p-3 min-h-[60px]">
      <button type="button" disabled={!onBewerk} onClick={onBewerk} className="min-w-0 flex-1 text-left" style={{ minHeight: 44 }}>
        <span className={besteld ? 'text-[15px] text-muted-foreground line-through' : 'text-[16px] font-medium'}>
          {signaal.naam}
          <span className={cn('ml-2', besteld ? '' : 'font-bold')}>
            {Number(signaal.aantal)} {signaal.eenheid}
          </span>
        </span>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
          <span>{datumLabel(signaal.created_at)}</span>
          {signaal.bron === 'sluitlijst' && (
            <Badge variant="secondary" className="font-normal">Sluitlijst</Badge>
          )}
        </div>
      </button>
      {onVervallen && (
        <Button variant="ghost" className="h-11 w-11 p-0 text-muted-foreground" onClick={onVervallen} aria-label="Toch niet nodig">
          <X className="h-4 w-4" />
        </Button>
      )}
      <Button variant={besteld ? 'outline' : 'default'} className="h-11 min-w-[44px]" onClick={() => onBesteld(!besteld)} aria-label={besteld ? 'Terug naar open' : 'Besteld'}>
        {besteld ? <Undo2 className="h-4 w-4" /> : <><Check className="h-4 w-4 mr-1" />Besteld</>}
      </Button>
    </div>
  );
}

export default function Bestelbord() {
  const { userLocation } = useUserLocation();
  const vestiging = userLocation ?? '';
  const { data: signalen = [], isLoading } = useBestelSignalen(vestiging || null);
  const { toevoegen, zetBesteld, verwijderen, herstel, wijzig } = useBestelbordMutaties(vestiging);
  const [naam, setNaam] = useState('');
  const [aantal, setAantal] = useState(1);
  const [soort, setSoort] = useState<string | null>(null);
  const [bewerk, setBewerk] = useState<BestelSignaal | null>(null);
  const [bewerkAantal, setBewerkAantal] = useState(1);
  const [bewerkSoort, setBewerkSoort] = useState<string | null>(null);
  const invoer = useRef<HTMLInputElement>(null);

  const { open, besteld } = useMemo(
    () => ({
      open: signalen.filter((s) => s.status === 'open'),
      besteld: signalen.filter((s) => s.status === 'besteld').slice(0, 30),
    }),
    [signalen],
  );

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
    if (n.length < 2) return;
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

  const openBewerk = (s: BestelSignaal) => {
    setBewerk(s);
    setBewerkAantal(Math.max(1, Number(s.aantal) || 1));
    setBewerkSoort(s.eenheid);
  };

  return (
    <SidebarLayout>
      <div className="page-stack max-w-3xl">
        <p className="text-sm text-muted-foreground">
          Wat op is in {vestiging || 'deze keuken'}. Blijft staan tot het besteld is.
        </p>

        <Card className="p-4 space-y-3">
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
            placeholder="Wat is op? Bijv. Hüttenkäse"
            className="h-12 text-[16px]"
          />
          {suggesties.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {suggesties.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => kies(s)}
                  className="h-10 shrink-0 rounded-full bg-muted px-3.5 text-[14px] text-foreground hover:bg-muted/70"
                >
                  {s.naam}
                </button>
              ))}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <Stepper waarde={aantal} onChange={setAantal} />
            <SoortKeuze waarde={soort} onChange={setSoort} />
          </div>
          <Button className="h-12 w-full sm:w-auto" onClick={voegToe} disabled={naam.trim().length < 2}>
            <Plus className="h-4 w-4 mr-1" /> Erbij
          </Button>
        </Card>

        {isLoading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Laden…</p>
        ) : (
          <>
            <Card className="divide-y divide-border/60 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 bg-muted/60">
                <span className="text-sm font-semibold">Nog bestellen</span>
                <span className="text-xs text-muted-foreground">{open.length}</span>
              </div>
              {open.length === 0 ? (
                <p className="p-4 text-sm text-muted-foreground">Niets openstaand.</p>
              ) : (
                open.map((s) => (
                  <Rij key={s.id} signaal={s} onBesteld={(b) => markeerBesteld(s, b)} onVervallen={() => vervallen(s)} onBewerk={() => openBewerk(s)} />
                ))
              )}
            </Card>

            {besteld.length > 0 && (
              <Card className="divide-y divide-border/60 overflow-hidden">
                <div className="px-4 py-2 bg-muted/40 text-sm font-semibold text-muted-foreground">Besteld</div>
                {besteld.map((s) => (
                  <Rij key={s.id} signaal={s} onBesteld={(b) => markeerBesteld(s, b)} />
                ))}
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
