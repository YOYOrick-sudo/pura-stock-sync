import { useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { metHerstel } from '@/lib/appWake';
import { useKanaalHerstel } from '@/lib/realtime';

export interface KoelcelCheckItem {
  id: string;
  vestiging: string;
  naam: string;
  doel_aantal: number;
  eenheid: string;
  type: 'koelcel' | 'vriezer';
  volgorde: number;
  actief: boolean;
}

export type KoelcelCheckStatus = 'aanwezig' | 'naar_mep' | 'uit_vriezer';

export interface KoelcelCheck {
  id: string;
  item_id: string;
  vestiging: string;
  datum: string;
  status: KoelcelCheckStatus;
  mep_taak_id: string | null;
  created_by: string | null;
}

/** Actieve items van de voorraad-check (koelcel + vriezer) voor een vestiging. */
export function useKoelcelCheckItems(vestiging: string | null | undefined) {
  return useQuery({
    queryKey: ['koelcel-check-items', vestiging],
    enabled: !!vestiging,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<KoelcelCheckItem[]> => {
      const { data, error } = await supabase
        .from('koelcel_check_items')
        .select('*')
        .eq('vestiging', vestiging!)
        .eq('actief', true)
        .order('volgorde');
      if (error) throw error;
      return (data ?? []) as KoelcelCheckItem[];
    },
  });
}

/** Afvink-statussen van één dag, realtime gesynchroniseerd tussen de iPads. */
export function useKoelcelChecks(vestiging: string | null | undefined, datum: string) {
  const qc = useQueryClient();
  const { poging, statusHandler } = useKanaalHerstel();
  const key = useMemo(() => ['koelcel-checks', vestiging, datum], [vestiging, datum]);

  const query = useQuery({
    queryKey: key,
    enabled: !!vestiging && !!datum,
    placeholderData: (vorige) => vorige,
    queryFn: async (): Promise<KoelcelCheck[]> => {
      const { data, error } = await supabase
        .from('koelcel_checks')
        .select('*')
        .eq('vestiging', vestiging!)
        .eq('datum', datum);
      if (error) throw error;
      return (data ?? []) as KoelcelCheck[];
    },
  });

  useEffect(() => {
    if (!vestiging || !datum) return;
    const channel = supabase
      .channel(`koelcel-checks-${vestiging}-${datum}-${poging}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'koelcel_checks', filter: `vestiging=eq.${vestiging}` },
        () => qc.invalidateQueries({ queryKey: key }),
      )
      .subscribe(statusHandler(() => qc.invalidateQueries({ queryKey: key })));
    return () => {
      supabase.removeChannel(channel);
    };
  }, [vestiging, datum, qc, key, poging, statusHandler]);

  return query;
}

export function useKoelcelCheckMutaties(vestiging: string, datum: string) {
  const qc = useQueryClient();
  const checksKey = ['koelcel-checks', vestiging, datum] as const;

  /** Zet een status (optimistisch), of haal hem weg als die er al stond. */
  const zetStatus = useMutation({
    mutationFn: async ({
      item,
      status,
      uit,
    }: {
      item: KoelcelCheckItem;
      status: KoelcelCheckStatus;
      uit: boolean;
    }) => {
      if (uit) {
        const { error } = await metHerstel(() =>
          supabase.from('koelcel_checks').delete().eq('item_id', item.id).eq('datum', datum),
        );
        if (error) throw error;
        return { uit: true as const, item, status };
      }
      const { data: user } = await supabase.auth.getUser();
      const { error } = await metHerstel(() =>
        supabase.from('koelcel_checks').upsert(
          {
            item_id: item.id,
            vestiging,
            datum,
            status,
            created_by: user.user?.id ?? null,
          },
          { onConflict: 'item_id,datum' },
        ),
      );
      if (error) throw error;
      return { uit: false as const, item, status };
    },
    onMutate: async ({ item, status, uit }) => {
      await qc.cancelQueries({ queryKey: checksKey });
      const vorige = qc.getQueryData<KoelcelCheck[]>(checksKey);
      qc.setQueryData<KoelcelCheck[]>(checksKey, (huidig = []) =>
        uit
          ? huidig.filter((c) => c.item_id !== item.id)
          : [
              ...huidig.filter((c) => c.item_id !== item.id),
              {
                id: `optimistisch-${item.id}`,
                item_id: item.id,
                vestiging,
                datum,
                status,
                mep_taak_id: null,
                created_by: null,
              },
            ],
      );
      return { vorige };
    },
    onError: (_e, _v, context) => {
      if (context?.vorige) qc.setQueryData(checksKey, context.vorige);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: checksKey }),
  });

  /**
   * Zet een ontbrekend item op de MEP-lijst van vandaag (loopt automatisch door
   * naar morgen zolang het open staat). Dedupe: staat er al een open taak met
   * dezelfde titel + handeling, dan geen dubbele.
   */
  const naarMep = useMutation({
    mutationFn: async (item: KoelcelCheckItem) => {
      const handeling = item.type === 'vriezer' ? 'Ontdooien' : 'Aanvullen';
      const { data: bestaand, error: zoekFout } = await supabase
        .from('mep_taken')
        .select('id')
        .eq('vestiging', vestiging)
        .in('status', ['open', 'bezig'])
        .ilike('titel', item.naam)
        .eq('handeling', handeling)
        .limit(1);
      if (zoekFout) throw zoekFout;

      let mepTaakId: string | null = bestaand?.[0]?.id ?? null;
      let dubbel = !!mepTaakId;

      if (!mepTaakId) {
        const { data: openTaken } = await supabase
          .from('mep_taken')
          .select('volgorde')
          .eq('vestiging', vestiging)
          .in('status', ['open', 'bezig']);
        const volgordes = (openTaken ?? []).map((t: any) => Number(t.volgorde ?? 0));
        const volgorde = volgordes.length ? Math.max(...volgordes) + 10 : 0;

        const { data: user } = await supabase.auth.getUser();
        const { data: taak, error: invoegFout } = await metHerstel(() =>
          supabase
            .from('mep_taken')
            .insert({
              vestiging,
              titel: item.naam,
              categorie: 'Algemeen',
              taak_datum: datum,
              handeling,
              doel_aantal: item.doel_aantal,
              doel_eenheid: item.eenheid,
              prioriteit: 2,
              volgorde,
              created_by: user.user?.id ?? null,
            })
            .select('id')
            .single(),
        );
        if (invoegFout) throw invoegFout;
        mepTaakId = taak.id;
      }

      const { data: user2 } = await supabase.auth.getUser();
      const { error: checkFout } = await metHerstel(() =>
        supabase.from('koelcel_checks').upsert(
          {
            item_id: item.id,
            vestiging,
            datum,
            status: item.type === 'vriezer' ? 'uit_vriezer' : 'naar_mep',
            mep_taak_id: mepTaakId,
            created_by: user2.user?.id ?? null,
          },
          { onConflict: 'item_id,datum' },
        ),
      );
      if (checkFout) throw checkFout;
      return { dubbel, item };
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: checksKey });
      qc.invalidateQueries({ queryKey: ['mep-taken', vestiging] });
    },
  });

  return { zetStatus, naarMep };
}
