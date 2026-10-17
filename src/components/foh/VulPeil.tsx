import { cn } from '@/lib/utils';

/** Drie blokjes: hoe vol het minstens moet zijn voordat je aanvult. */
export function VulPeil({ gevuld }: { gevuld: number }) {
  return (
    <span className="inline-flex items-end gap-[2px]" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={cn('h-[10px] w-[4px] rounded-[1px]', i < gevuld ? 'bg-primary' : 'bg-muted-foreground/25')}
        />
      ))}
    </span>
  );
}
