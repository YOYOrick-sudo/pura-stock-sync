import { useCallback, useEffect, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Live-verbindingen sterven als een tablet in de achtergrond gaat. Deze teller
 * loopt op zodra een kanaal stukgaat, zodat het abonnement opnieuw wordt
 * opgebouwd — en daarna één keer de gegevens ververst.
 */
export function useKanaalHerstel() {
  const [poging, setPoging] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const statusHandler = useCallback(
    (onHersteld?: () => void) => (status: string) => {
      if (status === 'SUBSCRIBED') {
        onHersteld?.();
        return;
      }
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => setPoging((p) => p + 1), 3000);
      }
    },
    [],
  );

  return { poging, statusHandler };
}

export type { RealtimeChannel };
