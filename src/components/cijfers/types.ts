export type Vestiging = 'Midsland' | 'West';
export type VestKeuze = 'Midsland' | 'West' | 'Beide';
export type Periode = 'vandaag' | 'week' | 'maand' | 'jaar' | 'aangepast';

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

export function granulariteitVoor(p: Periode): 'uur' | 'dag' | 'maand' {
  if (p === 'vandaag') return 'uur';
  if (p === 'jaar') return 'maand';
  return 'dag';
}
