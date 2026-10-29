// @ts-ignore bun test runner
import { describe, expect, test } from 'bun:test';
import { eerderVrijeRegels, filterEerderSuggesties } from './bordSnelkeuze';

const r = (naam: string, status = 'open', artikel_id: string | null = null) => ({ naam, status, artikel_id });

describe('bord snelkeuze', () => {
  test('vervallen wordt overgeslagen', () => {
    expect(eerderVrijeRegels([r('Basilicum', 'vervallen')])).toEqual([]);
  });
  test('TEST-namen worden overgeslagen', () => {
    expect(eerderVrijeRegels([r('TESTPRODUCT x'), r('  test iets')])).toEqual([]);
  });
  test('open, besteld en geleverd blijven', () => {
    const uit = eerderVrijeRegels([r('A', 'open'), r('B', 'besteld'), r('C', 'geleverd')]);
    expect(uit.map((s) => s.naam)).toEqual(['A', 'B', 'C']);
  });
  test('regels met artikel worden overgeslagen', () => {
    expect(eerderVrijeRegels([r('Melk', 'open', 'x')])).toEqual([]);
  });
  test('ontdubbelt op genormaliseerde naam, nieuwste eerst', () => {
    const uit = eerderVrijeRegels([r('Munt ', 'geleverd'), r('munt', 'open')]);
    expect(uit).toHaveLength(1);
    expect(uit[0].status).toBe('geleverd');
  });
  test('max 8, exacte match en productsuggesties uitgesloten', () => {
    const vrij = eerderVrijeRegels(Array.from({ length: 12 }, (_, i) => r(`kruid ${i}`)).concat([r('kruid')]));
    expect(filterEerderSuggesties(vrij, 'kruid', [])).toHaveLength(8);
    expect(filterEerderSuggesties(vrij, 'kruid', []).some((s) => s.naam === 'kruid')).toBe(false);
    expect(filterEerderSuggesties(vrij, 'kruid 1', ['Kruid 10']).map((s) => s.naam)).toEqual(['kruid 1', 'kruid 11'].filter((n) => n !== 'kruid 1'));
  });
});
