/** Liggende meter (leeg → vol), groen tot het minimum met een dikke streep, zoals een brandstofmeter. */
export function VulPeil({ procent, label }: { procent: number; label?: string }) {
  const p = Math.max(0, Math.min(100, procent));
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className="relative inline-flex h-[10px] w-[64px] shrink-0 overflow-visible rounded-full bg-muted-foreground/20"
    >
      <span className="absolute inset-y-0 left-0 rounded-full bg-primary" style={{ width: `${p}%` }} />
      <span
        className="absolute -top-[3px] -bottom-[3px] w-[3px] -translate-x-1/2 rounded-full bg-foreground"
        style={{ left: `${Math.min(p, 98)}%` }}
      />
    </span>
  );
}
