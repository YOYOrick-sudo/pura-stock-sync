import React from 'react';
import { Menu } from 'lucide-react';

export interface PolarHeaderProps {
  title?: string;
  showStatusIndicator?: boolean;
  location?: string;
  onMenuClick?: () => void;
}

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
        borderBottom: '1px solid #D5D8E0',
      }}
    >
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="flex items-center justify-center w-10 h-10 rounded-xl transition-colors hover:bg-[#F1F3F5]"
            style={{
              border: '1px solid #D5D8E0',
            }}
            aria-label="Open menu"
          >
            <Menu size={20} style={{ color: '#282E3A' }} />
          </button>
        )}
        <h1 
          className="text-lg md:text-2xl"
          style={{
            fontFamily: "'Instrument Sans', 'Inter', sans-serif",
            fontWeight: 700,
            color: '#1A1F28',
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
            color: '#636878',
          }}
        >
          Locatie: {location}
        </div>
      )}
    </div>
  );
}
