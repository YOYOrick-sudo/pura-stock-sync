/** Pure helpers voor de Tellen-kaart: indeling en statusbadge per artikel. */
export interface TelRegelBasis {
  id: string | null;
  telrol: string | null;
  telvraag_vandaag: boolean | null;
  tellen_nodig: boolean | null;
  dagen_sinds_telling: number | null;
  stand: number | null;
}

/** Splitst artikelen van één rol in "Vandaag" en "Overige"; elk artikel komt maar één keer voor. */
export function deelTellenIn<T extends TelRegelBasis>(regels: T[], rol: string): { vandaag: T[]; overige: T[] } {
  const gezien = new Set<string>();
  const vandaag: T[] = [];
  const overige: T[] = [];
  for (const a of regels) {
    if (a.telrol !== rol || !a.id || gezien.has(a.id)) continue;
    gezien.add(a.id);
    (a.telvraag_vandaag ? vandaag : overige).push(a);
  }
  return { vandaag, overige };
}

export type TelStatus = { soort: 'tellen' } | { soort: 'geteld' } | { soort: 'onbekend' } | { soort: 'stand'; stand: number };

/** Eén status per regel: tellen > geteld (vandaag) > onbekend > stand. */
export function telStatus(a: TelRegelBasis): TelStatus {
  if (a.tellen_nodig) return { soort: 'tellen' };
  if (a.dagen_sinds_telling != null && a.dagen_sinds_telling <= 0) return { soort: 'geteld' };
  if (a.stand == null) return { soort: 'onbekend' };
  return { soort: 'stand', stand: a.stand };
}
