import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { allesOphalen } from '@/lib/pagineer';

export interface Ingredient {
  id?: string;
  naam: string;
  hoeveelheid: string;
  eenheid?: string | null;
  sort_order: number;
  ingredient_id?: string | null;
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
  arbeid_minuten: number | null;
  tht_dagen: number;
  created_at: string;
  updated_at: string;
  ingredient_count?: number;
  ingredient_namen?: string[];
}

export interface RecipeInput {
  name: string;
  category: string;
  type: 'gerecht' | 'halffabricaat';
  porties: number | null;
  bereiding: string;
  foto_url?: string | null;
  arbeid_minuten?: number | null;
  tht_dagen?: number | null;
}

export function useRecipes(search: string, category: string | null) {
  return useQuery({
    queryKey: ['recipes', 'list', search, category],
    queryFn: async () => {
      const data = await allesOphalen(async (van, tot) => {
        let query = supabase
          .from('recipes')
          .select('*, recept_ingredienten(naam)')
          .eq('is_gearchiveerd', false)
          .order('name', { ascending: true })
          .order('id', { ascending: true });

        if (search.trim()) query = query.ilike('name', `%${search.trim()}%`);
        if (category) query = query.eq('category', category);

        const { data: rij, error } = await query.range(van, tot);
        if (error) throw error;
        return rij ?? [];
      });
      return data.map((r: any) => {
        const regels = Array.isArray(r.recept_ingredienten) ? r.recept_ingredienten : [];
        return {
          ...r,
          ingredient_count: regels.length,
          ingredient_namen: regels.map((regel: { naam?: string | null }) => regel.naam).filter((naam: string | null | undefined): naam is string => !!naam?.trim()),
        };
      }) as Recipe[];
    },
  });
}

export function useRecipeCategories() {
  return useQuery({
    queryKey: ['recipes', 'categories'],
    queryFn: async () => {
      const data = await allesOphalen(async (van, tot) => {
        const { data: rij, error } = await supabase
          .from('recipes')
          .select('category, id')
          .eq('is_gearchiveerd', false)
          .order('category', { ascending: true })
          .order('id', { ascending: true })
          .range(van, tot);
        if (error) throw error;
        return rij ?? [];
      });
      const set = new Set<string>();
      data.forEach((r: any) => r.category && set.add(r.category));
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
      ingredient_id: i.ingredient_id ?? null,
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
          arbeid_minuten: rest.arbeid_minuten ?? null,
          tht_dagen: rest.tht_dagen ?? 3,
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
          arbeid_minuten: rest.arbeid_minuten ?? null,
          tht_dagen: rest.tht_dagen ?? 3,
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

export function useDeleteRecipe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('recipes')
        .update({ is_gearchiveerd: true, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recipes'] });
    },
  });
}


/** Aantal ingrediëntregels van een recept (voor de verbruik-waarschuwing bij methodes). */
export function useReceptRegelCount(receptId?: string) {
  return useQuery({
    queryKey: ['recept-regel-count', receptId],
    enabled: !!receptId,
    queryFn: async () => {
      const { count, error } = await supabase
        .from('recept_ingredienten')
        .select('id', { count: 'exact', head: true })
        .eq('recept_id', receptId!);
      if (error) throw error;
      return count ?? 0;
    },
  });
}
