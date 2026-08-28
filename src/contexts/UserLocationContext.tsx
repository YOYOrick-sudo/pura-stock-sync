import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getLocationDisplayName } from '@/lib/utils';

interface UserLocationContextType {
  /** De actieve vestiging (gekozen bij meerdere vestigingen) */
  userLocation: string;
  displayLocation: string;
  /** Alle vestigingen waar dit account actief is */
  availableLocations: string[];
  /** True als dit account meerdere vestigingen heeft */
  canSwitchLocation: boolean;
  setActiveLocation: (loc: string) => void;
  loading: boolean;
}

const UserLocationContext = createContext<UserLocationContextType | undefined>(undefined);

const storageKey = (userId: string) => `puravida-vestiging:${userId}`;

const LOCATION_ORDER = ['West', 'Midsland'];

function sortLocations(locs: string[]) {
  return [...locs].sort((a, b) => {
    const ia = LOCATION_ORDER.indexOf(a);
    const ib = LOCATION_ORDER.indexOf(b);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib) || a.localeCompare(b);
  });
}

export function UserLocationProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);
  const [activeLocation, setActiveLocationState] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const applyLocations = useCallback((uid: string, locs: string[]) => {
    const sorted = sortLocations(locs);
    setAvailableLocations(sorted);
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(storageKey(uid));
    } catch {
      stored = null;
    }
    const next = stored && sorted.includes(stored) ? stored : sorted[0] ?? '';
    setActiveLocationState(next);
    setLoading(false);
  }, []);

  const loadLocations = useCallback(async (uid: string) => {
    const { data } = await supabase
      .from('user_roles')
      .select('location')
      .eq('user_id', uid)
      .eq('is_active', true);
    const locs = Array.from(new Set((data ?? []).map(r => r.location).filter(Boolean) as string[]));
    applyLocations(uid, locs);
  }, [applyLocations]);

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === 'SIGNED_IN' && session) {
        setUserId(session.user.id);
        setTimeout(() => {
          if (mounted) void loadLocations(session.user.id);
        }, 0);
      } else if (event === 'SIGNED_OUT') {
        setUserId(null);
        setAvailableLocations([]);
        setActiveLocationState('');
        setLoading(false);
      }
    });

    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      if (session?.user) {
        setUserId(session.user.id);
        await loadLocations(session.user.id);
      } else {
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadLocations]);

  const setActiveLocation = useCallback((loc: string) => {
    setActiveLocationState(prev => (availableLocations.includes(loc) ? loc : prev));
    if (userId && availableLocations.includes(loc)) {
      try {
        localStorage.setItem(storageKey(userId), loc);
      } catch {
        /* localStorage niet beschikbaar: keuze geldt dan alleen deze sessie */
      }
    }
  }, [availableLocations, userId]);

  const value = useMemo<UserLocationContextType>(() => ({
    userLocation: activeLocation,
    displayLocation: getLocationDisplayName(activeLocation),
    availableLocations,
    canSwitchLocation: availableLocations.length > 1,
    setActiveLocation,
    loading,
  }), [activeLocation, availableLocations, setActiveLocation, loading]);

  return (
    <UserLocationContext.Provider value={value}>
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
