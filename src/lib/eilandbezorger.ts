import type { StatusToon } from '@/components/pura';

export const AANDACHT = ['geblokkeerd', 'uitkomst_onbekend', 'geweigerd', 'verzenden', 'afgekeurd'] as const;

const LABELS: Record<string, { tekst: string; toon: StatusToon }> = {
  ontvangen: { tekst: 'Ontvangen', toon: 'neutraal' },
  test_ok: { tekst: 'Test ok', toon: 'goed' },
  afgekeurd: { tekst: 'Afgekeurd', toon: 'fout' },
  geblokkeerd: { tekst: 'Geblokkeerd', toon: 'let-op' },
  gepland: { tekst: 'Gepland', toon: 'neutraal' },
  geannuleerd: { tekst: 'Geannuleerd', toon: 'neutraal' },
  verzenden: { tekst: 'Bezig', toon: 'let-op' },
  verzonden: { tekst: 'In kassa', toon: 'goed' },
  geweigerd: { tekst: 'Geweigerd', toon: 'fout' },
  uitkomst_onbekend: { tekst: 'Onzeker', toon: 'fout' },
};
export const statusLabel = (s: string) => LABELS[s] ?? { tekst: s, toon: 'neutraal' as StatusToon };

/** Welke beheeracties bij een status passen. Testbestellingen gaan nooit naar de kassa. */
export function actiesVoor(status: string, modus: string): ('annuleren' | 'vrijgeven' | 'teruglezen' | 'in_kassa' | 'herverzenden')[] {
  const a: ReturnType<typeof actiesVoor> = [];
  if (modus === 'live' && status === 'geblokkeerd') a.push('vrijgeven');
  if (modus === 'live' && status === 'uitkomst_onbekend') a.push('teruglezen', 'in_kassa', 'herverzenden');
  if (modus === 'live' && status === 'geweigerd') a.push('herverzenden');
  if (['ontvangen', 'gepland', 'geblokkeerd', 'afgekeurd', 'test_ok'].includes(status)) a.push('annuleren');
  return a;
}

export const euro = (cent: number) => (cent / 100).toLocaleString('nl-NL', { style: 'currency', currency: 'EUR' });
