import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

type Mode = 'auto' | 'light' | 'dark';

const SEGMENTS: { mode: Mode; icon: typeof Monitor; label: string; tooltip: string }[] = [
  { mode: 'auto', icon: Monitor, label: 'Auto', tooltip: 'Automatisch volgen' },
  { mode: 'light', icon: Sun, label: 'Licht', tooltip: 'Lichte modus' },
  { mode: 'dark', icon: Moon, label: 'Donker', tooltip: 'Donkere modus' },
];

interface ThemeToggleProps {
  compact?: boolean;
}

export function ThemeToggle({ compact = false }: ThemeToggleProps = {}) {
  const { mode, setMode } = useTheme();

  return (
    <TooltipProvider delayDuration={250}>
      <div
        role="radiogroup"
        aria-label="Thema"
        className="inline-flex items-center gap-0.5 rounded-full border border-border/60 bg-muted/60 p-0.5"
      >
        {SEGMENTS.map(({ mode: m, icon: Icon, label, tooltip }) => {
          const active = mode === m;
          return (
            <Tooltip key={m}>
              <TooltipTrigger asChild>
                <button
                  role="radio"
                  aria-checked={active}
                  aria-label={tooltip}
                  onClick={() => setMode(m)}
                  className={cn(
                    'flex items-center justify-center rounded-full transition-all duration-150',
                    compact ? 'h-7 w-7' : 'h-7 px-2 gap-1.5',
                    active
                      ? 'bg-card text-foreground shadow-sm ring-1 ring-border/50'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon size={14} strokeWidth={2} />
                  {!compact && active && (
                    <span className="text-[12px] font-medium leading-none pr-0.5">
                      {label}
                    </span>
                  )}
                </button>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                className="bg-card text-foreground border border-border rounded-md px-2.5 py-1.5 text-xs shadow-md"
              >
                {tooltip}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
