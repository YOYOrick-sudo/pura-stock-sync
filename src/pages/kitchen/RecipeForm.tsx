import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SidebarLayout } from '@/components/SidebarLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, ArrowUp, ArrowDown, Save } from 'lucide-react';
import {
  Ingredient,
  useCreateRecipe,
  useRecipe,
  useUpdateRecipe,
} from '@/hooks/useRecipes';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { IngredientCombobox } from '@/components/kitchen/IngredientCombobox';


type RecipeType = 'gerecht' | 'halffabricaat';

const EENHEDEN = ['g', 'kg', 'ml', 'l', 'stuks', 'el', 'tl', 'teentje', 'plak', 'blaadje'] as const;
const NO_UNIT = '__none__';

export default function RecipeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const { data: existing, isLoading } = useRecipe(id);
  const createMut = useCreateRecipe();
  const updateMut = useUpdateRecipe();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState<RecipeType>('gerecht');
  const [porties, setPorties] = useState<string>('');
  const [bereiding, setBereiding] = useState('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([
    { naam: '', hoeveelheid: '', eenheid: null, sort_order: 0, ingredient_id: null },
  ]);
  const [categoryTouched, setCategoryTouched] = useState(false);

  // Stil op de achtergrond: bij een nieuw recept een categorie voorstellen zodra er een naam is
  // en de gebruiker het veld niet zelf heeft aangeraakt. Geen UI-feedback, faalt stil.
  useEffect(() => {
    if (isEdit) return;
    if (categoryTouched) return;
    if (category.trim().length > 0) return;
    const n = name.trim();
    if (n.length < 3) return;

    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const { data: cats } = await supabase
          .from('recipes')
          .select('category')
          .eq('is_gearchiveerd', false);
        const existing = Array.from(
          new Set((cats ?? []).map((c: any) => c.category).filter((c: any) => c && c.trim().length > 0)),
        );
        const ingr = ingredients.map((i) => i.naam.trim()).filter((s) => s.length > 0);
        const { data, error } = await supabase.functions.invoke('suggest-recipe-category', {
          body: { name: n, ingredients: ingr, existingCategories: existing },
        });
        if (cancelled) return;
        if (!error && data?.category && !categoryTouched && category.trim().length === 0) {
          setCategory(String(data.category));
        }
      } catch {
        /* stil */
      }
    }, 900);

    return () => {
      cancelled = true;
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, isEdit, categoryTouched]);



  useEffect(() => {
    if (isEdit && existing?.recipe) {
      const r = existing.recipe;
      setName(r.name ?? '');
      setCategory(r.category ?? '');
      setType((r.type as RecipeType) ?? 'gerecht');
      setPorties(r.porties != null ? String(r.porties) : '');
      setBereiding(r.bereiding ?? '');
      setIngredients(
        existing.ingredients.length > 0
          ? existing.ingredients.map((i, idx) => ({ ...i, sort_order: idx }))
          : [{ naam: '', hoeveelheid: '', eenheid: null, sort_order: 0, ingredient_id: null }],
      );
    }
  }, [isEdit, existing]);

  const addRow = () =>
    setIngredients((prev) => [
      ...prev,
      { naam: '', hoeveelheid: '', eenheid: null, sort_order: prev.length, ingredient_id: null },
    ]);

  const removeRow = (idx: number) =>
    setIngredients((prev) => prev.filter((_, i) => i !== idx).map((r, i) => ({ ...r, sort_order: i })));

  const move = (idx: number, dir: -1 | 1) => {
    setIngredients((prev) => {
      const next = [...prev];
      const j = idx + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[idx], next[j]] = [next[j], next[idx]];
      return next.map((r, i) => ({ ...r, sort_order: i }));
    });
  };

  const updateRow = (idx: number, field: 'naam' | 'hoeveelheid' | 'eenheid', value: string | null) =>
    setIngredients((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));

  const setNaamAndMaster = (idx: number, naam: string, ingredient_id: string | null) =>
    setIngredients((prev) => prev.map((r, i) => (i === idx ? { ...r, naam, ingredient_id } : r)));

  const onSave = async () => {
    if (!name.trim()) {
      toast.error('Naam is verplicht');
      return;
    }

    // Detecteer rijen zonder naam maar mét hoeveelheid/eenheid → foutmelding i.p.v. stille drop.
    const incomplete = ingredients.find(
      (i) =>
        i.naam.trim().length === 0 &&
        ((i.hoeveelheid ?? '').trim().length > 0 || (i.eenheid ?? '').toString().trim().length > 0),
    );
    if (incomplete) {
      toast.error('Er staat een rij zonder naam. Vul een naam in of verwijder de rij.');
      return;
    }

    const payload = {
      name: name.trim(),
      category: category.trim(),
      type,
      porties: porties.trim() ? parseInt(porties, 10) : null,
      bereiding,
      ingredients,
    };

    try {
      if (isEdit && id) {
        await updateMut.mutateAsync({ id, ...payload });
        toast.success('Recept opgeslagen');
        navigate(`/kitchen/recipes/${id}`);
      } else {
        const newId = await createMut.mutateAsync(payload);
        toast.success('Recept toegevoegd');
        navigate(`/kitchen/recipes/${newId}`);
      }
    } catch (e: any) {
      toast.error('Opslaan mislukt: ' + (e.message ?? 'onbekende fout'));
    }
  };

  const busy = createMut.isPending || updateMut.isPending || (isEdit && isLoading);

  return (
    <SidebarLayout>
      <div className="space-y-4 max-w-4xl">
        <Card className="p-5 sm:p-6 bg-white shadow-sm space-y-5">
          <div>
            <Label className="text-sm font-medium">Naam *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Bijv. Bananenbrood"
              className="mt-2 h-11"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Categorie</Label>
              <Input
                value={category}
                onChange={(e) => {
                  setCategoryTouched(true);
                  setCategory(e.target.value);
                }}
                placeholder="Bijv. Groente, Sauzen, Hoofdgerecht"
                className="mt-2 h-11"
              />
            </div>
            <div>
              <Label className="text-sm font-medium">Porties</Label>
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                value={porties}
                onChange={(e) => setPorties(e.target.value)}
                placeholder="Bijv. 4"
                className="mt-2 h-11"
              />
            </div>
          </div>

          <div>
            <Label className="text-sm font-medium mb-2 block">Type</Label>
            <div className="inline-flex rounded-polar-lg bg-muted p-1">
              {(['gerecht', 'halffabricaat'] as RecipeType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`px-5 py-2.5 rounded-polar-md text-sm font-medium min-h-[44px] transition-colors ${
                    type === t ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {t === 'gerecht' ? 'Gerecht' : 'Halffabricaat'}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Ingredienten */}
        <Card className="p-5 sm:p-6 bg-white shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
              Ingrediënten
            </h2>
            <Button onClick={addRow} variant="outline" size="sm" className="min-h-[40px]">
              <Plus className="h-4 w-4 mr-1" /> Rij toevoegen
            </Button>
          </div>

          <div className="space-y-3">
            {ingredients.map((row, idx) => (
              <div
                key={idx}
                className="flex flex-wrap items-center gap-2 rounded-polar-md border border-border/60 bg-background/40 p-2"
              >
                <div className="flex-1 min-w-[160px]">
                  <IngredientCombobox
                    value={row.naam}
                    ingredientId={row.ingredient_id ?? null}
                    onChange={(naam, id) => setNaamAndMaster(idx, naam, id)}
                    placeholder="Ingrediënt"
                  />
                </div>
                <Input
                  value={row.hoeveelheid}
                  onChange={(e) => updateRow(idx, 'hoeveelheid', e.target.value)}
                  placeholder="Hoeveelheid"
                  className="h-11 w-24"
                />
                <Select
                  value={row.eenheid && row.eenheid.length > 0 ? row.eenheid : NO_UNIT}
                  onValueChange={(v) => updateRow(idx, 'eenheid', v === NO_UNIT ? null : v)}
                >
                  <SelectTrigger className="h-11 w-32">
                    <SelectValue placeholder="Eenheid" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_UNIT}>—</SelectItem>
                    {EENHEDEN.map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex flex-col gap-0.5">
                  <button
                    type="button"
                    onClick={() => move(idx, -1)}
                    className="h-6 w-8 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground disabled:opacity-30"
                    disabled={idx === 0}
                    aria-label="Omhoog"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(idx, 1)}
                    className="h-6 w-8 rounded-md hover:bg-muted flex items-center justify-center text-muted-foreground disabled:opacity-30"
                    disabled={idx === ingredients.length - 1}
                    aria-label="Omlaag"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => removeRow(idx)}
                  className="h-11 w-11 rounded-md hover:bg-destructive/10 flex items-center justify-center text-destructive"
                  aria-label="Verwijderen"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ))}
          </div>
        </Card>

        {/* Bereiding */}
        <Card className="p-5 sm:p-6 bg-white shadow-sm">
          <Label className="text-sm font-medium uppercase tracking-wide text-muted-foreground mb-3 block">
            Bereiding
          </Label>
          <Textarea
            value={bereiding}
            onChange={(e) => setBereiding(e.target.value)}
            placeholder={'Beschrijf de bereidingsstappen…\n\nBijv.\n1. Verwarm oven op 180°C\n2. Meng droge ingrediënten\n3. …'}
            rows={12}
            className="text-[15px] leading-relaxed"
          />
        </Card>

        <div className="flex flex-col sm:flex-row justify-end gap-3 sticky bottom-4">
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate(isEdit && id ? `/kitchen/recipes/${id}` : '/kitchen/recipes')}
            disabled={busy}
            className="min-h-[44px]"
          >
            Annuleren
          </Button>
          <Button size="lg" onClick={onSave} disabled={busy} className="min-h-[44px]">
            <Save className="h-4 w-4 mr-2" />
            {busy ? 'Opslaan…' : 'Opslaan'}
          </Button>
        </div>
      </div>
    </SidebarLayout>
  );
}
