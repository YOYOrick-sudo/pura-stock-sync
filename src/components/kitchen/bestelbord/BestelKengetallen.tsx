import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type KengetalTegel = { id: string; label: string; waarde: string | number; sub?: string; icoon: LucideIcon; toon?: 'neutraal' | 'let-op'; actief?: boolean; onKies: () => void };

/** Rij kengetal-kaarten bovenaan de Bestellijst; tik = naar tab of filter. Telefoon 2x2, vanaf tablet 4 naast elkaar. */
export function BestelKengetallen({ tegels }: { tegels: KengetalTegel[] }) {
  return <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
    {tegels.map(({ id, label, waarde, sub, icoon: Icoon, toon, actief, onKies }) => (
      <button key={id} type="button" onClick={onKies} aria-pressed={actief}
        className={cn('min-h-11 min-w-0 rounded-polar-lg border bg-card p-4 text-left shadow-card transition-colors duration-200 hover:bg-muted/40',
          actief ? 'border-primary ring-1 ring-primary' : 'border-border')}>
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span className="truncate">{label}</span>
          <Icoon className={cn('h-4 w-4 shrink-0', toon === 'let-op' ? 'text-warning' : 'text-muted-foreground')} />
        </div>
        <div className={cn('mt-1 truncate text-2xl font-semibold tabular-nums', toon === 'let-op' ? 'text-warning' : 'text-foreground')}>{waarde}</div>
        {sub && <div className="truncate text-xs text-muted-foreground">{sub}</div>}
      </button>
    ))}
  </div>;
}
