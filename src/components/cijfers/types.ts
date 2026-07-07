export type Vestiging = 'Midsland' | 'West';
export type VestKeuze = 'Midsland' | 'West' | 'Beide';
export type Periode = 'vandaag' | 'week' | 'maand' | 'jaar' | 'aangepast';

/** Preset-mode voor de vergelijkperiode. Wordt door de RPC gebruikt om
 *  "t.o.v. vorige"-datums te berekenen. Custom range → 'custom'. */
export type VergelijkMode = 'dag' | 'week' | 'maand' | 'jaar' | 'custom';

export function vergelijkModeVan(p: Periode): VergelijkMode {
  if (p === 'vandaag') return 'dag';
  if (p === 'week') return 'week';
  if (p === 'maand') return 'maand';
  if (p === 'jaar') return 'jaar';
  return 'custom';
}

export const VEST_KLEUR: Record<Vestiging, string> = {
  Midsland: 'hsl(var(--primary))',
  West: '#0EA5E9',
};

export function vestigingenVan(k: VestKeuze): Vestiging[] {
  return k === 'Beide' ? ['Midsland', 'West'] : [k];
}

export const EUR = new Intl.NumberFormat('nl-NL', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 0,
});
export const EUR2 = new Intl.NumberFormat('nl-NL', {
  style: 'currency',
  currency: 'EUR',
  maximumFractionDigits: 2,
});

/** Periode-range op basis van werkdag; alles in Europe/Amsterdam.
 * Voor de meeste browsers volstaat een lokale datum in NL. Serverkant weet er alleen datums van. */
export function periodeRange(p: Periode, ref: Date = new Date()): { van: string; tot: string } {
  const today = new Date(ref);
  today.setHours(0, 0, 0, 0);

  const toISO = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
  };

  if (p === 'vandaag') {
    return { van: toISO(today), tot: toISO(today) };
  }
  if (p === 'week') {
    const dow = (today.getDay() + 6) % 7; // 0=ma..6=zo
    const monday = new Date(today);
    monday.setDate(today.getDate() - dow);
    return { van: toISO(monday), tot: toISO(today) };
  }
  if (p === 'maand') {
    const first = new Date(today.getFullYear(), today.getMonth(), 1);
    return { van: toISO(first), tot: toISO(today) };
  }
  // jaar
  const first = new Date(today.getFullYear(), 0, 1);
  return { van: toISO(first), tot: toISO(today) };
}

export function granulariteitVoor(p: Periode, van?: string, tot?: string): 'uur' | 'dag' | 'maand' {
  if (p === 'vandaag') return 'uur';
  if (p === 'jaar') return 'maand';
  if (p === 'aangepast' && van && tot) {
    const dagen = Math.round((new Date(tot).getTime() - new Date(van).getTime()) / 86400000) + 1;
    if (dagen <= 1) return 'uur';
    if (dagen > 92) return 'maand';
    return 'dag';
  }
  return 'dag';
}

export function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

const NL_MAAND = ['januari','februari','maart','april','mei','juni','juli','augustus','september','oktober','november','december'];
const NL_DAG_KORT = ['zo','ma','di','wo','do','vr','za'];

/**
 * Compact label voor de vergelijkperiode uit de RPC, bv:
 *  - 1 dag       → "zo 28 jun"
 *  - week/range  → "30 jun – 6 jul"
 *  - hele maand  → "juli 2025"
 *  - heel jaar   → "2025"
 */
export function prevLabel(van?: string | null, tot?: string | null): string {
  if (!van || !tot) return '';
  const dv = new Date(van); const dt = new Date(tot);
  if (isNaN(dv.getTime()) || isNaN(dt.getTime())) return '';

  // heel jaar
  const isJan1 = dv.getMonth() === 0 && dv.getDate() === 1;
  const isDec31 = dt.getMonth() === 11 && dt.getDate() === 31;
  if (isJan1 && isDec31 && dv.getFullYear() === dt.getFullYear()) {
    return String(dv.getFullYear());
  }
  // hele maand
  const lastOfMonth = new Date(dv.getFullYear(), dv.getMonth() + 1, 0);
  if (dv.getDate() === 1
      && dt.getFullYear() === dv.getFullYear()
      && dt.getMonth() === dv.getMonth()
      && dt.getDate() === lastOfMonth.getDate()) {
    return `${NL_MAAND[dv.getMonth()]} ${dv.getFullYear()}`;
  }
  // 1 dag
  if (van === tot) {
    return `${NL_DAG_KORT[dv.getDay()]} ${dv.getDate()} ${NL_MAAND[dv.getMonth()].slice(0,3)}`;
  }
  // range
  if (dv.getMonth() === dt.getMonth() && dv.getFullYear() === dt.getFullYear()) {
    return `${dv.getDate()} – ${dt.getDate()} ${NL_MAAND[dv.getMonth()].slice(0,3)}`;
  }
  return `${dv.getDate()} ${NL_MAAND[dv.getMonth()].slice(0,3)} – ${dt.getDate()} ${NL_MAAND[dt.getMonth()].slice(0,3)}`;
}

