/**
 * Aantallen horen in het veld "Hoeveel", niet in de naam van een MEP-taak.
 * Anders krijg je lijsten met "Taco 4 a 5 stuks" en snelknoppen die per
 * hoeveelheid verdubbelen. Deze helper haalt een duidelijk herkenbaar aantal
 * uit de getypte tekst en laat de rest met rust.
 */

export const MEP_EENHEDEN = ['stuks', 'gram', 'kg', 'liter', 'bak'] as const;

/** Schrijfwijzen die koks gebruiken → de eenheid die we opslaan. */
const SYNONIEMEN: Record<string, string> = {
  st: 'stuks',
  stuk: 'stuks',
  stuks: 'stuks',
  g: 'gram',
  gr: 'gram',
  gram: 'gram',
  kg: 'kg',
  kilo: 'kg',
  "kilo's": 'kg',
  l: 'liter',
  ltr: 'liter',
  liter: 'liter',
  bak: 'bak',
  bakken: 'bak',
};

const EENHEID_PATROON = Object.keys(SYNONIEMEN)
  .sort((a, b) => b.length - a.length)
  .join('|');

const GETAL = String.raw`\d+(?:[.,]\d+)?`;
// "4 stuks" of een reeks als "4 a 5 stuks" / "4-5 stuks" / "4/5 stuks"
const MET_EENHEID = String.raw`(${GETAL})(?:\s*(?:a|à|-|\/|tot)\s*(${GETAL}))?\s*(${EENHEID_PATROON})\b`;
// "5x" of "x5" — zonder eenheid, dat zijn stuks
const MET_MAAL = String.raw`(?:(${GETAL})\s*x|x\s*(${GETAL}))`;

export interface SplitsResultaat {
  /** De naam zonder aantal, getrimd en met hoofdletter. */
  titel: string;
  aantal: number | null;
  eenheid: string | null;
  /** True als er daadwerkelijk een aantal uit de naam is gehaald. */
  aangepast: boolean;
  /** True als er daarna nog een los getal in de naam staat. */
  losGetal: boolean;
}

function naarGetal(tekst: string) {
  return Number(tekst.replace(',', '.'));
}

function opschonen(tekst: string) {
  const schoon = tekst.replace(/\s+/g, ' ').replace(/^[\s·,-]+|[\s·,-]+$/g, '');
  return schoon.charAt(0).toUpperCase() + schoon.slice(1);
}

/**
 * Haalt een aantal + eenheid uit het begin of het eind van de tekst.
 * Een getal midden in de naam ("Saus nr 2") of een percentage ("Sap 100%")
 * blijft staan — daar is de kans op een terechte naam te groot.
 */
export function splitsAantalUitTitel(invoer: string): SplitsResultaat {
  const tekst = invoer.trim();
  let rest = tekst;
  let aantal: number | null = null;
  let eenheid: string | null = null;

  const patronen = [
    { re: new RegExp(String.raw`^${MET_EENHEID}\s+`, 'i'), eenheidIndex: 3 },
    { re: new RegExp(String.raw`\s+${MET_EENHEID}$`, 'i'), eenheidIndex: 3 },
    { re: new RegExp(String.raw`^${MET_MAAL}\s+`, 'i'), eenheidIndex: 0 },
    { re: new RegExp(String.raw`\s+${MET_MAAL}$`, 'i'), eenheidIndex: 0 },
  ];

  for (const { re, eenheidIndex } of patronen) {
    const m = rest.match(re);
    if (!m) continue;
    if (eenheidIndex === 0) {
      aantal = naarGetal(m[1] ?? m[2]);
      eenheid = 'stuks';
    } else {
      // Bij een reeks ("4 a 5") de bovenkant aanhouden: dan kom je niet tekort.
      aantal = Math.max(naarGetal(m[1]), m[2] ? naarGetal(m[2]) : naarGetal(m[1]));
      eenheid = SYNONIEMEN[m[eenheidIndex].toLowerCase()] ?? null;
    }
    rest = rest.replace(re, ' ');
    break;
  }

  const titel = opschonen(rest);
  // Geen naam meer over (iemand typte alleen "4 stuks")? Dan laten we de tekst staan.
  if (!titel) {
    return { titel: opschonen(tekst), aantal: null, eenheid: null, aangepast: false, losGetal: false };
  }

  return {
    titel,
    aantal,
    eenheid,
    aangepast: aantal != null,
    losGetal: /(^|\s)\d+(?:[.,]\d+)?(\s|$)/.test(titel),
  };
}
