import { useCallback, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { addDays, format, parseISO } from 'date-fns';
import { nl } from 'date-fns/locale';

export interface MepRegel {
  id: string;
  date: string;
  location: string;
  titel: string;
  handeling: string | null;
  recipe_id: string | null;
  quantity: number | null;
  aantal_klaar: number;
  eenheid: string | null;
  prioriteit: number;
  sort_order: number;
  employee_id: string | null;
  notes: string | null;
  status: string;
  bron: string;
  doorgeschoven_van: string | null;
  doorschuif_teller: number;
  completed_at: string | null;
}

export interface MepNieuweRegel {
  titel: string;
  handeling?: string | null;
  recipe_id?: string | null;
  quantity?: number | null;
  eenheid?: string | null;
  prioriteit?: number;
  employee_id?: string | null;
  notes?: string | null;
}

export const ymd = (d: Date) => format(d, 'yyyy-MM-dd');

/** Instellingen + open/dicht-kalender per vestiging. */
export function useMepKalender(location: string) {
  const instellingen = useQuery({
    queryKey: ['mep-instellingen', location],
    enabled: !!location,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mep_instellingen')
        .select('*')
        .eq('vestiging', location)
        .maybeSingle();
      if (error) throw error;
      return data ?? { vestiging: location, dagwissel_uur: 4, morgen_grens_uur: 17 };
    },
  });

  const opendagen = useQuery({
    queryKey: ['mep-opendagen', location],
    enabled: !!location,
    queryFn: async () => {
      const [{ data: dagen, error: e1 }, { data: datums, error: e2 }] = await Promise.all([
        supabase.from('vestiging_opendagen').select('weekdag, is_open').eq('vestiging', location),
        supabase.from('vestiging_sluitdatums').select('datum, reden, is_open_uitzondering').eq('vestiging', location),
      ]);
      if (e1) throw e1;
      if (e2) throw e2;
      return { dagen: dagen ?? [], datums: datums ?? [] };
    },
  });

  const isOpen = useCallback(
    (d: Date) => {
      const data = opendagen.data;
      if (!data) return true;
      const key = ymd(d);
      const uitzondering = data.datums.find((x) => x.datum === key);
      if (uitzondering) return uitzondering.is_open_uitzondering;
      const dag = data.dagen.find((x) => x.weekdag === d.getDay());
      return dag ? dag.is_open : true;
    },
    [opendagen.data],
  );

  const volgendeOpenDag = useCallback(
    (vanaf: Date) => {
      for (let i = 1; i <= 14; i++) {
        const d = addDays(vanaf, i);
        if (isOpen(d)) return d;
      }
      return addDays(vanaf, 1);
    },
    [isOpen],
  );

  const dagwisselUur = instellingen.data?.dagwissel_uur ?? 4;
  const morgenGrensUur = instellingen.data?.morgen_grens_uur ?? 17;

  /** "Vandaag" volgens de dagwissel: vóór 04:00 hoor je nog bij gisteren. */
  const vandaag = useMemo(() => {
    const now = new Date();
    return now.getHours() < dagwisselUur ? addDays(now, -1) : now;
  }, [dagwisselUur]);

  const volgendeDag = useMemo(() => volgendeOpenDag(vandaag), [volgendeOpenDag, vandaag]);

  /** Standaardtab bij toevoegen: na de grens (of als vandaag dicht is) de volgende open dag. */
  const standaardDag = useMemo(() => {
    if (!isOpen(vandaag)) return volgendeDag;
    return new Date().getHours() >= morgenGrensUur ? volgendeDag : vandaag;
  }, [isOpen, vandaag, volgendeDag, morgenGrensUur]);

  const dagLabel = useCallback(
    (d: Date) => {
      if (ymd(d) === ymd(vandaag)) return 'Vandaag';
      if (ymd(d) === ymd(addDays(vandaag, 1))) return 'Morgen';
      return format(d, 'EEEE', { locale: nl }).replace(/^./, (c) => c.toUpperCase());
    },
    [vandaag],
  );

  const sluitReden = useCallback(
    (d: Date) => opendagen.data?.datums.find((x) => x.datum === ymd(d) && !x.is_open_uitzondering)?.reden ?? null,
    [opendagen.data],
  );

  return {
    loading: instellingen.isLoading || opendagen.isLoading,
    dagwisselUur,
    morgenGrensUur,
    vandaag,
    volgendeDag,
    standaardDag,
    isOpen,
    volgendeOpenDag,
    dagLabel,
    sluitReden,
  };
}

/** Zorgt dat de dagopbouw voor deze dag gedraaid heeft — cron is gemak, geen vereiste. */
function useZelfherstellendeDagopbouw(location: string, datum: string, enabled: boolean) {
  const qc = useQueryClient();
  useEffect(() => {
    if (!enabled || !location || !datum) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('mep_dagopbouw_log')
        .select('datum')
        .eq('vestiging', location)
        .eq('datum', datum)
        .maybeSingle();
      if (cancelled || data) return;
      const { error } = await supabase.rpc('mep_bouw_dag', { _vestiging: location, _datum: datum });
      if (!cancelled && !error) {
        qc.invalidateQueries({ queryKey: ['mep-planning', location, datum] });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [location, datum, enabled, qc]);
}

export function useMepPlanning(location: string, datum: string, autoBouw = false) {
  const qc = useQueryClient();
  const queryKey = ['mep-planning', location, datum];

  useZelfherstellendeDagopbouw(location, datum, autoBouw);

  const query = useQuery({
    queryKey,
    enabled: !!location && !!datum,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mep_planning')
        .select('*')
        .eq('location', location)
        .eq('date', datum)
        .is('deleted_at', null)
        .order('prioriteit', { ascending: true })
        .order('sort_order', { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as MepRegel[];
    },
  });

  // Realtime: elke tablet ziet wijzigingen direct.
  useEffect(() => {
    if (!location) return;
    const channel = supabase
      .channel(`mep-${location}-${datum}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'mep_planning', filter: `location=eq.${location}` },
        () => qc.invalidateQueries({ queryKey }),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, datum]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ['mep-planning'] });

  const toevoegen = useMutation({
    mutationFn: async ({ regel, dag }: { regel: MepNieuweRegel; dag: string }) => {
      // Bestaat de regel al (zelfde titel + handeling)? Dan heropenen en ophogen.
      const { data: bestaand } = await supabase
        .from('mep_planning')
        .select('id, quantity, completed_at')
        .eq('location', location)
        .eq('date', dag)
        .is('deleted_at', null)
        .ilike('titel', regel.titel)
        .limit(20);

      const match = (bestaand ?? []).find(() => true);
      const dubbel = (bestaand ?? []).length > 0 ? match : null;

      if (dubbel) {
        const { error } = await supabase
          .from('mep_planning')
          .update({
            quantity: (dubbel.quantity ?? 0) + (regel.quantity ?? 1),
            completed_at: null,
            status: 'pending',
          })
          .eq('id', dubbel.id);
        if (error) throw error;
        return 'opgehoogd' as const;
      }

      const { error } = await supabase.from('mep_planning').insert({
        location,
        date: dag,
        titel: regel.titel,
        handeling: regel.handeling ?? null,
        recipe_id: regel.recipe_id ?? null,
        quantity: regel.quantity ?? 1,
        eenheid: regel.eenheid ?? null,
        prioriteit: regel.prioriteit ?? 2,
        employee_id: regel.employee_id ?? null,
        notes: regel.notes ?? null,
        bron: 'handmatig',
        status: 'pending',
        sort_order: ((query.data?.length ?? 0) + 1) * 10,
      });
      if (error) throw error;
      return 'toegevoegd' as const;
    },
    onSuccess: invalidate,
  });

  const bijwerken = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<MepRegel> }) => {
      const { error } = await supabase.from('mep_planning').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const afvinken = useMutation({
    mutationFn: async ({ regel, klaar }: { regel: MepRegel; klaar: boolean }) => {
      const { error } = await supabase
        .from('mep_planning')
        .update({
          completed_at: klaar ? new Date().toISOString() : null,
          status: klaar ? 'completed' : 'pending',
          aantal_klaar: klaar ? regel.quantity ?? 1 : 0,
        })
        .eq('id', regel.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  /** Deelvoortgang: tik op het aantal telt op; vol = klaar. */
  const stapVoortgang = useMutation({
    mutationFn: async (regel: MepRegel) => {
      const totaal = regel.quantity ?? 1;
      const nieuw = regel.aantal_klaar + 1 > totaal ? 0 : regel.aantal_klaar + 1;
      const klaar = nieuw >= totaal;
      const { error } = await supabase
        .from('mep_planning')
        .update({
          aantal_klaar: nieuw,
          completed_at: klaar ? new Date().toISOString() : null,
          status: klaar ? 'completed' : 'pending',
        })
        .eq('id', regel.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const verplaatsNaarDag = useMutation({
    mutationFn: async ({ id, dag }: { id: string; dag: string }) => {
      const { error } = await supabase.from('mep_planning').update({ date: dag }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const verwijderen = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('mep_planning')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const herordenen = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(
        ids.map((id, i) => supabase.from('mep_planning').update({ sort_order: (i + 1) * 10 }).eq('id', id)),
      );
    },
    onSuccess: invalidate,
  });

  return {
    regels: query.data ?? [],
    loading: query.isLoading,
    toevoegen,
    bijwerken,
    afvinken,
    stapVoortgang,
    verplaatsNaarDag,
    verwijderen,
    herordenen,
  };
}

/** Handelingen (bereiden, vacumeren, ...) per vestiging. */
export function useMepHandelingen(location: string) {
  return useQuery({
    queryKey: ['mep-handelingen', location],
    enabled: !!location,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mep_handelingen')
        .select('id, naam, sort_order')
        .eq('vestiging', location)
        .eq('actief', true)
        .order('sort_order');
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Autocomplete: eerder gebruikte titels + receptnamen, zodat "kip vac" niet naast "Kip vacumeren" gaat leven. */
export function useMepTitelSuggesties(location: string) {
  return useQuery({
    queryKey: ['mep-titels', location],
    enabled: !!location,
    queryFn: async () => {
      const sinds = ymd(addDays(new Date(), -180));
      const [{ data: hist }, { data: recepten }] = await Promise.all([
        supabase
          .from('mep_planning')
          .select('titel, recipe_id')
          .eq('location', location)
          .gte('date', sinds)
          .limit(1000),
        supabase
          .from('recipes')
          .select('id, name')
          .eq('is_gearchiveerd', false)
          .or(`location.eq.${location},location.is.null`),
      ]);

      const map = new Map<string, { titel: string; recipe_id: string | null; aantal: number }>();
      for (const r of recepten ?? []) {
        map.set(r.name.toLowerCase(), { titel: r.name, recipe_id: r.id, aantal: 0 });
      }
      for (const h of hist ?? []) {
        const key = h.titel.toLowerCase();
        const bestaand = map.get(key);
        if (bestaand) bestaand.aantal += 1;
        else map.set(key, { titel: h.titel, recipe_id: h.recipe_id, aantal: 1 });
      }
      return [...map.values()].sort((a, b) => b.aantal - a.aantal || a.titel.localeCompare(b.titel));
    },
  });
}

export function useKeukenMedewerkers(location: string) {
  return useQuery({
    queryKey: ['mep-medewerkers', location],
    enabled: !!location,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('foh_employees')
        .select('id, name')
        .eq('location', location)
        .order('name');
      if (error) throw error;
      return data ?? [];
    },
  });
}

export const parseDag = (s: string) => parseISO(s);
