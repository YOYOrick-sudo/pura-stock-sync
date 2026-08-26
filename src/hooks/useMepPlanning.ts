import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  sort_order_persoon: number;
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

  // Realtime: elke tablet ziet wijzigingen direct. Status voedt de verbindingsbanner.
  const [realtimeOk, setRealtimeOk] = useState(true);
  useEffect(() => {
    if (!location) return;
    const channel = supabase
      .channel(`mep-${location}-${datum}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'mep_planning', filter: `location=eq.${location}` },
        () => qc.invalidateQueries({ queryKey }),
      )
      .subscribe((status) => {
        setRealtimeOk(status === 'SUBSCRIBED');
      });
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location, datum]);

  // Wachtrij met mislukte acties: nooit stilletjes een vinkje kwijt.
  type Wachtrij = { id: number; label: string; run: () => Promise<void> };
  const [wachtrij, setWachtrij] = useState<Wachtrij[]>([]);
  const teller = useRef(0);
  const inWachtrij = useCallback((label: string, run: () => Promise<void>) => {
    teller.current += 1;
    setWachtrij((w) => [...w, { id: teller.current, label, run }]);
  }, []);

  const opnieuwProberen = useCallback(async () => {
    const items = wachtrij;
    setWachtrij([]);
    for (const item of items) {
      try {
        await item.run();
      } catch {
        setWachtrij((w) => [...w, item]);
      }
    }
    qc.invalidateQueries({ queryKey: ['mep-planning'] });
  }, [wachtrij, qc]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ['mep-planning'] });


  const toevoegen = useMutation({
    mutationFn: async ({ regel, dag }: { regel: MepNieuweRegel; dag: string }) => {
      // Bestaat de regel al (zelfde titel + handeling)? Dan heropenen en ophogen.
      const { data: bestaand } = await supabase
        .from('mep_planning')
        .select('id, titel, handeling, quantity, completed_at')
        .eq('location', location)
        .eq('date', dag)
        .is('deleted_at', null)
        .ilike('titel', regel.titel);

      const dubbel = (bestaand ?? []).find(
        (r) =>
          r.titel.toLowerCase() === regel.titel.toLowerCase() &&
          (r.handeling ?? '') === (regel.handeling ?? ''),
      );


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

  /** Afvinken en uitvinken. Uitvinken laat aantal_klaar staan — corrigeren mag geen werk wissen. */
  const afvinken = useMutation({
    mutationFn: async ({ regel, klaar }: { regel: MepRegel; klaar: boolean }) => {
      const patch = {
        completed_at: klaar ? new Date().toISOString() : null,
        status: klaar ? 'completed' : 'pending',
        ...(klaar ? { aantal_klaar: regel.quantity ?? 1 } : {}),
      };
      const { error } = await supabase.from('mep_planning').update(patch).eq('id', regel.id);
      if (error) throw error;
    },
    onSuccess: invalidate,
    onError: (_e, v) =>
      inWachtrij(`${v.klaar ? 'Afvinken' : 'Uitvinken'}: ${v.regel.titel}`, async () => {
        const patch = {
          completed_at: v.klaar ? new Date().toISOString() : null,
          status: v.klaar ? 'completed' : 'pending',
          ...(v.klaar ? { aantal_klaar: v.regel.quantity ?? 1 } : {}),
        };
        const { error } = await supabase.from('mep_planning').update(patch).eq('id', v.regel.id);
        if (error) throw error;
      }),
  });

  /** Deelvoortgang: omhoog of omlaag, altijd tussen 0 en het totaal. */
  const stapVoortgang = useMutation({
    mutationFn: async ({ regel, richting = 1 }: { regel: MepRegel; richting?: 1 | -1 }) => {
      const totaal = regel.quantity ?? 1;
      const ruw = Number(regel.aantal_klaar) + richting;
      const nieuw = richting > 0 ? (ruw > totaal ? 0 : ruw) : Math.max(ruw, 0);
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
    onError: (_e, v) => inWachtrij(`Voortgang: ${v.regel.titel}`, async () => {}),
  });

  const verplaatsNaarDag = useMutation({
    mutationFn: async ({ id, dag }: { id: string; dag: string }) => {
      const { error } = await supabase.from('mep_planning').update({ date: dag }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  /** Toewijzen aan een persoon (of losmaken); belandt achteraan diens lijst. */
  const toewijzen = useMutation({
    mutationFn: async ({ id, employeeId }: { id: string; employeeId: string | null }) => {
      const zelfde = (query.data ?? []).filter((r) => r.employee_id === employeeId);
      const achteraan = (zelfde.length + 1) * 10;
      const { error } = await supabase
        .from('mep_planning')
        .update({ employee_id: employeeId, sort_order_persoon: achteraan })
        .eq('id', id);
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

  const herstellen = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('mep_planning').update({ deleted_at: null }).eq('id', id);
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

  const herordenenPersoon = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(
        ids.map((id, i) =>
          supabase.from('mep_planning').update({ sort_order_persoon: (i + 1) * 10 }).eq('id', id),
        ),
      );
    },
    onSuccess: invalidate,
  });

  return {
    regels: query.data ?? [],
    loading: query.isLoading,
    verbinding: { ok: realtimeOk && wachtrij.length === 0, realtimeOk, wachtrij, opnieuwProberen },
    toevoegen,
    bijwerken,
    afvinken,
    stapVoortgang,
    verplaatsNaarDag,
    toewijzen,
    verwijderen,
    herstellen,
    herordenen,
    herordenenPersoon,
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

export interface MepTemplate {
  id: string;
  vestiging: string;
  weekdag: number | null;
  titel: string;
  handeling: string | null;
  recipe_id: string | null;
  aantal: number | null;
  eenheid: string | null;
  prioriteit: number;
  sort_order: number;
  actief: boolean;
  notitie: string | null;
}

/** Suggestie-chips: wat stond de laatste 4 weken op deze weekdag vaak op de lijst? */
export function useMepSuggesties(location: string, datum: string, huidigeRegels: MepRegel[]) {
  const query = useQuery({
    queryKey: ['mep-suggesties', location, datum],
    enabled: !!location && !!datum,
    queryFn: async () => {
      const dag = parseISO(datum);
      const sinds = ymd(addDays(dag, -28));
      const { data, error } = await supabase
        .from('mep_planning')
        .select('titel, handeling, recipe_id, quantity, eenheid, prioriteit, date')
        .eq('location', location)
        .gte('date', sinds)
        .lt('date', datum)
        .limit(500);
      if (error) throw error;
      const zelfdeWeekdag = (data ?? []).filter((r) => parseISO(r.date).getDay() === dag.getDay());
      const map = new Map<string, { titel: string; handeling: string | null; quantity: number | null; eenheid: string | null; prioriteit: number; aantal: number }>();
      for (const r of zelfdeWeekdag) {
        const key = `${r.titel.toLowerCase()}|${r.handeling ?? ''}`;
        const bestaand = map.get(key);
        if (bestaand) bestaand.aantal += 1;
        else
          map.set(key, {
            titel: r.titel,
            handeling: r.handeling,
            quantity: r.quantity,
            eenheid: r.eenheid,
            prioriteit: r.prioriteit,
            aantal: 1,
          });
      }
      return [...map.values()].sort((a, b) => b.aantal - a.aantal);
    },
  });

  const chips = useMemo(() => {
    const alHier = new Set(huidigeRegels.map((r) => `${r.titel.toLowerCase()}|${r.handeling ?? ''}`));
    return (query.data ?? []).filter((s) => !alHier.has(`${s.titel.toLowerCase()}|${s.handeling ?? ''}`)).slice(0, 5);
  }, [query.data, huidigeRegels]);

  return { chips, loading: query.isLoading };
}

/** Templates per vestiging: lezen en beheren. */
export function useMepTemplates(location: string) {
  const qc = useQueryClient();
  const queryKey = ['mep-templates', location];
  const invalidate = () => qc.invalidateQueries({ queryKey: ['mep-templates'] });

  const query = useQuery({
    queryKey,
    enabled: !!location,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mep_templates')
        .select('*')
        .eq('vestiging', location)
        .order('weekdag', { nullsFirst: true })
        .order('sort_order');
      if (error) throw error;
      return (data ?? []) as unknown as MepTemplate[];
    },
  });

  const opslaan = useMutation({
    mutationFn: async (t: Partial<MepTemplate> & { titel: string }) => {
      if (t.id) {
        const { error } = await supabase.from('mep_templates').update(t).eq('id', t.id);
        if (error) throw error;
        return;
      }
      const aantalBestaand = (query.data ?? []).filter((x) => x.weekdag === (t.weekdag ?? null)).length;
      const { error } = await supabase.from('mep_templates').insert({
        vestiging: location,
        weekdag: t.weekdag ?? null,
        titel: t.titel,
        handeling: t.handeling ?? null,
        recipe_id: t.recipe_id ?? null,
        aantal: t.aantal ?? 1,
        eenheid: t.eenheid ?? null,
        prioriteit: t.prioriteit ?? 2,
        notitie: t.notitie ?? null,
        actief: t.actief ?? true,
        sort_order: (aantalBestaand + 1) * 10,
      });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const verwijderen = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('mep_templates').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  const herordenen = useMutation({
    mutationFn: async (ids: string[]) => {
      await Promise.all(
        ids.map((id, i) => supabase.from('mep_templates').update({ sort_order: (i + 1) * 10 }).eq('id', id)),
      );
    },
    onSuccess: invalidate,
  });

  return { templates: query.data ?? [], loading: query.isLoading, opslaan, verwijderen, herordenen };
}

/** Beheer van handelingen. */
export function useMepHandelingenBeheer(location: string) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['mep-handelingen'] });

  const query = useQuery({
    queryKey: ['mep-handelingen-beheer', location],
    enabled: !!location,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mep_handelingen')
        .select('id, naam, sort_order, actief')
        .eq('vestiging', location)
        .order('sort_order');
      if (error) throw error;
      return data ?? [];
    },
  });

  const opslaan = useMutation({
    mutationFn: async (h: { id?: string; naam: string; actief?: boolean }) => {
      if (h.id) {
        const { error } = await supabase
          .from('mep_handelingen')
          .update({ naam: h.naam, actief: h.actief ?? true })
          .eq('id', h.id);
        if (error) throw error;
        return;
      }
      const { error } = await supabase.from('mep_handelingen').insert({
        vestiging: location,
        naam: h.naam,
        actief: h.actief ?? true,
        sort_order: ((query.data?.length ?? 0) + 1) * 10,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      invalidate();
      qc.invalidateQueries({ queryKey: ['mep-handelingen-beheer'] });
    },
  });

  return { handelingen: query.data ?? [], loading: query.isLoading, opslaan };
}

/** Openingsdagen en sluitdatums beheren; sluitdatum verhuist openstaande regels mee. */
export function useMepOpendagenBeheer(location: string) {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['mep-opendagen'] });
    qc.invalidateQueries({ queryKey: ['mep-opendagen-beheer'] });
    qc.invalidateQueries({ queryKey: ['mep-planning'] });
  };

  const query = useQuery({
    queryKey: ['mep-opendagen-beheer', location],
    enabled: !!location,
    queryFn: async () => {
      const [{ data: dagen, error: e1 }, { data: datums, error: e2 }] = await Promise.all([
        supabase.from('vestiging_opendagen').select('*').eq('vestiging', location).order('weekdag'),
        supabase
          .from('vestiging_sluitdatums')
          .select('*')
          .eq('vestiging', location)
          .gte('datum', ymd(addDays(new Date(), -30)))
          .order('datum'),
      ]);
      if (e1) throw e1;
      if (e2) throw e2;
      return { dagen: dagen ?? [], datums: datums ?? [] };
    },
  });

  const zetWeekdag = useMutation({
    mutationFn: async ({ weekdag, isOpen }: { weekdag: number; isOpen: boolean }) => {
      const { error } = await supabase
        .from('vestiging_opendagen')
        .upsert({ vestiging: location, weekdag, is_open: isOpen }, { onConflict: 'vestiging,weekdag' });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  /** Sluitdatum opslaan en openstaande regels naar de eerstvolgende open dag verhuizen. */
  const zetDatum = useMutation({
    mutationFn: async ({
      datum,
      reden,
      isOpenUitzondering,
    }: {
      datum: string;
      reden: string | null;
      isOpenUitzondering: boolean;
    }) => {
      const { error } = await supabase.from('vestiging_sluitdatums').upsert(
        { vestiging: location, datum, reden, is_open_uitzondering: isOpenUitzondering },
        { onConflict: 'vestiging,datum' },
      );
      if (error) throw error;
      if (isOpenUitzondering) return { verplaatst: 0, naar: null as string | null, ids: [] as string[] };

      const { data: doel } = await supabase.rpc('mep_volgende_open_dag', {
        _vestiging: location,
        _vanaf: datum,
      });
      const naar = doel as unknown as string | null;
      if (!naar) return { verplaatst: 0, naar: null, ids: [] as string[] };

      const { data: open } = await supabase
        .from('mep_planning')
        .select('id')
        .eq('location', location)
        .eq('date', datum)
        .is('deleted_at', null)
        .is('completed_at', null);
      const ids = (open ?? []).map((r) => r.id);
      if (ids.length) {
        const { error: e2 } = await supabase.from('mep_planning').update({ date: naar }).in('id', ids);
        if (e2) throw e2;
      }
      return { verplaatst: ids.length, naar, ids };
    },
    onSuccess: invalidate,
  });

  const verwijderDatum = useMutation({
    mutationFn: async (datum: string) => {
      const { error } = await supabase
        .from('vestiging_sluitdatums')
        .delete()
        .eq('vestiging', location)
        .eq('datum', datum);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  /** Ongedaan maken van de verhuizing bij een sluitdatum. */
  const zetTerug = useMutation({
    mutationFn: async ({ ids, datum }: { ids: string[]; datum: string }) => {
      if (!ids.length) return;
      const { error } = await supabase.from('mep_planning').update({ date: datum }).in('id', ids);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });

  return {
    dagen: query.data?.dagen ?? [],
    datums: query.data?.datums ?? [],
    loading: query.isLoading,
    zetWeekdag,
    zetDatum,
    verwijderDatum,
    zetTerug,
  };
}

