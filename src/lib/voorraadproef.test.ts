// @ts-ignore bun test runner
import { expect, test } from 'bun:test';
import { amsterdamDatum, tellingTotaal } from './voorraadproef';

test('niet ingevuld is onbekend, expliciet nul is nul', () => {
  const plekken = [{ naam: 'dozen', eenheid: 'doos', factor: 24 }];
  expect(tellingTotaal(plekken, {})).toBeNull();
  expect(tellingTotaal(plekken, { dozen: '0' })).toBe(0);
});
test('koffie telt zakken3kg, open gram en hopper samen', () => {
  expect(tellingTotaal([{ naam: 'zak', eenheid: 'zak', factor: 3 }, { naam: 'open', eenheid: 'gram', factor: .001 }, { naam: 'hopper', eenheid: 'gram', factor: .001 }], { zak: '2', open: '500', hopper: '250' })).toBe(6.75);
});
test('Fritz telt doos24, koeling en magazijn samen', () => {
  expect(tellingTotaal([{ naam: 'doos', eenheid: 'doos', factor: 24 }, { naam: 'koeling', eenheid: 'fles', factor: 1 }, { naam: 'magazijn', eenheid: 'fles', factor: 1 }], { doos: '2', koeling: '5', magazijn: '7' })).toBe(60);
});
test('datum volgt Amsterdam, ook over UTC-middernacht', () => {
  expect(amsterdamDatum(new Date('2026-10-28T23:30:00Z'))).toBe('2026-10-29');
});