import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

export type ProefStand = Tables<'v_voorraad_stand'>;
export type ProefTelling = Tables<'voorraad_telling'>;
export interface TellingInvoer {
  id: string; voorraad_artikel_id: string; datum: string;
  moment: 'voor_opening' | 'na_sluiting'; per_plek: Record<string, number>;
  totaal: number; hertelling_van: string | null; bron_ref: string;
}

export function useVoorraadproef(vestiging: string) {
  const cache = useQueryClient();
  const standen = useQuery({
    queryKey: ['voorraadproef', vestiging], enabled: !!vestiging,
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from('v_voorraad_stand').select('*').eq('vestiging', vestiging).eq('actief', true).order('naam');
      if (error) throw error;
      return data ?? [];
    },
  });
  const opslaan = useMutation({
    mutationFn: async (invoer: TellingInvoer): Promise<ProefTelling> => {
      const { error } = await supabase.from('voorraad_telling').insert(invoer);
      if (error && error.code !== '23505') throw error;
      const { data, error: leesfout } = await supabase.from('voorraad_telling').select('*').eq('id', invoer.id).eq('bron_ref', invoer.bron_ref).single();
      if (leesfout) throw leesfout;
      return data;
    },
    onSuccess: () => cache.invalidateQueries({ queryKey: ['voorraadproef', vestiging] }),
  });
  return { standen, opslaan };
}