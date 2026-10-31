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
  const sleutel = eerste.toLowerCase();
  const enkel = Object.entries(meervouden).find(([, m]) => m === sleutel)?.[0];
  const basis = enkel ?? (meervouden[sleutel] ? sleutel : null);
  if (!basis) return `${getal(aantal)} ${eenheid}`;
  const vorm = aantal === 1 ? basis : meervouden[basis];
  return `${getal(aantal)} ${vorm}${rest.length ? ` (${rest.join(' ')})` : ''}`;
}

/** Telwoord met juist enkel/meervoud: telwoord(1, 'regel', 'regels') → '1 regel'. */
export const telwoord = (n: number, enkel: string, meer: string) => `${n} ${n === 1 ? enkel : meer}`;
