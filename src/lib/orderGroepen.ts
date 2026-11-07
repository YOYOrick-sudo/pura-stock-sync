import { formatInTimeZone } from 'date-fns-tz';

export interface OrderRegel {
  bestelreferentie: string | null;
  besteld_op: string | null;
  verwachte_levering: string | null;
}

export interface OrderGroep<T> {
  key: string;
  leverancier: string;
  referentie: string | null;
  /** Amsterdamse kalenderdag van besteld_op, yyyy-MM-dd. */
  besteldag: string | null;
  /** Vroegste verwachte levering in de groep. */
  leverdatum: string | null;
  regels: T[];
}

export function amsterdamDag(iso: string | null): string | null {
  if (!iso) return null;
  const datum = new Date(iso);
  if (Number.isNaN(datum.getTime())) return null;
  return formatInTimeZone(datum, 'Europe/Amsterdam', 'yyyy-MM-dd');
}

/**
 * Eén bestelling = leverancier + ordernummer, of zonder nummer leverancier + besteldag.
 * Achterstallig bovenaan, dan vandaag en later oplopend. Zonder leverdag onderaan.
 */
export function groepeerBestellingen<T extends OrderRegel>(
  regels: readonly T[],
  vandaag: string,
  leverancierVan: (regel: T) => string,
): OrderGroep<T>[] {
  const groepen = new Map<string, OrderGroep<T>>();
  for (const regel of regels) {
    const leverancier = leverancierVan(regel);
    const referentie = regel.bestelreferentie?.trim() || null;
    const besteldag = amsterdamDag(regel.besteld_op);
    const key = referentie ? `${leverancier}\u0000ref\u0000${referentie}` : `${leverancier}\u0000dag\u0000${besteldag ?? ''}`;
    const groep = groepen.get(key) ?? { key, leverancier, referentie, besteldag, leverdatum: null, regels: [] };
    groep.regels.push(regel);
    if (besteldag && (!groep.besteldag || besteldag < groep.besteldag)) groep.besteldag = besteldag;
    const lever = regel.verwachte_levering;
    if (lever && (!groep.leverdatum || lever < groep.leverdatum)) groep.leverdatum = lever;
    groepen.set(key, groep);
  }
  const rang = (leverdatum: string | null): [number, string] => {
    if (!leverdatum) return [2, ''];
    return [leverdatum < vandaag ? 0 : 1, leverdatum];
  };
  return [...groepen.values()].sort((a, b) => {
    const ra = rang(a.leverdatum);
    const rb = rang(b.leverdatum);
    if (ra[0] !== rb[0]) return ra[0] - rb[0];
    if (ra[1] !== rb[1]) return ra[1].localeCompare(rb[1]);
    const naam = a.leverancier.localeCompare(b.leverancier, 'nl');
    if (naam) return naam;
    return (a.referentie ?? a.besteldag ?? '').localeCompare(b.referentie ?? b.besteldag ?? '', 'nl');
  });
}
