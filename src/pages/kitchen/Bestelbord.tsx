import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Check, Plus, Trash2, Undo2 } from 'lucide-react';
import { SidebarLayout } from '@/components/SidebarLayout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUserLocation } from '@/contexts/UserLocationContext';
import { useBestelSignalen, useBestelbordMutaties, type BestelSignaal } from '@/hooks/useBestelbord';

function datumLabel(iso: string): string {
  return new Date(iso).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' });
}

function Rij({
  signaal,
  onBesteld,
  onVerwijder,
}: {
  signaal: BestelSignaal;
  onBesteld: (besteld: boolean) => void;
  onVerwijder: () => void;
}) {
  const besteld = signaal.status === 'besteld';
  return (
    <div className="flex items-center gap-3 p-3 min-h-[60px]">
      <div className="min-w-0 flex-1">
        <span className={besteld ? 'text-[15px] text-muted-foreground line-through' : 'text-[15px] font-medium'}>
          {signaal.naam}
        </span>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
          <span>
            {Number(signaal.aantal)} {signaal.eenheid}
          </span>
          <span>·</span>
          <span>{datumLabel(signaal.created_at)}</span>
          {signaal.bron === 'sluitlijst' && (
            <Badge variant="secondary" className="font-normal">
              Sluitlijst
            </Badge>
          )}
        </div>
      </div>

      <Button
        variant={besteld ? 'outline' : 'default'}
        className="h-11 min-w-[44px]"
        onClick={() => onBesteld(!besteld)}
      >
        {besteld ? <Undo2 className="h-4 w-4" /> : <Check className="h-4 w-4 mr-1" />}
        {besteld ? '' : 'Besteld'}
      </Button>
      <Button variant="ghost" className="h-11 w-11 p-0 text-muted-foreground" onClick={onVerwijder} aria-label="Verwijderen">
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}

export default function Bestelbord() {
  const { userLocation } = useUserLocation();
  const vestiging = userLocation ?? '';
  const { data: signalen = [], isLoading } = useBestelSignalen(vestiging || null);
  const { toevoegen, zetBesteld, verwijderen } = useBestelbordMutaties(vestiging);
  const [naam, setNaam] = useState('');
  const [aantal, setAantal] = useState('1');

  const { open, besteld } = useMemo(
    () => ({
      open: signalen.filter((s) => s.status === 'open'),
      besteld: signalen.filter((s) => s.status === 'besteld').slice(0, 30),
    }),
    [signalen],
  );

  const voegToe = () => {
    const n = naam.trim();
    if (n.length < 2) return;
    toevoegen.mutate(
      { naam: n, aantal: Math.max(1, Number(aantal) || 1), eenheid: 'stuks' },
      {
        onSuccess: () => {
          setNaam('');
          setAantal('1');
          toast.success(`"${n}" staat op het bestelbord`);
        },
        onError: (e: any) => toast.error('Niet opgeslagen: ' + (e?.message ?? 'onbekende fout')),
      },
    );
  };

  return (
    <SidebarLayout>
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Bestelbord</h1>
          <p className="text-sm text-muted-foreground">
            Wat op is in {vestiging || 'deze keuken'}. Blijft staan tot het besteld is.
          </p>
        </div>

        <Card className="p-4">
          <div className="flex gap-2">
            <Input
              value={naam}
              onChange={(e) => setNaam(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  voegToe();
                }
              }}
              placeholder="Wat is op? Bijv. Hüttenkäse"
              className="h-11 flex-1"
            />
            <Input
              value={aantal}
              onChange={(e) => setAantal(e.target.value.replace(/[^0-9]/g, ''))}
              inputMode="numeric"
              className="h-11 w-16 text-center"
              aria-label="Aantal"
            />
            <Button className="h-11" onClick={voegToe} disabled={toevoegen.isPending}>
              <Plus className="h-4 w-4 mr-1" /> Erbij
            </Button>
          </div>
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
                  <Rij
                    key={s.id}
                    signaal={s}
                    onBesteld={(b) => zetBesteld.mutate({ id: s.id, besteld: b })}
                    onVerwijder={() => verwijderen.mutate(s.id)}
                  />
                ))
              )}
            </Card>

            {besteld.length > 0 && (
              <Card className="divide-y divide-border/60 overflow-hidden">
                <div className="px-4 py-2 bg-muted/40 text-sm font-semibold text-muted-foreground">Besteld</div>
                {besteld.map((s) => (
                  <Rij
                    key={s.id}
                    signaal={s}
                    onBesteld={(b) => zetBesteld.mutate({ id: s.id, besteld: b })}
                    onVerwijder={() => verwijderen.mutate(s.id)}
                  />
                ))}
              </Card>
            )}
          </>
        )}
      </div>
    </SidebarLayout>
  );
}
