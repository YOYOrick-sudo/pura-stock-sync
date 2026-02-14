import React from 'react';
import { Menu } from 'lucide-react';

export interface PolarHeaderProps {
  title?: string;
  showStatusIndicator?: boolean;
  location?: string;
  onMenuClick?: () => void;
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
  location,
  onMenuClick
}: PolarHeaderProps) {
  return (
    <div 
      className="h-[60px] md:h-[72px] flex items-center justify-between px-4 md:px-12"
      style={{
        backgroundColor: '#F8F9FA',
      }}
    >
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="flex items-center justify-center w-10 h-10 rounded-lg transition-colors hover:bg-[#FFF7ED]"
            style={{
              border: '1px solid rgba(197, 197, 202, 0.3)',
            }}
            aria-label="Open menu"
          >
            <Menu size={20} style={{ color: '#282E3A' }} />
          </button>
        )}
        <h1 
          className="text-lg md:text-2xl"
          style={{
            fontFamily: 'Inter, sans-serif',
            fontWeight: 600,
            color: '#282E3A',
            marginTop: '14px',
          }}
        >
          {title}
        </h1>
      </div>
      {location && (
        <div
          className="hidden sm:block text-sm"
          style={{
            fontFamily: 'Inter, sans-serif',
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
