import { AlertTriangle } from 'lucide-react';
import { ALLERGEEN_LABEL, isAllergeen, type AllergeenCode } from '@/lib/allergenen';
import { cn } from '@/lib/utils';

interface Props {
  allergenen: string[];
  sporen?: string[];
  onbekend?: number;
  size?: 'sm' | 'md';
  className?: string;
}

export function AllergenenBadges({ allergenen, sporen = [], onbekend = 0, size = 'md', className }: Props) {
  const codes = allergenen.filter(isAllergeen) as AllergeenCode[];
  const sporenCodes = (sporen.filter(isAllergeen) as AllergeenCode[]).filter((c) => !codes.includes(c));

  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {codes.length === 0 && onbekend === 0 && (
        <span className="text-sm text-muted-foreground">Geen van de 14 allergenen</span>
      )}
      {codes.map((c) => (
        <span
          key={c}
          className={cn(
            'inline-flex items-center rounded-full bg-destructive/10 text-destructive font-medium',
            size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
          )}
        >
          {ALLERGEEN_LABEL[c]}
        </span>
      ))}
      {sporenCodes.map((c) => (
        <span
          key={`sp-${c}`}
          className={cn(
            'inline-flex items-center rounded-full bg-muted text-muted-foreground font-medium',
            size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
          )}
          title="Kan sporen bevatten"
        >
          {ALLERGEEN_LABEL[c]} (sporen)
        </span>
      ))}
      {onbekend > 0 && (
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full bg-warning/15 text-warning font-medium',
            size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
          )}
        >
          <AlertTriangle className="h-3 w-3" />
          {onbekend} ingrediënt{onbekend === 1 ? '' : 'en'} niet gecontroleerd
        </span>
      )}
    </div>
  );
}
