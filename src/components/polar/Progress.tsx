import React from 'react';
import { PolarColors } from './colors';

export interface PolarProgressProps {
  value: number; // 0-100
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

  const variantColors = {
    default: PolarColors.brand.primary,
    success: PolarColors.status.success,
    warning: PolarColors.status.warning,
    error: PolarColors.status.error,
  };

  const height = sizeMap[size];
  const color = variantColors[variant];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
      {(label || showPercentage) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {label && (
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                fontWeight: 500,
                color: PolarColors.text.primary,
              }}
            >
              {label}
            </span>
          )}
          {showPercentage && (
            <span
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                fontWeight: 600,
                color: PolarColors.text.secondary,
              }}
            >
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      
      <div
        style={{
          width: '100%',
          height: `${height}px`,
          backgroundColor: PolarColors.background,
          borderRadius: '999px',
          overflow: 'hidden',
          border: `1px solid ${PolarColors.border.default}`,
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            height: '100%',
            backgroundColor: color,
            transition: 'width 0.3s ease',
            borderRadius: '999px',
          }}
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

  const variantColors = {
    default: PolarColors.brand.primary,
    success: PolarColors.status.success,
    warning: PolarColors.status.warning,
    error: PolarColors.status.error,
  };

  const color = variantColors[variant];

  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <svg
        width={size}
        height={size}
        style={{ transform: 'rotate(-90deg)' }}
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={PolarColors.background}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
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
          style={{
            transition: 'stroke-dashoffset 0.3s ease',
          }}
        />
      </svg>
      
      {showLabel && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontFamily: 'Inter, sans-serif',
            fontSize: `${size / 4}px`,
            fontWeight: 600,
            color: PolarColors.text.primary,
          }}
        >
          {Math.round(percentage)}%
        </div>
      )}
    </div>
  );
}
