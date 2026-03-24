import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { MaintenanceUser, MaintenanceSession } from '@/types/maintenance';

const SESSION_KEY = 'maintenance_session';
const LOCKOUT_KEY = 'maintenance_lockout';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

// Simple hash function for pin verification (client-side)
// In production, pin verification should happen via Edge Function
async function hashPin(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin + 'pura-vida-salt');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function getSession(): MaintenanceSession | null {
  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (!stored) return null;
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

function setSession(session: MaintenanceSession | null) {
  if (session) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    sessionStorage.removeItem(SESSION_KEY);
  }
}

function isLockedOut(): boolean {
  try {
    const lockout = localStorage.getItem(LOCKOUT_KEY);
    if (!lockout) return false;
    const { until } = JSON.parse(lockout);
    if (Date.now() < until) return true;
    localStorage.removeItem(LOCKOUT_KEY);
    return false;
  } catch {
    return false;
  }
}

function recordFailedAttempt(): boolean {
  try {
    const key = 'maintenance_attempts';
    const stored = localStorage.getItem(key);
    let attempts = stored ? JSON.parse(stored) : { count: 0, since: Date.now() };

    // Reset if older than lockout duration
    if (Date.now() - attempts.since > LOCKOUT_DURATION) {
      attempts = { count: 0, since: Date.now() };
    }

    attempts.count += 1;
    localStorage.setItem(key, JSON.stringify(attempts));

    if (attempts.count >= MAX_ATTEMPTS) {
      localStorage.setItem(LOCKOUT_KEY, JSON.stringify({ until: Date.now() + LOCKOUT_DURATION }));
      localStorage.removeItem(key);
      return true; // locked out
    }
    return false;
  } catch {
    return false;
  }
}

function clearAttempts() {
  localStorage.removeItem('maintenance_attempts');
}

export function useMaintenanceAuth() {
  const [session, setSessionState] = useState<MaintenanceSession | null>(getSession);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (pin: string): Promise<boolean> => {
    if (isLockedOut()) {
      setError('Te veel pogingen. Wacht 15 minuten.');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const pinHash = await hashPin(pin);

      const { data: users, error: dbError } = await supabase
        .from('maintenance_users')
        .select('*')
        .eq('pincode_hash', pinHash)
        .eq('actief', true)
        .limit(1);

      if (dbError) throw dbError;

      if (!users || users.length === 0) {
        const lockedOut = recordFailedAttempt();
        setError(lockedOut ? 'Te veel pogingen. Wacht 15 minuten.' : 'Ongeldige pincode');
        setLoading(false);
        return false;
      }

      const user = users[0] as MaintenanceUser;
      const newSession: MaintenanceSession = {
        user,
        loggedInAt: Date.now(),
      };

      setSession(newSession);
      setSessionState(newSession);
      clearAttempts();
      setLoading(false);
      return true;
    } catch (err) {
      setError('Er ging iets mis. Probeer opnieuw.');
      setLoading(false);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    setSession(null);
    setSessionState(null);
    setError(null);
  }, []);

  return {
    session,
    user: session?.user ?? null,
    isLoggedIn: !!session,
    isEigenaar: session?.user?.rol === 'eigenaar',
    loading,
    error,
    login,
    logout,
  };
}

export { hashPin };
