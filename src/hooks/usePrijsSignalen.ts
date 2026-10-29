import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { PrijsSignaal } from '@/lib/prijsSignaal';

/** Prijssignalen (pijl omhoog/omlaag) voor het bestelbord van één vestiging. */
export function usePrijsSignalen(vestiging: string | null) {
  return useQuery({
    queryKey: ['prijs-signalen', vestiging],
    enabled: !!vestiging,
    staleTime: 10 * 60 * 1000,
    queryFn: async (): Promise<PrijsSignaal[]> => {
      const { data, error } = await supabase.rpc('prijs_signalen_bord', { p_vestiging: vestiging! });
      if (error) throw error;
      return (data ?? []) as unknown as PrijsSignaal[];
    },
  });
}
