import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { AllergeenCode, AllergeenStatus } from '@/lib/allergenen';

export interface IngredientAllergenen {
  id: string;
  naam: string;
  allergenen: AllergeenCode[];
  allergenen_sporen: AllergeenCode[];
  allergenen_status: AllergeenStatus;
  allergenen_bron: string | null;
  allergenen_bijgewerkt_op: string | null;
}

export interface ReceptAllergenen {
  recept_id: string;
  allergenen: AllergeenCode[];
  sporen: AllergeenCode[];
  onbekende_ingredienten: number;
  allergenen_notitie: string | null;
}

/** Allergenen van alle ingrediënten (beheerscherm + combobox). */
export function useIngredientAllergenen() {
  return useQuery({
    queryKey: ['allergenen', 'ingredienten'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('ingredienten_master')
        .select('id, naam, allergenen, allergenen_sporen, allergenen_status, allergenen_bron, allergenen_bijgewerkt_op')
        .order('naam', { ascending: true });
      if (error) throw error;
      return (data ?? []) as IngredientAllergenen[];
    },
  });
}

/** Afgeleide allergenen van één recept. */
export function useReceptAllergenen(receptId: string | undefined) {
  return useQuery({
    queryKey: ['allergenen', 'recept', receptId],
    enabled: !!receptId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('v_recept_allergenen')
        .select('*')
        .eq('recept_id', receptId!)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as ReceptAllergenen | null;
    },
  });
}

/** Afgeleide allergenen voor alle recepten (lijstweergave). */
export function useAlleReceptAllergenen() {
  return useQuery({
    queryKey: ['allergenen', 'recepten'],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from('v_recept_allergenen').select('*');
      if (error) throw error;
      const map = new Map<string, ReceptAllergenen>();
      (data ?? []).forEach((r: ReceptAllergenen) => map.set(r.recept_id, r));
      return map;
    },
  });
}

export function useUpdateIngredientAllergenen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      allergenen: AllergeenCode[];
      allergenen_sporen?: AllergeenCode[];
      status: AllergeenStatus;
      bron?: string | null;
    }) => {
      const patch: Record<string, unknown> = {
        allergenen: input.allergenen,
        allergenen_status: input.status,
        allergenen_bijgewerkt_op: new Date().toISOString(),
      };
      if (input.allergenen_sporen) patch.allergenen_sporen = input.allergenen_sporen;
      if (input.bron !== undefined) patch.allergenen_bron = input.bron;

      const { error } = await (supabase as any).from('ingredienten_master').update(patch).eq('id', input.id);
      if (error) throw error;
      return input.id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['allergenen'] });
    },
  });
}

/** Zet de status van een ingrediënt in één klik op 'bevestigd'. */
export function useConfirmIngredientAllergenen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from('ingredienten_master')
        .update({ allergenen_status: 'bevestigd', allergenen_bijgewerkt_op: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['allergenen'] });
    },
  });
}

export interface AllergeenSuggestie {
  naam: string;
  allergenen: AllergeenCode[];
  sporen: AllergeenCode[];
  onzeker: boolean;
  reden: string;
}

/**
 * Vraagt AI-voorstellen op voor ingrediënten en slaat ze op als status 'ai_voorstel'.
 * Ingrediënten die al 'bevestigd' zijn worden nooit overschreven.
 */
export function useSuggestAllergenen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (items: { id: string; naam: string }[]) => {
      const uniek = items.filter((i, idx) => items.findIndex((x) => x.id === i.id) === idx);
      if (uniek.length === 0) return 0;

      let bijgewerkt = 0;
      for (let i = 0; i < uniek.length; i += 20) {
        const batch = uniek.slice(i, i + 20);
        const { data, error } = await supabase.functions.invoke('suggest-allergenen', {
          body: { namen: batch.map((b) => b.naam) },
        });
        if (error) throw error;

        const resultaten: AllergeenSuggestie[] = (data as any)?.resultaten ?? [];
        for (const r of resultaten) {
          const match = batch.find((b) => b.naam.toLowerCase() === r.naam.toLowerCase());
          if (!match) continue;
          if (r.onzeker && r.allergenen.length === 0 && r.sporen.length === 0) continue;

          const { error: upErr } = await (supabase as any)
            .from('ingredienten_master')
            .update({
              allergenen: r.allergenen,
              allergenen_sporen: r.sporen,
              allergenen_status: 'ai_voorstel',
              allergenen_bron: r.reden ? `AI-voorstel: ${r.reden}` : 'AI-voorstel',
              allergenen_bijgewerkt_op: new Date().toISOString(),
            })
            .eq('id', match.id)
            .neq('allergenen_status', 'bevestigd');
          if (!upErr) bijgewerkt += 1;
        }
      }
      return bijgewerkt;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['allergenen'] });
    },
  });
}

export function useUpdateReceptAllergenenOverride() {

  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      id: string;
      extra: AllergeenCode[];
      uitgesloten: AllergeenCode[];
      notitie: string | null;
    }) => {
      const { error } = await (supabase as any)
        .from('recipes')
        .update({
          allergenen_extra: input.extra,
          allergenen_uitgesloten: input.uitgesloten,
          allergenen_notitie: input.notitie,
        })
        .eq('id', input.id);
      if (error) throw error;
      return input.id;
    },
    onSuccess: (id) => {
      qc.invalidateQueries({ queryKey: ['allergenen'] });
      qc.invalidateQueries({ queryKey: ['recipes', 'detail', id] });
    },
  });
}
