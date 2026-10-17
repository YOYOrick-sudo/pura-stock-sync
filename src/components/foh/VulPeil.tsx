import { cn } from '@/lib/utils';

const STANDEN = [
  { procent: 20, naam: 'bodem' },
  { procent: 50, naam: 'half' },
  { procent: 100, naam: 'vol' },
];

/** Drie bakjes (bodem, half, vol) naast elkaar; alleen het minimum is gevuld. */
export function VulPeil({ procent, label }: { procent: number; label?: string }) {
  const actief = STANDEN.reduce((b, s) => (Math.abs(s.procent - procent) < Math.abs(b.procent - procent) ? s : b));
  return (
    <span role="img" aria-label={label} title={label} className="inline-flex shrink-0 items-end gap-1">
      {STANDEN.map((s) => {
        const aan = s === actief;
        return (
          <span
            key={s.naam}
            className={cn(
              'relative inline-flex h-[20px] w-[18px] overflow-hidden rounded-b-[4px] rounded-t-[1px] border-2 border-t-0',
              aan ? 'border-primary' : 'border-muted-foreground/40',
            )}
          >
            <span
              className={cn('absolute inset-x-0 bottom-0', aan ? 'bg-primary' : 'bg-muted-foreground/20')}
              style={{ height: `${s.procent}%` }}
            />
          </span>
        );
      })}
    </span>
  );
}
