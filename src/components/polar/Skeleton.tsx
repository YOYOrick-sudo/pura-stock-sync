import React from 'react';

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

  const getAnimationStyles = () => {
    if (animation === 'pulse') {
      return {
        animation: 'polar-skeleton-pulse 1.5s ease-in-out infinite',
      };
    } else if (animation === 'wave') {
      return {
        background: 'linear-gradient(90deg, rgba(197, 197, 202, 0.3) 25%, #F8F9FA 50%, rgba(197, 197, 202, 0.3) 75%)',
        backgroundSize: '200% 100%',
        animation: 'polar-skeleton-wave 1.5s ease-in-out infinite',
      };
    }
    return {};
  };

  return (
    <div
      style={{
        backgroundColor: '#F8F9FA',
        ...getVariantStyles(),
        ...getAnimationStyles(),
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: `${spacing}px` }}>
        {children}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: `${spacing}px` }}>
      {Array.from({ length: count }).map((_, index) => (
        <PolarSkeleton key={index} />
      ))}
    </div>
  );
}
