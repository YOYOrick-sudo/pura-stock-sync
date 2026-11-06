import type { ReactNode } from 'react';
import { AlertTriangle, CircleAlert, CircleCheck, type LucideIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'brand';
export type StatusVariant = 'soft' | 'solid' | 'outline';

interface StatusBadgeProps {
  tone?: StatusTone;
  variant?: StatusVariant;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  shape?: 'chip' | 'label';
}

const badgeVariant = {
  success: 'success',
  warning: 'warning',
  danger: 'error',
  info: 'info',
  neutral: 'secondary',
  brand: 'secondary',
} as const;

const statusIcoon: Partial<Record<StatusTone, LucideIcon>> = {
  success: CircleCheck,
  warning: AlertTriangle,
  danger: CircleAlert,
};

const toneColorVar: Record<StatusTone, string> = {
  success: 'hsl(var(--success))',
  warning: 'hsl(var(--warning))',
  danger: 'hsl(var(--destructive))',
  info: 'hsl(var(--info))',
  neutral: 'hsl(var(--muted-foreground))',
  brand: 'hsl(var(--foreground))',
};

export function StatusBadge({ tone = 'neutral', children, className }: StatusBadgeProps) {
  const Icoon = statusIcoon[tone];
  return (
    <Badge variant={badgeVariant[tone]} className={cn('gap-1', className)}>
      {Icoon ? <Icoon className="h-3 w-3" aria-hidden /> : null}
      {children}
    </Badge>
  );
}

/** Kleur-token per tone, voor bv. urgency-strips op kaarten. */
export function toneColor(tone: StatusTone): string {
  return toneColorVar[tone];
}
