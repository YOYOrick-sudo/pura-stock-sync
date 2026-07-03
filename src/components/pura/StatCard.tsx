import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { toneColor, type StatusTone } from './StatusBadge';

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  tone?: StatusTone;
  className?: string;
}

/**
 * StatCard — compacte KPI-tegel in Pura-stijl.
 * Wit vlak, icoon-tegel links met tone-kleur, cijfer rechts.
 */
export function StatCard({ label, value, icon, tone = 'neutral', className }: StatCardProps) {
  const color = toneColor(tone);
  return (
    <div
      className={cn(
        'bg-card border border-border rounded-polar-xl shadow-card',
        'flex items-center gap-3 p-4',
        className,
      )}
    >
      {icon && (
        <div
          className="flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-polar-md"
          style={{ backgroundColor: `${color}1a`, color }}
        >
          <span className="[&_svg]:h-5 [&_svg]:w-5">{icon}</span>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground truncate">{label}</p>
        <p
          className="text-2xl font-semibold leading-tight"
          style={{ color: tone === 'neutral' ? undefined : color }}
        >
          {value}
        </p>
      </div>
    </div>
  );
}
