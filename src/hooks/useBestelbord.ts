import { useEffect, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { metHerstel } from '@/lib/appWake';
import { useKanaalHerstel } from '@/lib/realtime';

export interface BestelSignaal {
  id: string;
  vestiging: string;
  naam: string;
  aantal: number;
  eenheid: string;
  notitie: string | null;
  status: 'open' | 'besteld' | 'geleverd' | 'vervallen';
  bron: string;
  created_at: string;
  besteld_op: string | null;
  bestelreferentie: string | null;
  besteld_via: 'handmatig' | 'bot' | null;
  leverancier_id: string | null;
  artikel_id: string | null;
  artikel_vorm_id: string | null;
  verwachte_levering: string | null;
  geleverd_op: string | null;
  geleverd_door: string | null;
  levering_status: 'geleverd' | 'niet_geleverd' | 'deels' | null;
  levering_opmerking: string | null;
  restant_van: string | null;
}

/** Het digitale bestelbord: wat is op en moet besteld worden. */
export function useBestelSignalen(vestiging: string | null | undefined) {
  const qc = useQueryClient();
  const { poging, statusHandler } = useKanaalHerstel();
  const key = useMemo(() => ['bestel-signalen', vestiging], [vestiging]);

  const query = useQuery({
    queryKey: key,
    enabled: !!vestiging,
    placeholderData: (vorige) => vorige,
    queryFn: async (): Promise<BestelSignaal[]> => {
      const { data, error } = await supabase
        .from('bestel_signalen')
        .select('*')
        .eq('vestiging', vestiging!)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as unknown as BestelSignaal[];
    },
  });

  useEffect(() => {
    if (!vestiging) return;
    const channel = supabase
      .channel(`bestel-signalen-${vestiging}-${poging}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bestel_signalen', filter: `vestiging=eq.${vestiging}` },
        () => qc.invalidateQueries({ queryKey: key }),
      )
      .subscribe(statusHandler(() => qc.invalidateQueries({ queryKey: key })));
    return () => {
      supabase.removeChannel(channel);
    };
  }, [vestiging, qc, key, poging, statusHandler]);

  return query;
}

export interface ArtikelVorm {
  id: string;
  artikel_id: string;
  vorm: string;
  eenheid: string;
  leverancier_id: string | null;
  leverancier_naam?: string | null;
  prijs: number | null;
  prijs_datum: string | null;
  prijs_bron: string | null;
  is_standaard: boolean;
}

export interface BordSuggestie {
  artikel_id: string;
  naam: string;
  leverancier_id: string | null;
  score: number;
  standaard_eenheid: string | null;
  standaard_vorm: string | null;
  vormen: ArtikelVorm[];
}

/** Zoeksuggesties uit de productdatabase (al vanaf 1 letter, tikfouten opgevangen). */
export async function zoekBordSuggesties(vestiging: string, tekst: string): Promise<BordSuggestie[]> {
  const { data, error } = await supabase.rpc('rpc_bord_suggesties', { p_vestiging: vestiging, p_tekst: tekst, p_limit: 8 });
  if (error) throw error;
  return ((data ?? []) as unknown[]).map((r: any) => ({ ...r, vormen: (r.vormen ?? []) as ArtikelVorm[] }));
}

/** Alle actieve verpakkingsvormen van een vestiging (voor indicatieprijzen). */
export function useArtikelVormen(vestiging: string | null | undefined) {
  return useQuery({
    queryKey: ['artikel-vormen', vestiging],
    enabled: !!vestiging,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<ArtikelVorm[]> => {
      const { data, error } = await supabase
        .from('artikel_vormen')
        .select('id, artikel_id, vorm, eenheid, leverancier_id, prijs, prijs_datum, prijs_bron, is_standaard')
        .eq('vestiging', vestiging!)
        .is('deleted_at', null);
      if (error) throw error;
      return (data ?? []) as unknown as ArtikelVorm[];
    },
  });
}

export interface ArtikelKoppeling {
  artikel_id: string | null;
  leverancier_id: string | null;
  artikel_vorm_id: string | null;
}

export function useBestelbordMutaties(vestiging: string) {
  const qc = useQueryClient();
  const key = ['bestel-signalen', vestiging] as const;
  const ververs = () => qc.invalidateQueries({ queryKey: key });

  const toevoegen = useMutation({
    mutationFn: async ({ naam, aantal, eenheid, koppeling }: { naam: string; aantal: number; eenheid: string; koppeling?: ArtikelKoppeling | null }) => {
      if (!vestiging) throw new Error('Vestiging nog niet geladen, probeer het zo opnieuw');
      const { data: user } = await supabase.auth.getUser();
      const { error } = await metHerstel(() =>
        supabase.from('bestel_signalen').insert({
          vestiging,
          naam: naam.trim(),
          aantal,
          eenheid,
          bron: 'handmatig',
          gemeld_door: user.user?.id ?? null,
          ...(koppeling?.artikel_id
            ? { artikel_id: koppeling.artikel_id, leverancier_id: koppeling.leverancier_id, artikel_vorm_id: koppeling.artikel_vorm_id }
            : {}),
        }),
      );
      if (error) throw error;
    },
    onSettled: ververs,
  });

  const zetBesteld = useMutation({
    mutationFn: async ({ id, besteld }: { id: string; besteld: boolean }) => {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await metHerstel(() =>
        supabase
          .from('bestel_signalen')
          .update({
            status: besteld ? 'besteld' : 'open',
            besteld_op: besteld ? new Date().toISOString() : null,
            besteld_door: besteld ? user.user?.id ?? null : null,
            // De database vult verwachte_levering zelf (morgen/volgende open dag); bij terugzetten weer leeg.
            verwachte_levering: null,
          })
          .eq('id', id),
      );
      if (error) throw error;
    },
    onSettled: ververs,
  });

  const verwijderen = useMutation({
    mutationFn: async (id: string) => {
      // Archiveren, niet wissen: historie blijft bewaard.
      const { error } = await metHerstel(() =>
        supabase.from('bestel_signalen').update({ status: 'vervallen' }).eq('id', id),
      );
      if (error) throw error;
    },
    onSettled: ververs,
  });

  const herstel = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await metHerstel(() =>
        supabase.from('bestel_signalen').update({ status: 'open' }).eq('id', id),
      );
      if (error) throw error;
    },
    onSettled: ververs,
  });

  const wijzig = useMutation({
    mutationFn: async ({ id, aantal, eenheid, vorm }: { id: string; aantal: number; eenheid: string; vorm?: { artikel_vorm_id: string | null; leverancier_id: string | null } }) => {
      const { error } = await metHerstel(() =>
        supabase.from('bestel_signalen').update({ aantal, eenheid, ...(vorm ?? {}) }).eq('id', id),
      );
      if (error) throw error;
    },
    onSettled: ververs,
  });

  const markeerGeleverd = useMutation({
    mutationFn: async (ids: string[]) => {
      const { data: user } = await supabase.auth.getUser();
      const { error } = await metHerstel(() =>
        supabase
          .from('bestel_signalen')
          .update({
            status: 'geleverd',
            geleverd_op: new Date().toISOString(),
            geleverd_door: user.user?.id ?? null,
            levering_status: 'geleverd',
          })
          .in('id', ids),
      );
      if (error) throw error;
    },
    onSettled: ververs,
  });

  /** Niet geleverd: terug naar open zodat de bot hem opnieuw meeneemt; opmerking blijft zichtbaar. */
  const nietGeleverd = useMutation({
    mutationFn: async ({ id, opmerking }: { id: string; opmerking: string }) => {
      const { error } = await metHerstel(() =>
        supabase
          .from('bestel_signalen')
          .update({ status: 'open', verwachte_levering: null, levering_status: 'niet_geleverd', levering_opmerking: opmerking })
          .eq('id', id),
      );
      if (error) throw error;
    },
    onSettled: ververs,
  });

  /** Deels geleverd: origineel wordt geleverd, restant komt als nieuwe open regel terug op het bord. */
  const deelsGeleverd = useMutation({
    mutationFn: async ({ signaal, ontvangen, opmerking }: { signaal: BestelSignaal; ontvangen: number; opmerking: string }) => {
      const { data: user } = await supabase.auth.getUser();
      const restant = Number(signaal.aantal) - ontvangen;
      const { error: e1 } = await metHerstel(() =>
        supabase
          .from('bestel_signalen')
          .update({
            status: 'geleverd',
            geleverd_op: new Date().toISOString(),
            geleverd_door: user.user?.id ?? null,
            levering_status: 'deels',
            levering_opmerking: `${ontvangen} ${signaal.eenheid} binnen${opmerking ? ` — ${opmerking}` : ''}`,
          })
          .eq('id', signaal.id),
      );
      if (e1) throw e1;
      const { error: e2 } = await metHerstel(() =>
        supabase.from('bestel_signalen').insert({
          vestiging: signaal.vestiging,
          naam: signaal.naam,
          aantal: restant,
          eenheid: signaal.eenheid,
          bron: 'restant',
          restant_van: signaal.id,
          leverancier_id: signaal.leverancier_id,
          artikel_id: signaal.artikel_id,
          artikel_vorm_id: signaal.artikel_vorm_id,
          levering_opmerking: opmerking || null,
          gemeld_door: user.user?.id ?? null,
        }),
      );
      if (e2) throw e2;
    },
    onSettled: ververs,
  });

  /** Per ongeluk afgevinkt: terug naar onderweg. */
  const terugNaarBesteld = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await metHerstel(() =>
        supabase
          .from('bestel_signalen')
          .update({ status: 'besteld', geleverd_op: null, geleverd_door: null, levering_status: null, levering_opmerking: null })
          .eq('id', id),
      );
      if (error) throw error;
    },
    onSettled: ververs,
  });

  /** Verwachte leverdatum handmatig aanpassen. */
  const zetVerwachteLevering = useMutation({
    mutationFn: async ({ id, datum }: { id: string; datum: string }) => {
      const { error } = await metHerstel(() =>
        supabase.from('bestel_signalen').update({ verwachte_levering: datum }).eq('id', id),
      );
      if (error) throw error;
    },
    onSettled: ververs,
  });

  return { toevoegen, zetBesteld, verwijderen, herstel, wijzig, markeerGeleverd, nietGeleverd, deelsGeleverd, terugNaarBesteld, zetVerwachteLevering };
}

/** Leveranciers (id -> naam) voor groepering in het Onderweg-overzicht. */
export function useLeveranciers() {
  return useQuery({
    queryKey: ['leveranciers-namen'],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.from('leveranciers').select('id, naam').is('deleted_at', null);
      if (error) throw error;
      return new Map((data ?? []).map((l) => [l.id as string, l.naam as string]));
    },
  });
}

/** Openingsdagen van een vestiging (voor "te laat" zonder dichte dagen te tellen). */
export function useVestigingOpenDagen(vestiging: string | null | undefined) {
  const query = useQuery({
    queryKey: ['vestiging-opendagen', vestiging],
    enabled: !!vestiging,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const [{ data: dagen, error: e1 }, { data: datums, error: e2 }] = await Promise.all([
        supabase.from('vestiging_opendagen').select('weekdag, is_open').eq('vestiging', vestiging!),
        supabase.from('vestiging_sluitdatums').select('datum, is_open_uitzondering').eq('vestiging', vestiging!),
      ]);
      if (e1) throw e1;
      if (e2) throw e2;
      return { dagen: dagen ?? [], datums: datums ?? [] };
    },
  });
  const isOpen = (d: Date) => {
    const data = query.data;
    if (!data) return true;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const uitzondering = data.datums.find((x) => x.datum === key);
    if (uitzondering) return uitzondering.is_open_uitzondering;
    const dag = data.dagen.find((x) => x.weekdag === d.getDay());
    return dag ? dag.is_open : true;
  };
  return { isOpen, geladen: !!query.data };
}
