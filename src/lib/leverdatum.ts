// Verwachte leverdatum voor bestelde regels. Spiegelt de databasefunctie
// public.bestel_verwachte_levering: weekdag = 0 (zondag) t/m 6 (zaterdag),
// gelijk aan extract(dow) en Date.getDay().

export interface Leverdag {
  weekdag: number; // 0 = zondag
  offset: number; // dagen tussen besteldag en leverdag
}

const MS_DAG = 24 * 60 * 60 * 1000;

export function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dag = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dag}`;
}

export function parseYmd(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function plusDagen(d: Date, n: number): Date {
  return new Date(d.getTime() + n * MS_DAG);
}

/**
 * Verwachte leverdatum: eerstvolgende besteldag van de leverancier + offset,
 * anders morgen. Valt die op een dichte dag, dan doorschuiven naar de
 * volgende open dag (max 14 dagen vooruit, net als de database).
 */
export function verwachteLevering(
  basis: Date,
  leverdagen: Leverdag[],
  isOpen: (d: Date) => boolean,
): Date {
  let levering: Date | null = null;
  for (const l of leverdagen) {
    const wacht = (l.weekdag - basis.getDay() + 7) % 7;
    const kandidaat = plusDagen(basis, wacht + l.offset);
    if (!levering || kandidaat < levering) levering = kandidaat;
  }
  if (!levering) levering = plusDagen(basis, 1);
  for (let i = 0; i < 14 && !isOpen(levering); i++) levering = plusDagen(levering, 1);
  return levering;
}

/**
 * Aantal open dagen dat een levering te laat is: open dagen ná de verwachte
 * datum t/m vandaag. Dichte dagen tellen niet mee.
 */
export function dagenTeLaat(verwacht: string | null, vandaag: Date, isOpen: (d: Date) => boolean): number {
  if (!verwacht) return 0;
  let d = plusDagen(parseYmd(verwacht), 1);
  const eind = new Date(vandaag.getFullYear(), vandaag.getMonth(), vandaag.getDate());
  let n = 0;
  while (d <= eind && n < 60) {
    if (isOpen(d)) n++;
    d = plusDagen(d, 1);
  }
  return n;
}
