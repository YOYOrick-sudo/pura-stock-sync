import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type KengetalTegel = { id: string; label: string; waarde: string | number; sub?: string; icoon: LucideIcon; toon?: 'neutraal' | 'let-op'; actief?: boolean; onKies: () => void };

/** Rij kengetal-kaarten bovenaan de Bestellijst; tik = naar tab of filter. Kleur alleen in het icoon. Telefoon 2x2, vanaf tablet 4 naast elkaar. */
export function BestelKengetallen({ tegels }: { tegels: KengetalTegel[] }) {
  return <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
    {tegels.map(({ id, label, waarde, sub, icoon: Icoon, toon, actief, onKies }) => (
      <button key={id} type="button" onClick={onKies} aria-pressed={actief}
        className={cn('flex min-h-11 min-w-0 items-center gap-3 rounded-polar-lg border bg-card px-4 py-3 text-left transition-colors duration-200 hover:bg-muted/40',
          actief ? 'border-primary bg-primary/5' : 'border-border')}>
        <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-polar-md', toon === 'let-op' ? 'bg-warning/10 text-warning' : actief ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')}>
          <Icoon className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-baseline gap-2">
            <span className="text-xl font-semibold tabular-nums text-foreground">{waarde}</span>
            <span className="truncate text-xs text-muted-foreground">{label}</span>
          </span>
          {sub && <span className="block truncate text-xs text-muted-foreground">{sub}</span>}
        </span>
      </button>
    ))}
  </div>;
}
