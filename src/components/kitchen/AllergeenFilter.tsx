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
  aantal?: number;
}

export function AllergeenFilter({ zonder, onToggle, alleenVegan, onToggleVegan, onWissen, aantal }: Props) {
  const actief = zonder.length > 0 || alleenVegan;

  return (
    <div className="mt-4 border-t pt-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Moet vrij zijn van
        </p>
        {actief && (
          <div className="flex items-center gap-3">
            {aantal !== undefined && (
              <span className="text-xs font-medium text-foreground" aria-live="polite">
                {aantal} {aantal === 1 ? 'gerecht' : 'gerechten'}
              </span>
            )}
            <button
              onClick={onWissen}
              className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground min-h-[32px] px-2"
            >
              <X className="h-3.5 w-3.5" />
              Wis filter
            </button>
          </div>
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
                'inline-flex items-center justify-center whitespace-nowrap min-h-[44px] rounded-full text-sm font-medium border transition-colors',
                aan
                  ? 'bg-destructive/10 text-destructive border-destructive/40 pl-4 pr-3.5'
                  : 'bg-background text-muted-foreground border-border hover:bg-muted px-4',
              )}
            >
              {aan ? (
                <>
                  Zonder {GERECHT_LABEL_NAAM[code].toLowerCase()}
                  <X className="ml-1.5 h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden="true" />
                </>
              ) : (
                GERECHT_LABEL_NAAM[code]
              )}
            </button>
          );
        })}
        <button
          type="button"
          aria-pressed={alleenVegan}
          onClick={onToggleVegan}
          className={cn(
            'inline-flex items-center justify-center whitespace-nowrap min-h-[44px] rounded-full text-sm font-medium border transition-colors',
            alleenVegan
              ? 'bg-primary/10 text-primary border-primary/40 pl-4 pr-3.5'
              : 'bg-background text-muted-foreground border-border hover:bg-muted px-4',
          )}
        >
          {alleenVegan ? (
            <>
              Moet vegan zijn
              <X className="ml-1.5 h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden="true" />
            </>
          ) : (
            'Vegan'
          )}
        </button>
      </div>
    </div>
  );
}
