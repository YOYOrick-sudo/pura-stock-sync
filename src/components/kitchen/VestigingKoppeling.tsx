import { cn } from '@/lib/utils';
import {
  VESTIGINGEN,
  type Vestiging,
  useSetVestigingKoppeling,
  type KoppelSoort,
} from '@/hooks/useVestigingKoppeling';

const KORT: Record<string, string> = { West: 'W', Midsland: 'M' };

interface FilterProps {
  waarde: Vestiging | null;
  onChange: (v: Vestiging | null) => void;
  className?: string;
}

/** Filterchips: Alle vestigingen / West / Midsland. */
export function VestigingFilter({ waarde, onChange, className }: FilterProps) {
  const opties: Array<{ label: string; value: Vestiging | null }> = [
    { label: 'Alle vestigingen', value: null },
    ...VESTIGINGEN.map((v) => ({ label: v, value: v as Vestiging })),
  ];

  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {opties.map((o) => {
        const actief = waarde === o.value;
        return (
          <button
            key={o.label}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              'px-4 rounded-full text-sm font-medium transition-colors min-h-[40px]',
              actief
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-foreground hover:bg-muted/80',
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

interface TogglesProps {
  soort: KoppelSoort;
  id: string;
  actieve: Set<string>;
  disabled?: boolean;
  className?: string;
}

/** Twee kleine schakelaars: staat dit item aan voor West / Midsland? */
export function VestigingToggles({ soort, id, actieve, disabled, className }: TogglesProps) {
  const mut = useSetVestigingKoppeling(soort);

  return (
    <div className={cn('flex gap-1.5', className)} onClick={(e) => e.stopPropagation()}>
      {VESTIGINGEN.map((v) => {
        const aan = actieve.has(v);
        return (
          <button
            key={v}
            type="button"
            disabled={disabled}
            title={`${v}: ${aan ? 'aan' : 'uit'}`}
            aria-label={`${v} ${aan ? 'uitzetten' : 'aanzetten'}`}
            onClick={() => mut.mutate({ id, vestiging: v, actief: !aan })}
            className={cn(
              'h-8 w-8 rounded-full text-xs font-semibold transition-colors border',
              aan
                ? 'bg-primary/10 text-primary border-primary/30'
                : 'bg-muted text-muted-foreground border-transparent',
              disabled ? 'cursor-default opacity-70' : 'hover:opacity-80',
            )}
          >
            {KORT[v] ?? v.slice(0, 1)}
          </button>
        );
      })}
    </div>
  );
}
