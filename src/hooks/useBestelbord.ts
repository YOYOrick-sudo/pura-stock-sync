import { useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { metHerstel } from '@/lib/appWake';
import { useKanaalHerstel } from '@/lib/realtime';

export interface BestelSignaal {
  id: string;
  vestiging: string;
  naam: string;
  aantal: number;
  eenheid: string;
  notitie: string | null;
  status: 'open' | 'besteld';
  bron: string;
  created_at: string;
  besteld_op: string | null;
}

/** Het digitale bestelbord: wat is op en moet besteld worden. */
export function useBestelSignalen(vestiging: string | null | undefined) {
  const qc = useQueryClient();
  const { poging, statusHandler } = useKanaalHerstel();
  const key = useMemo(() => ['bestel-signalen', vestiging], [vestiging]);

  const query = useQuery({
    queryKey: key,
    enabled: !!vestiging,
    placeholderData: (vorige) => vorige,
    queryFn: async (): Promise<BestelSignaal[]> => {
      const { data, error } = await supabase
        .from('bestel_signalen')
        .select('*')
        .eq('vestiging', vestiging!)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as unknown as BestelSignaal[];
    },
  });

  useEffect(() => {
    if (!vestiging) return;
    const channel = supabase
      .channel(`bestel-signalen-${vestiging}-${poging}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bestel_signalen', filter: `vestiging=eq.${vestiging}` },
        () => qc.invalidateQueries({ queryKey: key }),
      )
      .subscribe(statusHandler(() => qc.invalidateQueries({ queryKey: key })));
    return () => {
      supabase.removeChannel(channel);
    };
  }, [vestiging, qc, key, poging, statusHandler]);

  return query;
}

export function useBestelbordMutaties(vestiging: string) {
  const qc = useQueryClient();
  const key = ['bestel-signalen', vestiging] as const;
  const ververs = () => qc.invalidateQueries({ queryKey: key });

  const toevoegen = useMutation({
    mutationFn: async ({ naam, aantal, eenheid }: { naam: string; aantal: number; eenheid: string }) => {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await metHerstel(() =>
        supabase.from('bestel_signalen').insert({
          vestiging,
          naam: naam.trim(),
          aantal,
          eenheid,
          bron: 'handmatig',
          gemeld_door: user.user?.id ?? null,
        }),
      );
      if (error) throw error;
    },
    onSettled: ververs,
  });

  const zetBesteld = useMutation({
    mutationFn: async ({ id, besteld }: { id: string; besteld: boolean }) => {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await metHerstel(() =>
        supabase
          .from('bestel_signalen')
          .update({
            status: besteld ? 'besteld' : 'open',
            besteld_op: besteld ? new Date().toISOString() : null,
            besteld_door: besteld ? user.user?.id ?? null : null,
          })
          .eq('id', id),
      );
      if (error) throw error;
    },
    onSettled: ververs,
  });

  const verwijderen = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await metHerstel(() => supabase.from('bestel_signalen').delete().eq('id', id));
      if (error) throw error;
    },
    onSettled: ververs,
  });

  return { toevoegen, zetBesteld, verwijderen };
}
