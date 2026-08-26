import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const db = supabase as any;

export type Vestiging = 'West' | 'Midsland';
export const VESTIGINGEN: Vestiging[] = ['West', 'Midsland'];

export const ARTIKEL_SOORTEN = ['inkoop', 'halffabricaat', 'non_food'] as const;
export const AANVUL_BRONNEN = ['leverancier', 'eigen_productie', 'interne_order'] as const;
export const LEVERANCIER_KANALEN = ['mail', 'telefoon', 'portal', 'api'] as const;

export interface Eenheid {
  id: string;
  code: string;
  naam: string;
  soort: string | null;
}

export interface Artikel {
  id: string;
  naam: string;
  soort: string | null;
  categorie: string | null;
  basis_eenheid_id: string | null;
  is_voorraad_artikel: boolean | null;
  recept_id: string | null;
}

export interface ArtikelEenheid {
  id: string;
  artikel_id: string;
  eenheid_id: string;
  factor_naar_basis: number;
  rendement_pct: number | null;
  is_inkoop: boolean;
  is_keuken: boolean;
}

export interface ArtikelLocatie {
  id: string;
  artikel_id: string;
  vestiging: string;
  is_actief: boolean;
  min_voorraad: number | null;
  max_voorraad: number | null;
  tel_volgorde: number | null;
  opslag_locatie: string | null;
  aanvul_bron: string | null;
  bron_vestiging: string | null;
}

export interface Leverancier {
  id: string;
  naam: string;
  kanaal: string;
  contact_email: string | null;
  contact_telefoon: string | null;
  api_basis_url: string | null;
  notitie: string | null;
  actief: boolean;
}

export interface LeverancierBesteldag {
  id: string;
  leverancier_id: string;
  vestiging: string | null;
  weekdag: number;
  deadline_tijd: string | null;
  leverdag_offset: number;
  actief: boolean;
}

export interface LeverancierArtikel {
  id: string;
  leverancier_id: string;
  artikel_id: string;
  artikelnummer: string | null;
  besteleenheid_id: string | null;
  inhoud_per_besteleenheid: number | null;
  netto_prijs: number | null;
  is_voorkeur: boolean;
  actief: boolean;
}

export interface LeverancierVestigingConfig {
  id: string;
  leverancier_id: string;
  vestiging: string;
  klantnummer: string | null;
  api_sleutel_referentie: string | null;
  portal_login_hint: string | null;
  actief: boolean;
}

export interface InterneLeverdag {
  id: string;
  van_vestiging: string;
  naar_vestiging: string;
  weekdag: number;
  deadline_tijd: string | null;
  actief: boolean;
  notitie: string | null;
}

export interface LogboekRegel {
  id: string;
  onderwerp: string;
  bron_tabel: string;
  bron_id: string;
  reden: string;
  ruwe_waarde: string | null;
  opgelost_op: string | null;
}

/* ---------------- eenheden ---------------- */

export function useEenheden() {
  return useQuery({
    queryKey: ['keten', 'eenheden'],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await db
        .from('eenheden')
        .select('id, code, naam, soort')
        .is('deleted_at', null)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data ?? []) as Eenheid[];
    },
  });
}

/* ---------------- artikelen ---------------- */

export function useArtikelen() {
  return useQuery({
    queryKey: ['keten', 'artikelen'],
    queryFn: async () => {
      const { data, error } = await db
        .from('artikelen')
        .select('id, naam, soort, categorie, basis_eenheid_id, is_voorraad_artikel, recept_id')
        .is('deleted_at', null)
        .order('naam', { ascending: true });
      if (error) throw error;
      return (data ?? []) as Artikel[];
    },
  });
}

export function useSaveArtikel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<Artikel> & { naam: string; id?: string }) => {
      if (id) {
        const { error } = await db.from('artikelen').update(input).eq('id', id);
        if (error) throw error;
        return id;
      }
      const { data, error } = await db.from('artikelen').insert(input).select('id').single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['keten'] });
      qc.invalidateQueries({ queryKey: ['ingredienten'] });
      qc.invalidateQueries({ queryKey: ['allergenen'] });
    },
  });
}

export function useArtikelEenheden(artikelId?: string) {
  return useQuery({
    queryKey: ['keten', 'artikel-eenheden', artikelId],
    enabled: !!artikelId,
    queryFn: async () => {
      const { data, error } = await db
        .from('artikel_eenheden')
        .select('*')
        .eq('artikel_id', artikelId!)
        .is('deleted_at', null);
      if (error) throw error;
      return (data ?? []) as ArtikelEenheid[];
    },
  });
}

export function useSaveArtikelEenheid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<ArtikelEenheid> & { artikel_id: string; id?: string }) => {
      if (id) {
        const { error } = await db.from('artikel_eenheden').update(input).eq('id', id);
        if (error) throw error;
        return id;
      }
      const { data, error } = await db.from('artikel_eenheden').insert(input).select('id').single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['keten', 'artikel-eenheden'] }),
  });
}

export function useDeleteArtikelEenheid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from('artikel_eenheden').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['keten', 'artikel-eenheden'] }),
  });
}

/* ---------------- artikel_locaties ---------------- */

export function useArtikelLocaties(vestiging?: string) {
  return useQuery({
    queryKey: ['keten', 'artikel-locaties', vestiging ?? 'alle'],
    queryFn: async () => {
      let q = db.from('artikel_locaties').select('*').is('deleted_at', null);
      if (vestiging) q = q.eq('vestiging', vestiging);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as ArtikelLocatie[];
    },
  });
}

export function useUpdateArtikelLocatie() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<ArtikelLocatie> & { id: string }) => {
      const { error } = await db.from('artikel_locaties').update(patch).eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['keten', 'artikel-locaties'] }),
  });
}

/* ---------------- leveranciers ---------------- */

export function useLeveranciers() {
  return useQuery({
    queryKey: ['keten', 'leveranciers'],
    queryFn: async () => {
      const { data, error } = await db
        .from('leveranciers')
        .select('*')
        .is('deleted_at', null)
        .order('naam', { ascending: true });
      if (error) throw error;
      return (data ?? []) as Leverancier[];
    },
  });
}

export function useSaveLeverancier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<Leverancier> & { naam: string; id?: string }) => {
      if (id) {
        const { error } = await db.from('leveranciers').update(input).eq('id', id);
        if (error) throw error;
        return id;
      }
      const { data, error } = await db.from('leveranciers').insert(input).select('id').single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['keten'] }),
  });
}

function subQuery<T>(tabel: string, key: string, leverancierId?: string) {
  return {
    queryKey: ['keten', key, leverancierId],
    enabled: !!leverancierId,
    queryFn: async () => {
      const { data, error } = await db
        .from(tabel)
        .select('*')
        .eq('leverancier_id', leverancierId!)
        .is('deleted_at', null);
      if (error) throw error;
      return (data ?? []) as T[];
    },
  };
}

export function useBesteldagen(leverancierId?: string) {
  return useQuery(subQuery<LeverancierBesteldag>('leverancier_besteldagen', 'besteldagen', leverancierId));
}

export function useLeverancierArtikelen(leverancierId?: string) {
  return useQuery(subQuery<LeverancierArtikel>('leverancier_artikelen', 'lev-artikelen', leverancierId));
}

export function useLeverancierConfigs(leverancierId?: string) {
  return useQuery(subQuery<LeverancierVestigingConfig>('leverancier_vestiging_config', 'lev-configs', leverancierId));
}

/** Generieke insert/update/delete voor de leverancier-subtabellen. */
export function useLeverancierSubMutatie(tabel: string, key: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id?: string; verwijder?: boolean } & Record<string, unknown>) => {
      const { id, verwijder, ...rest } = input;
      if (verwijder && id) {
        const { error } = await db.from(tabel).delete().eq('id', id);
        if (error) throw error;
        return id;
      }
      if (id) {
        const { error } = await db.from(tabel).update(rest).eq('id', id);
        if (error) throw error;
        return id;
      }
      const { data, error } = await db.from(tabel).insert(rest).select('id').single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['keten', key] }),
  });
}

/* ---------------- interne leverdagen ---------------- */

export function useInterneLeverdagen() {
  return useQuery({
    queryKey: ['keten', 'interne-leverdagen'],
    queryFn: async () => {
      const { data, error } = await db
        .from('interne_leverdagen')
        .select('*')
        .is('deleted_at', null)
        .order('weekdag', { ascending: true });
      if (error) throw error;
      return (data ?? []) as InterneLeverdag[];
    },
  });
}

export function useLeverdagMutatie() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id?: string; verwijder?: boolean } & Record<string, unknown>) => {
      const { id, verwijder, ...rest } = input;
      if (verwijder && id) {
        const { error } = await db.from('interne_leverdagen').delete().eq('id', id);
        if (error) throw error;
        return id;
      }
      if (id) {
        const { error } = await db.from('interne_leverdagen').update(rest).eq('id', id);
        if (error) throw error;
        return id;
      }
      const { data, error } = await db.from('interne_leverdagen').insert(rest).select('id').single();
      if (error) throw error;
      return data.id as string;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['keten', 'interne-leverdagen'] }),
  });
}

/* ---------------- logboek ---------------- */

export function useLogboek(alleenOpen = true) {
  return useQuery({
    queryKey: ['keten', 'logboek', alleenOpen],
    queryFn: async () => {
      let q = db.from('migratie_logboek').select('*').order('reden', { ascending: true });
      if (alleenOpen) q = q.is('opgelost_op', null);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as LogboekRegel[];
    },
  });
}

export function useLogboekAfronden() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await db
        .from('migratie_logboek')
        .update({ opgelost_op: new Date().toISOString(), opgelost_door: user?.id ?? null })
        .eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['keten', 'logboek'] }),
  });
}

/** Receptregels die in het logboek staan, met recept- en ingrediëntnaam. */
export function useReceptRegels(ids: string[]) {
  const key = [...ids].sort().join(',');
  return useQuery({
    queryKey: ['keten', 'recept-regels', key],
    enabled: ids.length > 0,
    queryFn: async () => {
      const { data, error } = await db
        .from('recept_ingredienten')
        .select('id, naam, hoeveelheid, eenheid, hoeveelheid_num, eenheid_id, recept_id, recipes:recept_id (name)')
        .in('id', ids);
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
}

export function useUpdateReceptRegel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: { id: string } & Record<string, unknown>) => {
      const { error } = await db.from('recept_ingredienten').update(patch).eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['keten', 'recept-regels'] });
      qc.invalidateQueries({ queryKey: ['recipes'] });
    },
  });
}

/* ---------------- keten-instellingen ---------------- */

export function useKetenInstellingen() {
  return useQuery({
    queryKey: ['keten', 'instellingen'],
    queryFn: async () => {
      const { data, error } = await db.from('keten_instellingen').select('*').order('vestiging');
      if (error) throw error;
      return (data ?? []) as { id: string; vestiging: string; cycle_count_aantal: number }[];
    },
  });
}

export function useUpdateKetenInstelling() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, cycle_count_aantal }: { id: string; cycle_count_aantal: number }) => {
      const { error } = await db.from('keten_instellingen').update({ cycle_count_aantal }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['keten', 'instellingen'] }),
  });
}
