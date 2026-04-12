import React from 'react';

export interface PolarProgressProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  size?: 'small' | 'default' | 'large';
  variant?: 'default' | 'success' | 'warning' | 'error';
}

export function PolarProgress({
  value,
  max = 100,
  label,
  showPercentage = false,
  size = 'default',
  variant = 'default',
}: PolarProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizeMap = {
    small: 4,
    default: 8,
    large: 12,
  };

  const variantClasses = {
    default: 'bg-primary',
    success: 'bg-success',
    warning: 'bg-warning',
    error: 'bg-destructive',
  };

  const height = sizeMap[size];

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
        className="w-full bg-muted rounded-full overflow-hidden border border-border"
        style={{ height: `${height}px` }}
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ${variantClasses[variant]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// Circular Progress variant
export interface PolarCircularProgressProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  variant?: 'default' | 'success' | 'warning' | 'error';
  showLabel?: boolean;
}

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

  // For SVG we need actual color values, use CSS vars
  const variantColors = {
    default: 'hsl(var(--primary))',
    success: 'hsl(var(--success))',
    warning: 'hsl(var(--warning))',
    error: 'hsl(var(--destructive))',
  };

  const color = variantColors[variant];

  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <svg
        width={size}
        height={size}
        style={{ transform: 'rotate(-90deg)' }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.3s ease' }}
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
