/**
 * Eén vaste schrijfwijze voor hoeveelheden in de voorraadronde.
 * Altijd in deze volgorde: aantal — maat — hoogte — GN-code.
 * Voorbeeld: "1 bakje · klein, hoog (GN 1/9 hoog)".
 */

const MEERVOUD: Record<string, string> = {
  bak: 'bakken',
  bakje: 'bakjes',
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

/** GN-maat → kort maatwoord (het woord "bakje"/"bak" komt uit de eenheid). */
const GN_KORT: Record<string, string> = {
  '1/9': 'klein',
  '1/6': 'standaard',
  '1/4': 'breed',
  '1/3': 'groot',
  '1/2': 'halve',
  '1/1': 'hele',
};

/** Vanaf GN 1/2 spreken we van een bak, daaronder van een bakje. */
const GROTE_MATEN = new Set(['1/2', '1/1']);

/** De drie hoogtes die het team gebruikt. */
export const HOOGTES = ['laag', 'midden', 'hoog'] as const;
export type Hoogte = (typeof HOOGTES)[number];

/** De GN-maten die gekozen kunnen worden. */
export const GN_MATEN = ['1/9', '1/6', '1/4', '1/3', '1/2', '1/1'] as const;

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

export type Bakje = {
  /** Maat zonder eenheid: "klein", "standaard", "breed". */
  kort: string;
  /** Maat met eenheid: "klein bakje". */
  maat: string;
  /** laag | midden | hoog, of null als het niet is ingevuld. */
  hoogte: Hoogte | null;
  /** "GN 1/9 hoog" — precies zoals het op de bak staat. */
  code: string | null;
  /** Volledige omschrijving: "klein bakje, hoog". */
  naam: string;
};

/**
 * Bakje in gewone taal, met de GN-code erachter voor wie ermee werkt.
 * "GN 1/6 hoog" → { kort: 'standaard', maat: 'standaard bakje', hoogte: 'hoog', code: 'GN 1/6 hoog' }
 */
export function bakjeLabel(formaat?: string | null): Bakje | null {
  const ruw = (formaat ?? '').trim();
  if (!ruw) return null;
  const match = ruw.match(/gn\s*(\d\/\d)\s*(laag|midden|halfhoog|hoog)?/i);
  if (!match) return { kort: ruw, maat: ruw, hoogte: null, code: null, naam: ruw };
  const maatCode = match[1];
  const kort = GN_KORT[maatCode] ?? `GN ${maatCode}`;
  const eenheid = GROTE_MATEN.has(maatCode) ? 'bak' : 'bakje';
  const ruwe = match[2]?.toLowerCase();
  const hoogte: Hoogte | null = ruwe ? (ruwe === 'halfhoog' ? 'midden' : (ruwe as Hoogte)) : null;
  const maat = `${kort} ${eenheid}`;
  return {
    kort,
    maat,
    hoogte,
    code: `GN ${maatCode}${hoogte ? ` ${hoogte}` : ''}`,
    naam: hoogte ? `${maat}, ${hoogte}` : maat,
  };
}

/** Bij een GN-formaat is de eenheid altijd een bakje of een bak — nooit "stuks". */
export function eenheidUitFormaat(formaat?: string | null, val = 'stuks'): string {
  const match = (formaat ?? '').trim().match(/gn\s*(\d\/\d)/i);
  if (!match) return val;
  return GROTE_MATEN.has(match[1]) ? 'bak' : 'bakje';
}

/** Alleen de GN-code, of null als het geen GN-bakje is. */
export function bakjeCode(formaat?: string | null): string | null {
  return bakjeLabel(formaat)?.code ?? null;
}

/** "1 bakje · klein, hoog (GN 1/9 hoog)" — het volledige streefformaat. */
export function formaatLabel(aantal: number, eenheid: string, formaat?: string | null): string {
  const bakje = bakjeLabel(formaat);
  const eenheidNu = eenheidUitFormaat(formaat, eenheid);
  const basis = aantalLabel(aantal, eenheidNu);
  if (!bakje || !bakje.code) return basis;
  const maat = bakje.hoogte ? `${bakje.kort}, ${bakje.hoogte}` : bakje.kort;
  return `${basis} · ${maat} (${bakje.code})`;
}
