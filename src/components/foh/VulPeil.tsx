/** Klein bakje (zijaanzicht): hoe vol het minstens moet zijn. */
export function VulPeil({ procent, label }: { procent: number; label?: string }) {
  return (
    <span
      role="img"
      aria-label={label}
      title={label}
      className="relative inline-flex h-[16px] w-[18px] shrink-0 overflow-hidden rounded-b-[4px] rounded-t-[1px] border-[1.5px] border-t-0 border-muted-foreground/40"
    >
      <span className="absolute inset-x-0 bottom-0 bg-primary" style={{ height: `${procent}%` }} />
    </span>
  );
}
