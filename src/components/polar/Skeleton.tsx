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
        return { height: '1em', borderRadius: '4px', width };
      case 'circular':
        return { borderRadius: '50%', width, height };
      case 'rectangular':
      default:
        return { borderRadius, width, height };
    }
  };

  const animationClass = animation === 'pulse' ? 'animate-pulse' : '';

  return (
    <div
      className={`bg-muted ${animationClass}`}
      style={getVariantStyles()}
    />
  );
}

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
