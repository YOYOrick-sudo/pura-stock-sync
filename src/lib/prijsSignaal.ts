/** Prijssignaal per besteleenheid excl. btw (uit v_prijs_signaal via prijs_signalen_bord). */
export interface PrijsSignaal {
  vestiging: string;
  leverancier_id: string | null;
  artikel_id: string | null;
  naam: string | null;
  verpakking: string | null;
  eenheid: string | null;
  nu_prijs: number | null;
  normale_prijs: number | null;
  n_vergelijk: number;
  verschil_pct: number | null;
  richting: 'omlaag' | 'omhoog' | 'gelijk' | null;
  pijl: boolean;
  tooltip: string | null;
}

export interface BordRegelSleutel {
  leverancier_id: string | null;
  artikel_id: string | null;
  naam: string;
  vorm?: string | null;
}

const schoon = (s: string | null | undefined) => (s ?? '').toLowerCase().replace(/[\s×x]+/g, '').replace(',', '.');

/** Zoek het signaal voor een bordregel. Bij meerdere verpakkingen alleen een zeker antwoord, anders niets. */
export function zoekSignaal(signalen: PrijsSignaal[], r: BordRegelSleutel): PrijsSignaal | null {
  const naam = r.naam.trim().toLowerCase();
  const kand = signalen.filter((s) =>
    (r.artikel_id ? s.artikel_id === r.artikel_id : !s.artikel_id && (s.naam ?? '').trim().toLowerCase() === naam) &&
    (!r.leverancier_id || s.leverancier_id === r.leverancier_id));
  if (kand.length === 1) return kand[0];
  if (kand.length > 1 && r.vorm) {
    const op = kand.filter((s) => s.verpakking && schoon(s.verpakking) === schoon(r.vorm));
    if (op.length === 1) return op[0];
  }
  return null;
}

/** Pijl tonen? Alleen bij een betrouwbaar verschil (de view bepaalt de drempel). */
export function pijlRichting(s: PrijsSignaal | null): 'omlaag' | 'omhoog' | null {
  if (!s || !s.pijl) return null;
  return s.richting === 'omlaag' || s.richting === 'omhoog' ? s.richting : null;
}

const euroFmt = new Intl.NumberFormat('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const euroNl = (n: number) => `€${euroFmt.format(n)}`;

export function prijsTooltip(s: PrijsSignaal): string {
  if (s.normale_prijs == null || s.nu_prijs == null) return '';
  return `was ${euroNl(Number(s.normale_prijs))}, nu ${euroNl(Number(s.nu_prijs))}`;
}

/** Waarschuwing voor de eigenaar: extra kosten = (nu − normaal) × hoeveelheid.
 *  Drempel: (≥5% én ≥€5) of ≥€25. */
export function duurderWaarschuwing(s: PrijsSignaal | null, hoeveelheid: number): string | null {
  if (!s || s.nu_prijs == null || s.normale_prijs == null || s.n_vergelijk < 2 || !(hoeveelheid > 0)) return null;
  const nu = Number(s.nu_prijs), normaal = Number(s.normale_prijs);
  if (!(normaal > 0) || nu <= normaal) return null;
  const extra = (nu - normaal) * hoeveelheid;
  const pct = ((nu - normaal) / normaal) * 100;
  if (!((pct >= 5 && extra >= 5) || extra >= 25)) return null;
  return `Let op: ${euroNl(extra)} duurder dan normaal (was ${euroNl(normaal)}, nu ${euroNl(nu)})`;
}
