import React from 'react';
import { cn } from '@/lib/utils';

export interface PolarProgressProps {
  value: number; // 0-100
  max?: number;
  label?: string;
  showPercentage?: boolean;
  size?: 'small' | 'default' | 'large';
  variant?: 'default' | 'success' | 'warning' | 'error';
}

const variantColorClasses = {
  default: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-destructive',
} as const;

const sizeHeightClasses = {
  small: 'h-1',
  default: 'h-2',
  large: 'h-3',
} as const;

export function PolarProgress({
  value,
  max = 100,
  label,
  showPercentage = false,
  size = 'default',
  variant = 'default',
}: PolarProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className="flex flex-col gap-2 w-full">
      {(label || showPercentage) && (
        <div className="flex justify-between items-center">
          {label && (
            <span className="text-sm font-medium text-foreground">
              {label}
            </span>
          )}
          {showPercentage && (
            <span className="text-sm font-semibold text-muted-foreground">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}

      <div
        className={cn(
          'w-full rounded-full overflow-hidden border border-border bg-background',
          sizeHeightClasses[size],
        )}
      >
        <div
          className={cn(
            'h-full rounded-full transition-[width] duration-slow',
            variantColorClasses[variant],
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// Circular Progress variant
export interface PolarCircularProgressProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  variant?: 'default' | 'success' | 'warning' | 'error';
  showLabel?: boolean;
}

// SVG stroke colors need to be inline or use CSS variables
const variantStrokeColors = {
  default: 'hsl(var(--primary))',
  success: 'hsl(var(--success))',
  warning: 'hsl(var(--warning))',
  error: 'hsl(var(--destructive))',
} as const;

export function PolarCircularProgress({
  value,
  size = 80,
  strokeWidth = 8,
  variant = 'default',
  showLabel = true,
}: PolarCircularProgressProps) {
  const percentage = Math.min(Math.max(value, 0), 100);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const strokeColor = variantStrokeColors[variant];

  return (
    <div className="relative inline-flex">
      <svg
        width={size}
        height={size}
        className="-rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--background))"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-[stroke-dashoffset] duration-slow"
        />
      </svg>

      {showLabel && (
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-semibold text-foreground"
          style={{ fontSize: `${size / 4}px` }}
        >
          {Math.round(percentage)}%
        </div>
      )}
    </div>
  );
}
