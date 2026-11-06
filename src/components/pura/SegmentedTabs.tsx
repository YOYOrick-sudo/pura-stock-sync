import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { segmentTabsKlasse } from '@/components/pura/patronen';

interface SegmentedTabsProps<T extends string> {
  value: T;
  onValueChange: (value: T) => void;
  options: { value: T; label: string; count?: number }[];
  className?: string;
}

/** Zelfde opties als voorheen, nu de tablijst uit het boek. */
export function SegmentedTabs<T extends string>({
  value,
  onValueChange,
  options,
  className,
}: SegmentedTabsProps<T>) {
  return (
    <Tabs value={value} onValueChange={(volgende) => onValueChange(volgende as T)}>
      <TabsList className={cn(segmentTabsKlasse, className)}>
        {options.map((opt) => (
          <TabsTrigger key={opt.value} value={opt.value}>
            {opt.label}
            {typeof opt.count === 'number' ? <span className="tabular-nums text-muted-foreground">{opt.count}</span> : null}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
