import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { withTimeout } from '@/lib/withTimeout';

/**
 * Eén plek die bepaalt of iemand ingelogd is.
 *
 * iPadOS bevriest de lokale opslag zolang de app op de achtergrond staat. Een
 * enkele mislukte uitlezing betekent dus NIET "uitgelogd" — daarom proberen we
 * het een paar keer voordat we iets op het scherm veranderen. Zo verschijnt het
 * inlogscherm nooit meer even "per ongeluk".
 */
export type AuthStatus = 'onbekend' | 'ingelogd' | 'uitgelogd';

interface AuthContextValue {
  status: AuthStatus;
  session: Session | null;
  offline: boolean;
  /** Opnieuw proberen na een mislukte of trage start. */
  opnieuw: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  status: 'onbekend',
  session: null,
  offline: false,
  opnieuw: () => {},
});

const POGINGEN = 3;
const POGING_TIMEOUT_MS = 8_000;
const PAUZE_MS = 600;

const wacht = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [status, setStatus] = useState<AuthStatus>('onbekend');
  const [session, setSession] = useState<Session | null>(null);
  const [offline, setOffline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine === false : false,
  );
  const rondeRef = useRef(0);

  const bepaal = useCallback(async () => {
    const ronde = ++rondeRef.current;
    setStatus('onbekend');

    for (let poging = 1; poging <= POGINGEN; poging++) {
      try {
        const { data } = await withTimeout(supabase.auth.getSession(), POGING_TIMEOUT_MS);
        if (rondeRef.current !== ronde) return;
        if (data?.session) {
          setSession(data.session);
          setStatus('ingelogd');
          return;
        }
      } catch {
        // opslag bevroren of traag — gewoon nog eens proberen
      }
      if (rondeRef.current !== ronde) return;
      if (poging < POGINGEN) await wacht(PAUZE_MS);
    }

    if (rondeRef.current !== ronde) return;
    // Geen net? Dan weten we het simpelweg niet zeker; niemand uitloggen.
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setStatus('onbekend');
      setOffline(true);
      return;
    }
    setSession(null);
    setStatus('uitgelogd');
  }, []);

  useEffect(() => {
    void bepaal();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nieuweSessie) => {
      rondeRef.current++; // lopende pogingen zijn achterhaald
      setSession(nieuweSessie);
      setStatus(nieuweSessie ? 'ingelogd' : 'uitgelogd');
    });

    return () => subscription.unsubscribe();
  }, [bepaal]);

  useEffect(() => {
    const online = () => {
      setOffline(false);
      // Weten we het nog niet zeker? Nu het net terug is opnieuw proberen.
      setStatus((huidig) => {
        if (huidig === 'onbekend') void bepaal();
        return huidig;
      });
    };
    const uit = () => setOffline(true);
    window.addEventListener('online', online);
    window.addEventListener('offline', uit);
    return () => {
      window.removeEventListener('online', online);
      window.removeEventListener('offline', uit);
    };
  }, [bepaal]);

  return (
    <AuthContext.Provider value={{ status, session, offline, opnieuw: () => void bepaal() }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthStatus = () => useContext(AuthContext);
