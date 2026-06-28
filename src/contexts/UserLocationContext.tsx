import { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getLocationDisplayName } from '@/lib/utils';

interface UserLocationContextType {
  userLocation: string;
  displayLocation: string;
  loading: boolean;
}

const UserLocationContext = createContext<UserLocationContextType | undefined>(undefined);

export function UserLocationProvider({ children }: { children: ReactNode }) {
  const [userLocation, setUserLocation] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Listen to auth state changes - ZONDER async operations!
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {  // ✅ NIET async
        if (!mounted) return;
        
        if (event === 'SIGNED_IN' && session) {
          // ✅ Defer Supabase call met setTimeout
          setTimeout(() => {
            if (!mounted) return;
            
            supabase
              .from('user_roles')
              .select('location')
              .eq('user_id', session.user.id)
              .maybeSingle()
              .then(({ data }) => {
                if (mounted) {
                  setUserLocation(data?.location || '');
                  setLoading(false);
                }
              });
          }, 0);
        } else if (event === 'SIGNED_OUT') {
          if (mounted) {
            setUserLocation('');
            setLoading(false);
          }
        }
      }
    );

    // Initial check
    const checkInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted) {
        if (session?.user) {
          const { data } = await supabase
            .from('user_roles')
            .select('location')
            .eq('user_id', session.user.id)
            .maybeSingle();
          setUserLocation(data?.location || '');
        }
        setLoading(false);
      }
    };
    
    checkInitialSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <UserLocationContext.Provider value={{ userLocation, loading }}>
      {children}
    </UserLocationContext.Provider>
  );
}

export function useUserLocation() {
  const context = useContext(UserLocationContext);
  if (context === undefined) {
    throw new Error('useUserLocation must be used within a UserLocationProvider');
  }
  return context;
}
