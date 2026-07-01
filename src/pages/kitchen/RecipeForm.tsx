import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { KitchenLayout } from '@/components/kitchen/KitchenLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, ArrowUp, ArrowDown, Save } from 'lucide-react';
import {
  Ingredient,
  useCreateRecipe,
  useRecipe,
  useUpdateRecipe,
} from '@/hooks/useRecipes';
import { toast } from 'sonner';

type RecipeType = 'gerecht' | 'halffabricaat';

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
    { naam: '', hoeveelheid: '', sort_order: 0 },
  ]);

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
          : [{ naam: '', hoeveelheid: '', sort_order: 0 }],
      );
    }
  }, [isEdit, existing]);

  const addRow = () =>
    setIngredients((prev) => [...prev, { naam: '', hoeveelheid: '', sort_order: prev.length }]);

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

  const updateRow = (idx: number, field: 'naam' | 'hoeveelheid', value: string) =>
    setIngredients((prev) => prev.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));

  const onSave = async () => {
    if (!name.trim()) {
      toast.error('Naam is verplicht');
      return;
    }
    const cleanIngredients = ingredients.filter((i) => i.naam.trim().length > 0);
    const payload = {
      name: name.trim(),
      category: category.trim(),
      type,
      porties: porties.trim() ? parseInt(porties, 10) : null,
      bereiding: bereiding,
      ingredients: cleanIngredients,
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
    <KitchenLayout
      title={isEdit ? 'Recept bewerken' : 'Nieuw recept'}
      backTo={isEdit && id ? `/kitchen/recipes/${id}` : '/kitchen/recipes'}
      backLabel={isEdit ? 'Recept' : 'Recepten'}
    >
      <div className="space-y-6">
        <Card className="p-6 bg-white shadow-sm space-y-5">
          <div>
            <Label className="text-base">Naam *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Bijv. Bananenbrood"
              className="mt-2 h-12 text-base"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-base">Categorie</Label>
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Bijv. Saus, Voorgerecht, Bakwerk"
                className="mt-2 h-12 text-base"
              />
            </div>
            <div>
              <Label className="text-base">Porties</Label>
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                value={porties}
                onChange={(e) => setPorties(e.target.value)}
                placeholder="Bijv. 4"
                className="mt-2 h-12 text-base"
              />
            </div>
          </div>

          <div>
            <Label className="text-base mb-2 block">Type</Label>
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
        <Card className="p-6 bg-white shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading font-bold text-xl text-foreground">Ingrediënten</h2>
            <Button onClick={addRow} variant="outline" size="sm" className="min-h-[44px]">
              <Plus className="h-4 w-4 mr-1" /> Rij toevoegen
            </Button>
          </div>

          <div className="space-y-2">
            {ingredients.map((row, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <Input
                  value={row.naam}
                  onChange={(e) => updateRow(idx, 'naam', e.target.value)}
                  placeholder="Ingrediënt"
                  className="h-12 text-base flex-1"
                />
                <Input
                  value={row.hoeveelheid}
                  onChange={(e) => updateRow(idx, 'hoeveelheid', e.target.value)}
                  placeholder="Hoeveelheid"
                  className="h-12 text-base w-40 sm:w-56"
                />
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
        <Card className="p-6 bg-white shadow-sm">
          <Label className="text-base mb-2 block">Bereiding</Label>
          <Textarea
            value={bereiding}
            onChange={(e) => setBereiding(e.target.value)}
            placeholder={'Beschrijf de bereidingsstappen…\n\nBijv.\n1. Verwarm oven op 180°C\n2. Meng droge ingrediënten\n3. …'}
            rows={12}
            className="text-base leading-relaxed"
          />
        </Card>

        <div className="flex flex-col sm:flex-row justify-end gap-3 sticky bottom-4">
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate(isEdit && id ? `/kitchen/recipes/${id}` : '/kitchen/recipes')}
            disabled={busy}
            className="min-h-[48px]"
          >
            Annuleren
          </Button>
          <Button size="lg" onClick={onSave} disabled={busy} className="min-h-[48px]">
            <Save className="h-5 w-5 mr-2" />
            {busy ? 'Opslaan…' : 'Opslaan'}
          </Button>
        </div>
      </div>
    </KitchenLayout>
  );
}
