import React from 'react';

export interface PolarHeaderProps {
  title?: string;
  showStatusIndicator?: boolean;
  location?: string;
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
  showStatusIndicator = true,
  location
}: PolarHeaderProps) {
  return (
    <div 
      style={{
        height: '72px',
        backgroundColor: '#FEFFF1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 48px',
        paddingTop: '16px',
      }}
    >
      <h1 
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '24px',
          fontWeight: 600,
          color: '#282E3A',
          marginTop: '14px',
        }}
      >
        {title}
      </h1>
      {location && (
        <div
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            fontWeight: 500,
            color: '#73747B',
            marginTop: '14px',
          }}
        >
          Locatie: {location}
        </div>
      )}
    </div>
  );
}
