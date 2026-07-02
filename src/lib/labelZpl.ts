// ZPL helper voor keukenstickers op Zebra ZD411d (203 dpi, 57×32mm).
// - Slimme fontgrootte + word-wrap zodat lange namen niet over de rand vallen.
// - UTF-8 (^CI28) voor accenten.

export function sanitizeZpl(s: string): string {
  return (s ?? '').replace(/[\^~]/g, '').trim();
}

function fontForName(len: number): number {
  if (len <= 16) return 44;
  if (len <= 24) return 36;
  if (len <= 34) return 30;
  return 26;
}

const TYPE_LABEL: Record<string, string> = {
  gerecht: 'Gerecht',
  halffabricaat: 'Halffabricaat',
};

export function vandaagNL(): string {
  return new Date().toLocaleDateString('nl-NL', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export interface RecipeForLabel {
  name: string;
  type: 'gerecht' | 'halffabricaat' | string;
}

// 32×32 monochrome Pura Vida logo (32 dots = ~4 mm bij 203 dpi)
const LOGO_32_HEX =
  '805FFBFF0007FFFF001F20F7018FE06F628023008100218042020001040040118004000280400000018010000E40000011C0000114C4000217E6B13F3CC40EC3184602421846008208C6018108C6218100C6018180C6218180C621018146210081C601008146210081C6010042C6021843C6060880043A668004000080040000';

export function buildRecipeLabelZpl(recept: RecipeForLabel): string {
  const naam = sanitizeZpl(recept.name);
  const datum = vandaagNL();
  const typeLabel = TYPE_LABEL[recept.type] ?? 'Gerecht';
  const naamFont = fontForName(naam.length);

  return [
    '^XA',
    '^CI28',
    '^PW448',
    '^LL256',
    `^FO20,20^A0N,${naamFont},${naamFont}^FB370,2,4,L^FD${naam}^FS`,
    `^FO406,18^GFA,128,128,4,${LOGO_32_HEX}^FS`,
    `^FO20,125^A0N,28,28^FD${datum}^FS`,
    `^FO20,165^A0N,24,24^FD${typeLabel}^FS`,
    '^XZ',
  ].join('\n');
}

export function buildLabelOmschrijving(naam: string, datum?: string): string {
  const d = datum ?? vandaagNL();
  return `${sanitizeZpl(naam)} — ${d}`;
}

// ============ Snel-print stickers (ontdooid / bereid / vrij) ============

export type StickerType = 'ontdooid' | 'bereid' | 'vrij';

const STICKER_KOP: Record<StickerType, string> = {
  ontdooid: 'ONTDOOID',
  bereid: 'BEREID',
  vrij: '',
};

// Iets compacter dan fontForName omdat er 2 datumregels onder moeten.
function fontForStickerName(len: number): number {
  if (len <= 14) return 40;
  if (len <= 22) return 32;
  if (len <= 32) return 26;
  return 22;
}

export interface StickerLabelInput {
  type: StickerType;
  naam: string;
  datum1: string;
  datum2?: string;
}

export function buildStickerZpl(input: StickerLabelInput): string {
  const naam = sanitizeZpl(input.naam);
  const kop = STICKER_KOP[input.type];
  const naamFont = fontForStickerName(naam.length);
  const d1 = sanitizeZpl(input.datum1);
  const d2 = input.datum2 ? sanitizeZpl(input.datum2) : '';

  const lines: string[] = ['^XA', '^CI28', '^PW448', '^LL256'];

  // Kop (klein, vet-look via A0). Weglaten bij 'vrij'.
  if (kop) {
    lines.push(`^FO20,14^A0N,22,22^FD${kop}^FS`);
  }

  // Naam — start iets lager als er een kop is
  const naamY = kop ? 44 : 24;
  lines.push(`^FO20,${naamY}^A0N,${naamFont},${naamFont}^FB408,2,4,L^FD${naam}^FS`);

  // Datums onderaan (label = 256 dots hoog)
  if (input.type === 'vrij') {
    lines.push(`^FO20,208^A0N,28,28^FDDatum: ${d1}^FS`);
  } else if (input.type === 'ontdooid') {
    lines.push(`^FO20,176^A0N,24,24^FDUit vriezer: ${d1}^FS`);
    lines.push(`^FO20,212^A0N,26,26^FDGebruiken t/m: ${d2}^FS`);
  } else {
    lines.push(`^FO20,176^A0N,24,24^FDBereid: ${d1}^FS`);
    lines.push(`^FO20,212^A0N,26,26^FDGebruiken t/m: ${d2}^FS`);
  }

  lines.push('^XZ');
  return lines.join('\n');
}

export function buildStickerOmschrijving(input: StickerLabelInput): string {
  const naam = sanitizeZpl(input.naam);
  if (input.type === 'vrij') {
    return `VRIJ: ${naam} — ${input.datum1}`;
  }
  const kop = STICKER_KOP[input.type];
  return `${kop}: ${naam} — t/m ${input.datum2 ?? ''}`.trim();
}

// Labelary render-URL — alleen voor UI-voorbeeld, niet voor het printen zelf.
// 8dpmm = 203 dpi. 2.24 × 1.26 inch ≈ 57 × 32 mm.
export function labelaryPreviewUrl(zpl: string): string {
  return `https://api.labelary.com/v1/printers/8dpmm/labels/2.24x1.26/0/${encodeURIComponent(zpl)}`;
}
