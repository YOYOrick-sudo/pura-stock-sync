import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { bestelbordViaRpc, type BordClient } from '@/lib/taakVervolgBord';
import { useInternePlaatsen } from '@/hooks/useInterneLevering';
import {
  normaliseerVervolg,
  rijVanDatabase,
  type TaakVervolgRij,
  type VervolgInvoer,
} from '@/lib/taakVervolg';

type RpcFout = { message: string; code?: string } | null;
const los = supabase as unknown as {
  rpc(naam: string, args?: Record<string, unknown>): Promise<{ data: unknown; error: RpcFout }>;
  from(tabel: string): {
    select(kolommen: string): Promise<{ data: unknown; error: RpcFout }>;
  };
};

function bordClient(): BordClient {
  return {
    rpc: (naam, args) => los.rpc(naam, args),
    openSignaal: async (vestiging, naam) => {
      const { data, error } = await supabase
        .from('bestel_signalen')
        .select('id')
        .eq('vestiging', vestiging)
        .eq('status', 'open')
        .ilike('naam', naam)
        .limit(1);
      if (error) throw error;
      const id = (data?.[0] as { id?: string } | undefined)?.id;
      return id ? { id } : null;
    },
    zoek: async (vestiging, naam) => {
      const { data, error } = await los.rpc('rpc_bord_suggesties', {
        p_vestiging: vestiging,
        p_tekst: naam,
        p_limit: 5,
      });
      if (error) throw new Error(error.message);
      const rij = (Array.isArray(data) ? data[0] : null) as {
        artikel_id?: string | null;
        leverancier_id?: string | null;
        vormen?: { id?: string | null }[] | null;
      } | null;
      if (!rij) return null;
      return {
        artikelId: rij.artikel_id ?? null,
        artikelVormId: rij.vormen?.find((vorm) => vorm.id)?.id ?? null,
        leverancierId: rij.leverancier_id ?? null,
      };
    },
  };
}

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

/** Lezen mag iedereen van de vestiging. Schrijven gaat alleen via de eigenaar-RPC. */
export function useTaakVervolg(vestiging: string, datum: string, aan: boolean) {
  const qc = useQueryClient();
  const plaatsen = useInternePlaatsen();
  const key = ['taak-vervolg-config', vestiging] as const;

  const query = useQuery({
    queryKey: key,
    enabled: aan && !!vestiging,
    retry: false,
    staleTime: 30_000,
    queryFn: async (): Promise<TaakVervolgRij[]> => {
      const { data, error } = await los.from('taak_vervolg_config').select(
        'taak_sleutel, vestiging, instructie, vervolgactie, vervolg_als_op',
      );
      if (error) return [];
      return ((data ?? []) as Record<string, unknown>[])
        .map((rij) => rijVanDatabase(rij))
        .filter((rij): rij is TaakVervolgRij => !!rij);
    },
  });

  const bewaar = useMutation({
    mutationFn: async (input: { taakSleutel: string; invoer: VervolgInvoer }) => {
      const schoon = normaliseerVervolg(input.invoer);
      const { error } = await los.rpc('taak_vervolg_config_opslaan', {
        p_taak_sleutel: input.taakSleutel,
        p_vestiging: vestiging,
        p_instructie: schoon.instructie,
        p_vervolgactie: schoon.vervolgactie,
        p_vervolg_als_op: schoon.vervolgAlsOp,
      });
      if (error) throw new Error(error.message || 'Niet opgeslagen');
      return { taakSleutel: input.taakSleutel, ...schoon, vestiging };
    },
    onSuccess: (rij) => {
      qc.setQueryData<TaakVervolgRij[]>(key, (huidig = []) => [
        ...huidig.filter((oud) => !(oud.taakSleutel === rij.taakSleutel && oud.vestiging === rij.vestiging)),
        {
          taakSleutel: rij.taakSleutel,
          vestiging: rij.vestiging,
          instructie: rij.instructie,
          vervolgactie: rij.vervolgactie,
          vervolgAlsOp: rij.vervolgAlsOp,
        },
      ]);
    },
  });

  const bestelbord = async (item: { id: string; naam: string; eenheid?: string | null; doel_aantal?: number | null; leverancier?: string | null }) => {
    const uit = await bestelbordViaRpc(bordClient(), {
      vestiging,
      naam: item.naam,
      eenheid: item.eenheid || 'stuk',
      leverancierId: null,
    });
    if (!uit.gekoppeld) throw new Error(uit.reden || 'De bordregel is niet gekoppeld.');
    const aantal = Number(item.doel_aantal ?? 1) || 1;
    await schrijfDoorgezet({ itemId: item.id, vestiging, datum, naar: 'bestelbord', aantal });
    qc.invalidateQueries({ queryKey: ['koelcel-checks', vestiging, datum] });
    qc.invalidateQueries({ queryKey: ['bestel-signalen', vestiging] });
    return uit;
  };

  const intern = async (item: { id: string; doel_aantal?: number | null }, productId: string) => {
    const aantal = Math.max(1, Number(item.doel_aantal ?? 1) || 1);
    await plaatsen.mutateAsync({
      productId,
      aantal,
      sleutel: crypto.randomUUID(),
      notitie: 'Vanuit de sluitlijst',
    });
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
