import { useState } from 'react';
import { Check, ChevronsUpDown, Plus, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { ensureIngredientMaster, useIngredientSuggestions } from '@/hooks/useIngredienten';
import { toast } from 'sonner';

interface Props {
  value: string;
  ingredientId?: string | null;
  onChange: (naam: string, ingredientId: string | null) => void;
  /** Wordt aangeroepen zodra een nieuw ingrediënt is aangemaakt (voor automatische allergenen-suggestie). */
  onCreated?: (id: string, naam: string) => void;
  placeholder?: string;
  className?: string;
}


/**
 * Combobox voor ingrediëntnaam met live suggesties uit ingredienten_master.
 * - Bij typen ≥2 chars: suggesties tonen.
 * - Suggestie kiezen → ingredient_id + naam gezet.
 * - "➕ toevoegen als nieuw" → insert in master (case-safe via ensureIngredientMaster).
 * - Vrij typen zonder kiezen mag: alleen naam, geen ingredient_id.
 */
export function IngredientCombobox({ value, ingredientId, onChange, onCreated, placeholder, className }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);

  const term = query.trim();
  const { data: suggestions = [], isFetching } = useIngredientSuggestions(term);

  const exactMatch = suggestions.find((s) => s.naam.toLowerCase() === term.toLowerCase());
  const showCreate = term.length >= 2 && !exactMatch;

  const handleSelect = (naam: string, id: string) => {
    onChange(naam, id);
    setOpen(false);
    setQuery('');
  };

  const handleCreate = async () => {
    if (!term) return;
    setCreating(true);
    try {
      const created = await ensureIngredientMaster(term);
      onChange(created.naam, created.id);
      setOpen(false);
      setQuery('');
    } catch (e: any) {
      toast.error('Toevoegen mislukt: ' + (e.message ?? 'onbekende fout'));
    } finally {
      setCreating(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'flex h-11 w-full items-center justify-between rounded-polar-lg border-1.5 border-input bg-background px-3 py-2 text-sm text-left focus-visible:outline-none focus-visible:border-primary transition-colors',
            !value && 'text-muted-foreground',
            className,
          )}
        >
          <span className="truncate">{value || placeholder || 'Ingrediënt'}</span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50 ml-2" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[var(--radix-popover-trigger-width)] min-w-[240px]" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Zoek of typ nieuwe naam…"
            value={query}
            onValueChange={setQuery}
            autoFocus
          />
          <CommandList>
            {term.length < 2 && (
              <div className="py-6 px-4 text-xs text-muted-foreground text-center">
                Typ minstens 2 letters om te zoeken.
              </div>
            )}
            {term.length >= 2 && isFetching && suggestions.length === 0 && (
              <div className="py-4 flex items-center justify-center text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}
            {suggestions.length > 0 && (
              <CommandGroup heading="Bestaande ingrediënten">
                {suggestions.map((s) => (
                  <CommandItem
                    key={s.id}
                    value={s.id}
                    onSelect={() => handleSelect(s.naam, s.id)}
                    className="min-h-[44px] cursor-pointer"
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        ingredientId === s.id ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    {s.naam}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {showCreate && (
              <CommandGroup heading="Nieuw">
                <CommandItem
                  value={`__new__${term}`}
                  onSelect={handleCreate}
                  disabled={creating}
                  className="min-h-[44px] cursor-pointer text-primary"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  "{term}" toevoegen als nieuw ingrediënt
                </CommandItem>
              </CommandGroup>
            )}
            {term.length >= 2 && !isFetching && suggestions.length === 0 && !showCreate && (
              <CommandEmpty>Geen resultaten.</CommandEmpty>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
