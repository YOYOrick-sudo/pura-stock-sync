import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * True als de ingelogde app-user beheer mag doen in de onderhoud-module
 * (statuswijzigingen, notities). Alleen actieve owner- of admin-rol.
 */
export function useIsMaintenanceAdmin() {
  return useQuery({
    queryKey: ['maintenance-is-admin'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('is_active', true);
      if (error) return false;
      return (data ?? []).some((r) => r.role === 'owner' || r.role === 'admin');
    },
    staleTime: 60_000,
  });
}
