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
  /** Genormaliseerde bakmaat: "GN 1/6 hoog". */
  formaat?: string | null;
  volgorde: number;
  actief: boolean;
  product_sleutel: string | null;
  /** In welke lade van de koelwerkbank het product ligt (null = nog niet ingedeeld). */
  lade_id?: string | null;
  /** Hoeveel hele reservebakjes er achter de hand horen te staan (koelwerkbank). */
  reserve_doel?: number | null;
  /** Tot hoever het werkbakje gevuld hoort te zijn: 'vol' of 'half'. */
  vulnorm?: string | null;
  /** Hoeveel er in een keer gemaakt wordt (MEP-batch); leeg = standaardberekening. */
  batch_aantal?: number | null;
}

/** Hoeveel hele reservebakjes er achter de hand horen te staan. */
export function reserveDoel(item: KoelcelCheckItem): number {
  return Math.max(Number(item.reserve_doel ?? 0), 0);
}

/** De vastgelegde batchgrootte, of null als die niet is ingevuld. */
export function batchGrootte(item: KoelcelCheckItem): number | null {
  const n = Number(item.batch_aantal ?? 0);
  return n > 0 ? n : null;
}

/** Product met een reserve-afspraak: tellen op hele reservebakjes. */
export function isReserveItem(item: KoelcelCheckItem): boolean {
  return item.plek === 'werkbank' && reserveDoel(item) > 0;
}

/** Koelwerkbankproduct zonder reserve: beoordelen op vol/half/bodempje/leeg. */
export function isVulItem(item: KoelcelCheckItem): boolean {
  return item.plek === 'werkbank' && reserveDoel(item) === 0;
}

/** De vulnorm als waarde: heel bakje (1) of half bakje (0,5). */
export function vulnormWaarde(item: KoelcelCheckItem): number {
  return (item.vulnorm ?? 'vol') === 'half' ? 0.5 : 1;
}

/** "hoort vol" / "hoort half". */
export function vulnormLabel(item: KoelcelCheckItem): string {
  return (item.vulnorm ?? 'vol') === 'half' ? 'hoort half' : 'hoort vol';
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
  return diepsteBron(item, alleItems).bestemming;
}

/**
 * Loopt de keten af tot het laagste niveau dat dit product nog voert, en geeft
 * dat item terug plus waar het bijbesteld/gemaakt moet worden.
 */
export function diepsteBron(
  item: KoelcelCheckItem,
  alleItems: KoelcelCheckItem[],
): { item: KoelcelCheckItem; bestemming: ReturnType<typeof bestemmingVoorBron> } {
  let huidig = item;
  for (let i = 0; i < 5; i++) {
    const volgend = vervolgactieVoorRegel(huidig, alleItems);
    if (volgend.soort !== 'niveau') return { item: huidig, bestemming: volgend };
    huidig = volgend.onderItem;
  }
  return { item: huidig, bestemming: bestemmingVoorBron(huidig.bron) };
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
  /** 1 = belangrijk (vandaag maken), 2 = normaal (mag morgen). */
  prioriteit: number = 2,
): Promise<{ id: string; dubbel: boolean }> {
  const { data: bestaand, error: zoekFout } = await supabase
    .from('mep_taken')
    .select('id, prioriteit')
    .eq('vestiging', vestiging)
    .in('status', ['open', 'bezig'])
    .ilike('titel', item.naam)
    .eq('handeling', handeling)
    .limit(1);
  if (zoekFout) throw zoekFout;
  if (bestaand?.[0]?.id) {
    const huidig = Number((bestaand[0] as any).prioriteit ?? 2);
    // Er staat al een taak: geen tweede regel, maar wel opwaarderen als het
    // bakje inmiddels bijna leeg is.
    if (prioriteit < huidig) {
      await metHerstel(() =>
        supabase.from('mep_taken').update({ prioriteit }).eq('id', bestaand[0].id),
      );
    }
    return { id: bestaand[0].id, dubbel: true };
  }

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
        prioriteit,
        volgorde,
        created_by: user.user?.id ?? null,
      })
      .select('id')
      .single(),
  );
  if (invoegFout) throw invoegFout;
  return { id: (taak as any).id, dubbel: false };
}


/**
 * Alles wat al voor dit product besteld is en nog niet geleverd: openstaande
 * regels op interne bestellingen naar Midsland. Zo bestellen we nooit twee keer
 * hetzelfde als er een week niet is aangevuld.
 */
async function openstaandVoorProduct(
  vestiging: string,
  naam: string,
  negeerRegelId?: string,
): Promise<number> {
  const { data: orders, error } = await supabase
    .from('internal_orders')
    .select('id, status')
    .eq('from_location', vestiging)
    .eq('to_location', 'Midsland')
    .not('status', 'in', '("delivered","cancelled","geannuleerd")')
    // Alleen recente bestellingen tellen als "onderweg": oude, nooit afgemelde
    // bestellingen mogen de behoefte van vandaag niet wegdrukken.
    .gte('created_at', new Date(Date.now() - 14 * 86400_000).toISOString());
  if (error) throw error;
  const ids = (orders ?? []).map((o: any) => o.id);
  if (!ids.length) return 0;

  const { data: regels, error: regelFout } = await supabase
    .from('internal_order_items')
    .select('id, quantity, ontvangen_aantal')
    .in('order_id', ids)
    .ilike('product_name', naam);
  if (regelFout) throw regelFout;

  return (regels ?? [])
    .filter((r: any) => r.id !== negeerRegelId)
    .reduce((som: number, r: any) => {
      const besteld = Number(r.quantity ?? 0);
      const ontvangen = Number(r.ontvangen_aantal ?? 0);
      return som + Math.max(besteld - ontvangen, 0);
    }, 0);
}

/**
 * Eén open signaal per product: de nieuwste telling overschrijft het aantal,
 * hij telt er niet bij op.
 */
async function opBestelbord(
  item: KoelcelCheckItem,
  vestiging: string,
  behoefte: number,
): Promise<{ dubbel: boolean; aantal: number }> {
  const { data: bestaand, error } = await supabase
    .from('bestel_signalen')
    .select('id, aantal')
    .eq('vestiging', vestiging)
    .eq('status', 'open')
    .ilike('naam', item.naam)
    .limit(1);
  if (error) throw error;
  if (bestaand?.[0]) {
    const huidig = Number((bestaand[0] as any).aantal ?? 0);
    if (behoefte !== huidig) {
      const { error: bijFout } = await metHerstel(() =>
        supabase.from('bestel_signalen').update({ aantal: behoefte }).eq('id', (bestaand[0] as any).id),
      );
      if (bijFout) throw bijFout;
    }
    return { dubbel: true, aantal: behoefte };
  }

  const { data: user } = await supabase.auth.getUser();
  const { error: invoegFout } = await metHerstel(() =>
    supabase.from('bestel_signalen').insert({
      vestiging,
      naam: item.naam,
      aantal: behoefte,
      eenheid: item.eenheid,
      bron: 'sluitlijst',
      gemeld_door: user.user?.id ?? null,
    }),
  );
  if (invoegFout) throw invoegFout;
  return { dubbel: false, aantal: behoefte };
}


function datumMorgen(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

/**
 * nodig = doel − wat er ligt − wat al besteld is en nog niet geleverd.
 * De regel op de conceptbestelling wordt bijgewerkt, nooit verdubbeld.
 */
async function naarMidsland(
  item: KoelcelCheckItem,
  vestiging: string,
  behoefte: number,
): Promise<{ dubbel: boolean; aantal: number; onderweg: number }> {
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

  // Staat het al op de conceptbestelling?
  let regel: any = null;
  if (orderId) {
    const { data: bestaand } = await supabase
      .from('internal_order_items')
      .select('id, quantity, handmatig_aangepast')
      .eq('order_id', orderId)
      .ilike('product_name', item.naam)
      .limit(1);
    regel = bestaand?.[0] ?? null;
  }

  // Wat er al onderweg is (verstuurde bestellingen en andere concepten).
  const onderweg = await openstaandVoorProduct(vestiging, item.naam, regel?.id);
  const nodig = Math.max(Math.round((behoefte - onderweg) * 100) / 100, 0);

  if (regel) {
    if (regel.handmatig_aangepast) return { dubbel: true, aantal: Number(regel.quantity ?? 0), onderweg };
    if (nodig <= 0) {
      const { error: wegFout } = await metHerstel(() =>
        supabase.from('internal_order_items').delete().eq('id', regel.id),
      );
      if (wegFout) throw wegFout;
      return { dubbel: true, aantal: 0, onderweg };
    }
    if (Number(regel.quantity ?? 0) !== nodig) {
      const { error: bijFout } = await metHerstel(() =>
        supabase.from('internal_order_items').update({ quantity: nodig }).eq('id', regel.id),
      );
      if (bijFout) throw bijFout;
    }
    return { dubbel: true, aantal: nodig, onderweg };
  }

  if (nodig <= 0) return { dubbel: true, aantal: 0, onderweg };

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

  const { error: regelFout } = await metHerstel(() =>
    supabase.from('internal_order_items').insert({
      order_id: orderId!,
      product_name: item.naam,
      quantity: nodig,
      unit: item.eenheid,
      bron: 'systeem',
    }),
  );
  if (regelFout) throw regelFout;
  return { dubbel: false, aantal: nodig, onderweg };
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
   * Aangevuld vanuit het niveau eronder: de bovenste regel is klaar, en wat er
   * uit het onderliggende niveau gehaald is wordt daar meteen weer bijbesteld
   * (bestelbord, Midsland of de mise-en-place), zodat die voorraad blijft kloppen.
   */
  const vulAanUitNiveau = useMutation({
    mutationFn: async ({
      item,
      onderItem,
      aantal = 1,
    }: {
      item: KoelcelCheckItem;
      onderItem: KoelcelCheckItem;
      /** Hoeveel er uit het niveau eronder gehaald is. */
      aantal?: number;
    }) => {
      const gehaald = Math.max(Number(aantal) || 1, 1);
      const { item: bronItem, bestemming } = diepsteBron(onderItem, alleItems);

      let mepTaakId: string | null = null;
      let dubbel = false;
      let geplaatst = gehaald;
      let onderweg = 0;

      if (bestemming.soort === 'mep') {
        const res = await mepTaakVoorItem(bronItem, vestiging, datum, bestemming.handeling!, gehaald);
        mepTaakId = res.id;
        dubbel = res.dubbel;
      } else if (bestemming.soort === 'bestelbord') {
        const res = await opBestelbord(bronItem, vestiging, gehaald);
        dubbel = res.dubbel;
        geplaatst = res.aantal;
      } else {
        const res = await naarMidsland(bronItem, vestiging, gehaald);
        dubbel = res.dubbel;
        geplaatst = res.aantal;
        onderweg = res.onderweg;
      }

      const { data: user } = await supabase.auth.getUser();
      const uid = user.user?.id ?? null;
      const { error } = await metHerstel(() =>
        supabase.from('koelcel_checks').upsert(
          [
            { item_id: item.id, vestiging, datum, status: 'aanwezig' as const, created_by: uid },
            {
              item_id: onderItem.id,
              vestiging,
              datum,
              status: 'uit_vriezer' as const,
              doorgezet_naar: bestemming.soort,
              aantal_doorgezet: geplaatst,
              mep_taak_id: mepTaakId,
              created_by: uid,
            },
          ] as any,
          { onConflict: 'item_id,datum' },
        ),
      );
      if (error) throw error;
      return { item, onderItem, bronItem, bestemming, gehaald, geplaatst, dubbel, onderweg };
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: checksKey });
      qc.invalidateQueries({ queryKey: ['mep-taken', vestiging] });
      qc.invalidateQueries({ queryKey: ['bestel-signalen', vestiging] });
      qc.invalidateQueries({ queryKey: ['openstaand-besteld', vestiging] });
      qc.invalidateQueries({ queryKey: ['internal-orders'] });
      qc.invalidateQueries({ queryKey: ['bestelbord-open', vestiging] });
      qc.invalidateQueries({ queryKey: ['mep-open-namen', vestiging] });
    },
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
      mepPrioriteit,
      mepAantal,
    }: {
      item: KoelcelCheckItem;
      /** De doelhoeveelheid van vandaag (rustig of druk). */
      doel?: number;
      /** Wat er nog ligt; 0 = helemaal op. */
      aanwezig?: number;
      /** 1 = vandaag maken, 2 = mag morgen. Alleen voor MEP-bestemmingen. */
      mepPrioriteit?: number;
      /** Hele batch in plaats van het rekenkundige tekort. */
      mepAantal?: number;
    }) => {
      const bestemming = vervolgactieVoorRegel(item, alleItems);
      const doelNu = Number(doel ?? item.doel_aantal ?? 1);
      const tekort = Math.max(doelNu - Number(aanwezig || 0), 1);
      let mepTaakId: string | null = null;
      let dubbel = false;
      // Wat er daadwerkelijk besteld wordt (kan lager zijn: er ligt al iets onderweg).
      let geplaatst = tekort;
      let onderweg = 0;

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
        // Zelf maken doe je in hele batches: nooit "0,5 bakje bijmaken".
        const batch = Math.max(Math.ceil(Number(mepAantal ?? tekort) - 0.001), 1);
        const res = await mepTaakVoorItem(
          item,
          vestiging,
          datum,
          bestemming.handeling!,
          batch,
          mepPrioriteit ?? 2,
        );
        geplaatst = batch;
        mepTaakId = res.id;
        dubbel = res.dubbel;
      } else if (bestemming.soort === 'bestelbord') {

        const res = await opBestelbord(item, vestiging, tekort);
        dubbel = res.dubbel;
        geplaatst = res.aantal;
      } else {
        const res = await naarMidsland(item, vestiging, tekort);
        dubbel = res.dubbel;
        geplaatst = res.aantal;
        onderweg = res.onderweg;
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
            aantal_doorgezet: bestemming.soort === 'niveau' ? null : geplaatst,
            created_by: user.user?.id ?? null,
          } as any,
          { onConflict: 'item_id,datum' },
        ),
      );
      if (checkFout) throw checkFout;
      return { dubbel, item, bestemming, tekort, geplaatst, onderweg };

    },

    onSettled: () => {
      qc.invalidateQueries({ queryKey: checksKey });
      qc.invalidateQueries({ queryKey: ['mep-taken', vestiging] });
      qc.invalidateQueries({ queryKey: ['bestel-signalen', vestiging] });
      qc.invalidateQueries({ queryKey: ['openstaand-besteld', vestiging] });
      qc.invalidateQueries({ queryKey: ['internal-orders'] });
      qc.invalidateQueries({ queryKey: ['bestelbord-open', vestiging] });
      qc.invalidateQueries({ queryKey: ['mep-open-namen', vestiging] });
    },

  });

  /**
   * "Alles ligt er": zet in één keer alle nog niet afgevinkte regels van een blok
   * op aanwezig. Zo is een normale sluitdienst een paar tikken in plaats van tachtig.
   */
  const zetAllesAanwezig = useMutation({
    mutationFn: async (teZetten: KoelcelCheckItem[]) => {
      if (!teZetten.length) return { aantal: 0 };
      const { data: user } = await supabase.auth.getUser();
      const uid = user.user?.id ?? null;
      const rijen = teZetten.map((item) => ({
        item_id: item.id,
        vestiging,
        datum,
        status: 'aanwezig' as const,
        created_by: uid,
      }));
      const { error } = await metHerstel(() =>
        supabase.from('koelcel_checks').upsert(rijen, { onConflict: 'item_id,datum' }),
      );
      if (error) throw error;
      return { aantal: rijen.length };
    },
    onMutate: async (teZetten: KoelcelCheckItem[]) => {
      await qc.cancelQueries({ queryKey: checksKey });
      const vorige = qc.getQueryData<KoelcelCheck[]>(checksKey);
      const ids = new Set(teZetten.map((i) => i.id));
      qc.setQueryData<KoelcelCheck[]>(checksKey, (huidig = []) => [
        ...huidig.filter((c) => !ids.has(c.item_id)),
        ...teZetten.map((item) => ({
          id: `optimistisch-${item.id}`,
          item_id: item.id,
          vestiging,
          datum,
          status: 'aanwezig' as const,
          mep_taak_id: null,
          doorgezet_naar: null,
          aantal_doorgezet: null,
          created_by: null,
        })),
      ]);
      return { vorige };
    },
    onError: (_e, _v, context: any) => {
      if (context?.vorige) qc.setQueryData(checksKey, context.vorige);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: checksKey }),
  });

  return { zetStatus, meldOp, vulAanUitNiveau, zetAllesAanwezig, naarMep: meldOp };
}

/**
 * Hoe vaak een product de laatste 30 dagen op of te weinig was. Producten die
 * vaak problemen geven staan bovenaan de lijst, de rest daaronder.
 */
export function useProbleemFrequentie(vestiging: string | null | undefined) {
  return useQuery({
    queryKey: ['koelcel-probleem-frequentie', vestiging],
    enabled: !!vestiging,
    staleTime: 10 * 60_000,
    queryFn: async (): Promise<Record<string, number>> => {
      const vanaf = new Date();
      vanaf.setDate(vanaf.getDate() - 30);
      const { data, error } = await supabase
        .from('koelcel_checks')
        .select('item_id, status, datum')
        .eq('vestiging', vestiging!)
        .gte('datum', vanaf.toISOString().slice(0, 10));
      if (error) throw error;
      const map: Record<string, number> = {};
      for (const rij of (data ?? []) as any[]) {
        if (rij.status !== 'gemeld' && rij.status !== 'naar_mep') continue;
        map[rij.item_id] = (map[rij.item_id] ?? 0) + 1;
      }
      return map;
    },
  });
}


/**
 * Hoeveel er voor dit product onderweg is vanuit Midsland. Alleen het niveau dat
 * Midsland ook echt levert (de vriescelregel) kan iets onderweg hebben: de koelcel
 * en de koelwerkbank vul je zelf bij uit het niveau eronder. Zonder deze check
 * plakte een bestelling voor de vriescel op alle regels met dezelfde naam
 * (wortelspread, tomatenjam, tomatenrelish, tempeh ...).
 */
export function onderwegVoorItem(
  item: KoelcelCheckItem,
  map: Record<string, number>,
): number {
  if (item.bron !== 'midsland') return 0;
  return map[item.naam.trim().toLowerCase()] ?? 0;
}

/**
 * Per product: hoeveel er al besteld is bij Midsland en nog niet geleverd.
 * Wordt onder de regel getoond zodat niemand nog een keer hetzelfde bestelt.
 * Alleen verstuurde bestellingen tellen mee; een concept staat nog in West.
 */
export function useOpenstaandeBestellingen(vestiging: string) {
  return useQuery({
    queryKey: ['openstaand-besteld', vestiging],
    enabled: !!vestiging,
    staleTime: 30_000,
    queryFn: async () => {
      const { data: orders, error } = await supabase
        .from('internal_orders')
        .select('id')
        .eq('from_location', vestiging)
        .eq('to_location', 'Midsland')
        .not('status', 'in', '("concept","delivered","cancelled","geannuleerd")')
        .gte('created_at', new Date(Date.now() - 14 * 86400_000).toISOString());
      if (error) throw error;
      const ids = (orders ?? []).map((o: any) => o.id);
      const map: Record<string, number> = {};
      if (!ids.length) return map;

      const { data: regels, error: regelFout } = await supabase
        .from('internal_order_items')
        .select('product_name, quantity, ontvangen_aantal')
        .in('order_id', ids);
      if (regelFout) throw regelFout;

      for (const r of (regels ?? []) as any[]) {
        const open = Math.max(Number(r.quantity ?? 0) - Number(r.ontvangen_aantal ?? 0), 0);
        if (open <= 0) continue;
        const sleutel = String(r.product_name ?? '').trim().toLowerCase();
        map[sleutel] = (map[sleutel] ?? 0) + open;
      }
      return map;
    },
  });
}

/**
 * Per product: hoeveel er open staat op het bestelbord (inkoop). De ronde toont
 * dit als "staat op het bestelbord" en meldt het niet nog een keer.
 */
export function useBestelbordOpen(vestiging: string) {
  return useQuery({
    queryKey: ['bestelbord-open', vestiging],
    enabled: !!vestiging,
    staleTime: 30_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bestel_signalen')
        .select('naam, aantal')
        .eq('vestiging', vestiging)
        .eq('status', 'open');
      if (error) throw error;
      const map: Record<string, number> = {};
      for (const r of (data ?? []) as any[]) {
        const sleutel = String(r.naam ?? '').trim().toLowerCase();
        if (!sleutel) continue;
        map[sleutel] = (map[sleutel] ?? 0) + Number(r.aantal ?? 0);
      }
      return map;
    },
  });
}

/**
 * Titels van open MEP-taken (klein geschreven). De ronde herkent zo dat een
 * product al "wordt gemaakt" en maakt geen dubbele taak.
 */
export function useMepOpenNamen(vestiging: string) {
  return useQuery({
    queryKey: ['mep-open-namen', vestiging],
    enabled: !!vestiging,
    staleTime: 30_000,
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from('mep_taken')
        .select('titel')
        .eq('vestiging', vestiging)
        .in('status', ['open', 'bezig']);
      if (error) throw error;
      return (data ?? [])
        .map((r: any) => String(r.titel ?? '').trim().toLowerCase())
        .filter(Boolean);
    },
  });
}
