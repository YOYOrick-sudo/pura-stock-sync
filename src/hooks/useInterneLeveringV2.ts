import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { type Aanvraag } from '@/lib/interneLeveringV2';

type RpcFout = { message: string; code?: string };

const rpc = (naam: string, args?: Record<string, unknown>) =>
  (supabase.rpc as unknown as (n: string, a?: Record<string, unknown>) => Promise<{ data: unknown; error: RpcFout | null }>)(naam, args);

async function leesOfVerberg<T>(naam: string, args?: Record<string, unknown>): Promise<T | null> {
  const { data, error } = await rpc(naam, args);
  if (error) {
    if (error.code === '42501' || error.code === '55000') return null;
    throw new Error(error.message || 'Laden mislukt');
  }
  return data as T;
}

async function leesJson<T>(naam: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await rpc(naam, args);
  if (error) throw new Error(error.message || 'Niet opgeslagen');
  return data as T;
}

function num(waarde: unknown) {
  const n = Number(waarde ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function tekst(waarde: unknown) {
  return waarde == null || waarde === '' ? null : String(waarde);
}

export function alsAanvraag(ruw: unknown): Aanvraag {
  const r = (ruw ?? {}) as Record<string, unknown>;
  return {
    id: String(r.id ?? ''),
    naam: String(r.naam ?? r.vrije_naam ?? ''),
    vrije_naam: tekst(r.vrije_naam),
    product_id: tekst(r.product_id),
    eenheid: String(r.eenheid ?? 'stuks'),
    besteld_aantal: num(r.besteld_aantal),
    gewenste_leverdag: tekst(r.gewenste_leverdag),
    verwachte_leverdag: tekst(r.verwachte_leverdag),
    mep_datum: tekst(r.mep_datum),
    mep_taak_id: tekst(r.mep_taak_id),
    mep_aantal: num(r.mep_aantal),
    mep_klaar_aantal: num(r.mep_klaar_aantal),
    voorraad_aantal: num(r.voorraad_aantal),
    klaar_aantal: num(r.klaar_aantal),
    meegegeven_aantal: num(r.meegegeven_aantal),
    ontvangen_aantal: num(r.ontvangen_aantal),
    geannuleerd_aantal: num(r.geannuleerd_aantal),
    bevestigd: r.bevestigd === true,
    notitie: tekst(r.notitie),
    besteld_op: String(r.besteld_op ?? ''),
  };
}

export type InternV2Product = {
  product_id: string;
  artikel_id: string | null;
  naam: string;
  eenheid: string;
  inhoud_per_eenheid: number | null;
  inhoud_eenheid: string | null;
  max_per_bestelling: number | null;
  volgorde: number;
  open_aantal: number;
};

export type InternV2BeheerProduct = {
  product_id: string;
  artikel_id: string | null;
  naam: string;
  eenheid: string;
  inhoud_per_eenheid: number | null;
  inhoud_eenheid: string | null;
  max_per_bestelling: number | null;
  v2_beschikbaar: boolean;
  huidige_route: boolean;
};

export type StamArtikel = { id: string; naam: string };

function lijst<T>(data: unknown, map: (rij: Record<string, unknown>) => T): T[] {
  return Array.isArray(data) ? data.map((rij) => map((rij ?? {}) as Record<string, unknown>)) : [];
}

function herlaad(qc: ReturnType<typeof useQueryClient>, ookMep = false) {
  qc.invalidateQueries({ queryKey: ['interne_v2_producten'] });
  qc.invalidateQueries({ queryKey: ['interne_v2_aanvragen'] });
  qc.invalidateQueries({ queryKey: ['interne_v2_beheer'] });
  if (ookMep) qc.invalidateQueries({ queryKey: ['mep-taken'] });
}

export function useInterneV2Producten(vestiging: string | null) {
  return useQuery({
    queryKey: ['interne_v2_producten', vestiging],
    enabled: !!vestiging,
    retry: false,
    queryFn: async () => {
      const data = await leesOfVerberg<unknown>('interne_v2_producten_lijst', { p_vestiging: vestiging });
      if (data == null) return null;
      return lijst(data, (r) => ({
        product_id: String(r.product_id),
        artikel_id: tekst(r.artikel_id),
        naam: String(r.naam ?? ''),
        eenheid: String(r.eenheid ?? 'stuks'),
        inhoud_per_eenheid: r.inhoud_per_eenheid == null ? null : num(r.inhoud_per_eenheid),
        inhoud_eenheid: tekst(r.inhoud_eenheid),
        max_per_bestelling: r.max_per_bestelling == null ? null : num(r.max_per_bestelling),
        volgorde: num(r.volgorde),
        open_aantal: num(r.open_aantal),
      }));
    },
  });
}

export function useInterneV2Aanvragen(vestiging: string | null, kant: 'bord' | 'mep') {
  return useQuery({
    queryKey: ['interne_v2_aanvragen', vestiging, kant],
    enabled: !!vestiging,
    retry: false,
    queryFn: async () => {
      const data = await leesOfVerberg<unknown>('interne_v2_lezen', { p_vestiging: vestiging, p_kant: kant });
      if (data == null) return null;
      return lijst(data, (r) => alsAanvraag(r));
    },
  });
}

export function useInterneV2Plaatsen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (a: {
      vestiging: string;
      productId?: string | null;
      vrijeNaam?: string | null;
      aantal: number;
      eenheid?: string | null;
      gewensteLeverdag?: string | null;
      notitie?: string | null;
      sleutel: string;
    }) => leesJson('interne_v2_plaatsen', {
      p_vestiging: a.vestiging,
      p_product_id: a.productId ?? null,
      p_vrije_naam: a.vrijeNaam ?? null,
      p_aantal: a.aantal,
      p_eenheid: a.eenheid ?? null,
      p_gewenste_leverdag: a.gewensteLeverdag || null,
      p_notitie: a.notitie ?? null,
      p_aanvraag_sleutel: a.sleutel,
    }),
    onSuccess: () => herlaad(qc),
  });
}

export function useInterneV2Koppelen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (a: { vestiging: string; aanvraagId: string; productId: string }) =>
      leesJson('interne_v2_koppelen', { p_vestiging: a.vestiging, p_aanvraag_id: a.aanvraagId, p_product_id: a.productId }),
    onSuccess: () => herlaad(qc),
  });
}

export function useInterneV2Inplannen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (a: { vestiging: string; id: string; mepDatum: string; aantal: number; leverdag: string }) =>
      leesJson('interne_v2_inplannen', {
        p_vestiging: a.vestiging, p_aanvraag_id: a.id, p_mep_datum: a.mepDatum, p_aantal: a.aantal, p_verwachte_leverdag: a.leverdag,
      }),
    onSuccess: () => herlaad(qc, true),
  });
}

export function useInterneV2Klaarzetten() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (a: { vestiging: string; id: string; aantal: number; leverdag: string; meegeven: boolean }) =>
      leesJson('interne_v2_klaarzetten', {
        p_vestiging: a.vestiging, p_aanvraag_id: a.id, p_aantal: a.aantal, p_verwachte_leverdag: a.leverdag, p_meegeven: a.meegeven,
      }),
    onSuccess: () => herlaad(qc),
  });
}

export function useInterneV2Meegegeven() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (a: { vestiging: string; id: string; aantal: number }) =>
      leesJson('interne_v2_meegegeven', { p_vestiging: a.vestiging, p_aanvraag_id: a.id, p_aantal: a.aantal }),
    onSuccess: () => herlaad(qc),
  });
}

export function useInterneV2MepKlaar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (a: { vestiging: string; taakId: string; aantal: number }) =>
      leesJson('interne_v2_mep_klaar', { p_vestiging: a.vestiging, p_taak_id: a.taakId, p_aantal: a.aantal }),
    onSuccess: () => herlaad(qc),
  });
}

export function useInterneV2Ontvangen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (a: { vestiging: string; id: string; aantal: number | null; opmerking: string | null }) =>
      leesJson('interne_v2_ontvangen', {
        p_vestiging: a.vestiging, p_aanvraag_id: a.id, p_aantal: a.aantal, p_opmerking: a.opmerking,
      }),
    onSuccess: () => {
      herlaad(qc);
      qc.invalidateQueries({ queryKey: ['keuken_voorraad_stand'] });
      qc.invalidateQueries({ queryKey: ['keuken_advies'] });
    },
  });
}

export function useInterneV2Annuleren() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (a: { vestiging: string; id: string; aantal: number | null }) =>
      leesJson('interne_v2_annuleren', { p_vestiging: a.vestiging, p_aanvraag_id: a.id, p_aantal: a.aantal }),
    onSuccess: () => {
      herlaad(qc, true);
      qc.invalidateQueries({ queryKey: ['keuken_voorraad_stand'] });
      qc.invalidateQueries({ queryKey: ['keuken_advies'] });
    },
  });
}

export function useInterneV2Beheer(vestiging: string | null) {
  return useQuery({
    queryKey: ['interne_v2_beheer', vestiging],
    enabled: !!vestiging,
    retry: false,
    queryFn: async () => {
      const data = await leesOfVerberg<unknown>('interne_v2_producten_beheer', { p_vestiging: vestiging });
      if (data == null) return null;
      return lijst(data, (r) => ({
        product_id: String(r.product_id),
        artikel_id: tekst(r.artikel_id),
        naam: String(r.naam ?? ''),
        eenheid: String(r.eenheid ?? ''),
        inhoud_per_eenheid: r.inhoud_per_eenheid == null ? null : num(r.inhoud_per_eenheid),
        inhoud_eenheid: tekst(r.inhoud_eenheid),
        max_per_bestelling: r.max_per_bestelling == null ? null : num(r.max_per_bestelling),
        v2_beschikbaar: r.v2_beschikbaar === true,
        huidige_route: r.huidige_route === true,
      } satisfies InternV2BeheerProduct));
    },
  });
}

export function useInterneV2ArtikelenZoeken(vestiging: string | null, zoek: string) {
  return useQuery({
    queryKey: ['interne_v2_artikelen', vestiging, zoek],
    enabled: !!vestiging && zoek.trim().length >= 2,
    retry: false,
    queryFn: async () => {
      const data = await leesOfVerberg<unknown>('interne_v2_artikelen_zoeken', { p_vestiging: vestiging, p_zoek: zoek.trim() });
      if (data == null) return [];
      return lijst(data, (r) => ({ id: String(r.id), naam: String(r.naam ?? '') }));
    },
  });
}

export function useInterneV2ProductOpslaan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (a: {
      vestiging: string;
      artikelId: string;
      eenheid: string;
      inhoudPerEenheid: number | null;
      inhoudEenheid: string | null;
      max: number | null;
      beschikbaar: boolean;
    }) => leesJson<{ product_id: string; ongewijzigd: boolean; reden?: string }>('interne_v2_product_opslaan', {
      p_vestiging: a.vestiging,
      p_artikel_id: a.artikelId,
      p_eenheid: a.eenheid,
      p_inhoud_per_eenheid: a.inhoudPerEenheid,
      p_inhoud_eenheid: a.inhoudEenheid,
      p_max: a.max,
      p_beschikbaar: a.beschikbaar,
    }),
    onSuccess: () => herlaad(qc),
  });
}
