import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { TableCell, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

/** Sectiekop: titel + teller links, één actie of info rechts. */
export function SectieKop({ titel, teller, rechts }: { titel: ReactNode; teller?: ReactNode; rechts?: ReactNode }) {
  return <div className="flex min-h-9 items-center justify-between gap-2">
    <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-foreground">{titel}{teller != null && <span className="tabular-nums font-normal text-muted-foreground">{teller}</span>}</div>
    {rechts}
  </div>;
}

/** Groepkop als tussenrij in één tabel: naam vet links, aantal en totaal rechts. */
export function GroepRij({ naam, aantal, totaal, kolommen, gedimd = false, actie }: { naam: ReactNode; aantal?: number; totaal?: ReactNode; kolommen: number; gedimd?: boolean; actie?: ReactNode }) {
  return <TableRow className="bg-muted/50 hover:bg-muted/50">
    <TableCell colSpan={kolommen} className="h-9 py-0">
      <div className={cn('flex items-center justify-between gap-2 text-sm', gedimd ? 'text-muted-foreground' : 'text-foreground')}>
        <span className="min-w-0 truncate font-semibold">{naam}</span>
        <span className="flex shrink-0 gap-3 tabular-nums text-muted-foreground">{aantal != null && <span>{aantal}</span>}{totaal != null && <span className="font-medium text-foreground">{totaal}</span>}{actie}</span>
      </div>
    </TableCell>
  </TableRow>;
}

/** Kengetal: icoon + label klein, groot getal eronder. Meerdere naast elkaar in één kaart. */
export function Kengetal({ icoon: Icoon, label, waarde, toon = 'neutraal' }: { icoon: LucideIcon; label: string; waarde: ReactNode; toon?: 'neutraal' | 'let-op' }) {
  return <div className="min-w-0 space-y-1">
    <div className="flex items-center gap-1 text-xs text-muted-foreground"><Icoon className={cn('h-4 w-4 shrink-0', toon === 'let-op' && 'text-warning')} /><span className="truncate">{label}</span></div>
    <div className="text-xl font-semibold tabular-nums text-foreground">{waarde}</div>
  </div>;
}

/** Eén samenvattingskaart: kengetallen in een rij, optioneel inhoud eronder. */
export function OverzichtKaart({ kengetallen, children }: { kengetallen: ReactNode; children?: ReactNode }) {
  return <Card className="overflow-hidden">
    <div className="grid grid-cols-3 gap-3 p-4">{kengetallen}</div>
    {children && <div className="border-t border-border">{children}</div>}
  </Card>;
}

export function LegeStaat({ tekst }: { tekst: string }) {
  return <p className="py-6 text-center text-sm text-muted-foreground">{tekst}</p>;
}

/** Kleine stip met optioneel één woord. Toon: goed (groen), let-op (oranje), fout (rood), neutraal (grijs). */
export function StatusDot({ toon = 'neutraal', label, verborgenLabel }: { toon?: 'goed' | 'let-op' | 'fout' | 'neutraal'; label?: string; verborgenLabel?: string }) {
  const kleur = { goed: 'bg-primary', 'let-op': 'bg-warning', fout: 'bg-destructive', neutraal: 'bg-muted-foreground' }[toon];
  return <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
    <span className={cn('h-2 w-2 shrink-0 rounded-full', kleur)} aria-hidden />
    {label}{verborgenLabel && <span className="sr-only">{verborgenLabel}</span>}
  </span>;
}

/** Invoerbalk: zoekveld, aantal en eenheid in één omlijnd vlak. Kinderen zijn randloos. */
export function Invoerbalk({ children }: { children: ReactNode }) {
  return <div className="flex min-w-0 flex-wrap items-center gap-1 rounded-polar-md border border-input bg-background p-1 sm:flex-nowrap [&_input]:border-0 [&_input]:shadow-none [&_input]:focus-visible:ring-0 [&_input]:focus-visible:ring-offset-0">{children}</div>;
}

/** Klasse voor TabsList als aaneengesloten segmentbalk zonder gaten. */
export const segmentTabsKlasse = 'flex h-auto w-full min-w-0 gap-0 p-1 sm:w-auto [&>button]:min-h-10 [&>button]:flex-1 [&>button]:gap-1.5 [&>button]:px-3 sm:[&>button]:flex-none';
