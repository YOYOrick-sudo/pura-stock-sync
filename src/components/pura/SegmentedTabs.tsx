import { cn } from '@/lib/utils';

interface SegmentedTabsProps<T extends string> {
  value: T;
  onValueChange: (value: T) => void;
  options: { value: T; label: string; count?: number }[];
  className?: string;
}

/**
 * SegmentedTabs — losse pill-knoppen naar Taken-referentie.
 * Actief = groen gevuld met witte tekst + teller-badge.
 * Inactief = witte pill met border.
 */
export function SegmentedTabs<T extends string>({
  value,
  onValueChange,
  options,
  className,
}: SegmentedTabsProps<T>) {
  return (
    <div className={cn('flex flex-wrap gap-3', className)}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onValueChange(opt.value)}
            className={cn(
              'inline-flex items-center justify-center gap-2 min-h-[44px] px-5 rounded-polar-xl',
              'text-sm font-medium transition-all duration-150',
              active
                ? 'bg-primary text-primary-foreground border border-transparent shadow-sm'
                : 'bg-card text-foreground border border-border hover:bg-muted hover:shadow-sm',
            )}
          >
            <span>{opt.label}</span>
            {typeof opt.count === 'number' && (
              <span
                className={cn(
                  'rounded-md px-2 py-0.5 text-xs font-semibold min-w-[28px] text-center',
                  active
                    ? 'bg-primary-foreground/25 text-primary-foreground'
                    : 'bg-foreground/5 text-muted-foreground',
                )}
              >
                {opt.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
