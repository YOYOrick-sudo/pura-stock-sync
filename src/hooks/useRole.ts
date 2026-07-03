import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface RoleState {
  loading: boolean;
  isAuthenticated: boolean;
  isStaff: boolean;   // authenticated + any active role
  isManager: boolean; // manager OR owner OR admin
  isOwner: boolean;   // owner OR admin
  roles: string[];
  userId: string | null;
}

export function useRole(): RoleState {
  const [state, setState] = useState<RoleState>({
    loading: true,
    isAuthenticated: false,
    isStaff: false,
    isManager: false,
    isOwner: false,
    roles: [],
    userId: null,
  });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) setState({
          loading: false, isAuthenticated: false, isStaff: false,
          isManager: false, isOwner: false, roles: [], userId: null,
        });
        return;
      }
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('is_active', true);
      const roles = (data ?? []).map(r => r.role as string);
      const isOwner = roles.some(r => ['owner', 'admin'].includes(r));
      const isManager = isOwner || roles.includes('manager');
      const isStaff = roles.length > 0;
      if (!cancelled) setState({
        loading: false,
        isAuthenticated: true,
        isStaff, isManager, isOwner,
        roles, userId: user.id,
      });
    };

    load();

    const { data: sub } = supabase.auth.onAuthStateChange(() => load());
    return () => { cancelled = true; sub.subscription.unsubscribe(); };
  }, []);

  return state;
}
