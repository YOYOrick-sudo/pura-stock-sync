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
      className="h-[60px] md:h-[72px] flex items-center justify-between px-4 md:px-12 bg-card border-b border-border"
    >
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="flex items-center justify-center w-10 h-10 rounded-lg transition-colors border border-border hover:bg-muted"
            aria-label="Open menu"
          >
            <Menu size={20} className="text-foreground" />
          </button>
        )}
        <h1 
          className="text-lg md:text-2xl font-semibold text-foreground"
          style={{ marginTop: '14px' }}
        >
          {title}
        </h1>
      </div>
      {location && (
        <div
          className="hidden sm:block text-sm font-medium text-muted-foreground"
          style={{ marginTop: '14px' }}
        >
          Locatie: {location}
        </div>
      )}
    </div>
  );
}
