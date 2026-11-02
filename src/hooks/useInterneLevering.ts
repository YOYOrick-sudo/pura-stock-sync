import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getal } from '@/lib/hoeveelheid';
import { kortDatum } from '@/lib/ontvangstV2';

// Functies staan niet in de gegenereerde types: zelfde rpc-cast als useOntvangstV2.
type RpcFout = { message: string; code?: string };
const rpc = (naam: string, args?: Record<string, unknown>) =>
  (supabase.rpc as unknown as (n: string, a?: Record<string, unknown>) => Promise<{ data: unknown; error: RpcFout | null }>)(naam, args);

/** 42501 (geen toegang) en 55000 (vlag uit) verbergen het onderdeel. Andere fouten gaan naar de aanroeper. */
async function leesOfVerberg<T>(naam: string, args?: Record<string, unknown>): Promise<T | null> {
  const { data, error } = await rpc(naam, args);
  if (error) {
    if (error.code === '42501' || error.code === '55000') return null;
    console.warn(`${naam} mislukt`, error.code, error.message);
    throw new Error(error.message || 'Laden mislukt');
  }
  return (data ?? []) as T;
}

async function leesJson<T>(naam: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await rpc(naam, args);
  if (error) throw new Error(error.message || 'Niet opgeslagen');
  return data as T;
}

export type InternProduct = {
  product_id: string;
  naam: string;
  van_vestiging: string;
  eenheid: string;
  inhoud_per_eenheid: number | null;
  inhoud_eenheid: string | null;
  max_per_bestelling: number | null;
  open_aantal: number;
  volgende_mep_datum: string | null;
  volgorde: number;
};

export type InterneBestelling = {
  bestelling_id: string;
  product_id: string;
  naam: string;
  van_vestiging: string;
  aantal: number;
  eenheid: string;
  status: string;
  mep_datum: string | null;
  taak_status: string | null;
  besteld_op: string | null;
  geleverd_aantal: number | null;
  geleverd_op: string | null;
  ontvangen_aantal: number | null;
  ontvangen_op: string | null;
  notitie: string | null;
  kan_annuleren: boolean;
  kan_ontvangen: boolean;
};

export type InterneMepRegel = {
  bestelling_id: string;
  product_id: string;
  naam: string;
  naar_vestiging: string;
  aantal: number;
  eenheid: string;
  inhoud_per_eenheid: number | null;
  inhoud_eenheid: string | null;
  mep_datum: string | null;
  mep_taak_id: string | null;
  taak_status: string | null;
  status: string;
  besteld_op: string | null;
  geleverd_aantal: number | null;
  geleverd_op: string | null;
  notitie: string | null;
  te_laat: boolean;
};

export type PlaatsResultaat = {
  bestelling_id: string;
  mep_taak_id: string | null;
  mep_datum: string | null;
  taak_nieuw: boolean;
  doel_aantal: number;
  eenheid: string;
  bestond_al: boolean;
};

export function alsGetal(waarde: number | string | null | undefined): number | null {
  if (waarde == null || waarde === '') return null;
  const n = Number(waarde);
  return Number.isFinite(n) ? n : null;
}

export function klemAantal(waarde: number, min: number, max: number | null) {
  const onder = Math.max(min, waarde);
  return max == null ? onder : Math.min(max, onder);
}

/** Vlag aan en geen testmodus. De kaart verschijnt daarna alleen als de productlijst rijen voor die vestiging teruggeeft. */
export function internBestellenZichtbaar(input: { vlagAan: boolean; test: boolean }) {
  return input.vlagAan && !input.test;
}

/** Ander aantal geleverd gaat niet boven het bestelde aantal. */
export function maxGeleverdAantal(besteld: number | string | null | undefined) {
  const n = alsGetal(besteld);
  return n != null && n >= 1 ? n : 1;
}

/** Alleen cijfers; leeg mag, zodat een getal overgetypt kan worden. */
export function stapperTekst(ingevoerd: string) {
  return ingevoerd.replace(/[^0-9]/g, '');
}

/** Min en max gelden bij het verlaten van het veld. Leeg wordt het minimum. */
export function stapperBevestig(tekst: string, min: number, max: number | null) {
  if (!tekst) return min;
  const n = Number(tekst);
  return klemAantal(Number.isFinite(n) ? n : min, min, max);
}

/** Titel uit de bestemming van de regels, niet vast op één vestiging. */
export function mepKaartTitel(regels: { naar_vestiging?: string | null; status?: string }[]) {
  const open = regels.filter((r) => r.status === 'besteld');
  const bron = open.length ? open : regels;
  const naam = bron.map((r) => r.naar_vestiging?.trim()).find(Boolean);
  return naam ? `Voor ${naam}` : 'Voor';
}

export function telInterneOnderweg(regels: InterneBestelling[] | null | undefined) {
  if (!regels) return 0;
  return regels.filter((r) => r.status === 'besteld' || r.status === 'geleverd').length;
}

/** De tab Onderweg telt interne regels alleen mee als de vlag aan staat. */
export function onderwegTabAantal(basis: number, internAan: boolean, regels: InterneBestelling[] | null | undefined) {
  return basis + (internAan ? telInterneOnderweg(regels) : 0);
}

export function mepDagKort(iso: string | null | undefined) {
  return iso ? kortDatum(iso) : '';
}

/** 'woensdag 4 nov', zelfde kalenderdag als de korte labels op het bord. */
export function mepDagLang(iso: string | null | undefined) {
  if (!iso) return '';
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return '';
  return new Date(y, m - 1, d).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'short' }).replace(/\./g, '');
}

export function inhoudPerEenheid(per: number | string | null | undefined, inhoudEenheid: string | null | undefined, eenheid: string) {
  const n = alsGetal(per);
  if (n == null || !inhoudEenheid) return null;
  return `${getal(n)} ${inhoudEenheid} per ${eenheid}`;
}

export function inhoudTotaal(aantal: number, per: number | string | null | undefined, inhoudEenheid: string | null | undefined) {
  const n = alsGetal(per);
  if (n == null || !inhoudEenheid) return null;
  return `${getal(Math.round(aantal * n * 1000) / 1000)} ${inhoudEenheid}`;
}

export function foutTekst(e: unknown) {
  if (e instanceof Error && e.message) return e.message;
  if (typeof e === 'object' && e && 'message' in e && typeof e.message === 'string' && e.message) return e.message;
  return 'Niet opgeslagen';
}

export function onderwegMenuLabels(regel: { kan_ontvangen: boolean; kan_annuleren: boolean }) {
  const labels: string[] = [];
  if (regel.kan_ontvangen) labels.push('Ander aantal ontvangen');
  if (regel.kan_annuleren) labels.push('Annuleren');
  return labels;
}

function herlaadInterne(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['interne_producten_lijst'] });
  qc.invalidateQueries({ queryKey: ['interne_bestellingen_lezen'] });
  qc.invalidateQueries({ queryKey: ['interne_mep_lijst'] });
  qc.invalidateQueries({ queryKey: ['mep-taken'] });
}

export function useInterneProducten(vestiging: string | null) {
  return useQuery({
    queryKey: ['interne_producten_lijst', vestiging],
    enabled: !!vestiging,
    retry: false,
    queryFn: () => leesOfVerberg<InternProduct[]>('interne_producten_lijst', { p_vestiging: vestiging }),
  });
}

export function useInterneBestellingen(vestiging: string | null) {
  return useQuery({
    queryKey: ['interne_bestellingen_lezen', vestiging],
    enabled: !!vestiging,
    retry: false,
    queryFn: () => leesOfVerberg<InterneBestelling[]>('interne_bestellingen_lezen', { p_vestiging: vestiging, p_dagen: 14 }),
  });
}

export function useInterneMep(vestiging: string | null) {
  return useQuery({
    queryKey: ['interne_mep_lijst', vestiging],
    enabled: !!vestiging,
    retry: false,
    queryFn: () => leesOfVerberg<InterneMepRegel[]>('interne_mep_lijst', { p_vestiging: vestiging }),
  });
}

export function useInternePlaatsen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (a: { productId: string; aantal: number; sleutel: string; notitie?: string | null }) =>
      leesJson<PlaatsResultaat>('interne_bestelling_plaatsen', {
        p_product_id: a.productId,
        p_aantal: a.aantal,
        p_notitie: a.notitie ?? null,
        p_aanvraag_sleutel: a.sleutel,
      }),
    onSuccess: () => herlaadInterne(qc),
  });
}

export function useInterneAnnuleren() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (bestellingId: string) => leesJson<unknown>('interne_bestelling_annuleren', { p_bestelling_id: bestellingId }),
    onSuccess: () => herlaadInterne(qc),
  });
}

export function useInterneGeleverd() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (a: { id: string; aantal: number | null }) =>
      leesJson<unknown>('interne_bestelling_geleverd', { p_bestelling_id: a.id, p_aantal: a.aantal }),
    onSuccess: () => herlaadInterne(qc),
  });
}

export function useInterneOntvangen() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (a: { id: string; aantal: number | null; opmerking: string | null }) =>
      leesJson<unknown>('interne_bestelling_ontvangen', { p_bestelling_id: a.id, p_aantal: a.aantal, p_opmerking: a.opmerking }),
    onSuccess: () => herlaadInterne(qc),
  });
}
