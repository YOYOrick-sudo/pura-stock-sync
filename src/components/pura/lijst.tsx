import { MoreVertical, Search } from 'lucide-react';
import type { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/** Paginabalk: navigatie/filters links, de ene primaire actie rechts. Geen titel: die staat in de app-header. */
export function PaginaBalk({ links, actie }: { links: ReactNode; actie?: ReactNode }) {
  return <div className="flex flex-wrap items-center justify-between gap-2"><div className="min-w-0 flex-1 sm:flex-none">{links}</div>{actie}</div>;
}

export type StatusToon = 'goed' | 'let-op' | 'fout' | 'neutraal';
const badgeVoor: Record<StatusToon, 'success' | 'warning' | 'error' | 'secondary'> = { goed: 'success', 'let-op': 'warning', fout: 'error', neutraal: 'secondary' };

/** Eén statuslabel per rij: altijd met tekst, nooit alleen kleur. */
export function StatusLabel({ toon = 'neutraal', children }: { toon?: StatusToon; children: ReactNode }) {
  return <Badge variant={badgeVoor[toon]} className="shrink-0 whitespace-nowrap font-medium">{children}</Badge>;
}

/** Tweede regel onder de productnaam. Op telefoon draagt hij wat de verborgen kolommen tonen. */
export function RijMeta({ children, altijd = false }: { children: ReactNode; altijd?: boolean }) {
  return <span className={cn('mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground', !altijd && 'sm:hidden')}>{children}</span>;
}

export interface RijActie { label: string; onClick: () => void; gevaar?: boolean }

/** Rijmenu "…": alle rij-acties op één vaste plek, gevaarlijke actie onderaan. */
export function RijMenu({ naam, acties }: { naam: string; acties: RijActie[] }) {
  const gewoon = acties.filter((a) => !a.gevaar), gevaar = acties.filter((a) => a.gevaar);
  return <DropdownMenu>
    <DropdownMenuTrigger asChild><Button variant="ghost" size="touch-icon" aria-label={`Opties ${naam}`} onClick={(e) => e.stopPropagation()}><MoreVertical className="h-4 w-4 text-muted-foreground" /></Button></DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      {gewoon.map((a) => <DropdownMenuItem key={a.label} className="min-h-11" onClick={a.onClick}>{a.label}</DropdownMenuItem>)}
      {!!gewoon.length && !!gevaar.length && <DropdownMenuSeparator />}
      {gevaar.map((a) => <DropdownMenuItem key={a.label} className="min-h-11 text-destructive focus:text-destructive" onClick={a.onClick}>{a.label}</DropdownMenuItem>)}
    </DropdownMenuContent>
  </DropdownMenu>;
}

/** Voetregel onder een tabel: telling links, totaal rechts. */
export function TabelVoet({ links, rechts }: { links?: ReactNode; rechts?: ReactNode }) {
  return <div className="flex min-h-11 items-center justify-between gap-2 border-t border-border px-4 text-xs text-muted-foreground"><span>{links}</span><span className="font-medium tabular-nums text-foreground">{rechts}</span></div>;
}

/** Zoekveld met icoon, 44px. */
export function ZoekVeld({ waarde, onChange, placeholder = 'Zoeken' }: { waarde: string; onChange: (v: string) => void; placeholder?: string }) {
  return <div className="relative min-w-0"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={waarde} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} className="h-11 pl-9 text-base" /></div>;
}
