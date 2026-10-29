import { formatInTimeZone } from 'date-fns-tz';

export interface BesteldeadlineDag {
  leverancier_id: string;
  vestiging: string | null;
  weekdag: number;
  deadline_tijd: string | null;
  actief: boolean;
  deleted_at: string | null;
}

const weekdagen = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'];

/** Alleen presentatie: een deadline wijzigt nooit de bestelling of leverdatum. */
export function besteldeadlineHint(dagen: BesteldeadlineDag[], vestiging: string, leverancierId: string | null | undefined, nu: Date): string | null {
  if (!vestiging || !leverancierId) return null;
  const lokaal = formatInTimeZone(nu, 'Europe/Amsterdam', 'yyyy-MM-dd HH:mm:ss');
  const weekdag = new Date(`${lokaal.slice(0, 10)}T12:00:00Z`).getUTCDay();
  const actief = dagen.filter((d) => d.leverancier_id === leverancierId && d.vestiging === vestiging && d.actief && d.deleted_at === null);
  const vandaag = actief.find((d) => d.weekdag === weekdag);
  if (!vandaag?.deadline_tijd) return null;
  const [uur, minuut, seconde = '0'] = vandaag.deadline_tijd.split(':');
  const deadline = Number(uur) * 3600 + Number(minuut) * 60 + Number(seconde);
  const [h, m, s] = lokaal.slice(11).split(':').map(Number);
  if (h * 3600 + m * 60 + s < deadline) return `vóór ${vandaag.deadline_tijd.slice(0, 5)}`;
  const volgende = Math.min(...actief.map((d) => (d.weekdag - weekdag + 7) % 7 || 7));
  return volgende === 1 ? 'morgen' : weekdagen[(weekdag + volgende) % 7];
}