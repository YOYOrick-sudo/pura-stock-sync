import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'brand';
export type StatusVariant = 'soft' | 'solid' | 'outline';

interface StatusBadgeProps {
  tone?: StatusTone;
  variant?: StatusVariant;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  /** 'chip' = pill (rounded-full), 'label' = kleine hoekige label. Default: chip. */
  shape?: 'chip' | 'label';
}

const toneStyles: Record<StatusTone, Record<StatusVariant, string>> = {
  success: {
    soft: 'bg-success/10 text-success',
    solid: 'bg-success text-success-foreground',
    outline: 'border border-success/40 text-success bg-transparent',
  },
  warning: {
    soft: 'bg-warning/10 text-warning',
    solid: 'bg-warning text-warning-foreground',
    outline: 'border border-warning/40 text-warning bg-transparent',
  },
  danger: {
    soft: 'bg-destructive/10 text-destructive',
    solid: 'bg-destructive text-destructive-foreground',
    outline: 'border border-destructive/40 text-destructive bg-transparent',
  },
  info: {
    soft: 'bg-info/10 text-info',
    solid: 'bg-info text-info-foreground',
    outline: 'border border-info/40 text-info bg-transparent',
  },
  neutral: {
    soft: 'bg-muted text-muted-foreground',
    solid: 'bg-foreground text-background',
    outline: 'border border-border text-muted-foreground bg-transparent',
  },
  brand: {
    soft: 'bg-primary/10 text-primary',
    solid: 'bg-primary text-primary-foreground',
    outline: 'border border-primary/40 text-primary bg-transparent',
  },
};

const toneColorVar: Record<StatusTone, string> = {
  success: 'hsl(var(--success))',
  warning: 'hsl(var(--warning))',
  danger: 'hsl(var(--destructive))',
  info: 'hsl(var(--info))',
  neutral: 'hsl(var(--muted-foreground))',
  brand: 'hsl(var(--primary))',
};

export function StatusBadge({
  tone = 'neutral',
  variant = 'soft',
  icon,
  children,
  className,
  shape = 'chip',
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold',
        shape === 'chip' ? 'rounded-full' : 'rounded-polar-md',
        toneStyles[tone][variant],
        className,
      )}
    >
      {icon && <span className="flex items-center [&_svg]:h-3.5 [&_svg]:w-3.5">{icon}</span>}
      {children}
    </span>
  );
}

/** Kleur-token per tone, voor bv. urgency-strips op kaarten. */
export function toneColor(tone: StatusTone): string {
  return toneColorVar[tone];
}
