import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  GERECHT_LABEL_CODES,
  GERECHT_LABEL_NAAM,
  type GerechtLabel,
} from '@/lib/gerecht-labels';

const FILTER_CODES = GERECHT_LABEL_CODES.filter((c) => c !== 'vegan');

interface Props {
  zonder: GerechtLabel[];
  onToggle: (code: GerechtLabel) => void;
  alleenVegan: boolean;
  onToggleVegan: () => void;
  onWissen: () => void;
}

export function AllergeenFilter({ zonder, onToggle, alleenVegan, onToggleVegan, onWissen }: Props) {
  const actief = zonder.length > 0 || alleenVegan;

  return (
    <div className="mt-4 border-t pt-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Moet vrij zijn van
        </p>
        {actief && (
          <button
            onClick={onWissen}
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground min-h-[32px] px-2"
          >
            <X className="h-3.5 w-3.5" />
            Wis filter
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mt-3">
        {FILTER_CODES.map((code) => {
          const aan = zonder.includes(code);
          return (
            <button
              key={code}
              type="button"
              aria-pressed={aan}
              onClick={() => onToggle(code)}
              className={cn(
                'min-h-[44px] px-4 rounded-full text-sm font-medium border transition-colors',
                aan
                  ? 'bg-destructive/10 text-destructive border-destructive/30'
                  : 'bg-background text-muted-foreground border-border hover:bg-muted',
              )}
            >
              {aan ? `Zonder ${GERECHT_LABEL_NAAM[code].toLowerCase()}` : GERECHT_LABEL_NAAM[code]}
            </button>
          );
        })}
        <button
          type="button"
          aria-pressed={alleenVegan}
          onClick={onToggleVegan}
          className={cn(
            'min-h-[44px] px-4 rounded-full text-sm font-medium border transition-colors',
            alleenVegan
              ? 'bg-primary/10 text-primary border-primary/30'
              : 'bg-background text-muted-foreground border-border hover:bg-muted',
          )}
        >
          {alleenVegan ? 'Moet vegan zijn' : 'Vegan'}
        </button>
      </div>
    </div>
  );
}
