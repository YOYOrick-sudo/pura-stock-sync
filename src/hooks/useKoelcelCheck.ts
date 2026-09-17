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
  werkbank: 'Koelwerkbank bijvullen',
  werkblad: 'Toppings bijvullen',
};

export interface KoelcelCheckItem {
  id: string;
  vestiging: string;
  naam: string;
  doel_aantal: number;
  doel_aantal_druk: number | null;
  eenheid: string;
  type: 'koelcel' | 'vriezer';
  plek: VoorraadPlek;
  bron: VoorraadBron;
  bak_maat: string | null;
  volgorde: number;
  actief: boolean;
  product_sleutel: string | null;
}

export type DrukteModus = 'rustig' | 'druk';

/** Hoeveel er moet liggen, afhankelijk van of het rustig of druk is. */
export function doelAantal(item: KoelcelCheckItem, drukte: DrukteModus): number {
  const druk = Number(item.doel_aantal_druk ?? 0);
  if (drukte === 'druk' && druk > 0) return druk;
  return Number(item.doel_aantal);
}

/**
 * De niveaus eronder, in volgorde: de koelwerkbank wordt bijgevuld uit de koelcel,
 * en als daar geen regel voor is rechtstreeks uit de vriescel.
 */
export const NIVEAU_KETEN: Record<VoorraadPlek, VoorraadPlek[]> = {
  werkbank: ['koelcel', 'vriezer'],
  werkblad: ['koelcel', 'vriezer'],
  koelcel: ['vriezer'],
  vriezer: [],
};


export type KoelcelCheckStatus = 'aanwezig' | 'naar_mep' | 'uit_vriezer' | 'gemeld';

export interface KoelcelCheck {
  id: string;
  item_id: string;
  vestiging: string;
  datum: string;
  status: KoelcelCheckStatus;
  mep_taak_id: string | null;
  doorgezet_naar: string | null;
  aantal_doorgezet: number | null;
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

/**
 * Wat er gebeurt als dit product op is. Ligt hetzelfde product ook op het niveau
 * eronder (koelcel, vriescel), dan schuift de melding daarheen. Pas op het laagste
 * niveau gaat het naar de mise-en-place, het bestelbord of Midsland.
 */
export function vervolgactieVoorRegel(
  item: KoelcelCheckItem,
  alleItems: KoelcelCheckItem[],
): { soort: 'niveau'; onderItem: KoelcelCheckItem; label: string } | ReturnType<typeof bestemmingVoorBron> {
  if (item.product_sleutel) {
    for (const onder of NIVEAU_KETEN[item.plek] ?? []) {
      const onderItem = alleItems.find(
        (i) => i.product_sleutel === item.product_sleutel && i.plek === onder && i.actief,
      );
      if (onderItem) {
        return { soort: 'niveau', onderItem, label: PLEK_LABEL[onder].toLowerCase() };
      }
    }
  }
  return bestemmingVoorBron(item.bron);

}

/** Waar je het vandaan haalt: "de koelcel" of "de vriescel". */
export const HERKOMST_LABEL: Record<VoorraadPlek, string> = {
  vriezer: 'de vriescel',
  koelcel: 'de koelcel',
  werkbank: 'de koelwerkbank',
  werkblad: 'het werkblad',
};

/** Waar je het naartoe brengt: "in de koelcel", "in de koelwerkbank". */
export const BESTEMMING_LABEL: Record<VoorraadPlek, string> = {
  vriezer: 'in de vriescel',
  koelcel: 'in de koelcel',
  werkbank: 'in de koelwerkbank',
  werkblad: 'op het werkblad',
};

/**
 * Loopt de hele keten af en geeft terug waar het uiteindelijk vandaan moet komen
 * als álle niveaus leeg zijn (bestelbord, mise-en-place of Midsland).
 */
export function eindBestemming(
  item: KoelcelCheckItem,
  alleItems: KoelcelCheckItem[],
): ReturnType<typeof bestemmingVoorBron> {
  let huidig = item;
  for (let i = 0; i < 5; i++) {
    const volgend = vervolgactieVoorRegel(huidig, alleItems);
    if (volgend.soort !== 'niveau') return volgend;
    huidig = volgend.onderItem;
  }
  return bestemmingVoorBron(huidig.bron);
}


/** Rustig of druk: bepaalt welke hoeveelheden de sluitlijst toont. */
export function useDrukteModus(vestiging: string | null | undefined) {
  return useQuery({
    queryKey: ['drukte-modus', vestiging],
    enabled: !!vestiging,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<DrukteModus> => {
      const { data, error } = await (supabase as any)
        .from('vestiging_instellingen')
        .select('drukte_modus')
        .eq('vestiging', vestiging!)
        .maybeSingle();
      if (error) throw error;
      return ((data as any)?.drukte_modus as DrukteModus) ?? 'rustig';
    },
  });
}

/** Schakelaar rustig/druk voor een vestiging. */
export function useZetDrukteModus(vestiging: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (modus: DrukteModus) => {
      const { error } = await (supabase as any)
        .from('vestiging_instellingen')
        .upsert({ vestiging, drukte_modus: modus, updated_at: new Date().toISOString() }, { onConflict: 'vestiging' });
      if (error) throw error;
      return modus;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['drukte-modus', vestiging] }),
  });
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
  aantal: number,
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
        doel_aantal: aantal,
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

async function opBestelbord(item: KoelcelCheckItem, vestiging: string, aantal: number): Promise<boolean> {
  const { data: bestaand, error } = await supabase
    .from('bestel_signalen')
    .select('id, aantal')
    .eq('vestiging', vestiging)
    .eq('status', 'open')
    .ilike('naam', item.naam)
    .limit(1);
  if (error) throw error;
  if (bestaand?.[0]) {
    // Al gemeld: hoogste tekort laten staan, niet dubbel bestellen.
    const huidig = Number((bestaand[0] as any).aantal ?? 0);
    if (aantal > huidig) {
      const { error: bijFout } = await metHerstel(() =>
        supabase.from('bestel_signalen').update({ aantal }).eq('id', (bestaand[0] as any).id),
      );
      if (bijFout) throw bijFout;
    }
    return true;
  }

  const { data: user } = await supabase.auth.getUser();
  const { error: invoegFout } = await metHerstel(() =>
    supabase.from('bestel_signalen').insert({
      vestiging,
      naam: item.naam,
      aantal,
      eenheid: item.eenheid,
      bron: 'sluitlijst',
      gemeld_door: user.user?.id ?? null,
    }),
  );
  if (invoegFout) throw invoegFout;
  return false;
}


function datumMorgen(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

async function naarMidsland(item: KoelcelCheckItem, vestiging: string, aantal: number): Promise<boolean> {
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
          delivery_date: datumMorgen(),
          order_number: '',
          notes: 'Automatisch aangemaakt vanuit de sluitlijst',
        } as any)
        .select('id')
        .single(),
    );
    if (maakFout) throw maakFout;
    orderId = (nieuw as any).id;
  }

  const { data: bestaand } = await supabase
    .from('internal_order_items')
    .select('id, quantity')
    .eq('order_id', orderId!)
    .ilike('product_name', item.naam)
    .limit(1);
  if (bestaand?.[0]) {
    // Staat er al op: het grootste tekort aanhouden in plaats van optellen.
    const huidig = Number((bestaand[0] as any).quantity ?? 0);
    if (aantal > huidig) {
      const { error: bijFout } = await metHerstel(() =>
        supabase.from('internal_order_items').update({ quantity: aantal }).eq('id', (bestaand[0] as any).id),
      );
      if (bijFout) throw bijFout;
    }
    return true;
  }

  const { error: regelFout } = await metHerstel(() =>
    supabase.from('internal_order_items').insert({
      order_id: orderId!,
      product_name: item.naam,
      quantity: aantal,
      unit: item.eenheid,
      bron: 'sluitlijst',
    }),
  );
  if (regelFout) throw regelFout;
  return false;
}

export function useKoelcelCheckMutaties(
  vestiging: string,
  datum: string,
  alleItems: KoelcelCheckItem[] = [],
) {
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
                aantal_doorgezet: null,
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
   * Aangevuld vanuit het niveau eronder: de bovenste regel is klaar, en op de
   * onderliggende regel leggen we vast dat daar iets uit gehaald is (zodat de
   * maandagse vriescelcheck weet waar geteld moet worden).
   */
  const vulAanUitNiveau = useMutation({
    mutationFn: async ({ item, onderItem }: { item: KoelcelCheckItem; onderItem: KoelcelCheckItem }) => {
      const { data: user } = await supabase.auth.getUser();
      const uid = user.user?.id ?? null;
      const { error } = await metHerstel(() =>
        supabase.from('koelcel_checks').upsert(
          [
            { item_id: item.id, vestiging, datum, status: 'aanwezig' as const, created_by: uid },
            { item_id: onderItem.id, vestiging, datum, status: 'uit_vriezer' as const, created_by: uid },
          ],
          { onConflict: 'item_id,datum' },
        ),
      );
      if (error) throw error;
      return { item, onderItem };
    },
    onSettled: () => qc.invalidateQueries({ queryKey: checksKey }),
  });



  /**
   * "Op": het product kon niet aangevuld worden. Ligt hetzelfde product ook een
   * niveau lager (koelcel, vriescel), dan schuift de melding daarheen. Pas op het
   * laagste niveau gaat het naar de mise-en-place, het bestelbord of Midsland.
   */
  const meldOp = useMutation({
    mutationFn: async ({
      item,
      doel,
      aanwezig = 0,
    }: {
      item: KoelcelCheckItem;
      /** De doelhoeveelheid van vandaag (rustig of druk). */
      doel?: number;
      /** Wat er nog ligt; 0 = helemaal op. */
      aanwezig?: number;
    }) => {
      const bestemming = vervolgactieVoorRegel(item, alleItems);
      const doelNu = Number(doel ?? item.doel_aantal ?? 1);
      const tekort = Math.max(doelNu - Number(aanwezig || 0), 1);
      let mepTaakId: string | null = null;
      let dubbel = false;

      if (bestemming.soort === 'niveau') {
        // Het niveau eronder moet opnieuw gecontroleerd worden: haal een eerdere
        // "aanwezig" daar weg zodat het zichtbaar open staat.
        const { error } = await metHerstel(() =>
          supabase
            .from('koelcel_checks')
            .delete()
            .eq('item_id', bestemming.onderItem.id)
            .eq('datum', datum),
        );
        if (error) throw error;
      } else if (bestemming.soort === 'mep') {
        const res = await mepTaakVoorItem(item, vestiging, datum, bestemming.handeling!, tekort);
        mepTaakId = res.id;
        dubbel = res.dubbel;
      } else if (bestemming.soort === 'bestelbord') {
        dubbel = await opBestelbord(item, vestiging, tekort);
      } else {
        dubbel = await naarMidsland(item, vestiging, tekort);
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
            aantal_doorgezet: bestemming.soort === 'niveau' ? null : tekort,
            created_by: user.user?.id ?? null,
          } as any,
          { onConflict: 'item_id,datum' },
        ),
      );
      if (checkFout) throw checkFout;
      return { dubbel, item, bestemming, tekort };
    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: checksKey });
      qc.invalidateQueries({ queryKey: ['mep-taken', vestiging] });
      qc.invalidateQueries({ queryKey: ['bestel-signalen', vestiging] });
    },
  });

  return { zetStatus, meldOp, vulAanUitNiveau, naarMep: meldOp };
}
