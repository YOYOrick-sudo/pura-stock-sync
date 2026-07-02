import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarLayout } from '@/components/SidebarLayout';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Pencil, Check, X, ArrowUpDown, ChefHat, Search, Merge, Info } from 'lucide-react';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  useIngredientenStats,
  useRenameIngredient,
  useRecipesForIngredient,
  type IngredientStat,
} from '@/hooks/useIngredienten';
import { MergeIngredientenDialog } from '@/components/kitchen/MergeIngredientenDialog';
import { cn } from '@/lib/utils';

type SortKey = 'naam' | 'aantal';

function RecipesPopover({ ingredient }: { ingredient: IngredientStat }) {
  const [open, setOpen] = useState(false);
  const { data: recipes = [], isFetching } = useRecipesForIngredient(open ? ingredient.id : null);
  const navigate = useNavigate();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={ingredient.aantal_recepten === 0}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium min-h-[32px]',
            ingredient.aantal_recepten > 0
              ? 'bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer'
              : 'bg-muted text-muted-foreground cursor-default',
          )}
        >
          <ChefHat className="h-3.5 w-3.5" />
          {ingredient.aantal_recepten}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2" align="start">
        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
          Recepten met {ingredient.naam}
        </div>
        {isFetching && (
          <div className="px-2 py-4 text-xs text-muted-foreground text-center">Laden…</div>
        )}
        {!isFetching && recipes.length === 0 && (
          <div className="px-2 py-4 text-xs text-muted-foreground text-center">Geen recepten.</div>
        )}
        <div className="max-h-72 overflow-y-auto">
          {recipes.map((r) => (
            <button
              key={r.id}
              onClick={() => navigate(`/kitchen/recipes/${r.id}`)}
              className="w-full text-left px-2 py-2 rounded-md hover:bg-muted text-sm min-h-[40px]"
            >
              {r.name}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function IngredientRow({
  ing,
  selected,
  onToggleSelect,
}: {
  ing: IngredientStat;
  selected: boolean;
  onToggleSelect: (checked: boolean) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(ing.naam);
  const rename = useRenameIngredient();

  const startEdit = () => {
    setDraft(ing.naam);
    setEditing(true);
  };
  const cancel = () => setEditing(false);
  const save = async () => {
    if (draft.trim() === ing.naam) {
      setEditing(false);
      return;
    }
    try {
      await rename.mutateAsync({ id: ing.id, naam: draft });
      toast.success('Hernoemd');
      setEditing(false);
    } catch (e: any) {
      toast.error(e.message ?? 'Hernoemen mislukt');
    }
  };

  return (
    <TableRow className="h-[52px]">
      <TableCell className="w-10">
        <Checkbox checked={selected} onCheckedChange={(v) => onToggleSelect(Boolean(v))} />
      </TableCell>
      <TableCell className="font-medium">
        {editing ? (
          <div className="flex items-center gap-2">
            <Input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') save();
                if (e.key === 'Escape') cancel();
              }}
              className="h-9"
            />
            <button
              onClick={save}
              disabled={rename.isPending}
              className="h-9 w-9 rounded-md hover:bg-primary/10 flex items-center justify-center text-primary"
              aria-label="Opslaan"
            >
              <Check className="h-4 w-4" />
            </button>
            <button
              onClick={cancel}
              className="h-9 w-9 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground"
              aria-label="Annuleren"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <span>{ing.naam}</span>
        )}
      </TableCell>
      <TableCell>
        <RecipesPopover ingredient={ing} />
      </TableCell>
      <TableCell className="text-sm text-muted-foreground">
        {ing.laatst_gebruikt
          ? format(new Date(ing.laatst_gebruikt), 'd MMM yyyy', { locale: nl })
          : '—'}
      </TableCell>
      <TableCell className="text-right">
        {!editing && (
          <button
            onClick={startEdit}
            className="h-10 w-10 rounded-md hover:bg-muted inline-flex items-center justify-center text-muted-foreground"
            aria-label="Hernoemen"
          >
            <Pencil className="h-4 w-4" />
          </button>
        )}
      </TableCell>
    </TableRow>
  );
}

export default function Ingredienten() {
  const { data: rows = [], isLoading } = useIngredientenStats();
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('naam');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [mergeOpen, setMergeOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = q ? rows.filter((r) => r.naam.toLowerCase().includes(q)) : rows;
    const sorted = [...base].sort((a, b) => {
      if (sortKey === 'naam') return a.naam.localeCompare(b.naam, 'nl');
      return (a.aantal_recepten ?? 0) - (b.aantal_recepten ?? 0);
    });
    return sortDir === 'asc' ? sorted : sorted.reverse();
  }, [rows, search, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const toggleSelect = (id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const selected = rows.filter((r) => selectedIds.has(r.id));
  const canMerge = selected.length >= 2;

  return (
    <SidebarLayout>
      <div className="max-w-5xl mx-auto space-y-4">


        <Card className="p-4 sm:p-5 bg-card shadow-sm">
          <div className="flex items-center gap-3 flex-wrap mb-4">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Zoek ingrediënt…"
                className="h-11 pl-10"
              />
            </div>
            {canMerge && (
              <Button onClick={() => setMergeOpen(true)} className="min-h-[44px]">
                <Merge className="h-4 w-4 mr-2" />
                Samenvoegen ({selected.length})
              </Button>
            )}
            {selectedIds.size > 0 && !canMerge && (
              <span className="text-xs text-muted-foreground">
                Selecteer nog een ingrediënt om samen te voegen.
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground text-sm">Laden…</div>
          ) : rows.length === 0 ? (
            <div className="py-12 text-center">
              <ChefHat className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-medium text-foreground">Nog geen ingrediënten</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                De lijst groeit vanzelf zodra je ingrediënten toevoegt aan een recept.
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Geen ingrediënten gevonden voor "{search}".
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>
                      <button
                        onClick={() => toggleSort('naam')}
                        className="inline-flex items-center gap-1 font-medium hover:text-foreground"
                      >
                        Naam
                        <ArrowUpDown className="h-3 w-3 opacity-60" />
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        onClick={() => toggleSort('aantal')}
                        className="inline-flex items-center gap-1 font-medium hover:text-foreground"
                      >
                        In recepten
                        <ArrowUpDown className="h-3 w-3 opacity-60" />
                      </button>
                    </TableHead>
                    <TableHead>Laatst gebruikt</TableHead>
                    <TableHead className="text-right">Acties</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((ing) => (
                    <IngredientRow
                      key={ing.id}
                      ing={ing}
                      selected={selectedIds.has(ing.id)}
                      onToggleSelect={(v) => toggleSelect(ing.id, v)}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>

      <MergeIngredientenDialog
        open={mergeOpen}
        onOpenChange={setMergeOpen}
        selected={selected}
        onDone={() => setSelectedIds(new Set())}
      />
    </SidebarLayout>
  );
}
