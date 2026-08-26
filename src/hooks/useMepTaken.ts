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

/** Recepten met minimaal één handeling — de MEP-bibliotheek. */
export function useMepRecepten(vestiging: string) {
  return useQuery({
    queryKey: ['mep-recepten', vestiging],
    queryFn: async () => {
      const [{ data: methodes, error: e1 }, { data: koppels, error: e2 }] = await Promise.all([
        supabase
          .from('halffabricaat_methodes')
          .select('*, recipes!inner(id, name, category, is_gearchiveerd, tht_dagen)')
          .order('sort_order'),
        supabase.from('recept_locaties').select('recept_id, is_actief').eq('vestiging', vestiging),
      ]);
      if (e1) throw e1;
      if (e2) throw e2;
      const actief = new Set(
        (koppels ?? []).filter((k: any) => k.is_actief).map((k: any) => k.recept_id),
      );
      return (methodes ?? [])
        .filter((m: any) => !m.recipes?.is_gearchiveerd && actief.has(m.recept_id))
        .map((m: any) => ({
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
        }));
    },
  });
}

export type MepReceptOptie = NonNullable<ReturnType<typeof useMepRecepten>['data']>[number];
