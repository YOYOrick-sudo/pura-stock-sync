import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { besteldeadlineHint } from '@/lib/besteldeadline';

/** Locatiegebonden, read-only hints; bij een leesfout geen verouderde hint tonen. */
export function useBesteldeadlines(vestiging: string) {
  const [nu, setNu] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNu(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const query = useQuery({
    queryKey: ['besteldeadlines', vestiging],
    enabled: !!vestiging,
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from('leverancier_besteldagen')
        .select('leverancier_id, vestiging, weekdag, deadline_tijd, actief, deleted_at')
        .eq('vestiging', vestiging).eq('actief', true).is('deleted_at', null);
      if (error) throw error;
      return data ?? [];
    },
  });
  return (leverancierId: string | null | undefined) => query.isError ? null : besteldeadlineHint(query.data ?? [], vestiging, leverancierId, nu);
}