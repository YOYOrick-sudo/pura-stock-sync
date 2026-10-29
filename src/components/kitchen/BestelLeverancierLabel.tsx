import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/** Additive display lookup; never changes the board query or its mutations. */
export function BestelLeverancierLabel({ signaalId, vestiging }: { signaalId: string; vestiging: string }) {
  const { data: naam } = useQuery({
    queryKey: ['bestel-leverancier-label', vestiging, signaalId],
    enabled: Boolean(vestiging && signaalId),
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bestel_signalen')
        .select('leverancier_id, leveranciers(naam)')
        .eq('id', signaalId)
        .eq('vestiging', vestiging)
        .maybeSingle();
      if (error) throw error;
      return data?.leverancier_id ? data.leveranciers?.naam ?? null : null;
    },
  });
  if (!naam) return null;
  return <span className="block text-xs font-normal text-muted-foreground">{naam}</span>;
}