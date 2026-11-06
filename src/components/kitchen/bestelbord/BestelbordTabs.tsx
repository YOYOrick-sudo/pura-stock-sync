import type { ComponentType } from 'react';
import { AlertCircle } from 'lucide-react';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { segmentTabsKlasse, StatusBadge } from '@/components/pura';
import { cn } from '@/lib/utils';

export type BestelbordTab = {
  id: string;
  naam: string;
  kort: string;
  Icoon: ComponentType<{ className?: string }>;
  n: number;
  /** Gesproken reden. Dezelfde teller-badge gebruikt dan de waarschuwingskleur. */
  aandacht?: string | null;
};

/** Tabbalk: altijd volle breedte, tabs zo breed als hun label (nooit afgekapt). Onder lg kort label met teller eronder; vanaf lg icoon + volledige naam op één regel. */
export const bestelbordTabsKlasse = cn(
  segmentTabsKlasse,
  'w-full sm:w-full justify-start flex-nowrap [&>button]:flex-auto sm:[&>button]:flex-auto [&>button]:min-w-0 [&>button]:flex-col [&>button]:gap-1 [&>button]:px-1 [&>button]:text-xs lg:[&>button]:flex-row lg:[&>button]:gap-1.5 lg:[&>button]:px-2 lg:[&>button]:text-sm',
);

function TabTeller({ n, aandacht }: { n: number; aandacht?: string | null }) {
  if (n <= 0 && !aandacht) return null;
  return (
    <StatusBadge
      tone={aandacht ? 'warning' : 'neutral'}
      className={cn('h-5 shrink-0 px-1.5 py-0 leading-none tabular-nums', aandacht ? 'border-warning/40' : 'border-border bg-card text-muted-foreground')}
    >
      {n}
    </StatusBadge>
  );
}

export function BestelbordTabs({ tabs }: { tabs: BestelbordTab[] }) {
  return <TabsList className={bestelbordTabsKlasse}>
    {tabs.map(({ id, naam, kort, Icoon, n, aandacht }) => <TabsTrigger key={id} value={id} aria-label={aandacht ? `${naam} (${n}), ${aandacht}` : `${naam} (${n})`}>
      <Icoon className="hidden h-4 w-4 shrink-0 lg:block" />
      <span className="lg:hidden">{kort}</span><span className="hidden lg:inline">{naam}</span>
      <TabTeller n={n} aandacht={aandacht} />
    </TabsTrigger>)}
  </TabsList>;
}

/** Zelfde filter als voorheen: toont regels zonder prijs. Alleen de plek in de balk verandert. */
export function ZonderPrijsFilter({ aantal, aan, onToggle, className }: { aantal: number; aan: boolean; onToggle: () => void; className?: string }) {
  if (aantal <= 0) return null;
  return (
    <Button
      type="button"
      variant={aan ? 'default' : 'outline'}
      size="touch"
      className={cn('shrink-0 gap-1.5', !aan && 'border-warning/40 text-warning hover:bg-warning/10 hover:text-warning', className)}
      aria-pressed={aan}
      onClick={onToggle}
    >
      <AlertCircle className="h-4 w-4" />
      <span className="tabular-nums">{aantal}</span>
      <span>zonder prijs</span>
    </Button>
  );
}
