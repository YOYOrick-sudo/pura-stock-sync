import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface IngredientMaster {
  id: string;
  naam: string;
}

export interface IngredientStat {
  id: string;
  naam: string;
  aantal_recepten: number;
  laatst_gebruikt: string | null;
}

/** Autosuggest: max 8 hits, alfabetisch, ilike. */
export function useIngredientSuggestions(term: string) {
  const q = term.trim();
  return useQuery({
    queryKey: ['ingredienten', 'suggest', q.toLowerCase()],
    enabled: q.length >= 2,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ingredienten_master')
        .select('id, naam')
        .ilike('naam', `%${q}%`)
        .order('naam', { ascending: true })
        .limit(8);
      if (error) throw error;
      return (data ?? []) as IngredientMaster[];
    },
  });
}

/** Beheerpagina: alle ingrediënten met statistiek. */
export function useIngredientenStats() {
  return useQuery({
    queryKey: ['ingredienten', 'stats'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('v_ingredienten_stats')
        .select('*')
        .order('naam', { ascending: true });
      if (error) throw error;
      return (data ?? []) as IngredientStat[];
    },
  });
}

/**
 * Maak een nieuwe master aan. Als de naam al bestaat (case-insensitive) → bestaande teruggeven.
 * Vangt Postgres 23505 unique-violation af.
 */
export async function ensureIngredientMaster(naam: string): Promise<IngredientMaster> {
  const clean = naam.trim();
  if (!clean) throw new Error('Naam is leeg');

  const { data: ins, error: insErr } = await supabase
    .from('ingredienten_master')
    .insert({ naam: clean })
    .select('id, naam')
    .single();

  if (!insErr && ins) return ins as IngredientMaster;

  if (insErr && (insErr as any).code === '23505') {
    const { data: existing, error: selErr } = await supabase
      .from('ingredienten_master')
      .select('id, naam')
      .ilike('naam', clean)
      .limit(1)
      .maybeSingle();
    if (selErr) throw selErr;
    if (existing) return existing as IngredientMaster;
  }

  throw insErr ?? new Error('Aanmaken mislukt');
}

/** Recepten waarin dit ingrediënt voorkomt (voor de popover). */
export function useRecipesForIngredient(ingredientId: string | null) {
  return useQuery({
    queryKey: ['ingredienten', 'recipes', ingredientId],
    enabled: !!ingredientId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recept_ingredienten')
        .select('recept_id, recipes:recept_id (id, name)')
        .eq('ingredient_id', ingredientId!);
      if (error) throw error;
      const map = new Map<string, { id: string; name: string }>();
      (data ?? []).forEach((r: any) => {
        if (r.recipes?.id && !map.has(r.recipes.id)) {
          map.set(r.recipes.id, { id: r.recipes.id, name: r.recipes.name });
        }
      });
      return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, 'nl'));
    },
  });
}

export function useRenameIngredient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, naam }: { id: string; naam: string }) => {
      const clean = naam.trim();
      if (!clean) throw new Error('Naam is leeg');

      const { error } = await supabase
        .from('ingredienten_master')
        .update({ naam: clean })
        .eq('id', id);
      if (error) {
        if ((error as any).code === '23505') {
          throw new Error(
            'Deze naam bestaat al — selecteer beide en gebruik Samenvoegen.',
          );
        }
        throw error;
      }

      // Fallback-naam in recept_ingredienten meesynchroniseren.
      await supabase
        .from('recept_ingredienten')
        .update({ naam: clean })
        .eq('ingredient_id', id);

      return { id, naam: clean };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ingredienten'] });
      qc.invalidateQueries({ queryKey: ['recipes'] });
    },
  });
}

export function useMergeIngredienten() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ keep, drop }: { keep: string; drop: string[] }) => {
      const { data, error } = await supabase.rpc('ingredienten_merge' as any, {
        _keep: keep,
        _drop: drop,
      });
      if (error) throw error;
      return (data as number) ?? 0;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ingredienten'] });
      qc.invalidateQueries({ queryKey: ['recipes'] });
    },
  });
}
