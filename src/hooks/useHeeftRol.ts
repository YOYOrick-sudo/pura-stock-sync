import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStatus } from '@/contexts/AuthContext';

/**
 * Of de ingelogde gebruiker minstens één actieve rol heeft.
 * heeftRol is `null` zolang onbekend of bij een fout (bijv. haperende wifi);
 * dan wordt niemand weggestuurd.
 */
export function useHeeftRol() {
  const { status } = useAuthStatus();
  const query = useQuery({
    queryKey: ['heeft-actieve-rol'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { count, error } = await supabase
        .from('user_roles')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_active', true);
      if (error) throw error;
      return (count ?? 0) > 0;
    },
    enabled: status === 'ingelogd',
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
  return {
    heeftRol: query.isError ? null : (query.data ?? null),
    loading: status === 'ingelogd' && query.isLoading,
  };
}
