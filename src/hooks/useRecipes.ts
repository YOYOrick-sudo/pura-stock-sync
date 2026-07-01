import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Ingredient {
  id?: string;
  naam: string;
  hoeveelheid: string;
  eenheid?: string | null;
  sort_order: number;
}

export interface Recipe {
  id: string;
  name: string;
  category: string;
  type: 'gerecht' | 'halffabricaat';
  porties: number | null;
  bereiding: string | null;
  foto_url: string | null;
  description: string | null;
  is_gearchiveerd: boolean;
  location: string | null;
  created_at: string;
  updated_at: string;
  ingredient_count?: number;
}

export interface RecipeInput {
  name: string;
  category: string;
  type: 'gerecht' | 'halffabricaat';
  porties: number | null;
  bereiding: string;
  foto_url?: string | null;
}

export function useRecipes(search: string, category: string | null) {
  return useQuery({
    queryKey: ['recipes', 'list', search, category],
    queryFn: async () => {
      let query = supabase
        .from('recipes')
        .select('*, recept_ingredienten(id)')
        .eq('is_gearchiveerd', false)
        .order('name', { ascending: true });

      if (search.trim()) query = query.ilike('name', `%${search.trim()}%`);
      if (category) query = query.eq('category', category);

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map((r: any) => ({
        ...r,
        ingredient_count: Array.isArray(r.recept_ingredienten) ? r.recept_ingredienten.length : 0,
      })) as Recipe[];
    },
  });
}

export function useRecipeCategories() {
  return useQuery({
    queryKey: ['recipes', 'categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recipes')
        .select('category')
        .eq('is_gearchiveerd', false);
      if (error) throw error;
      const set = new Set<string>();
      (data ?? []).forEach((r: any) => r.category && set.add(r.category));
      return Array.from(set).sort();
    },
  });
}

export function useRecipe(id: string | undefined) {
  return useQuery({
    queryKey: ['recipes', 'detail', id],
    enabled: !!id,
    queryFn: async () => {
      const { data: recipe, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', id!)
        .maybeSingle();
      if (error) throw error;
      if (!recipe) return null;

      const { data: ingredients, error: iErr } = await supabase
        .from('recept_ingredienten')
        .select('*')
        .eq('recept_id', id!)
        .order('sort_order', { ascending: true });
      if (iErr) throw iErr;

      return { recipe: recipe as Recipe, ingredients: (ingredients ?? []) as Ingredient[] };
    },
  });
}

async function replaceIngredients(recipeId: string, ingredients: Ingredient[]) {
  const { error: delErr } = await supabase
    .from('recept_ingredienten')
    .delete()
    .eq('recept_id', recipeId);
  if (delErr) throw new Error('Ingrediënten opslaan mislukt (delete): ' + delErr.message);

  const clean = ingredients
    .map((i, idx) => ({
      recept_id: recipeId,
      naam: i.naam.trim(),
      hoeveelheid: (i.hoeveelheid ?? '').trim() || null,
      eenheid: (i.eenheid ?? '')?.toString().trim() || null,
      sort_order: idx,
    }))
    .filter((i) => i.naam.length > 0);

  if (clean.length === 0) return;
  const { error: insErr } = await supabase.from('recept_ingredienten').insert(clean);
  if (insErr) throw new Error('Ingrediënten opslaan mislukt (insert): ' + insErr.message);
}

export function useCreateRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: RecipeInput & { ingredients: Ingredient[] }) => {
      const { ingredients, ...rest } = input;
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) throw new Error('Niet ingelogd');

      const { data, error } = await supabase
        .from('recipes')
        .insert({
          name: rest.name,
          category: rest.category,
          type: rest.type,
          porties: rest.porties,
          bereiding: rest.bereiding,
          foto_url: rest.foto_url ?? null,
          created_by: uid,
        })
        .select('id')
        .single();
      if (error) throw error;

      await replaceIngredients(data.id, ingredients);
      return data.id as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recipes'] });
    },
  });
}

export function useUpdateRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: RecipeInput & { id: string; ingredients: Ingredient[] }) => {
      const { id, ingredients, ...rest } = input;
      const { data: updated, error } = await supabase
        .from('recipes')
        .update({
          name: rest.name,
          category: rest.category,
          type: rest.type,
          porties: rest.porties,
          bereiding: rest.bereiding,
          foto_url: rest.foto_url ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('id');
      if (error) throw error;
      if (!updated || updated.length === 0) {
        throw new Error('Geen rechten om dit recept te wijzigen (alleen de maker kan aanpassen).');
      }

      await replaceIngredients(id, ingredients);
      return id;
    },
    onSuccess: (id) => {
      qc.invalidateQueries({ queryKey: ['recipes'] });
      qc.invalidateQueries({ queryKey: ['recipes', 'detail', id] });
    },
  });
}
