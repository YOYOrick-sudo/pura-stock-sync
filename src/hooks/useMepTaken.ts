import { useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export const ymd = (d: Date) => format(d, 'yyyy-MM-dd');

export const MEP_CATEGORIEEN = [
  'Sauzen & dressings',
  'Snijwerk',
  'Vlees & vis',
  'Zoet & bakken',
  'Brood',
  'Voorbereiden',
  'Algemeen',
] as const;

export interface MepTaak {
  id: string;
  vestiging: string;
  titel: string;
  categorie: string;
  taak_datum: string;
  deadline: string | null;
  recept_id: string | null;
  methode_id: string | null;
  doel_aantal: number | null;
  doel_eenheid: string | null;
  prioriteit: number;
  status: 'open' | 'bezig' | 'afgerond' | 'geannuleerd';
  toegewezen_aan: string | null;
  volgorde: number;
  notitie: string | null;
  created_at: string;
  updated_at: string;
}

export interface MepTaakInput {
  vestiging: string;
  titel: string;
  categorie?: string;
  taak_datum: string;
  deadline?: string | null;
  recept_id?: string | null;
  methode_id?: string | null;
  doel_aantal?: number | null;
  doel_eenheid?: string | null;
  prioriteit?: number;
  toegewezen_aan?: string | null;
  notitie?: string | null;
}

/** Taken van één vestiging op één dag, inclusief realtime sync tussen tablets. */
export function useMepTaken(vestiging: string, datum: string) {
  const qc = useQueryClient();
  const key = useMemo(() => ['mep-taken', vestiging, datum], [vestiging, datum]);

  const query = useQuery({
    queryKey: key,
    enabled: !!vestiging && !!datum,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mep_taken')
        .select('*')
        .eq('vestiging', vestiging)
        .eq('taak_datum', datum)
        .neq('status', 'geannuleerd')
        .order('prioriteit', { ascending: true })
        .order('volgorde', { ascending: true })
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as MepTaak[];
    },
  });

  useEffect(() => {
    if (!vestiging || !datum) return;
    const channel = supabase
      .channel(`mep-taken-${vestiging}-${datum}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'mep_taken', filter: `vestiging=eq.${vestiging}` },
        () => qc.invalidateQueries({ queryKey: key }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [vestiging, datum, qc, key]);

  return query;
}

export function useMepTaakMutaties(vestiging: string, datum: string) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['mep-taken'] });
    qc.invalidateQueries({ queryKey: ['mep-batches'] });
  };

  const toevoegen = useMutation({
    mutationFn: async (input: MepTaakInput) => {
      const { data: user } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('mep_taken')
        .insert({ ...input, created_by: user.user?.id ?? null })
        .select('*')
        .single();
      if (error) throw error;
      return data as MepTaak;
    },
    onSuccess: invalidate,
  });

  const bijwerken = useMutation({
    mutationFn: async ({ id, ...patch }: Partial<MepTaak> & { id: string }) => {
      const { error } = await supabase.from('mep_taken').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const verwijderen = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('mep_taken').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const afronden = useMutation({
    mutationFn: async (args: {
      taakId: string;
      aantal: number;
      temperatuur?: number | null;
      notitie?: string | null;
    }) => {
      const { data, error } = await supabase.rpc('mep_taak_afronden', {
        _taak_id: args.taakId,
        _aantal_gemaakt: args.aantal,
        _temperatuur: args.temperatuur ?? null,
        _notitie: args.notitie ?? null,
      });
      if (error) throw error;
      return data as {
        batch_id: string;
        batch_nummer: string;
        hoeveelheid: number;
        eenheid: string;
        houdbaar_tot: string | null;
      };
    },
    onSuccess: invalidate,
  });

  const heropenen = useMutation({
    mutationFn: async (taakId: string) => {
      const { error } = await supabase.rpc('mep_taak_heropenen', { _taak_id: taakId });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return { toevoegen, bijwerken, verwijderen, afronden, heropenen, vestiging, datum };
}

/** Batches van vandaag — voor het overzicht "wat is er gemaakt". */
export function useProductieBatches(vestiging: string, datum: string) {
  return useQuery({
    queryKey: ['mep-batches', vestiging, datum],
    enabled: !!vestiging && !!datum,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('productie_batches')
        .select('*')
        .eq('vestiging', vestiging)
        .eq('productie_datum', datum)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export interface MepReceptOptie {
  methode_id: string | null;
  recept_id: string;
  recept_naam: string;
  categorie: string;
  tht_dagen: number | null;
  type: string;
  visuele_eenheid: string;
  output_hoeveelheid: number;
  output_eenheid: string;
  standaard_duur: number | null;
  houdbaarheid: number | null;
  heeft_methode: boolean;
}

/** Recepten die op deze vestiging aan staan — met methode én zonder. */
export function useMepRecepten(vestiging: string) {
  return useQuery({
    queryKey: ['mep-recepten', vestiging],
    queryFn: async (): Promise<MepReceptOptie[]> => {
      const [{ data: methodes, error: e1 }, { data: koppels, error: e2 }, { data: recepten, error: e3 }] =
        await Promise.all([
          supabase
            .from('halffabricaat_methodes')
            .select('*, recipes!inner(id, name, category, is_gearchiveerd, tht_dagen)')
            .order('sort_order'),
          supabase.from('recept_locaties').select('recept_id, is_actief').eq('vestiging', vestiging),
          supabase
            .from('recipes')
            .select('id, name, category, is_gearchiveerd, tht_dagen')
            .order('name'),
        ]);
      if (e1) throw e1;
      if (e2) throw e2;
      if (e3) throw e3;

      const actief = new Set(
        (koppels ?? []).filter((k: any) => k.is_actief).map((k: any) => k.recept_id),
      );

      const metMethode = (methodes ?? [])
        .filter((m: any) => !m.recipes?.is_gearchiveerd && actief.has(m.recept_id))
        .map(
          (m: any): MepReceptOptie => ({
            methode_id: m.id as string,
            recept_id: m.recept_id as string,
            recept_naam: m.recipes.name as string,
            categorie: (m.recipes.category as string) ?? 'Algemeen',
            tht_dagen: (m.recipes.tht_dagen as number) ?? null,
            type: m.type as string,
            visuele_eenheid: m.visuele_eenheid as string,
            output_hoeveelheid: Number(m.output_hoeveelheid),
            output_eenheid: m.output_eenheid as string,
            standaard_duur: m.standaard_duur as number,
            houdbaarheid: m.houdbaarheid as number | null,
            heeft_methode: true,
          }),
        );

      const metMethodeIds = new Set(metMethode.map((m) => m.recept_id));
      const zonderMethode = (recepten ?? [])
        .filter(
          (r: any) => !r.is_gearchiveerd && actief.has(r.id) && !metMethodeIds.has(r.id),
        )
        .map(
          (r: any): MepReceptOptie => ({
            methode_id: null,
            recept_id: r.id as string,
            recept_naam: r.name as string,
            categorie: (r.category as string) ?? 'Algemeen',
            tht_dagen: (r.tht_dagen as number) ?? null,
            type: 'recept',
            visuele_eenheid: 'batch',
            output_hoeveelheid: 1,
            output_eenheid: 'batch',
            standaard_duur: null,
            houdbaarheid: null,
            heeft_methode: false,
          }),
        );

      return [...metMethode, ...zonderMethode];
    },
  });
}

export interface MepFavoriet {
  sleutel: string;
  titel: string;
  categorie: string;
  recept_id: string | null;
  methode_id: string | null;
  doel_aantal: number | null;
  doel_eenheid: string | null;
  aantal_keer: number;
}

/** De zes vaakst gemaakte MEP-taken van de laatste 90 dagen (per vestiging). */
export function useMepFavorieten(vestiging: string, limiet = 6) {
  return useQuery({
    queryKey: ['mep-favorieten', vestiging, limiet],
    enabled: !!vestiging,
    staleTime: 60_000,
    queryFn: async (): Promise<MepFavoriet[]> => {
      const vanaf = ymd(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000));
      const { data, error } = await supabase
        .from('mep_taken')
        .select('titel, categorie, recept_id, methode_id, doel_aantal, doel_eenheid, taak_datum')
        .eq('vestiging', vestiging)
        .gte('taak_datum', vanaf)
        .neq('status', 'geannuleerd')
        .order('taak_datum', { ascending: false })
        .limit(1000);
      if (error) throw error;

      const map = new Map<string, MepFavoriet>();
      for (const t of (data ?? []) as any[]) {
        const sleutel = t.methode_id ?? t.recept_id ?? `vrij:${(t.titel ?? '').toLowerCase()}`;
        const bestaand = map.get(sleutel);
        if (bestaand) {
          bestaand.aantal_keer += 1;
        } else {
          map.set(sleutel, {
            sleutel,
            titel: t.titel,
            categorie: t.categorie ?? 'Algemeen',
            recept_id: t.recept_id ?? null,
            methode_id: t.methode_id ?? null,
            doel_aantal: t.doel_aantal ?? null,
            doel_eenheid: t.doel_eenheid ?? null,
            aantal_keer: 1,
          });
        }
      }
      return [...map.values()]
        .sort((a, b) => b.aantal_keer - a.aantal_keer)
        .slice(0, limiet);
    },
  });
}


/** Taken over een periode (weekweergave). */
export function useMepTakenBereik(vestiging: string, van: string, tot: string) {
  const qc = useQueryClient();
  const key = useMemo(() => ['mep-taken-bereik', vestiging, van, tot], [vestiging, van, tot]);

  const query = useQuery({
    queryKey: key,
    enabled: !!vestiging && !!van && !!tot,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mep_taken')
        .select('*')
        .eq('vestiging', vestiging)
        .gte('taak_datum', van)
        .lte('taak_datum', tot)
        .neq('status', 'geannuleerd')
        .order('taak_datum', { ascending: true })
        .order('prioriteit', { ascending: true })
        .order('volgorde', { ascending: true });
      if (error) throw error;
      return (data ?? []) as MepTaak[];
    },
  });

  useEffect(() => {
    if (!vestiging) return;
    const channel = supabase
      .channel(`mep-week-${vestiging}-${van}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'mep_taken', filter: `vestiging=eq.${vestiging}` },
        () => qc.invalidateQueries({ queryKey: key }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [vestiging, van, tot, qc, key]);

  return query;
}

/** Alle halffabricaat-methodes met receptnaam — voor het beheerscherm. */
export function useHalffabricaatOverzicht() {
  return useQuery({
    queryKey: ['hf-overzicht'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('halffabricaat_methodes')
        .select('*, recipes!inner(id, name, category, is_gearchiveerd)')
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data ?? [])
        .filter((m: any) => !m.recipes?.is_gearchiveerd)
        .map((m: any) => ({
          id: m.id as string,
          recept_id: m.recept_id as string,
          recept_naam: m.recipes.name as string,
          categorie: (m.recipes.category as string) ?? 'Algemeen',
          type: m.type as string,
          visuele_eenheid: m.visuele_eenheid as string,
          output_hoeveelheid: Number(m.output_hoeveelheid),
          output_eenheid: m.output_eenheid as string,
          houdbaarheid: m.houdbaarheid as number | null,
        }));
    },
  });
}
