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
    `^FO20,20^A0N,${naamFont},${naamFont}^FB408,2,4,L^FD${naam}^FS`,
    `^FO20,125^A0N,28,28^FD${datum}^FS`,
    `^FO20,165^A0N,24,24^FD${typeLabel}^FS`,
    '^XZ',
  ].join('\n');
}

export function buildLabelOmschrijving(naam: string, datum?: string): string {
  const d = datum ?? vandaagNL();
  return `${sanitizeZpl(naam)} — ${d}`;
}

// Labelary render-URL — alleen voor UI-voorbeeld, niet voor het printen zelf.
// 8dpmm = 203 dpi. 2.24 × 1.26 inch ≈ 57 × 32 mm.
export function labelaryPreviewUrl(zpl: string): string {
  return `https://api.labelary.com/v1/printers/8dpmm/labels/2.24x1.26/0/${encodeURIComponent(zpl)}`;
}
