/**
 * Liggende meter (leeg → vol), groen tot het minimum met een streep: de
 * minimumnorm. Bewust rustig gehouden — een dunne, zachte meter die niet
 * boven de productnaam uitkomt.
 */
export function VulPeil({ procent, label }: { procent: number; label?: string }) {
  const p = Math.max(0, Math.min(100, procent));
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className="relative inline-flex h-[6px] w-[56px] shrink-0 overflow-visible rounded-full bg-muted-foreground/15"
    >
      <span
        className="absolute inset-y-0 left-0 rounded-full bg-primary/55"
        style={{ width: `${p}%` }}
      />
      <span
        className="absolute -top-[3px] -bottom-[3px] w-[2px] -translate-x-1/2 rounded-full bg-muted-foreground"
        style={{ left: `${Math.min(p, 98)}%` }}
      />
    </span>
  );
}
