import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface SegmentedTabsProps<T extends string> {
  value: T;
  onValueChange: (value: T) => void;
  options: { value: T; label: string; count?: number }[];
  className?: string;
}

/**
 * SegmentedTabs — pill-bar met vaste Pura-styling (radius 20px, 44px touch).
 * Vervangt losse pill-implementaties (Kassatelling, Onderhoud, KasControle).
 */
export function SegmentedTabs<T extends string>({
  value,
  onValueChange,
  options,
  className,
}: SegmentedTabsProps<T>) {
  return (
    <Tabs value={value} onValueChange={(v) => onValueChange(v as T)} className={className}>
      <TabsList
        className={cn('bg-muted p-1 rounded-polar-xl w-full grid h-auto')}
        style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
      >
        {options.map((opt) => (
          <TabsTrigger
            key={opt.value}
            value={opt.value}
            className={cn(
              'rounded-polar-lg min-h-[44px] text-sm font-medium',
              'data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-card',
              'data-[state=inactive]:text-muted-foreground',
            )}
          >
            <span>{opt.label}</span>
            {typeof opt.count === 'number' && (
              <span className="ml-1.5 text-xs opacity-70">{opt.count}</span>
            )}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
