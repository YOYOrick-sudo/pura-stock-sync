import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserLocation } from '@/contexts/UserLocationContext';

export interface PrintJob {
  id: string;
  label_omschrijving: string | null;
  status: 'pending' | 'printing' | 'done' | 'error';
  foutmelding: string | null;
  created_at: string;
  geprint_op: string | null;
  vestiging: string | null;
  bron: string | null;
}

const BRIDGE_ACTIEF_MS = 5 * 60_000;
export const WACHTRIJ_OUD_MS = 2 * 60_000;

export function usePrintStatus() {
  const { userLocation } = useUserLocation();
  return useQuery({
    queryKey: ['print-status', userLocation],
    refetchInterval: 15_000,
    queryFn: async () => {
      const [statusRes, jobsRes] = await Promise.all([
        (supabase as any)
          .from('print_bridge_status')
          .select('vestiging, laatste_claim, laatste_print')
          .eq('vestiging', userLocation)
          .maybeSingle(),
        (supabase as any)
          .from('print_jobs')
          .select('id, label_omschrijving, status, foutmelding, created_at, geprint_op, vestiging, bron')
          .order('created_at', { ascending: false })
          .limit(10),
      ]);
      if (statusRes.error) throw statusRes.error;
      if (jobsRes.error) throw jobsRes.error;

      const jobs = (jobsRes.data ?? []) as PrintJob[];
      const laatsteClaim: string | null = statusRes.data?.laatste_claim ?? null;
      const laatstePrint: string | null = statusRes.data?.laatste_print ?? null;
      const bridgeActief =
        laatsteClaim != null && Date.now() - new Date(laatsteClaim).getTime() < BRIDGE_ACTIEF_MS;

      const nu = Date.now();
      const wachtrij = jobs.filter((j) => j.status === 'pending' || j.status === 'printing');
      const wachtrijOud = wachtrij.filter(
        (j) => nu - new Date(j.created_at).getTime() > WACHTRIJ_OUD_MS,
      );

      return { bridgeActief, laatsteClaim, laatstePrint, wachtrij, wachtrijOud, recent: jobs };
    },
  });
}
