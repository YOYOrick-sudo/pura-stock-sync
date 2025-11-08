import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';

interface UserLocationContextType {
  userLocation: string;
  loading: boolean;
}

const UserLocationContext = createContext<UserLocationContextType | undefined>(undefined);

export function UserLocationProvider({ children }: { children: ReactNode }) {
  const [userLocation, setUserLocation] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Listen to auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        console.log('Auth event:', event, 'Session:', session?.user?.id);
        
        if (event === 'SIGNED_IN' && session) {
          // Force fresh fetch bij nieuwe login
          const { data } = await supabase
            .from('user_roles')
            .select('location')
            .eq('user_id', session.user.id)
            .maybeSingle();
          
          if (mounted) {
            console.log('User location loaded:', data?.location);
            setUserLocation(data?.location || '');
            setLoading(false);
          }
        } else if (event === 'SIGNED_OUT') {
          if (mounted) {
            console.log('User signed out, clearing location');
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
