import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const METHODE_TYPES = [
  'Bereiden',
  'Aanvullen',
  'Snijden',
  'Roosteren',
  'Portioneren',
  'Uithalen',
  'Ontdooien',
  'Opwarmen',
  'Afmaken',
  'Vacumeren',
  'Overig',
] as const;

export type MethodeType = (typeof METHODE_TYPES)[number];

export interface HalffabricaatMethode {
  id: string;
  recept_id: string;
  type: string;
  visuele_eenheid: string;
  output_hoeveelheid: number;
  output_eenheid: string;
  standaard_duur: number;
  houdbaarheid: number | null;
  instructie: string | null;
  sort_order: number;
  /** true = output op voorraad (halffabricaat); false = direct verkoop (bv. afbakken). */
  output_gaat_op_voorraad: boolean;
}

export interface MethodeInput {
  recept_id: string;
  type: string;
  visuele_eenheid: string;
  output_hoeveelheid: number;
  output_eenheid: string;
  standaard_duur: number;
  houdbaarheid?: number | null;
  instructie?: string | null;
  sort_order?: number;
  output_gaat_op_voorraad?: boolean;
}

export function useMethodes(receptId?: string) {
  return useQuery({
    queryKey: ['hf-methodes', receptId],
    enabled: !!receptId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('halffabricaat_methodes')
        .select('*')
        .eq('recept_id', receptId!)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as HalffabricaatMethode[];
    },
  });
}

/** Alle methodes (voor MEP-toevoegen: recept + handeling kiezen). */
export function useAlleMethodes() {
  return useQuery({
    queryKey: ['hf-methodes-alle'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('halffabricaat_methodes')
        .select('*')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data ?? []) as HalffabricaatMethode[];
    },
  });
}

export function useSaveMethode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: MethodeInput & { id?: string }) => {
      if (id) {
        const { error } = await supabase.from('halffabricaat_methodes').update(input).eq('id', id);
        if (error) throw error;
        return id;
      }
      const { data, error } = await supabase
        .from('halffabricaat_methodes')
        .insert(input)
        .select('id')
        .single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['hf-methodes', vars.recept_id] });
      qc.invalidateQueries({ queryKey: ['hf-methodes-alle'] });
    },
  });
}

export function useDeleteMethode() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('halffabricaat_methodes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hf-methodes'] });
      qc.invalidateQueries({ queryKey: ['hf-methodes-alle'] });
    },
  });
}
