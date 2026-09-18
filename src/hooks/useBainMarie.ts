import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { metHerstel } from '@/lib/appWake';

/**
 * Bain-marie: bakken die meerdere dagen meegaan (kip, vissoep, tom-yum, ei).
 * De app onthoudt per product de startdatum (de dag waarop de bak voor het
 * laatst vers gevuld werd). Houdbaarheid verschilt per product:
 * dag 1 = startdag, laatste dag = startdag + max - 1, daarna weggooien.
 */

export interface BainMarieBak {
  id: string;
  vestiging: string;
  product: string;
  product_naam: string;
  start_datum: string;
  houdbaarheid_dagen: number;
  actief: boolean;
  /** Datum op de ontdooi-sticker van de vriezer-zak (alleen zak-producten). */
  ontdooid_datum?: string | null;
  /** Datum waarop de bak bij sluit is weggegooid. */
  weggegooid_op?: string | null;
}

export const BAIN_MARIE_PRODUCTEN = [
  { sleutel: 'kip', naam: 'Kip', houdbaarheid: 5, heeftVriesZak: true },
  { sleutel: 'vissoep', naam: 'Vissoep', houdbaarheid: 6, heeftVriesZak: false },
  { sleutel: 'tom-yum', naam: 'Tomyum', houdbaarheid: 6, heeftVriesZak: false },
  { sleutel: 'ei', naam: 'Ei', houdbaarheid: 4, heeftVriesZak: false },
] as const;

export type BainMarieSleutel = (typeof BAIN_MARIE_PRODUCTEN)[number]['sleutel'];

/** Houdbaarheid in dagen voor een product (kolom blijft als toekomstige override). */
export function houdbaarheidVan(sleutel: string): number {
  return (
    BAIN_MARIE_PRODUCTEN.find((p) => p.sleutel === sleutel)?.houdbaarheid ?? 5
  );
}

/** ISO-datum (yyyy-mm-dd) voor een Date, zonder tijdzone-ellende. */
export function isoDatum(d: Date): string {
  const j = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dag = String(d.getDate()).padStart(2, '0');
  return `${j}-${m}-${dag}`;
}

function datumVan(iso: string): Date {
  return new Date(`${iso}T12:00:00`);
}

/** Volledige dagnaam in het Nederlands, bv. "woensdag". */
export function dagNaam(iso: string): string {
  const d = datumVan(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString('nl-NL', { weekday: 'long' });
}

/** Korte dagnaam, bv. "wo". */
export function dagKort(iso: string): string {
  const d = datumVan(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString('nl-NL', { weekday: 'short' }).replace('.', '');
}

export interface BainMarieStatus {
  /** 1 = startdag. Null als er geen bak geregistreerd is. */
  dagNr: number | null;
  /** ISO-datum waarop de bak is gestart. */
  startDatum: string | null;
  /** Laatste dag dat de bak mag worden gebruikt. */
  houdbaarTot: string | null;
  status: 'geen' | 'ok' | 'laatste-dag' | 'te-oud';
}

export function bakStatus(bak: BainMarieBak | undefined, vandaagIso: string): BainMarieStatus {
  if (!bak) {
    return { dagNr: null, startDatum: null, houdbaarTot: null, status: 'geen' };
  }
  const dagen = Math.floor(
    (datumVan(vandaagIso).getTime() - datumVan(bak.start_datum).getTime()) / 86_400_000,
  );
  const dagNr = dagen + 1;
  const max = Math.max(
    Number(bak.houdbaarheid_dagen) || houdbaarheidVan(bak.product),
    1,
  );
  const tot = datumVan(bak.start_datum);
  tot.setDate(tot.getDate() + max - 1);
  const houdbaarTot = isoDatum(tot);
  if (dagNr > max) return { dagNr, startDatum: bak.start_datum, houdbaarTot, status: 'te-oud' };
  if (dagNr === max) return { dagNr, startDatum: bak.start_datum, houdbaarTot, status: 'laatste-dag' };
  return { dagNr, startDatum: bak.start_datum, houdbaarTot, status: 'ok' };
}

const SELECT_VELDEN =
  'id, vestiging, product, product_naam, start_datum, houdbaarheid_dagen, actief, ontdooid_datum, weggegooid_op';

export function useBainMarieBakken(vestiging: string) {
  return useQuery({
    queryKey: ['bain-marie-bakken', vestiging],
    queryFn: async () => {
      const { data, error } = await metHerstel(() =>
        supabase
          .from('bain_marie_bakken')
          .select(SELECT_VELDEN)
          .eq('vestiging', vestiging)
          .eq('actief', true),
      );
      if (error) throw error;
      return (data ?? []) as BainMarieBak[];
    },
  });
}

/**
 * Recent weggegooide bakken (laatste 2 dagen), zodat de open-lijst kan tonen
 * dat er bewust géén bak is ("weggegooid") in plaats van stilte.
 */
export function useBainMarieWeggegooid(vestiging: string) {
  return useQuery({
    queryKey: ['bain-marie-weggegooid', vestiging],
    queryFn: async () => {
      const grens = new Date();
      grens.setDate(grens.getDate() - 2);
      const { data, error } = await metHerstel(() =>
        supabase
          .from('bain_marie_bakken')
          .select(SELECT_VELDEN)
          .eq('vestiging', vestiging)
          .eq('actief', false)
          .not('weggegooid_op', 'is', null)
          .gte('weggegooid_op', isoDatum(grens))
          .order('weggegooid_op', { ascending: false }),
      );
      if (error) throw error;
      // Per product alleen de meest recente.
      const perProduct = new Map<string, BainMarieBak>();
      for (const rij of (data ?? []) as BainMarieBak[]) {
        if (!perProduct.has(rij.product)) perProduct.set(rij.product, rij);
      }
      return perProduct;
    },
  });
}

/**
 * Noteer de datum van een bain-marie-bak.
 * - "Vandaag (nieuw)": de oude bak wordt gearchiveerd (niets hard verwijderen)
 *   en er komt een nieuwe bak met startdatum vandaag bij. Bij zak-producten
 *   kan de ontdooid-datum van de zak meegegeven worden.
 * - Een oudere dag: dezelfde bak loopt door, de startdatum wordt bijgewerkt
 *   (of aangemaakt als er nog geen bak bekend was). De zak blijft dezelfde.
 */
export function useZetBainMarieStart(vestiging: string) {
  const qc = useQueryClient();
  const sleutel = ['bain-marie-bakken', vestiging] as const;
  return useMutation({
    mutationFn: async ({
      product,
      productNaam,
      startDatum,
      nieuw,
      houdbaarheidDagen,
      ontdooidDatum,
    }: {
      product: BainMarieSleutel;
      productNaam: string;
      startDatum: string;
      /** true = verse bak van vandaag (oude bak archiveren). */
      nieuw: boolean;
      houdbaarheidDagen?: number;
      /** Datum op de ontdooi-sticker van de zak (alleen bij nieuwe zak). */
      ontdooidDatum?: string | null;
    }) => {
      const houdbaarheid = houdbaarheidDagen ?? houdbaarheidVan(product);
      if (nieuw) {
        await metHerstel(() =>
          supabase
            .from('bain_marie_bakken')
            .update({ actief: false })
            .eq('vestiging', vestiging)
            .eq('product', product)
            .eq('actief', true),
        );
      } else {
        // Bestaat er al een actieve bak? Dan alleen de startdatum bijwerken.
        const { data: bestaand } = await metHerstel(() =>
          supabase
            .from('bain_marie_bakken')
            .select('id')
            .eq('vestiging', vestiging)
            .eq('product', product)
            .eq('actief', true)
            .limit(1),
        );
        if (bestaand && bestaand.length > 0) {
          const { error } = await metHerstel(() =>
            supabase
              .from('bain_marie_bakken')
              .update({ start_datum: startDatum })
              .eq('id', bestaand[0].id),
          );
          if (error) throw error;
          return { product };
        }
      }
      const { data: user } = await supabase.auth.getUser();
      const { error } = await metHerstel(() =>
        supabase.from('bain_marie_bakken').insert({
          vestiging,
          product,
          product_naam: productNaam,
          start_datum: startDatum,
          houdbaarheid_dagen: houdbaarheid,
          ontdooid_datum: nieuw ? (ontdooidDatum ?? null) : null,
          actief: true,
          created_by: user.user?.id ?? null,
        }),
      );
      if (error) throw error;
      return { product };
    },
    onMutate: async ({ product, startDatum, nieuw, ontdooidDatum }) => {
      await qc.cancelQueries({ queryKey: sleutel });
      const vorige = qc.getQueryData<BainMarieBak[]>(sleutel);
      qc.setQueryData<BainMarieBak[]>(sleutel, (huidig = []) => {
        const naam = BAIN_MARIE_PRODUCTEN.find((p) => p.sleutel === product)?.naam ?? product;
        const rest = nieuw ? huidig.filter((b) => b.product !== product) : huidig;
        const bestaand = huidig.find((b) => b.product === product);
        const bak: BainMarieBak = {
          id: bestaand?.id ?? `optimistisch-${product}`,
          vestiging,
          product,
          product_naam: naam,
          start_datum: startDatum,
          houdbaarheid_dagen: bestaand?.houdbaarheid_dagen ?? houdbaarheidVan(product),
          actief: true,
          ontdooid_datum: nieuw
            ? (ontdooidDatum ?? null)
            : (bestaand?.ontdooid_datum ?? null),
        };
        return [...rest.filter((b) => b.product !== product), bak];
      });
      return { vorige };
    },
    onError: (_e, _v, context) => {
      if (context?.vorige) qc.setQueryData(sleutel, context.vorige);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: sleutel });
      qc.invalidateQueries({ queryKey: ['bain-marie-weggegooid', vestiging] });
    },
  });
}

/**
 * Gooi een bak weg bij sluit (laatste dag of te oud). De bak wordt
 * afgesloten: actief = false + weggegooid_op = vandaag. Nooit hard verwijderen.
 */
export function useGooiBainMarieWeg(vestiging: string) {
  const qc = useQueryClient();
  const sleutel = ['bain-marie-bakken', vestiging] as const;
  return useMutation({
    mutationFn: async ({ bak }: { bak: BainMarieBak }) => {
      const { error } = await metHerstel(() =>
        supabase
          .from('bain_marie_bakken')
          .update({ actief: false, weggegooid_op: isoDatum(new Date()) })
          .eq('id', bak.id),
      );
      if (error) throw error;
      return { product: bak.product };
    },
    onMutate: async ({ bak }) => {
      await qc.cancelQueries({ queryKey: sleutel });
      const vorige = qc.getQueryData<BainMarieBak[]>(sleutel);
      qc.setQueryData<BainMarieBak[]>(sleutel, (huidig = []) =>
        huidig.filter((b) => b.id !== bak.id),
      );
      return { vorige };
    },
    onError: (_e, _v, context) => {
      if (context?.vorige) qc.setQueryData(sleutel, context.vorige);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: sleutel });
      qc.invalidateQueries({ queryKey: ['bain-marie-weggegooid', vestiging] });
    },
  });
}
