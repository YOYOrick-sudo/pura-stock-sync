export interface TelPlek { naam: string; eenheid: string; factor: number }

export function tellingTotaal(plekken: TelPlek[], waarden: Record<string, string>): number | null {
  let totaal = 0;
  for (const plek of plekken) {
    const tekst = waarden[plek.naam]?.trim();
    if (!tekst) return null;
    const aantal = Number(tekst.replace(',', '.'));
    if (!Number.isFinite(aantal) || aantal < 0) return null;
    totaal += aantal * plek.factor;
  }
  return Math.round(totaal * 1_000_000) / 1_000_000;
}

export function amsterdamDatum(nu = new Date()): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Amsterdam' }).format(nu);
}