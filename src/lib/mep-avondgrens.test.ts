// @ts-ignore bun test runner
import { describe, expect, it } from 'bun:test';
import { naarVolgendeDag } from './mep-avondgrens';

// 28 okt 2026 is wintertijd: Amsterdam = UTC+1
const om = (hhmm: string) => new Date(`2026-10-28T${hhmm}:00+01:00`);

describe('Avondgrens 17:00 (West en Midsland)', () => {
  it('16:59 blijft vandaag', () => {
    expect(naarVolgendeDag('2026-10-28', '2026-10-28', om('16:59'))).toBe(false);
  });
  it('17:00 gaat naar volgende open dag', () => {
    expect(naarVolgendeDag('2026-10-28', '2026-10-28', om('17:00'))).toBe(true);
  });
  it('West gaat na de avondgrens ook door naar de volgende open dag', () => {
    expect(naarVolgendeDag('2026-10-28', '2026-10-28', om('20:00'))).toBe(true);
  });
  it('bewust andere dag bekeken verandert niet', () => {
    expect(naarVolgendeDag('2026-10-30', '2026-10-28', om('20:00'))).toBe(false);
  });
});
