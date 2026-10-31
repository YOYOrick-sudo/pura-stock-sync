import type { ComponentType, ReactNode } from 'react';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { segmentTabsKlasse } from '@/components/pura/patronen';
import { cn } from '@/lib/utils';

export type BestelbordTab = { id: string; naam: string; kort: string; Icoon: ComponentType<{ className?: string }>; n: number; extra?: ReactNode };

/** Tabbalk: altijd volle breedte, tabs zo breed als hun label (nooit afgekapt). Onder lg kort label met teller eronder; vanaf lg icoon + volledige naam op één regel. */
export const bestelbordTabsKlasse = cn(
  segmentTabsKlasse,
  'w-full sm:w-full justify-start flex-nowrap [&>button]:flex-auto sm:[&>button]:flex-auto [&>button]:min-w-0 [&>button]:flex-col [&>button]:gap-0 [&>button]:px-1 [&>button]:text-xs lg:[&>button]:flex-row lg:[&>button]:gap-1.5 lg:[&>button]:px-2 lg:[&>button]:text-sm',
);

export function BestelbordTabs({ tabs }: { tabs: BestelbordTab[] }) {
  return <TabsList className={bestelbordTabsKlasse}>
    {tabs.map(({ id, naam, kort, Icoon, n, extra }) => <TabsTrigger key={id} value={id} aria-label={`${naam} (${n})`}>
      <Icoon className="hidden h-4 w-4 shrink-0 lg:block" />
      <span className="lg:hidden">{kort}</span><span className="hidden lg:inline">{naam}</span>
      <span className="inline-flex min-h-4 items-center gap-1">{n > 0 && <span className="tabular-nums text-muted-foreground">{n}</span>}{extra}</span>
    </TabsTrigger>)}
  </TabsList>;
}
