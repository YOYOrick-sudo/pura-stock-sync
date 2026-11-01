import type { OmzetRegel, Vestiging } from './omzet';

/** Maandtotalen uit omzet_uren, gelezen 1-11-2026. [omzet excl. btw, bonnen, open dagen]. */
export const CONTROLE_MAANDEN: Record<Vestiging, Record<string, [number, number, number]>> = {
  Midsland: {
    '2025-01': [36738, 830, 23],
    '2025-02': [32975, 699, 21],
    '2025-03': [46547, 905, 23],
    '2025-04': [61400, 1313, 22],
    '2025-05': [75173, 1594, 27],
    '2025-06': [171242, 4162, 28],
    '2025-07': [158606, 4006, 31],
    '2025-08': [168163, 4047, 29],
    '2025-09': [67938, 1616, 25],
    '2025-10': [71256, 1459, 27],
    '2026-01': [36512, 737, 22],
    '2026-02': [1128, 26, 1],
    '2026-03': [0, 0, 0],
    '2026-04': [69626, 1433, 24],
    '2026-05': [83121, 1873, 24],
    '2026-06': [180240, 4375, 22],
    '2026-07': [142397, 3446, 25],
    '2026-08': [131249, 3207, 23],
    '2026-09': [74627, 1759, 22],
    '2026-10': [66340, 1422, 24],
  },
  West: {
    '2025-01': [15089, 602, 29],
    '2025-02': [13167, 611, 28],
    '2025-03': [20237, 892, 30],
    '2025-04': [28550, 1248, 29],
    '2025-05': [34464, 1467, 30],
    '2025-06': [68685, 2597, 28],
    '2025-07': [55477, 2312, 31],
    '2025-08': [56413, 2426, 30],
    '2025-09': [31796, 1472, 30],
    '2025-10': [28970, 1177, 31],
    '2026-01': [3737, 147, 4],
    '2026-02': [0, 0, 0],
    '2026-03': [0, 0, 0],
    '2026-04': [22293, 908, 17],
    '2026-05': [40043, 1505, 27],
    '2026-06': [64016, 2506, 26],
    '2026-07': [56220, 2172, 27],
    '2026-08': [49342, 1786, 25],
    '2026-09': [28855, 1223, 23],
    '2026-10': [29688, 1130, 26],
  },
};

function verdeel(totaal: number, delen: number): number[] {
  const basis = Math.floor(totaal / delen);
  let rest = totaal - basis * delen;
  return Array.from({ length: delen }, () => {
    const extra = rest > 0 ? 1 : 0;
    rest -= extra;
    return basis + extra;
  });
}

/** Eén rij per open dag, totalen exact gelijk aan de controle. Maanden zonder dagen blijven leeg. */
export function controleRegels(): OmzetRegel[] {
  const uit: OmzetRegel[] = [];
  for (const vestiging of ['Midsland', 'West'] as const) {
    for (const [sleutel, [omzet, bonnen, dagen]] of Object.entries(CONTROLE_MAANDEN[vestiging])) {
      if (dagen <= 0) continue;
      const [jaar, maand] = sleutel.split('-');
      const omzetPerDag = verdeel(omzet, dagen);
      const bonnenPerDag = verdeel(bonnen, dagen);
      for (let i = 0; i < dagen; i += 1) {
        uit.push({
          vestiging,
          werkdag: `${jaar}-${maand}-${String(i + 1).padStart(2, '0')}`,
          omzetExcl: omzetPerDag[i],
          aantalBonnen: bonnenPerDag[i],
        });
      }
    }
  }
  return uit;
}
