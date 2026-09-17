import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { withTimeout } from '@/lib/withTimeout';

interface RequireManagerProps {
  children: React.ReactNode;
}

export const RequireManager = ({ children }: RequireManagerProps) => {
  const [loading, setLoading] = useState(true);
  const [isManager, setIsManager] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: { user } } = await withTimeout(supabase.auth.getUser(), 8000);
        if (!user) {
          if (!cancelled) { setIsManager(false); setLoading(false); }
          return;
        }
        const { data } = await withTimeout(
          supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .eq('is_active', true),
          8000,
        );
        const allowed = (data ?? []).some(r =>
          ['owner', 'manager', 'admin'].includes(r.role as string)
        );
        if (!cancelled) { setIsManager(allowed); setLoading(false); }
      } catch {
        if (!cancelled) { setIsManager(false); setLoading(false); }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isManager) return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
};
