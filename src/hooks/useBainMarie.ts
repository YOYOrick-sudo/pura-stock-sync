import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { metHerstel } from '@/lib/appWake';

/**
 * Bain-marie: bakken die meerdere dagen meegaan (kip, vissoep, tom-yum, ei).
 * De app onthoudt per product de startdatum (de dag waarop de bak voor het
 * laatst vers gevuld werd). Alles is standaard 5 dagen houdbaar:
 * dag 1 = startdag, dag 5 = laatste dag, daarna weggooien.
 */

export interface BainMarieBak {
  id: string;
  vestiging: string;
  product: string;
  product_naam: string;
  start_datum: string;
  houdbaarheid_dagen: number;
  actief: boolean;
}

export const BAIN_MARIE_PRODUCTEN = [
  { sleutel: 'kip', naam: 'Kip' },
  { sleutel: 'vissoep', naam: 'Vissoep' },
  { sleutel: 'tom-yum', naam: 'Tomyum' },
  { sleutel: 'ei', naam: 'Ei' },
] as const;

export type BainMarieSleutel = (typeof BAIN_MARIE_PRODUCTEN)[number]['sleutel'];

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
  const max = Math.max(Number(bak.houdbaarheid_dagen) || 5, 1);
  const tot = datumVan(bak.start_datum);
  tot.setDate(tot.getDate() + max - 1);
  const houdbaarTot = isoDatum(tot);
  if (dagNr > max) return { dagNr, startDatum: bak.start_datum, houdbaarTot, status: 'te-oud' };
  if (dagNr === max) return { dagNr, startDatum: bak.start_datum, houdbaarTot, status: 'laatste-dag' };
  return { dagNr, startDatum: bak.start_datum, houdbaarTot, status: 'ok' };
}

export function useBainMarieBakken(vestiging: string) {
  return useQuery({
    queryKey: ['bain-marie-bakken', vestiging],
    queryFn: async () => {
      const { data, error } = await metHerstel(() =>
        supabase
          .from('bain_marie_bakken')
          .select('id, vestiging, product, product_naam, start_datum, houdbaarheid_dagen, actief')
          .eq('vestiging', vestiging)
          .eq('actief', true),
      );
      if (error) throw error;
      return (data ?? []) as BainMarieBak[];
    },
  });
}

/**
 * Noteer de datum van een bain-marie-bak.
 * - "Vandaag (nieuw)": de oude bak wordt gearchiveerd (niets hard verwijderen)
 *   en er komt een nieuwe bak met startdatum vandaag bij.
 * - Een oudere dag: dezelfde bak loopt door, de startdatum wordt bijgewerkt
 *   (of aangemaakt als er nog geen bak bekend was).
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
      houdbaarheidDagen = 5,
    }: {
      product: BainMarieSleutel;
      productNaam: string;
      startDatum: string;
      /** true = verse bak van vandaag (oude bak archiveren). */
      nieuw: boolean;
      houdbaarheidDagen?: number;
    }) => {
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
          houdbaarheid_dagen: houdbaarheidDagen,
          actief: true,
          created_by: user.user?.id ?? null,
        }),
      );
      if (error) throw error;
      return { product };
    },
    onMutate: async ({ product, startDatum, nieuw }) => {
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
          houdbaarheid_dagen: bestaand?.houdbaarheid_dagen ?? 5,
          actief: true,
        };
        return [...rest.filter((b) => b.product !== product), bak];
      });
      return { vorige };
    },
    onError: (_e, _v, context) => {
      if (context?.vorige) qc.setQueryData(sleutel, context.vorige);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: sleutel }),
  });
}
