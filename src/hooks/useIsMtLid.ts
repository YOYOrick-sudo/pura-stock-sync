import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStatus } from '@/contexts/AuthContext';

/**
 * Of de ingelogde gebruiker een actief MT-lid is (tabel mt_leden, op e-mail).
 * Resultaat wordt gecachet; bij uitloggen wordt de query niet uitgevoerd.
 */
export function useIsMtLid() {
  const { status } = useAuthStatus();
  const query = useQuery({
    queryKey: ['is-mt-lid'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('is_mt_lid');
      if (error) throw error;
      return data === true;
    },
    enabled: status === 'ingelogd',
    staleTime: 5 * 60 * 1000,
  });
  return {
    isMtLid: query.data === true,
    loading: status !== 'ingelogd' || query.isLoading,
  };
}
