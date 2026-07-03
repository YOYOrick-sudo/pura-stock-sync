import { useRef, useState } from 'react';
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover';
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Loader2, Package, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStickerSuggesties, type StickerProduct } from '@/hooks/useStickerProducten';

interface Props {
  value: string;
  onChange: (naam: string) => void;
  onPickSuggestion: (p: StickerProduct) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function StickerProductCombobox({
  value,
  onChange,
  onPickSuggestion,
  placeholder,
  autoFocus,
}: Props) {
  const [open, setOpen] = useState(false);
  const term = value.trim();
  const { data: suggestions = [], isFetching } = useStickerSuggesties(term);
  const headingLabel = term.length === 0 ? 'Meest gebruikt' : 'Voorstellen';



  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverAnchor asChild>
        <div className="relative">
          <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            ref={inputRef}
            autoFocus={autoFocus}
            type="text"
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onClick={() => setOpen(true)}
            onBlur={(e) => {
              // Alleen sluiten als focus buiten popover gaat
              const next = e.relatedTarget as HTMLElement | null;
              if (!next || !next.closest('[data-radix-popper-content-wrapper]')) {
                setOpen(false);
              }
            }}
            placeholder={placeholder ?? 'Product…'}
            className={cn(
              'flex w-full h-11 pl-10 pr-3 rounded-md border border-input bg-background text-sm',
              'ring-offset-background placeholder:text-muted-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50 transition-colors',
            )}
          />
        </div>
      </PopoverAnchor>
      <PopoverContent
        className="p-0 w-[var(--radix-popover-trigger-width)] min-w-[280px]"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
        onInteractOutside={(e) => {
          if (e.target instanceof Node && inputRef.current?.contains(e.target)) {
            e.preventDefault();
          }
        }}
      >
        <Command shouldFilter={false}>
          <CommandInput placeholder="Filter…" value={term} onValueChange={onChange} className="hidden" />
          <CommandList>
            {isFetching && suggestions.length === 0 && (
              <div className="py-4 flex items-center justify-center text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}
            {suggestions.length > 0 && (
              <CommandGroup heading={headingLabel}>
                {suggestions.map((s) => (
                  <CommandItem
                    key={s.id}
                    value={s.id}
                    onSelect={() => {
                      onPickSuggestion(s);
                      setOpen(false);
                    }}
                    className="min-h-[48px] cursor-pointer flex items-center justify-between gap-2"
                  >
                    <span className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary/70" />
                      <span className="font-medium">{s.naam}</span>
                    </span>
                    <span className="text-xs text-muted-foreground">{s.keer_geprint}×</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {!isFetching && suggestions.length === 0 && term.length >= 1 && (
              <div className="py-4 px-3 text-xs text-muted-foreground text-center">
                Nieuw product — wordt onthouden bij printen.
              </div>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
