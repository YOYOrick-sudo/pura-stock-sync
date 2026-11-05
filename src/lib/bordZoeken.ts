/**
 * Zoeken op het bestelbord en in de ingrediëntenlijst.
 * De normalisatie volgt public.bestelbot_normaliseer: kleine letters, accenten weg, leestekens en spaties weg.
 * pg_trgm-similarity blijft in rpc_bord_suggesties; hier staan de vaste scoretrappen die de UI en de tests vastzetten.
 */

/** Zichtbare koppeling vanaf deze score. Onder 0.9 geen artikelkoppeling bij Enter. */
export const STERKE_KOPPEL_DREMPEL = 0.9;

/**
 * Historie en concept (vrije bordnaam) krijgen dezelfde trappen, daarna maal deze factor.
 * Een exacte niet-artikelnaam wordt 0.85: lager dan een exact artikel (1) en lager dan de koppeldrempel.
 */
export const HISTORIE_SCORE_FACTOR = 0.85;

export const BORD_SUGGESTIE_LIMIET = 15;
export const INGREDIENT_LIMIET = 15;

/** Genormaliseerde naam of historie telt pas mee voor «Maak artikel» vanaf dit aantal. */
export const HERHAAL_DREMPEL = 2;

const VRIJE_STATUSSEN = new Set(['open', 'besteld', 'geleverd']);

export function bestelbotNormaliseer(waarde: string | null | undefined): string {
  const basis = (waarde ?? '').normalize('NFD').replace(/\p{M}/gu, '');
  return basis.toLowerCase().replace(/[^0-9a-z]+/gi, '');
}

function zoekWoorden(ruw: string): string[] {
  const basis = (ruw ?? '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
  return basis.split(/[^0-9a-z]+/i).filter(Boolean);
}

export type BordBron = 'artikel' | 'historie' | 'concept';

/** Vaste scoretrappen uit rpc_bord_suggesties, zonder de pg_trgm-tak. */
export function bordScore(ruw: string, zoek: string, bron: BordBron): number | null {
  const q = bestelbotNormaliseer(zoek);
  const n = bestelbotNormaliseer(ruw);
  if (!q || !n) return null;
  let s: number | null = null;
  if (n === q) s = 1;
  else if (n.startsWith(q)) s = 0.9;
  else if (zoekWoorden(ruw).some((w) => w.startsWith(q))) s = 0.8;
  else if (n.includes(q)) s = 0.6;
  if (s == null) return null;
  const geschaald = bron === 'artikel' ? s : s * HISTORIE_SCORE_FACTOR;
  return Math.round(geschaald * 1000) / 1000;
}

export function isSterkeArtikeltreffer(s: {
  score: number | string | null;
  artikel_id: string | null;
  bron?: string | null;
}): boolean {
  if (!s.artikel_id || s.bron === 'historie' || s.bron === 'concept') return false;
  const score = typeof s.score === 'number' ? s.score : Number(s.score);
  return Number.isFinite(score) && score >= STERKE_KOPPEL_DREMPEL;
}

/** -1: Enter maakt een vrije regel. 0: de top is een sterk artikel en Enter/tik kiest die. */
export function actieveSuggestieIndex<T extends { score: number | string | null; artikel_id: string | null; bron?: string | null }>(
  rijen: T[],
): number {
  return rijen.length > 0 && isSterkeArtikeltreffer(rijen[0]) ? 0 : -1;
}

export function enterKiestSuggestie(lijstZichtbaar: boolean, actief: number): boolean {
  return lijstZichtbaar && actief >= 0;
}

export function isArtikelSuggestie<T extends { artikel_id: string | null; bron?: string | null }>(
  rij: T,
): rij is T & { artikel_id: string } {
  return !!rij.artikel_id && rij.bron !== 'historie' && rij.bron !== 'concept';
}

export function suggestieSubtekst(bron: string | null | undefined, onderschrift: string): string {
  const label = bron === 'historie' || bron === 'concept' ? 'eerder besteld' : '';
  return [label, onderschrift].filter(Boolean).join(' · ');
}

/**
 * Normen die minstens HERHAAL_DREMPEL keer vrij op het bord staan,
 * plus normen die de RPC al als herhaling (bord of historie) heeft gemeld.
 */
export function herhaalNormen(
  signalen: { naam: string; artikel_id: string | null; status: string }[],
  historieNormen: Iterable<string> = [],
): Set<string> {
  const telling = new Map<string, number>();
  for (const s of signalen) {
    if (s.artikel_id || !VRIJE_STATUSSEN.has(s.status)) continue;
    const n = bestelbotNormaliseer(s.naam);
    if (!n) continue;
    telling.set(n, (telling.get(n) ?? 0) + 1);
  }
  const uit = new Set<string>();
  for (const [n, k] of telling) if (k >= HERHAAL_DREMPEL) uit.add(n);
  for (const n of historieNormen) {
    const norm = bestelbotNormaliseer(n) || n;
    if (norm) uit.add(norm);
  }
  return uit;
}

/** Zelfde bevat-regel als rpc_ingredient_suggesties. De combobox filtert niet zelf. */
export function filterIngredienten<T extends { naam: string }>(
  rijen: T[],
  term: string,
  limiet = INGREDIENT_LIMIET,
): T[] {
  const q = bestelbotNormaliseer(term);
  if (q.length < 2) return [];
  return rijen
    .filter((r) => bestelbotNormaliseer(r.naam).includes(q))
    .sort((a, b) => a.naam.localeCompare(b.naam, 'nl') || a.naam.localeCompare(b.naam))
    .slice(0, limiet);
}
