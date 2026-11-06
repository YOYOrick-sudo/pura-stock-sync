import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { bestelOpdracht, opBestelbord, type KoelcelCheckItem } from '@/hooks/useKoelcelCheck';
import { useInternePlaatsen } from '@/hooks/useInterneLevering';
import { useInterneV2Plaatsen } from '@/hooks/useInterneLeveringV2';
import {
  normaliseerKeten,
  rijVanDatabase,
  type KetenInvoer,
  type KetenRij,
} from '@/lib/taakVervolg';

type RpcFout = { message: string; code?: string } | null;
const los = supabase as unknown as {
  rpc(naam: string, args?: Record<string, unknown>): Promise<{ data: unknown; error: RpcFout }>;
  from(tabel: string): {
    select(kolommen: string): Promise<{ data: unknown; error: RpcFout }>;
  };
};

async function schrijfDoorgezet(input: {
  itemId: string;
  vestiging: string;
  datum: string;
  naar: 'bestelbord' | 'midsland';
  aantal: number;
}) {
  const { data: user } = await supabase.auth.getUser();
  const { error } = await supabase.from('koelcel_checks').upsert(
    {
      item_id: input.itemId,
      vestiging: input.vestiging,
      datum: input.datum,
      status: 'gemeld',
      doorgezet_naar: input.naar,
      aantal_doorgezet: input.aantal,
      created_by: user.user?.id ?? null,
    } as never,
    { onConflict: 'item_id,datum' },
  );
  if (error) throw error;
}

/**
 * Lezen mag iedereen van de vestiging. Schrijven gaat alleen via de eigenaar-RPC.
 * `aan` zet alleen de leesquery aan. `taak_vervolg_config_opslaan` hangt er niet van af.
 */
const KOLOMMEN_NIEUW = 'taak_sleutel, vestiging, instructie, vervolgactie, vervolg_als_op, stap_koelcel, stap_vriezer, stap_magazijn, eindactie';
const KOLOMMEN_OUD = 'taak_sleutel, vestiging, instructie, vervolgactie, vervolg_als_op';

export function useTaakVervolg(vestiging: string, datum: string, aan: boolean) {
  const qc = useQueryClient();
  const plaatsen = useInternePlaatsen();
  const plaatsenV2 = useInterneV2Plaatsen();
  const key = ['taak-vervolg-config', vestiging] as const;

  const query = useQuery({
    queryKey: key,
    enabled: aan && !!vestiging,
    retry: false,
    staleTime: 30_000,
    queryFn: async (): Promise<KetenRij[]> => {
      const nieuw = await los.from('taak_vervolg_config').select(KOLOMMEN_NIEUW);
      const gelezen = nieuw.error
        ? await los.from('taak_vervolg_config').select(KOLOMMEN_OUD)
        : nieuw;
      if (gelezen.error) return [];
      return ((gelezen.data ?? []) as Record<string, unknown>[])
        .map((rij) => rijVanDatabase(rij))
        .filter((rij): rij is KetenRij => !!rij);
    },
  });

  const bewaar = useMutation({
    mutationFn: async (input: { taakSleutel: string; invoer: KetenInvoer; midslandVast: boolean }) => {
      const schoon = normaliseerKeten(input.invoer, { midslandVast: input.midslandVast });
      const { error } = await los.rpc('taak_vervolg_config_opslaan', {
        p_taak_sleutel: input.taakSleutel,
        p_vestiging: vestiging,
        p_instructie: schoon.instructie,
        p_stap_koelcel: schoon.stapKoelcel,
        p_stap_vriezer: schoon.stapVriezer,
        p_stap_magazijn: schoon.stapMagazijn,
        p_eindactie: schoon.eindactie,
      });
      if (error) throw new Error(error.message || 'Niet opgeslagen');
      return { taakSleutel: input.taakSleutel, ...schoon, vestiging };
    },
    onSuccess: (rij) => {
      qc.setQueryData<KetenRij[]>(key, (huidig = []) => [
        ...huidig.filter((oud) => !(oud.taakSleutel === rij.taakSleutel && oud.vestiging === rij.vestiging)),
        {
          taakSleutel: rij.taakSleutel,
          vestiging: rij.vestiging,
          instructie: rij.instructie,
          stapKoelcel: rij.stapKoelcel,
          stapVriezer: rij.stapVriezer,
          stapMagazijn: rij.stapMagazijn,
          eindactie: rij.eindactie,
        },
      ]);
    },
  });

  const bestelbord = async (item: KoelcelCheckItem) => {
    const doel = Number(item.doel_aantal ?? 1);
    const opdracht = bestelOpdracht(item, doel > 0 ? doel : 1, 0);
    const uit = await opBestelbord(item, vestiging, opdracht.eenheden, {
      eenheid: opdracht.eenheidNaam,
      notitie: 'Vanuit de sluitlijst',
    });
    await schrijfDoorgezet({ itemId: item.id, vestiging, datum, naar: 'bestelbord', aantal: uit.aantal });
    qc.invalidateQueries({ queryKey: ['koelcel-checks', vestiging, datum] });
    qc.invalidateQueries({ queryKey: ['bestel-signalen', vestiging] });
    return uit;
  };

  const intern = async (
    item: { id: string; doel_aantal?: number | null },
    productId: string,
    via: 'v1' | 'v2' = 'v1',
  ) => {
    const aantal = Math.max(1, Number(item.doel_aantal ?? 1) || 1);
    // Zelfde sleutel bij een tik en bij opnieuw proberen, zodat er geen tweede bestelling komt.
    const sleutel = `sluitlijst:${vestiging}:${datum}:${item.id}`;
    if (via === 'v2') {
      await plaatsenV2.mutateAsync({
        vestiging,
        productId,
        aantal,
        sleutel,
        notitie: 'Vanuit de sluitlijst',
      });
    } else {
      await plaatsen.mutateAsync({
        productId,
        aantal,
        sleutel,
        notitie: 'Vanuit de sluitlijst',
      });
    }
    await schrijfDoorgezet({ itemId: item.id, vestiging, datum, naar: 'midsland', aantal });
    qc.invalidateQueries({ queryKey: ['koelcel-checks', vestiging, datum] });
  };

  return {
    rijen: query.data ?? [],
    bewaar,
    bestelbord,
    intern,
  };
}
