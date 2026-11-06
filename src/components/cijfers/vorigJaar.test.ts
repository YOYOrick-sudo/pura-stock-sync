import { describe, it, expect } from 'vitest';
import { zelfdeWeekdagVorigJaar } from './vorigJaar';

describe('zelfdeWeekdagVorigJaar', () => {
  it('vrijdag 6 nov 2026 → vrijdag 7 nov 2025', () => {
    expect(zelfdeWeekdagVorigJaar('2026-11-06')).toBe('2025-11-07');
    expect(new Date('2025-11-07T00:00:00Z').getUTCDay()).toBe(5);
  });
  it('maand nov 2026 → 2 nov t/m 1 dec 2025', () => {
    expect(zelfdeWeekdagVorigJaar('2026-11-01')).toBe('2025-11-02');
    expect(zelfdeWeekdagVorigJaar('2026-11-30')).toBe('2025-12-01');
  });
  it('over schrikkeldag heen', () => {
    expect(zelfdeWeekdagVorigJaar('2025-03-01')).toBe('2024-03-02');
  });
});
