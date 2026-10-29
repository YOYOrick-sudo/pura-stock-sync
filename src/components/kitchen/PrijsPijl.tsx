import { useState } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { pijlRichting, prijsTooltip, type PrijsSignaal } from '@/lib/prijsSignaal';

/** Klein, rustig prijsicoon: alleen zichtbaar als de prijs duidelijk afwijkt van normaal. */
export function PrijsPijl({ signaal, eenheid }: { signaal: PrijsSignaal | null; eenheid?: string | null }) {
  const [open, setOpen] = useState(false);
  const richting = pijlRichting(signaal);
  if (!signaal || !richting) return null;
  const tekst = prijsTooltip(signaal);
  const inhoud = (
    <span className="block text-sm">
      {tekst}
      <span className="block text-xs text-muted-foreground">per {eenheid || 'besteleenheid'}, excl. btw</span>
    </span>
  );
  const Icoon = richting === 'omlaag' ? ArrowDown : ArrowUp;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <PopoverTrigger asChild>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={(e) => e.stopPropagation()}
              aria-label={`Prijs ${richting === 'omlaag' ? 'gedaald' : 'gestegen'}: ${tekst}`}
              className="-m-2 inline-flex items-center justify-center p-2"
            >
              <Icoon className={richting === 'omlaag' ? 'h-3.5 w-3.5 text-primary' : 'h-3.5 w-3.5 text-destructive'} />
            </button>
          </TooltipTrigger>
        </PopoverTrigger>
        {!open && <TooltipContent>{inhoud}</TooltipContent>}
      </Tooltip>
      <PopoverContent className="w-auto">{inhoud}</PopoverContent>
    </Popover>
  );
}
