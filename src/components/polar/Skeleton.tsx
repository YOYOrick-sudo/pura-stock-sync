import React from 'react';
import { cn } from '@/lib/utils';

export interface PolarSkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  variant?: 'text' | 'circular' | 'rectangular';
  animation?: 'pulse' | 'wave' | 'none';
}

export function PolarSkeleton({
  width = '100%',
  height = '20px',
  borderRadius = '8px',
  variant = 'rectangular',
  animation = 'pulse',
}: PolarSkeletonProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'text':
        return {
          height: '1em',
          borderRadius: '4px',
          width: width,
        };
      case 'circular':
        return {
          borderRadius: '50%',
          width: width,
          height: height,
        };
      case 'rectangular':
      default:
        return {
          borderRadius: borderRadius,
          width: width,
          height: height,
        };
    }
  };

  const getAnimationClass = () => {
    if (animation === 'pulse') return 'animate-[polar-skeleton-pulse_1.5s_ease-in-out_infinite]';
    if (animation === 'wave') return 'animate-[polar-skeleton-wave_1.5s_ease-in-out_infinite]';
    return '';
  };

  const getWaveStyle = () => {
    if (animation === 'wave') {
      return {
        background: 'linear-gradient(90deg, hsl(var(--border)) 25%, hsl(var(--card)) 50%, hsl(var(--border)) 75%)',
        backgroundSize: '200% 100%',
      };
    }
    return {};
  };

  return (
    <div
      className={cn('bg-card', getAnimationClass())}
      style={{
        ...getVariantStyles(),
        ...getWaveStyle(),
      }}
    />
  );
}

// Skeleton Group for multiple skeletons
export interface PolarSkeletonGroupProps {
  count?: number;
  spacing?: number;
  children?: React.ReactNode;
}

export function PolarSkeletonGroup({
  count = 3,
  spacing = 12,
  children,
}: PolarSkeletonGroupProps) {
  if (children) {
    return (
      <div className="flex flex-col" style={{ gap: `${spacing}px` }}>
        {children}
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ gap: `${spacing}px` }}>
      {Array.from({ length: count }).map((_, index) => (
        <PolarSkeleton key={index} />
      ))}
    </div>
  );
}
