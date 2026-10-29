// @ts-ignore bun test runner
import { describe, expect, test } from 'bun:test';
import { besteldeadlineHint, type BesteldeadlineHintRij } from './besteldeadline';

const rij = (besteldag: string, deadline_tijd: string | null, volgende_besteldag: string | null, leverancier_id = 'sligro'): BesteldeadlineHintRij => ({ leverancier_id, besteldag, deadline_tijd, volgende_besteldag });
const hint = (rijen: BesteldeadlineHintRij[], iso: string) => besteldeadlineHint(rijen, 'sligro', new Date(iso));

describe('besteldeadlinehint (uit bestel_deadline_hints)', () => {
  test('vóór 21:00 in Nederland', () => expect(hint([rij('2026-10-29', '21:00:00', '2026-10-30')], '2026-10-29T19:59:59Z')).toBe('vóór 21:00'));
  test('precies 21:00 telt als verstreken; volgende dag is morgen', () => expect(hint([rij('2026-10-29', '21:00:00', '2026-10-30')], '2026-10-29T20:00:00Z')).toBe('morgen'));
  test('na deadline korte weekdag voor eerstvolgende besteldag', () => expect(hint([rij('2026-10-29', '21:00:00', '2026-11-01')], '2026-10-29T20:01:00Z')).toBe('zo'));
  test('alleen vandaag actief betekent volgende week dezelfde dag', () => expect(hint([rij('2026-10-29', '21:00:00', '2026-11-05')], '2026-10-29T20:01:00Z')).toBe('do'));
  test('null deadline geeft geen hint', () => expect(hint([rij('2026-10-29', null, '2026-10-30')], '2026-10-29T20:01:00Z')).toBeNull());
  test('geen rij vandaag geeft geen hint', () => expect(hint([], '2026-10-29T19:00:00Z')).toBeNull());
  test('rij van een andere dag (verouderd) geeft geen hint', () => expect(hint([rij('2026-10-28', '21:00:00', '2026-10-29')], '2026-10-29T19:00:00Z')).toBeNull());
  test('geen leverancier geeft geen hint', () => expect(besteldeadlineHint([rij('2026-10-29', '21:00:00', '2026-10-30')], null, new Date('2026-10-29T19:00:00Z'))).toBeNull());
  test('andere leverancier wordt nooit gebruikt', () => expect(hint([rij('2026-10-29', '21:00:00', '2026-10-30', 'kooyman')], '2026-10-29T19:00:00Z')).toBeNull());
  test('na deadline zonder volgende besteldag geen hint', () => expect(hint([rij('2026-10-29', '21:00:00', null)], '2026-10-29T20:01:00Z')).toBeNull());
  test('seizoen: vervallen dagen overgeslagen, volgende is wo', () => expect(hint([rij('2026-11-01', '21:00:00', '2026-11-04')], '2026-11-01T20:30:00Z')).toBe('wo'));
  test('zomertijd: 19:00 UTC is 21:00 NL', () => expect(hint([rij('2026-07-02', '21:00:00', '2026-07-03')], '2026-07-02T19:00:00Z')).toBe('morgen'));
  test('NL-middernacht verandert de besteldag ondanks UTC-datum', () => expect(hint([rij('2026-10-30', '01:00:00', '2026-10-31')], '2026-10-29T23:30:00Z')).toBe('vóór 01:00'));
  test('seconden in deadline tellen mee', () => expect(hint([rij('2026-10-29', '21:00:30', '2026-10-30')], '2026-10-29T20:00:29Z')).toBe('vóór 21:00'));
  test('exacte deadline met seconden is verstreken', () => expect(hint([rij('2026-10-29', '21:00:30', '2026-10-30')], '2026-10-29T20:00:30Z')).toBe('morgen'));
  test('weekovergang: zondag naar maandag is morgen', () => expect(hint([rij('2026-11-01', '21:00:00', '2026-11-02')], '2026-11-01T20:00:00Z')).toBe('morgen'));
  test('wintertijdwissel: za 24 okt naar zo 25 okt is morgen', () => expect(hint([rij('2026-10-24', '21:00:00', '2026-10-25')], '2026-10-24T19:30:00Z')).toBe('morgen'));
});
