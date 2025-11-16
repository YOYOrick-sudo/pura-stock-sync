import React from 'react';

export interface PolarHeaderProps {
  title?: string;
  showStatusIndicator?: boolean;
}

/**
 * PolarHeader - EXACT header from PolarBaseUI
 * 
 * Specifications:
 * - Height: 72px
 * - Background: #FFFFFF
 * - Padding: 0 48px
 * - Font: Inter, 24px, 600 weight
 * - Color: #17171C
 */
export function PolarHeader({ 
  title = 'Dashboard', 
  showStatusIndicator = true 
}: PolarHeaderProps) {
  return (
    <div 
      style={{
        height: '72px',
        backgroundColor: '#EAF0EB',
        display: 'flex',
        alignItems: 'center',
        padding: '0 48px',
      }}
    >
      <h1 
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '24px',
          fontWeight: 600,
          color: '#17171C',
          marginTop: '14px',
        }}
      >
        {title}
      </h1>
    </div>
  );
}
