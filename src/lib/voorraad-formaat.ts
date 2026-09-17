/**
 * Eén vaste schrijfwijze voor hoeveelheden in de voorraadronde.
 * Bakjes in gewone taal ("standaard bakje, diep") met de GN-code als bijschrift.
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

/** GN-maat → gewone naam. */
const GN_NAAM: Record<string, string> = {
  '1/9': 'klein bakje',
  '1/6': 'standaard bakje',
  '1/4': 'breed bakje',
  '1/3': 'groot bakje',
  '1/2': 'halve bak',
  '1/1': 'hele bak',
};

/** "midden"/"halfhoog" → ondiep, "hoog" → diep. */
const HOOGTE_NAAM: Record<string, string> = {
  laag: 'ondiep',
  midden: 'ondiep',
  halfhoog: 'ondiep',
  hoog: 'diep',
};

/** Eenheid in enkelvoud of meervoud, afhankelijk van het aantal. */
export function eenheidLabel(eenheid: string, aantal: number): string {
  const basis = (eenheid || 'stuks').trim().toLowerCase();
  if (aantal === 1) return basis;
  return MEERVOUD[basis] ?? basis;
}

/** Getal in Nederlandse schrijfwijze: 2 → "2", 2.5 → "2,5". */
export function getalLabel(aantal: number): string {
  const n = Math.round(aantal * 100) / 100;
  return Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0$/, '').replace('.', ',');
}

/** "2 pakjes" / "1,5 bak" — het aantal met de juiste eenheid. */
export function aantalLabel(aantal: number, eenheid: string): string {
  return `${getalLabel(aantal)} ${eenheidLabel(eenheid, aantal)}`;
}

/**
 * Bakje in gewone taal, met de GN-code erachter voor wie ermee werkt.
 * "GN 1/6 hoog" → { naam: 'standaard bakje, diep', code: 'GN 1/6' }
 */
export function bakjeLabel(formaat?: string | null): { naam: string; code: string | null } | null {
  const ruw = (formaat ?? '').trim();
  if (!ruw) return null;
  const match = ruw.match(/gn\s*(\d\/\d)\s*(laag|midden|halfhoog|hoog)?/i);
  if (!match) return { naam: ruw, code: null };
  const naam = GN_NAAM[match[1]] ?? `GN ${match[1]}`;
  const hoogte = match[2] ? HOOGTE_NAAM[match[2].toLowerCase()] : null;
  return { naam: hoogte ? `${naam}, ${hoogte}` : naam, code: `GN ${match[1]}` };
}

/** "2 bakken · standaard bakje, diep (GN 1/6)" — het volledige streefformaat. */
export function formaatLabel(aantal: number, eenheid: string, formaat?: string | null): string {
  const basis = aantalLabel(aantal, eenheid);
  const bakje = bakjeLabel(formaat);
  if (!bakje) return basis;
  if (bakje.naam.toLowerCase() === (eenheid ?? '').trim().toLowerCase()) return basis;
  return `${basis} · ${bakje.naam}${bakje.code ? ` (${bakje.code})` : ''}`;
}
