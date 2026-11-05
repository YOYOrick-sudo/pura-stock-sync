/**
 * Artikelstam fase 1: zoeken en een concept na de eerste bestelling.
 *
 * De drempel 0,9 is dezelfde als STERKE_KOPPEL_DREMPEL in bordZoeken.ts.
 * Historie zonder artikel_id telt nooit als treffer, ook niet bij score 1.
 * Een concept in de stam heeft wél een artikel_id en mag dus wel voorgesteld worden.
 *
 * Zolang de migratie niet gedraaid is, ontbreken artikel_zoek_v2 en
 * rpc_bord_maak_concept_artikel_v2. Dat is de fallback: de bestelling blijft
 * zoals nu, zonder concept en zonder koppeling.
 */

import { STERKE_KOPPEL_DREMPEL } from './bordZoeken';

/** West, Midsland en Test. Een alias hoort bij één van deze vestigingen, nooit bij NULL. */
export const STAM_VESTIGINGEN = ['West', 'Midsland', 'Test'] as const;

export type StamVestiging = (typeof STAM_VESTIGINGEN)[number];

export type ArtikelZoekBron = 'artikel' | 'historie';

export interface ArtikelZoekRij {
  artikel_id: string | null;
  naam: string;
  score: number;
  /** actief, concept, of leeg bij een historienaam zonder artikel. */
  status: string | null;
  bron: ArtikelZoekBron;
  standaard_vorm: string | null;
  standaard_eenheid: string | null;
  op_vestiging: boolean;
}

export type EersteBestellingUitkomst =
  | { soort: 'overgeslagen' }
  | { soort: 'database_oud' }
  | { soort: 'voorstel'; artikel_id: string; naam: string; status: string | null; score: number }
  | { soort: 'aangemaakt'; artikel_id: string }
  | { soort: 'fout'; bericht: string };

export interface EersteBestellingRegel {
  id: string;
  naam: string;
  artikel_id: string | null;
  leverancier_id: string | null;
  vestiging: string;
}

export function isStamVestiging(vestiging: string | null | undefined): vestiging is StamVestiging {
  return !!vestiging && (STAM_VESTIGINGEN as readonly string[]).includes(vestiging);
}

/** Label bij een concept in de stam. Een actief artikel krijgt geen extra label. */
export function artikelstamLabel(status: string | null | undefined): string {
  return status === 'concept' ? 'Nieuw, nog bevestigen' : '';
}

/**
 * De functie staat nog niet in deze database (migratie niet gedraaid).
 * PostgREST: PGRST202. Postgres: 42883.
 */
export function rpcOntbreekt(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const e = error as { code?: string; message?: string };
  const tekst = `${e.code ?? ''} ${e.message ?? ''}`.toLowerCase();
  return e.code === 'PGRST202'
    || e.code === '42883'
    || tekst.includes('could not find the function')
    || tekst.includes('schema cache')
    || tekst.includes('does not exist')
    || (tekst.includes('functie') && tekst.includes('bestaat niet'));
}

function scoreVan(score: number | string | null | undefined): number {
  const n = typeof score === 'number' ? score : Number(score);
  return Number.isFinite(n) ? n : NaN;
}

/**
 * Een stamartikel (actief of concept) met score ≥ 0,9.
 * Historie en een vrije bordnaam zonder artikel_id vallen erbuiten.
 */
export function isStamtreffer(rij: {
  artikel_id: string | null;
  score: number | string | null;
  bron?: string | null;
}): boolean {
  if (!rij.artikel_id || rij.bron === 'historie') return false;
  const score = scoreVan(rij.score);
  return Number.isFinite(score) && score >= STERKE_KOPPEL_DREMPEL;
}

/** Eerste rij die als bestaand artikel geldt. De RPC sorteert de sterkste bovenaan. */
export function sterksteStamtreffer<T extends { artikel_id: string | null; score: number | string | null; bron?: string | null }>(
  rijen: T[],
): T | null {
  return rijen.find((rij) => isStamtreffer(rij)) ?? null;
}

export interface EersteBestellingAfhankelijkheden {
  zoek: (vestiging: string, tekst: string) => Promise<ArtikelZoekRij[]>;
  maak: (vestiging: string, naam: string, leverancierId: string | null) => Promise<{ artikel_id: string }>;
  koppel: (signaalId: string, artikelId: string) => Promise<void>;
}

/**
 * Na het aanvinken van besteld, en alleen voor een vrije regel.
 * Eerst zoeken. Bij een treffer ≥ 0,9 stelt de app dat artikel voor.
 * Anders maakt de RPC een concept en koppelt de app alleen artikel_id.
 */
export async function naEersteBestelling(
  regel: EersteBestellingRegel,
  deps: EersteBestellingAfhankelijkheden,
): Promise<EersteBestellingUitkomst> {
  if (regel.artikel_id || !isStamVestiging(regel.vestiging) || !regel.naam.trim()) {
    return { soort: 'overgeslagen' };
  }
  let rijen: ArtikelZoekRij[];
  try {
    rijen = await deps.zoek(regel.vestiging, regel.naam);
  } catch (error) {
    if (rpcOntbreekt(error)) return { soort: 'database_oud' };
    return { soort: 'fout', bericht: foutTekst(error) };
  }
  const treffer = sterksteStamtreffer(rijen);
  if (treffer?.artikel_id) {
    return {
      soort: 'voorstel',
      artikel_id: treffer.artikel_id,
      naam: treffer.naam,
      status: treffer.status,
      score: scoreVan(treffer.score),
    };
  }
  try {
    const gemaakt = await deps.maak(regel.vestiging, regel.naam.trim(), regel.leverancier_id);
    if (!gemaakt.artikel_id) return { soort: 'fout', bericht: 'De stam gaf geen artikel terug' };
    await deps.koppel(regel.id, gemaakt.artikel_id);
    return { soort: 'aangemaakt', artikel_id: gemaakt.artikel_id };
  } catch (error) {
    if (rpcOntbreekt(error)) return { soort: 'database_oud' };
    return { soort: 'fout', bericht: foutTekst(error) };
  }
}

function foutTekst(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === 'object' && error && 'message' in error && typeof error.message === 'string' && error.message) {
    return error.message;
  }
  return 'onbekende fout';
}
