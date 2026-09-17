/**
 * Eén vaste schrijfwijze voor hoeveelheden in de voorraadronde.
 * Overal hetzelfde: "2 pakjes", "1 bak · GN 1/6 hoog".
 */

const MEERVOUD: Record<string, string> = {
  bak: 'bakken',
  pakje: 'pakjes',
  zak: 'zakken',
  zakje: 'zakjes',
  pot: 'potten',
  pak: 'pakken',
  fles: 'flessen',
  doos: 'dozen',
  blik: 'blikken',
  stuks: 'stuks',
  kilo: 'kilo',
};

/** Eenheid in enkelvoud of meervoud, afhankelijk van het aantal. */
export function eenheidLabel(eenheid: string, aantal: number): string {
  const basis = (eenheid || 'stuks').trim().toLowerCase();
  if (aantal === 1) return basis;
  return MEERVOUD[basis] ?? basis;
}

/** "2 pakjes" — het aantal met de juiste eenheid. */
export function aantalLabel(aantal: number, eenheid: string): string {
  const n = Number.isInteger(aantal) ? aantal : Math.round(aantal * 100) / 100;
  return `${n} ${eenheidLabel(eenheid, aantal)}`;
}

/** "2 pakjes · GN 1/6 hoog" — het volledige streefformaat van een product. */
export function formaatLabel(aantal: number, eenheid: string, formaat?: string | null): string {
  const basis = aantalLabel(aantal, eenheid);
  const maat = (formaat ?? '').trim();
  if (!maat || maat.toLowerCase() === (eenheid ?? '').trim().toLowerCase()) return basis;
  return `${basis} · ${maat}`;
}
