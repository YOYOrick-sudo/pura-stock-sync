import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatInTimeZone } from 'date-fns-tz';
import { supabase } from '@/integrations/supabase/client';
import { besteldeadlineHint, type BesteldeadlineHintRij } from '@/lib/besteldeadline';

/** Locatiegebonden, read-only hints uit de database (bestel_deadline_hints); bij een leesfout geen verouderde hint tonen. */
export function useBesteldeadlines(vestiging: string) {
  const [nu, setNu] = useState(() => new Date());
  useEffect(() => {
    const timer = window.setInterval(() => setNu(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);
  const dag = formatInTimeZone(nu, 'Europe/Amsterdam', 'yyyy-MM-dd');
  const query = useQuery({
    queryKey: ['besteldeadlines', vestiging, dag],
    enabled: !!vestiging,
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('bestel_deadline_hints', { _vestiging: vestiging });
      if (error) throw error;
      return (data ?? []) as BesteldeadlineHintRij[];
    },
  });
  return (leverancierId: string | null | undefined) => query.isError ? null : besteldeadlineHint(query.data ?? [], leverancierId, nu);
}
