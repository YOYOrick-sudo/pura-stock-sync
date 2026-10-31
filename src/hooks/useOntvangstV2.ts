import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { bepaalModus, type OntvangstModus, type Schakelaar } from '@/lib/ontvangstV2';

// Functies staan nog niet in de gegenereerde types: lokale definities + cast.
const rpc = (naam: string, args?: Record<string, unknown>) =>
  (supabase.rpc as unknown as (n: string, a?: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>)(naam, args);

async function lees<T>(naam: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await rpc(naam, args);
  if (error) throw new Error(error.message);
  return data as T;
}

export type OntvangstRestant = {
  soort: string; regel_id: string | null; api_backorder_id: string | null; bestel_signaal_id: string | null;
  artikel_id: string | null; leverancier_id: string | null; leverancier_naam: string | null; naam: string;
  aantal: number; eenheid: string | null; bron: string | null; notitie: string | null; sinds: string | null;
  verwacht_op: string | null; controle_op: string | null; opnieuw_besteld: boolean; telt_als_onderweg: boolean;
};

export type OntvangstVandaag = {
  soort: string; signaal_id: string | null; open_regel_id: string | null; pakbon_regel_id: string | null;
  leverancier_id: string | null; leverancier_naam: string | null; ordernummer: string | null; naam: string;
  artikelnummer: string | null; besteld_aantal: number | null; eenheid: string | null; verwachte_levering: string | null;
  te_laat: boolean; pakbon_aantal: number | null; voorstel_aantal: number | null; pakbon_status: string | null;
  pakbon_notitie: string | null; geleverd_vorm_id: string | null; geleverd_vorm: string | null;
};

export type MandjeVraag = {
  regel_id: string; soort: string; leverancier_id: string | null; leverancier_naam: string | null; naam: string;
  aantal: number; eenheid: string | null; bron: string | null; notitie: string | null; sinds: string | null;
  controle_op: string | null; deadline: string | null; reden: string | null;
};

export type NaleveringKandidaat = { regel_id: string; soort: string; naam: string; aantal: number; eenheid: string | null; sinds: string | null; ordernummer: string | null; opnieuw_besteld: boolean };

export type KeukenAdviesRegel = {
  telartikel_id: string; naam: string; basis_eenheid: string | null; leverancier_naam: string | null;
  stand: number | null; onderweg_op_tijd: number | null; onderweg_restant: number | null; behoefte: number | null;
  vorm: string | null; advies_vormen: number | null; status: string | null; reden: string | null;
};

async function leesFase2Schakelaars(): Promise<Schakelaar[]> {
  try { return await lees<Schakelaar[]>('fase2_schakelaars'); } catch { return []; }
}

export function useFase2VlagAan(vestiging: string | null | undefined, vlag: string): boolean {
  const { data } = useQuery({
    queryKey: ['fase2_schakelaars'],
    queryFn: leesFase2Schakelaars,
    enabled: !!vestiging,
    staleTime: 60_000,
    retry: false,
  });
  return !!vestiging && !!data?.some((r) => r.vestiging === vestiging && r.vlag === vlag && r.aan === true);
}

/** Schakelaar per actieve vestiging; fout of geen rij = uit. */
export function useOntvangstModus(vestiging: string): OntvangstModus {
  const [params] = useSearchParams();
  const testGevraagd = params.get('locatie') === 'Test';
  const { data } = useQuery({
    queryKey: ['fase2_schakelaars'],
    enabled: !!vestiging,
    staleTime: 60_000,
    retry: false,
    queryFn: leesFase2Schakelaars,
  });
  return useMemo(() => bepaalModus(data, vestiging, testGevraagd), [data, vestiging, testGevraagd]);
}

const sleutel = (m: OntvangstModus) => [m.pVestiging, m.pBron];

export function useOntvangstData(m: OntvangstModus) {
  const aan = m.ontvangstV2 && !!m.pVestiging;
  const restanten = useQuery({
    queryKey: ['ontvangst_restanten', ...sleutel(m)], enabled: aan,
    queryFn: () => lees<OntvangstRestant[]>('ontvangst_restanten', { p_vestiging: m.pVestiging, p_bron_vestiging: m.pBron }),
  });
  const vandaag = useQuery({
    queryKey: ['ontvangst_vandaag', ...sleutel(m)], enabled: aan,
    queryFn: () => lees<OntvangstVandaag[]>('ontvangst_vandaag', { p_vestiging: m.pVestiging, p_bron_vestiging: m.pBron, p_datum: null, p_ook_geleverd: false }),
  });
  const mandje = useQuery({
    queryKey: ['ontvangst_mandje_vragen', ...sleutel(m)], enabled: aan && m.magBeslissen,
    queryFn: () => lees<MandjeVraag[]>('ontvangst_mandje_vragen', { p_vestiging: m.pVestiging, p_bron_vestiging: m.pBron, p_nu: null }),
  });
  return { restanten, vandaag, mandje };
}

export function useKeukenAdvies(m: OntvangstModus) {
  return useQuery({
    queryKey: ['keuken_advies', m.pVestiging], enabled: m.keukenadvies && !!m.pVestiging,
    queryFn: () => lees<KeukenAdviesRegel[]>('keuken_advies', { p_vestiging: m.pVestiging, p_nu: null }),
  });
}

export function useOntvangstMutaties(m: OntvangstModus) {
  const qc = useQueryClient();
  const herlaad = () => {
    ['ontvangst_restanten', 'ontvangst_vandaag', 'ontvangst_mandje_vragen', 'bestel_signalen', 'keuken_advies'].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
  };
  const afronden = useMutation({
    mutationFn: (regels: Record<string, unknown>[]) => lees<unknown>('ontvangst_levering_afronden', { p_vestiging: m.pVestiging, p_levering_id: crypto.randomUUID(), p_regels: regels, p_ontvangen_op: null }),
    onSuccess: herlaad,
  });
  const beslissen = useMutation({
    mutationFn: (a: { regelId: string; keuze: 'nog_verwachten' | 'opnieuw_bestellen' | 'geannuleerd'; controleOp?: string | null; notitie?: string | null; bron?: string | null }) =>
      lees<unknown>('ontvangst_restant_beslissen', { p_regel_id: a.regelId, p_keuze: a.keuze, p_controle_op: a.controleOp || null, p_notitie: a.notitie || null, p_bron: a.bron || null }),
    onSuccess: herlaad,
  });
  const zonderOrder = useMutation({
    mutationFn: (a: { leverancierId: string; regels: Record<string, unknown>[] }) =>
      lees<unknown>('ontvangst_zonder_order', { p_vestiging: m.pVestiging, p_levering_id: crypto.randomUUID(), p_leverancier_id: a.leverancierId, p_regels: a.regels, p_ontvangen_op: null, p_bron_vestiging: m.pBron }),
    onSuccess: herlaad,
  });
  const kandidaten = (a: { leverancierId: string; artikelId: string | null; naam: string | null }) =>
    lees<NaleveringKandidaat[]>('ontvangst_nalevering_kandidaten', { p_vestiging: m.pVestiging, p_bron_vestiging: m.pBron, p_leverancier_id: a.leverancierId, p_artikel_id: a.artikelId, p_artikelnummer: null, p_naam: a.naam });
  return { afronden, beslissen, zonderOrder, kandidaten };
}
