import React from 'react';
import { Menu, MapPin, ChevronDown, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export interface PolarHeaderLocationOption {
  value: string;
  label: string;
}

export interface PolarHeaderProps {
  title?: string;
  showStatusIndicator?: boolean;
  location?: string;
  onMenuClick?: () => void;
  /** Meer dan één optie ⇒ header toont een vestigingswissel */
  locationOptions?: PolarHeaderLocationOption[];
  activeLocationValue?: string;
  onLocationChange?: (value: string) => void;
}


const dateFormatter = new Intl.DateTimeFormat('nl-NL', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
});

function formatToday() {
  const parts = dateFormatter.formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  const weekday = get('weekday');
  const day = get('day');
  const month = get('month');
  return `${day} ${month} · ${weekday}`;
}

export function PolarHeader({
  title = 'Dashboard',
  location,
  onMenuClick,
  locationOptions,
  activeLocationValue,
  onLocationChange,
}: PolarHeaderProps) {
  const today = formatToday();
  const canSwitch = !!locationOptions && locationOptions.length > 1 && !!onLocationChange;

  return (
    <div className="flex items-center justify-between gap-4 px-6 md:px-10 lg:px-16 py-5 md:py-6 bg-background">
      <div className="flex items-center gap-3 min-w-0">
        {onMenuClick && (
          <button
            onClick={onMenuClick}
            className="flex items-center justify-center w-10 h-10 rounded-lg transition-colors border border-border hover:bg-muted shrink-0"
            aria-label="Open menu"
          >
            <Menu size={20} className="text-foreground" />
          </button>
        )}
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground truncate leading-tight">
            {title}
          </h1>
          {location && !canSwitch && (
            <div className="mt-1 flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
              <MapPin size={14} className="text-primary shrink-0" strokeWidth={2.25} />
              <span className="truncate">{location}</span>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:block text-sm text-muted-foreground whitespace-nowrap first-letter:uppercase">
          {today}
        </div>

        {canSwitch && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-label="Vestiging wisselen"
                className="flex items-center gap-2 min-h-[44px] px-4 rounded-polar bg-primary/10 border border-primary/20 text-primary font-semibold text-base transition-colors hover:bg-primary/15"
              >
                <MapPin size={20} strokeWidth={2.25} className="shrink-0" />
                <span className="truncate max-w-[9rem]">{location}</span>
                <ChevronDown size={18} strokeWidth={2.25} className="shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[220px] p-1">
              {locationOptions!.map(opt => (
                <DropdownMenuItem
                  key={opt.value}
                  onSelect={() => onLocationChange!(opt.value)}
                  className="min-h-[48px] text-base font-medium gap-2 px-3"
                >
                  <Check
                    size={18}
                    className={opt.value === activeLocationValue ? 'text-primary' : 'opacity-0'}
                  />
                  {opt.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}

