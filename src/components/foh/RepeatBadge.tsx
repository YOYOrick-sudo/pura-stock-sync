import { Repeat } from 'lucide-react';

const DAY_SHORT = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'];

interface RepeatBadgeProps {
  repeatType?: string | null;
  daysOfWeek?: (number | null)[];
  size?: 'sm' | 'xs';
}

/**
 * Stylish, subtiele pill die aangeeft dat een taak terugkerend is.
 *   • daily  → "dagelijks"
 *   • weekly → "di · vr" (samengevoegde dagen)
 */
export function RepeatBadge({ repeatType, daysOfWeek, size = 'sm' }: RepeatBadgeProps) {
  if (!repeatType || repeatType === 'none' || repeatType === 'daily') return null;

  let label = '';
  if (repeatType === 'weekly') {
    const days = (daysOfWeek ?? [])
      .filter((d): d is number => typeof d === 'number')
      .sort((a, b) => ((a + 6) % 7) - ((b + 6) % 7)); // ma=1 eerst, zo=0 laatst
    if (days.length === 0) return null;
    label = days.map((d) => DAY_SHORT[d]).join(' · ');
  } else {
    return null;
  }

  const isXs = size === 'xs';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: isXs ? '1px 6px' : '2px 8px',
        marginLeft: '8px',
        borderRadius: '999px',
        backgroundColor: 'hsl(var(--muted))',
        color: 'hsl(var(--muted-foreground))',
        fontSize: isXs ? '10px' : '11px',
        fontWeight: 600,
        letterSpacing: '0.02em',
        lineHeight: 1,
        fontFamily: 'Inter, sans-serif',
        border: '1px solid hsl(var(--border) / 0.6)',
        flexShrink: 0,
        whiteSpace: 'nowrap',
      }}
      title={repeatType === 'daily' ? 'Herhaalt elke dag' : `Herhaalt elke week (${label})`}
    >
      <Repeat size={isXs ? 9 : 10} strokeWidth={2.5} style={{ color: 'hsl(var(--primary))' }} />
      {label}
    </span>
  );
}
