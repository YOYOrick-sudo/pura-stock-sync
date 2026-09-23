import { useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { metHerstel } from '@/lib/appWake';
import { useKanaalHerstel } from '@/lib/realtime';
import { splitsAantalUitTitel } from '@/lib/mep-hoeveelheid';
import { format } from 'date-fns';

export const ymd = (d: Date) => format(d, 'yyyy-MM-dd');

/** Aantal dagen dat een taak openstaat t.o.v. de referentiedatum (0 = vandaag of later). */
export function dagenOpen(taakDatum: string, referentieDatum: string): number {
  if (taakDatum >= referentieDatum) return 0;
  return Math.round(
    (Date.parse(`${referentieDatum}T00:00:00`) - Date.parse(`${taakDatum}T00:00:00`)) / 86_400_000,
  );
}

/** Begin van vandaag (Amsterdamse tijd) als UTC-tijdstip, voor filters op updated_at. */
function beginVanVandaagIso(): string {
  const nu = new Date();
  const [y, m, d] = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Amsterdam',
  })
    .format(nu)
    .split('-')
    .map(Number);

  // Afwijking van Amsterdam t.o.v. UTC op dit moment (winter +60, zomer +120).
  const onderdelen: Record<string, string> = {};
  for (const deel of new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Amsterdam',
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(nu)) {
    onderdelen[deel.type] = deel.value;
  }
  const muurKlokUtc =
    Date.UTC(
      +onderdelen.year,
      +onderdelen.month - 1,
      +onderdelen.day,
      +onderdelen.hour % 24,
      +onderdelen.minute,
      +onderdelen.second,
    ) - nu.getTime();
  const afwijkingMin = muurKlokUtc / 60000;

  return new Date(Date.UTC(y, m - 1, d) - afwijkingMin * 60000).toISOString();
}


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
  handeling: string | null;
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
  handeling?: string | null;
  doel_aantal?: number | null;
  doel_eenheid?: string | null;
  prioriteit?: number;
  toegewezen_aan?: string | null;
  notitie?: string | null;
}


/** Taken van één vestiging op één dag, inclusief realtime sync tussen tablets. */
export function useMepTaken(vestiging: string, datum: string) {
  const qc = useQueryClient();
  const { poging, statusHandler } = useKanaalHerstel();
  const key = useMemo(() => ['mep-taken', vestiging, datum], [vestiging, datum]);

  const query = useQuery({
    queryKey: key,
    enabled: !!vestiging && !!datum,
    placeholderData: (vorige) => vorige,
    queryFn: async () => {
      const vandaag = ymd(new Date());
      // Op vandaag nemen we openstaande taken van eerdere dagen mee: wat niet
      // gemaakt is blijft op de lijst staan tot het klaar is. Afgevinkte
      // achterstand die vandaag is afgewerkt blijft die dag ook zichtbaar
      // (onderaan), daarna hoort hij bij de dag waarop hij gemaakt is.
      const neemAchterstandMee = datum === vandaag;

      let q = supabase
        .from('mep_taken')
        .select('*')
        .eq('vestiging', vestiging)
        .neq('status', 'geannuleerd');

      q = neemAchterstandMee
        ? q.or(
            `taak_datum.eq.${datum},` +
              `and(taak_datum.lt.${datum},status.in.(open,bezig)),` +
              `and(taak_datum.lt.${datum},status.eq.afgerond,updated_at.gte.${beginVanVandaagIso()})`,
          )
        : q.eq('taak_datum', datum);

      const { data, error } = await q;
      if (error) throw error;

      const rijen = (data ?? []) as MepTaak[];
      // Openstaand eerst: handmatige sleepvolgorde wint, daarna belangrijk,
      // oudste invoerdatum en invoervolgorde. Alles wat vandaag is afgevinkt
      // staat onderaan, in de volgorde van afvinken.
      return rijen
        .map((t, i) => ({ t, i }))
        .sort((a, b) => {
          const aKlaar = a.t.status === 'afgerond' ? 1 : 0;
          const bKlaar = b.t.status === 'afgerond' ? 1 : 0;
          if (aKlaar !== bKlaar) return aKlaar - bKlaar;
          if (aKlaar === 1) return a.t.updated_at.localeCompare(b.t.updated_at);
          const aV = Number(a.t.volgorde ?? 0);
          const bV = Number(b.t.volgorde ?? 0);
          if (aV !== bV) return aV - bV;
          if (a.t.prioriteit !== b.t.prioriteit) return a.t.prioriteit - b.t.prioriteit;
          if (a.t.taak_datum !== b.t.taak_datum)
            return a.t.taak_datum.localeCompare(b.t.taak_datum);
          return a.i - b.i;
        })
        .map(({ t }) => t);

    },
  });

  useEffect(() => {
    if (!vestiging || !datum) return;
    const channel = supabase
      .channel(`mep-taken-${vestiging}-${datum}-${poging}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'mep_taken', filter: `vestiging=eq.${vestiging}` },
        () => qc.invalidateQueries({ queryKey: key }),
      )
      .subscribe(statusHandler(() => qc.invalidateQueries({ queryKey: key })));
    return () => {
      supabase.removeChannel(channel);
    };
  }, [vestiging, datum, qc, key, poging, statusHandler]);

  return query;
}

export function useMepTaakMutaties(vestiging: string, datum: string) {
  const qc = useQueryClient();
  const actieveTakenKey = ['mep-taken', vestiging, datum] as const;
  const invalidate = async () => {
    await qc.invalidateQueries({ queryKey: actieveTakenKey, exact: true });
    // Ook de andere daglijsten: een taak kan naar een andere dag verplaatst zijn.
    qc.invalidateQueries({ queryKey: ['mep-taken'] });
    qc.invalidateQueries({ queryKey: ['mep-taken-bereik'] });
    qc.invalidateQueries({ queryKey: ['mep-batches'] });
    qc.invalidateQueries({ queryKey: ['mep-favorieten'] });
  };

  const toevoegen = useMutation({
    mutationFn: async (input: MepTaakInput) => {
      if (!vestiging || !datum) {
        throw new Error('Kies eerst een geldige vestiging en datum');
      }
      const { data: user } = await supabase.auth.getUser();
      // Nieuwe taak sluit aan op de handmatige volgorde: belangrijk bovenaan,
      // normaal onderaan de openstaande lijst.
      const openstaand = (qc.getQueryData<MepTaak[]>(actieveTakenKey) ?? []).filter(
        (t) => t.status !== 'afgerond',
      );
      const volgordes = openstaand.map((t) => Number(t.volgorde ?? 0));
      const volgorde = volgordes.length
        ? (input.prioriteit ?? 2) === 1
          ? Math.min(...volgordes) - 10
          : Math.max(...volgordes) + 10
        : 0;
      const { data, error } = await supabase
        .from('mep_taken')
        .insert({
          ...input,
          vestiging,
          // Een taak mag vooruit gepland worden op een andere dag.
          taak_datum: input.taak_datum || datum,
          volgorde,
          created_by: user.user?.id ?? null,
        })
        .select('*')
        .single();
      if (error) throw error;
      if (!data?.id) throw new Error('De taak is niet opgeslagen');
      return data as MepTaak;
    },
    onSuccess: async (nieuweTaak) => {
      // Zet de opgeslagen rij direct in de zichtbare daglijst. Dit voorkomt dat
      // trage wifi of een vertraagde realtime-event een geslaagde insert verbergt.
      if (nieuweTaak.taak_datum === datum) {
        qc.setQueryData<MepTaak[]>(actieveTakenKey, (huidig = []) => {
          if (huidig.some((taak) => taak.id === nieuweTaak.id)) return huidig;
          return [...huidig, nieuweTaak].sort(
            (a, b) =>
              Number(a.volgorde ?? 0) - Number(b.volgorde ?? 0) ||
              a.prioriteit - b.prioriteit ||
              a.created_at.localeCompare(b.created_at),
          );
        });
      }
      await invalidate();
    },
  });

  /** Handmatige volgorde van de openstaande taken opslaan (slepen). */
  const herordenen = useMutation({
    mutationFn: async (ids: string[]) => {
      const resultaten = await Promise.all(
        ids.map((id, i) =>
          supabase.from('mep_taken').update({ volgorde: (i + 1) * 10 }).eq('id', id),
        ),
      );
      const fout = resultaten.find((r) => r.error);
      if (fout?.error) throw fout.error;
    },
    onMutate: async (ids: string[]) => {
      await qc.cancelQueries({ queryKey: actieveTakenKey, exact: true });
      const vorige = qc.getQueryData<MepTaak[]>(actieveTakenKey);
      qc.setQueryData<MepTaak[]>(actieveTakenKey, (huidig = []) => {
        const nieuweVolgorde = new Map(ids.map((id, i) => [id, (i + 1) * 10]));
        const bijgewerkt = huidig.map((t) =>
          nieuweVolgorde.has(t.id) ? { ...t, volgorde: nieuweVolgorde.get(t.id)! } : t,
        );
        const positie = (t: MepTaak) =>
          t.status === 'afgerond' ? 1e9 : (nieuweVolgorde.get(t.id) ?? Number(t.volgorde ?? 0));
        return [...bijgewerkt].sort((a, b) => positie(a) - positie(b));
      });
      return { vorige };
    },
    onError: (_e, _ids, context) => {
      if (context?.vorige) qc.setQueryData(actieveTakenKey, context.vorige);
    },
    onSettled: invalidate,
  });


  const bijwerken = useMutation({
    mutationFn: async ({ id, ...patch }: Partial<MepTaak> & { id: string }) => {
      const { data, error } = await supabase
        .from('mep_taken')
        .update(patch)
        .eq('id', id)
        .select('*')
        .single();
      if (error) throw error;
      if (!data?.id) throw new Error('De taakwijziging is niet opgeslagen');
      return data as MepTaak;
    },
    onSuccess: async (bijgewerkteTaak) => {
      qc.setQueryData<MepTaak[]>(actieveTakenKey, (huidig = []) =>
        huidig.map((taak) => (taak.id === bijgewerkteTaak.id ? bijgewerkteTaak : taak)),
      );
      await invalidate();
    },
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
      const { data, error } = await metHerstel(() =>
        supabase.rpc('mep_taak_afronden', {
          _taak_id: args.taakId,
          _aantal_gemaakt: args.aantal,
          _temperatuur: args.temperatuur ?? null,
          _notitie: args.notitie ?? null,
        }),
      );
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

  return { toevoegen, bijwerken, verwijderen, afronden, heropenen, herordenen, vestiging, datum };
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
    staleTime: 5 * 60_000,
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
  handeling: string | null;
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
        .select(
          'titel, categorie, recept_id, methode_id, handeling, doel_aantal, doel_eenheid, taak_datum',
        )
        .eq('vestiging', vestiging)
        .gte('taak_datum', vanaf)
        .neq('status', 'geannuleerd')
        .order('taak_datum', { ascending: false })
        .limit(1000);
      if (error) throw error;

      const map = new Map<string, MepFavoriet>();
      for (const t of (data ?? []) as any[]) {
        // Naam zonder aantal: "Taco 4 stuks" en "Taco" horen één knop te zijn.
        const schoon = splitsAantalUitTitel(t.titel ?? '');
        // Item + handeling samen: "Lente-ui · Snijden" is een andere knop dan "Lente-ui · Aanvullen".
        const basis = t.methode_id ?? t.recept_id ?? `vrij:${schoon.titel.toLowerCase()}`;
        const sleutel = `${basis}|${(t.handeling ?? '').toLowerCase()}`;
        const bestaand = map.get(sleutel);
        if (bestaand) {
          bestaand.aantal_keer += 1;
        } else {
          map.set(sleutel, {
            sleutel,
            titel: t.methode_id || t.recept_id ? t.titel : schoon.titel,
            categorie: t.categorie ?? 'Algemeen',
            recept_id: t.recept_id ?? null,
            methode_id: t.methode_id ?? null,
            handeling: t.handeling ?? null,
            // Meest recente hoeveelheid als standaard voor de snelknop.
            doel_aantal: t.doel_aantal ?? schoon.aantal ?? null,
            doel_eenheid: t.doel_eenheid ?? schoon.eenheid ?? null,
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
  const { poging, statusHandler } = useKanaalHerstel();
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
      .channel(`mep-week-${vestiging}-${van}-${poging}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'mep_taken', filter: `vestiging=eq.${vestiging}` },
        () => qc.invalidateQueries({ queryKey: key }),
      )
      .subscribe(statusHandler(() => qc.invalidateQueries({ queryKey: key })));
    return () => {
      supabase.removeChannel(channel);
    };
  }, [vestiging, van, tot, qc, key, poging, statusHandler]);

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
