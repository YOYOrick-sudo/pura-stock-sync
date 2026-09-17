import { useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { metHerstel } from '@/lib/appWake';
import { useKanaalHerstel } from '@/lib/realtime';

/** Waar komt het product vandaan? Bepaalt wat er gebeurt als het op is. */
export type VoorraadBron = 'vriezer' | 'koelcel_inkoop' | 'magazijn' | 'zelf_west' | 'midsland';
/** Waar hoort het product te liggen/staan. */
export type VoorraadPlek = 'vriezer' | 'koelcel' | 'werkbank' | 'werkblad';

export const BRON_LABEL: Record<VoorraadBron, string> = {
  vriezer: 'Uit de vriezer',
  koelcel_inkoop: 'Ingekocht',
  magazijn: 'Magazijn (roosteren)',
  zelf_west: 'Zelf maken in West',
  midsland: 'Uit Midsland',
};

export const PLEK_LABEL: Record<VoorraadPlek, string> = {
  vriezer: 'Uit de vriezer (ontdooien)',
  koelcel: 'Koelcel op peil',
  werkbank: 'Werkbank bijvullen',
  werkblad: 'Werkblad bijvullen',
};

export interface KoelcelCheckItem {
  id: string;
  vestiging: string;
  naam: string;
  doel_aantal: number;
  eenheid: string;
  type: 'koelcel' | 'vriezer';
  plek: VoorraadPlek;
  bron: VoorraadBron;
  bak_maat: string | null;
  volgorde: number;
  actief: boolean;
}

export type KoelcelCheckStatus = 'aanwezig' | 'naar_mep' | 'uit_vriezer' | 'gemeld';

export interface KoelcelCheck {
  id: string;
  item_id: string;
  vestiging: string;
  datum: string;
  status: KoelcelCheckStatus;
  mep_taak_id: string | null;
  doorgezet_naar: string | null;
  created_by: string | null;
}

/** Waar een "Op"-melding heen gaat, op basis van de bron van het product. */
export function bestemmingVoorBron(bron: VoorraadBron): {
  soort: 'mep' | 'bestelbord' | 'midsland';
  handeling?: string;
  label: string;
} {
  switch (bron) {
    case 'zelf_west':
      return { soort: 'mep', handeling: 'Bereiden', label: 'de mise-en-place' };
    case 'vriezer':
      return { soort: 'mep', handeling: 'Ontdooien', label: 'de ontdooilijst' };
    case 'magazijn':
      return { soort: 'mep', handeling: 'Roosteren', label: 'de mise-en-place' };
    case 'midsland':
      return { soort: 'midsland', label: 'de bestellijst voor Midsland' };
    case 'koelcel_inkoop':
    default:
      return { soort: 'bestelbord', label: 'het bestelbord' };
  }
}

/** Actieve productkaarten van de voorraad-check voor een vestiging. */
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
      return (data ?? []) as unknown as KoelcelCheckItem[];
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
      return (data ?? []) as unknown as KoelcelCheck[];
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

async function mepTaakVoorItem(
  item: KoelcelCheckItem,
  vestiging: string,
  datum: string,
  handeling: string,
): Promise<{ id: string; dubbel: boolean }> {
  const { data: bestaand, error: zoekFout } = await supabase
    .from('mep_taken')
    .select('id')
    .eq('vestiging', vestiging)
    .in('status', ['open', 'bezig'])
    .ilike('titel', item.naam)
    .eq('handeling', handeling)
    .limit(1);
  if (zoekFout) throw zoekFout;
  if (bestaand?.[0]?.id) return { id: bestaand[0].id, dubbel: true };

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
  return { id: (taak as any).id, dubbel: false };
}

async function opBestelbord(item: KoelcelCheckItem, vestiging: string): Promise<boolean> {
  const { data: bestaand, error } = await supabase
    .from('bestel_signalen')
    .select('id')
    .eq('vestiging', vestiging)
    .eq('status', 'open')
    .ilike('naam', item.naam)
    .limit(1);
  if (error) throw error;
  if (bestaand?.[0]) return true;

  const { data: user } = await supabase.auth.getUser();
  const { error: invoegFout } = await metHerstel(() =>
    supabase.from('bestel_signalen').insert({
      vestiging,
      naam: item.naam,
      aantal: item.doel_aantal,
      eenheid: item.eenheid,
      bron: 'sluitlijst',
      gemeld_door: user.user?.id ?? null,
    }),
  );
  if (invoegFout) throw invoegFout;
  return false;
}

async function naarMidsland(item: KoelcelCheckItem, vestiging: string): Promise<boolean> {
  const { data: orders, error: zoekFout } = await supabase
    .from('internal_orders')
    .select('id')
    .eq('from_location', vestiging)
    .eq('to_location', 'Midsland')
    .eq('status', 'concept')
    .order('created_at', { ascending: false })
    .limit(1);
  if (zoekFout) throw zoekFout;

  let orderId = orders?.[0]?.id ?? null;
  const { data: user } = await supabase.auth.getUser();

  if (!orderId) {
    const { data: nieuw, error: maakFout } = await metHerstel(() =>
      supabase
        .from('internal_orders')
        .insert({
          from_location: vestiging,
          to_location: 'Midsland',
          status: 'concept',
          requested_by: user.user?.id ?? null,
          notes: 'Automatisch aangemaakt vanuit de sluitlijst',
        })
        .select('id')
        .single(),
    );
    if (maakFout) throw maakFout;
    orderId = (nieuw as any).id;
  }

  const { data: bestaand } = await supabase
    .from('internal_order_items')
    .select('id')
    .eq('order_id', orderId!)
    .ilike('product_name', item.naam)
    .limit(1);
  if (bestaand?.[0]) return true;

  const { error: regelFout } = await metHerstel(() =>
    supabase.from('internal_order_items').insert({
      order_id: orderId!,
      product_name: item.naam,
      quantity: item.doel_aantal,
      unit: item.eenheid,
      bron: 'sluitlijst',
    }),
  );
  if (regelFout) throw regelFout;
  return false;
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
                doorgezet_naar: null,
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
   * "Op": het product kon niet aangevuld worden. Op basis van de bron gaat het
   * automatisch naar de mise-en-place, het bestelbord of de bestellijst voor
   * Midsland. Dubbele meldingen worden voorkomen.
   */
  const meldOp = useMutation({
    mutationFn: async (item: KoelcelCheckItem) => {
      const bestemming = bestemmingVoorBron(item.bron);
      let mepTaakId: string | null = null;
      let dubbel = false;

      if (bestemming.soort === 'mep') {
        const res = await mepTaakVoorItem(item, vestiging, datum, bestemming.handeling!);
        mepTaakId = res.id;
        dubbel = res.dubbel;
      } else if (bestemming.soort === 'bestelbord') {
        dubbel = await opBestelbord(item, vestiging);
      } else {
        dubbel = await naarMidsland(item, vestiging);
      }

      const { data: user } = await supabase.auth.getUser();
      const { error: checkFout } = await metHerstel(() =>
        supabase.from('koelcel_checks').upsert(
          {
            item_id: item.id,
            vestiging,
            datum,
            status: 'gemeld',
            doorgezet_naar: bestemming.soort,
            mep_taak_id: mepTaakId,
            created_by: user.user?.id ?? null,
          },
          { onConflict: 'item_id,datum' },
        ),
      );
      if (checkFout) throw checkFout;
      return { dubbel, item, bestemming };
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: checksKey });
      qc.invalidateQueries({ queryKey: ['mep-taken', vestiging] });
      qc.invalidateQueries({ queryKey: ['bestel-signalen', vestiging] });
    },
  });

  return { zetStatus, meldOp, naarMep: meldOp };
}
