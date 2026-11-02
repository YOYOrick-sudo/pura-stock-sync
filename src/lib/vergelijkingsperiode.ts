/** Vergelijking met dezelfde weekdag vorig jaar.

 * Werkdagen zijn kalenderdatums in Europe/Amsterdam (de Lightspeed-sync zet
 * de grens al op 06:00 lokale tijd). 52 weken is 364 kalenderdagen: de
 * weekdag blijft gelijk, de periode even lang. Rekenen gaat via de
 * datumcomponenten, niet via milliseconden, zodat zomer- en wintertijd de
 * dag niet verschuiven.
 */

export const AMSTERDAM = 'Europe/Amsterdam';

/** 52 weken. Eén dag korter dan een gewoon jaar, daardoor dezelfde weekdag. */
export const VERSCHUIVING_VORIG_JAAR = 364;

const WEEKDAG = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'] as const;
const MAAND = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'] as const;

export type DatumBereik = { van: string; tot: string };

const MODI_WEEKDAG = new Set(['dag', 'week', 'maand', 'jaar', 'custom']);

/** Vandaag, week, maand, jaar en aangepast. De shortcuts "periode ervoor" niet. */
export function vergelijktZelfdeWeekdag(mode: string): boolean {
  return MODI_WEEKDAG.has(mode);
}

export function parseKalender(iso: string): { jaar: number; maand: number; dag: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) throw new Error(`Geen kalenderdatum: ${iso}`);
  const jaar = Number(match[1]);
  const maand = Number(match[2]);
  const dag = Number(match[3]);
  if (maand < 1 || maand > 12 || dag < 1 || dag > dagenInMaand(jaar, maand)) {
    throw new Error(`Geen kalenderdatum: ${iso}`);
  }
  return { jaar, maand, dag };
}

export function formatKalender(jaar: number, maand: number, dag: number): string {
  return `${jaar}-${String(maand).padStart(2, '0')}-${String(dag).padStart(2, '0')}`;
}

/** Tel kalenderdagen op. UTC heeft geen zomer- of wintertijd; de invoer is al een Amsterdamse kalenderdag. */
export function verschuifKalenderdagen(iso: string, dagen: number): string {
  const { jaar, maand, dag } = parseKalender(iso);
  const utc = new Date(Date.UTC(jaar, maand - 1, dag));
  utc.setUTCDate(utc.getUTCDate() + dagen);
  return formatKalender(utc.getUTCFullYear(), utc.getUTCMonth() + 1, utc.getUTCDate());
}

export function vergelijkingsperiode(van: string, tot: string, dagen = VERSCHUIVING_VORIG_JAAR): DatumBereik {
  return {
    van: verschuifKalenderdagen(van, -dagen),
    tot: verschuifKalenderdagen(tot, -dagen),
  };
}

/** 0 = zondag … 6 = zaterdag, van de kalenderdag zelf. */
export function weekdagIndex(iso: string): number {
  const { jaar, maand, dag } = parseKalender(iso);
  return new Date(Date.UTC(jaar, maand - 1, dag)).getUTCDay();
}

export function kalenderdagenInclusief(van: string, tot: string): number {
  const a = parseKalender(van);
  const b = parseKalender(tot);
  const ms = Date.UTC(b.jaar, b.maand - 1, b.dag) - Date.UTC(a.jaar, a.maand - 1, a.dag);
  return Math.round(ms / 86_400_000) + 1;
}

/** Kalenderdag van een tijdstip, in Europe/Amsterdam. */
export function amsterdamKalenderdag(instant: Date): string {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: AMSTERDAM,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(instant);
}

/** Bijvoorbeeld "vr 31 okt 2025" of "ma 27 okt – zo 2 nov 2025". */
export function labelVergelijking(van: string, tot: string): string {
  const a = parseKalender(van);
  const b = parseKalender(tot);
  if (van === tot) return dagLabel(a, true);
  const startJaar = a.jaar !== b.jaar;
  return `${dagLabel(a, startJaar)} – ${dagLabel(b, true)}`;
}

function dagLabel(datum: { jaar: number; maand: number; dag: number }, metJaar: boolean): string {
  const iso = formatKalender(datum.jaar, datum.maand, datum.dag);
  const weekdag = WEEKDAG[weekdagIndex(iso)];
  const maand = MAAND[datum.maand - 1];
  return metJaar ? `${weekdag} ${datum.dag} ${maand} ${datum.jaar}` : `${weekdag} ${datum.dag} ${maand}`;
}

function dagenInMaand(jaar: number, maand: number): number {
  return new Date(Date.UTC(jaar, maand, 0)).getUTCDate();
}
