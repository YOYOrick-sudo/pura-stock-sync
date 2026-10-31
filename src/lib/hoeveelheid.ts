/** Shared quantity notation for Fase 2 screens: number plus correct Dutch singular/plural, no '×'. */
export const getal = (waarde: number | null) => waarde == null ? '—' : new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 2 }).format(waarde);

export const meervouden: Record<string, string> = {
  doos: 'dozen', krat: 'kratten', zak: 'zakken', fles: 'flessen', blik: 'blikken', pak: 'pakken',
  stuk: 'stuks', bakje: 'bakjes', emmer: 'emmers', tray: 'trays', zakje: 'zakjes', pot: 'potten',
  rol: 'rollen', bus: 'bussen', kist: 'kisten', bak: 'bakken', fust: 'fusten', blok: 'blokken',
};

/** Getal plus juiste vorm; formaat tussen haakjes ('36 pakken (1 L)'). Meervoud bij aantal ≠ 1; onbekende eenheden ongewijzigd. */
export function hoeveelheid(aantal: number | null, eenheid: string | null) {
  if (!eenheid) return getal(aantal);
  const [eerste, ...rest] = eenheid.split(' ');
  if (!vormVan(eerste)) return `${getal(aantal)} ${eenheid}`;
  return `${getal(aantal)} ${eenheidVorm(aantal, eerste)}${rest.length ? ` (${rest.join(' ')})` : ''}`;
}

function vormVan(woord: string) {
  const sleutel = woord.toLowerCase();
  return Object.entries(meervouden).find(([, m]) => m === sleutel)?.[0] ?? (meervouden[sleutel] ? sleutel : null);
}

/** Alleen de eenheid in juiste vorm bij dit aantal ('stuks' bij 1 → 'stuk'); onbekende eenheden ongewijzigd. Voor plekken waar getal en eenheid apart staan. */
export function eenheidVorm(aantal: number | null, eenheid: string | null) {
  if (!eenheid) return '';
  const [eerste, ...rest] = eenheid.split(' ');
  const basis = vormVan(eerste);
  if (!basis) return eenheid;
  return [aantal === 1 ? basis : meervouden[basis], ...rest].join(' ');
}

/** Telwoord met juist enkel/meervoud: telwoord(1, 'regel', 'regels') → '1 regel'. */
export const telwoord = (n: number, enkel: string, meer: string) => `${n} ${n === 1 ? enkel : meer}`;
