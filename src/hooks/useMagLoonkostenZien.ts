import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * True voor owner/admin of profielen met de vlag `mag_loonkosten_zien = true`.
 * Zelfde pattern als `mag_cijfers_zien`.
 */
export function useMagLoonkostenZien(): boolean {
  const { data } = useQuery({
    queryKey: ['mag-loonkosten-zien'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;
      const [roleRes, profRes] = await Promise.all([
        supabase.rpc('get_user_role', { uid: user.id }),
        supabase.from('profiles').select('mag_loonkosten_zien').eq('user_id', user.id).maybeSingle(),
      ]);
      const role = roleRes.data as string | null;
      if (role === 'owner' || role === 'admin') return true;
      return !!profRes.data?.mag_loonkosten_zien;
    },
    staleTime: 60_000,
  });
  return !!data;
}
