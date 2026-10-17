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

/** Hoe vol het minstens moet zijn. */
export function aanvulTekst(vulnorm: string | null | undefined): string {
  if (vulnorm === 'half') return 'Minstens half vol';
  if (vulnorm === 'bodem') return 'Bodempje is genoeg';
  return 'Moet vol zijn';
}

/** Vulpercentage van het bakje-icoon. */
export function peilBlokjes(vulnorm: string | null | undefined): number {
  return vulnorm === 'half' ? 50 : vulnorm === 'bodem' ? 20 : 100;
}

/** Wat je doet als het te weinig is. */
export function herkomstLabel(soort: SluitSoort, ketenKort: string): string {
  if (soort === 'snijden') return 'Naar MEP (snijden)';
  if (soort === 'maken') return 'Naar MEP (maken)';
  const kaal = ketenKort.replace(/^uit (de |het )?/, '').toLowerCase();
  if (kaal.includes('vries')) return 'Ontdooien uit vriescel';
  if (kaal.includes('midsland')) return 'Bestellen bij Midsland';
  return `Aanvullen uit ${kaal}`;
}

/** Kort woord naast het bakje. */
export function peilKort(vulnorm: string | null | undefined): string {
  if (vulnorm === 'half') return 'Min. ½';
  if (vulnorm === 'bodem') return 'Bodem';
  return 'Vol';
}
