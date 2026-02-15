import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface RoleGuardProps {
  allowedRoles: string[];
  children: React.ReactNode;
  fallbackPath?: string;
}

export const RoleGuard = ({ 
  allowedRoles, 
  children, 
  fallbackPath = '/mijn/dashboard' 
}: RoleGuardProps) => {
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

  useEffect(() => {
    const checkRole = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      const { data: userRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (userRole && allowedRoles.includes(userRole.role)) {
        setHasAccess(true);
      } else {
        setHasAccess(false);
      }
      setLoading(false);
    };

    checkRole();
  }, [allowedRoles]);

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#F8F9FA',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div
          style={{
            width: '20px',
            height: '20px',
            border: '2px solid #D5D8E0',
            borderTopColor: '#E27726',
            borderRadius: '50%',
            animation: 'spin 0.6s linear infinite',
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!hasAccess) {
    return <Navigate to={fallbackPath} replace />;
  }

  return <>{children}</>;
};
