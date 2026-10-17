/** Bak (zijaanzicht) met stippellijn op de minimumhoogte, zoals een maatbeker. */
export function VulPeil({ procent, label }: { procent: number; label?: string }) {
  const lijn = Math.min(procent, 92);
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className="relative inline-flex h-[24px] w-[28px] shrink-0 overflow-hidden rounded-b-[5px] rounded-t-[1px] border-2 border-t-0 border-muted-foreground/50"
    >
      <span className="absolute inset-x-0 bottom-0 bg-primary/70" style={{ height: `${procent}%` }} />
      <span
        className="absolute inset-x-0 border-t-2 border-dashed border-foreground/60"
        style={{ bottom: `${lijn}%` }}
      />
    </span>
  );
}
