/**
 * Regels van de afvink-sluitronde (West). Puur, zonder database, zodat ze
 * getest kunnen worden.
 */

export type SluitSoort = 'pakken' | 'snijden' | 'maken';

/** Wat voor product het is bepaalt de extra knop in de ronde. */
export function soortVanBron(bron: string | null | undefined): SluitSoort {
  if (bron === 'snijden') return 'snijden';
  if (bron === 'zelf_west') return 'maken';
  return 'pakken';
}

/** Welke bron hoort bij een gekozen soort. Pakken houdt zijn huidige bron. */
/**
 * Bron die hoort bij een gekozen soort. Terug naar "pakken" leidt de bron af
 * uit waar hetzelfde product verder in de keten ligt (koelcel → vriezer → magazijn),
 * zodat de oorspronkelijke keten terugkomt.
 */
export function bronVoorSoort(
  soort: SluitSoort,
  huidigeBron: string,
  ketenPlekken: string[] = [],
): string {
  if (soort === 'snijden') return 'snijden';
  if (soort === 'maken') return 'zelf_west';
  if (huidigeBron !== 'snijden' && huidigeBron !== 'zelf_west') return huidigeBron;
  if (ketenPlekken.includes('koelcel')) return 'koelcel_inkoop';
  if (ketenPlekken.includes('vriezer')) return 'vriezer';
  if (ketenPlekken.includes('magazijn')) return 'magazijn';
  return 'koelcel_inkoop';
}

export const SOORT_LABEL: Record<SluitSoort, string> = {
  pakken: 'Pakken uit keten',
  snijden: 'Vers snijwerk',
  maken: 'Zelf maken',
};

export function ymdLokaal(d: Date): string {
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const dag = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${m}-${dag}`;
}

/**
 * Is vandaag de teldag? Maandag, of de eerste open dag erna als maandag
 * (en de dagen tot vandaag) gesloten waren.
 */
export function isTeldag(datum: string, isOpen: (d: Date) => boolean): boolean {
  const vandaag = new Date(`${datum}T12:00:00`);
  if (Number.isNaN(vandaag.getTime()) || !isOpen(vandaag)) return false;
  const terug = (vandaag.getDay() + 6) % 7; // dagen sinds maandag
  for (let i = terug; i > 0; i--) {
    const d = new Date(vandaag);
    d.setDate(d.getDate() - i);
    if (isOpen(d)) return false;
  }
  return true;
}

/** Eerstvolgende open dag ná de sluitdag (voor de MEP van morgen). */
export function volgendeOpenDag(datum: string, isOpen: (d: Date) => boolean): string {
  const d = new Date(`${datum}T12:00:00`);
  for (let i = 0; i < 14; i++) {
    d.setDate(d.getDate() + 1);
    if (isOpen(d)) return ymdLokaal(d);
  }
  const morgen = new Date(`${datum}T12:00:00`);
  morgen.setDate(morgen.getDate() + 1);
  return ymdLokaal(morgen);
}

/** Wanneer je aanvult, als korte opdracht. */
export function aanvulTekst(vulnorm: string | null | undefined): string {
  if (vulnorm === 'half') return 'Vullen onder ½';
  if (vulnorm === 'bodem') return 'Vullen als leeg';
  return 'Altijd vol';
}

/** Aantal gevulde blokjes (van 3) voor het peilstreepje. */
export function peilBlokjes(vulnorm: string | null | undefined): number {
  return vulnorm === 'half' ? 1 : vulnorm === 'bodem' ? 0 : 3;
}

/** Korte plek: "uit de koelcel" → "Koelcel"; snijwerk/maken → "MEP: …". */
export function herkomstLabel(soort: SluitSoort, ketenKort: string): string {
  if (soort === 'snijden') return 'MEP: snijden';
  if (soort === 'maken') return 'MEP: maken';
  const kaal = ketenKort.replace(/^uit (de |het )?/, '');
  if (kaal === 'vriescel') return 'Vriescel · ontdooien';
  return kaal.charAt(0).toUpperCase() + kaal.slice(1);
}
