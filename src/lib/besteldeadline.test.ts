// @ts-ignore bun test runner
import { describe, expect, test } from 'bun:test';
import { besteldeadlineHint, type BesteldeadlineDag } from './besteldeadline';

const dag = (weekdag: number, deadline_tijd: string | null = '21:00:00', extra: Partial<BesteldeadlineDag> = {}): BesteldeadlineDag => ({ leverancier_id: 'sligro', vestiging: 'Midsland', weekdag, deadline_tijd, actief: true, deleted_at: null, ...extra });
const hint = (dagen: BesteldeadlineDag[], iso: string, vestiging = 'Midsland') => besteldeadlineHint(dagen, vestiging, 'sligro', new Date(iso));

describe('besteldeadlinehint', () => {
  test('vóór 21:00 in Nederland', () => expect(hint([dag(4)], '2026-10-29T19:59:59Z')).toBe('vóór 21:00'));
  test('precies 21:00 telt als verstreken; volgende dag is morgen', () => expect(hint([dag(4), dag(5)], '2026-10-29T20:00:00Z')).toBe('morgen'));
  test('na deadline korte weekdag voor eerstvolgende besteldag', () => expect(hint([dag(4), dag(1), dag(0)], '2026-10-29T20:01:00Z')).toBe('zo'));
  test('alleen vandaag actief betekent volgende week dezelfde dag', () => expect(hint([dag(4)], '2026-10-29T20:01:00Z')).toBe('do'));
  test('null deadline geeft geen hint, ook niet met andere besteldagen', () => expect(hint([dag(4, null), dag(5)], '2026-10-29T20:01:00Z')).toBeNull());
  test('geen rij vandaag geeft geen hint', () => expect(hint([dag(5)], '2026-10-29T19:00:00Z')).toBeNull());
  test('geen leverancier geeft geen hint', () => expect(besteldeadlineHint([dag(4)], 'Midsland', null, new Date('2026-10-29T19:00:00Z'))).toBeNull());
  test('andere vestiging en globale rijen worden niet gebruikt', () => expect(hint([dag(4), dag(4, '21:00:00', { vestiging: null })], '2026-10-29T19:00:00Z', 'West')).toBeNull());
  test('inactieve en verwijderde rijen geven geen hint', () => expect(hint([dag(4, '21:00:00', { actief: false }), dag(4, '21:00:00', { deleted_at: '2026-10-28' })], '2026-10-29T19:00:00Z')).toBeNull());
  test('eerstvolgende dag negeert andere vestiging, verwijderd en inactief', () => expect(hint([dag(4), dag(5, null, { vestiging: 'West' }), dag(5, null, { actief: false }), dag(5, null, { deleted_at: '2026-10-28' }), dag(1)], '2026-10-29T20:00:00Z')).toBe('ma'));
  test('zomertijd: 19:00 UTC is 21:00 NL', () => expect(hint([dag(4), dag(5)], '2026-07-02T19:00:00Z')).toBe('morgen'));
  test('NL-middernacht verandert de besteldag ondanks UTC-datum', () => expect(hint([dag(5, '01:00:00')], '2026-10-29T23:30:00Z')).toBe('vóór 01:00'));
  test('seconden in deadline tellen mee', () => expect(hint([dag(4, '21:00:30'), dag(5)], '2026-10-29T20:00:29Z')).toBe('vóór 21:00'));
  test('exacte deadline met seconden is verstreken', () => expect(hint([dag(4, '21:00:30'), dag(5)], '2026-10-29T20:00:30Z')).toBe('morgen'));
  test('weekovergang: zondag naar maandag is morgen', () => expect(hint([dag(0), dag(1)], '2026-11-01T20:00:00Z')).toBe('morgen'));
  test('andere leverancier wordt nooit gebruikt', () => expect(hint([dag(4, '21:00:00', { leverancier_id: 'kooyman' })], '2026-10-29T19:00:00Z')).toBeNull());
});