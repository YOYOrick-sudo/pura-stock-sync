/**
 * Kleurregels voor delta-pijltjes.
 * Betekenis is "goed/slecht" i.p.v. simpelweg "omhoog/omlaag".
 */
export type DeltaIntent =
  | 'hoger-is-goed'      // omzet, omzet/uur, gem/bon, bonnen
  | 'lager-is-goed'      // loonkosten-% van omzet
  | 'neutraal'           // uren gewerkt, loonkosten € absoluut
  | 'afwijking-signaal'; // uren gewerkt vs gepland (|Δ|>15% = amber)

export type DeltaKleur = 'groen' | 'rood' | 'amber' | 'grijs';

const EPS = 0.05;

export function deltaKleur(pct: number | null | undefined, intent: DeltaIntent): DeltaKleur {
  if (pct == null || Math.abs(pct) < EPS) return 'grijs';
  switch (intent) {
    case 'hoger-is-goed':
      return pct > 0 ? 'groen' : 'rood';
    case 'lager-is-goed':
      return pct < 0 ? 'groen' : 'rood';
    case 'afwijking-signaal':
      return Math.abs(pct) > 15 ? 'amber' : 'grijs';
    case 'neutraal':
    default:
      return 'grijs';
  }
}

export const KLEUR_STYLE: Record<DeltaKleur, { bg: string; fg: string }> = {
  groen: { bg: 'rgb(209 250 229)', fg: 'rgb(4 120 87)' },
  rood:  { bg: 'rgb(255 225 229)', fg: 'rgb(190 18 60)' },
  amber: { bg: 'rgb(254 243 199)', fg: 'rgb(180 83 9)' },
  grijs: { bg: 'hsl(var(--chart-track))', fg: 'hsl(var(--muted-foreground))' },
};

/**
 * Bepaal het pijltje op basis van richting (niet kleur).
 * Groen/rood/amber/grijs beslissen niet meer over ↑/↓ — dat is los.
 */
export function deltaPijl(pct: number | null | undefined): '▲' | '▼' | '' {
  if (pct == null || Math.abs(pct) < EPS) return '';
  return pct > 0 ? '▲' : '▼';
}
