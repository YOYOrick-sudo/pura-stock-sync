import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import type { StatusTone } from './StatusBadge';

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  tone?: StatusTone;
  className?: string;
}

const toonKleur: Record<StatusTone, string> = {
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-destructive',
  info: 'text-info',
  neutral: 'text-foreground',
  brand: 'text-foreground',
};

/** Zelfde label en getal, nu de maat van een kengetal. */
export function StatCard({ label, value, icon, tone = 'neutral', className }: StatCardProps) {
  return (
    <div className={cn('min-w-0 space-y-1 rounded-polar-lg border border-border bg-card px-4 py-4 shadow-sm', className)}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon ? <span className="[&_svg]:h-4 [&_svg]:w-4">{icon}</span> : null}
        <span className="truncate">{label}</span>
      </div>
      <p className={cn('truncate text-2xl font-semibold tabular-nums leading-none', toonKleur[tone])}>{value}</p>
    </div>
  );
}
