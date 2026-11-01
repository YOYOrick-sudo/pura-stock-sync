import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';
import { amsterdamDatum } from '@/lib/voorraadproef';

export type ProefStand = Tables<'v_voorraad_stand'>;
export type ProefTelling = Tables<'voorraad_telling'>;
export interface TellingInvoer {
  id: string; voorraad_artikel_id: string; datum: string;
  moment: 'voor_opening' | 'na_sluiting'; per_plek: Record<string, number>;
  totaal: number; hertelling_van: string | null; bron_ref: string;
}

export function voorraadServerfout(error: unknown): boolean {
  if (!error || typeof error !== 'object') return /statement timeout|canceling statement/i.test(String(error));
  const fout = error as { code?: string; message?: string; details?: string; status?: number; statusCode?: number };
  return fout.code === '57014' || /statement timeout|canceling statement/i.test(`${fout.message ?? ''} ${fout.details ?? ''}`) || Number(fout.status ?? fout.statusCode) >= 500;
}

export function voorraadRetry(failureCount: number, error: unknown): boolean {
  return !voorraadServerfout(error) && failureCount < 1;
}

export function useOpenTelvragen(vestiging: string, actief = true) {
  return useQuery({
    queryKey: ['voorraadproef-open', vestiging],
    enabled: !!vestiging && actief,
    refetchInterval: 60_000,
    retry: voorraadRetry,
    queryFn: async () => {
      const { count, error, status } = await supabase.from('voorraad_telvraag')
        .select('voorraad_artikel!inner(actief)', { count: 'exact', head: true })
        .eq('vestiging', vestiging).eq('datum', amsterdamDatum()).eq('status', 'open').eq('voorraad_artikel.actief', true);
      if (error) throw { ...error, status };
      return count ?? 0;
    },
  });
}

export function useVoorraadproef(vestiging: string, actief = true) {
  const cache = useQueryClient();
  const standen = useQuery({
    queryKey: ['voorraadproef', vestiging], enabled: !!vestiging && actief,
    refetchInterval: actief ? (query) => query.state.status === 'error' ? false : 60_000 : false,
    refetchOnWindowFocus: false,
    retryOnMount: false,
    retry: voorraadRetry,
    queryFn: async () => {
      const { data, error, status } = await supabase.from('v_voorraad_stand').select('*').eq('vestiging', vestiging).eq('actief', true).order('naam');
      if (error) throw { ...error, status };
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
    onSuccess: () => Promise.all([
      cache.invalidateQueries({ queryKey: ['voorraadproef', vestiging] }),
      cache.invalidateQueries({ queryKey: ['voorraadproef-open', vestiging] }),
    ]),
  });
  return { standen, opslaan };
}