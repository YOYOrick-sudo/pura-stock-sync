import { formatInTimeZone } from 'date-fns-tz';

/** Eén rij uit de database-functie bestel_deadline_hints (zelfde rekenstap als de leverdatum). */
export interface BesteldeadlineHintRij {
  leverancier_id: string;
  besteldag: string; // yyyy-MM-dd, NL-datum waarvoor de rij geldt
  deadline_tijd: string | null;
  volgende_besteldag: string | null; // yyyy-MM-dd
}

const weekdagen = ['zo', 'ma', 'di', 'wo', 'do', 'vr', 'za'];
const dagNummer = (iso: string) => Math.round(Date.parse(`${iso}T12:00:00Z`) / 86_400_000);

/** Alleen presentatie: een deadline wijzigt nooit de bestelling of leverdatum. */
export function besteldeadlineHint(rijen: BesteldeadlineHintRij[], leverancierId: string | null | undefined, nu: Date): string | null {
  if (!leverancierId) return null;
  const lokaal = formatInTimeZone(nu, 'Europe/Amsterdam', 'yyyy-MM-dd HH:mm:ss');
  const vandaag = lokaal.slice(0, 10);
  const rij = rijen.find((r) => r.leverancier_id === leverancierId && r.besteldag === vandaag);
  if (!rij?.deadline_tijd) return null;
  const [uur, minuut, seconde = '0'] = rij.deadline_tijd.split(':');
  const deadline = Number(uur) * 3600 + Number(minuut) * 60 + Number(seconde);
  const [h, m, s] = lokaal.slice(11).split(':').map(Number);
  if (h * 3600 + m * 60 + s < deadline) return `vóór ${rij.deadline_tijd.slice(0, 5)}`;
  if (!rij.volgende_besteldag) return null;
  const verschil = dagNummer(rij.volgende_besteldag) - dagNummer(vandaag);
  if (verschil === 1) return 'morgen';
  return weekdagen[new Date(`${rij.volgende_besteldag}T12:00:00Z`).getUTCDay()];
}
