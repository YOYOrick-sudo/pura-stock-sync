// @ts-ignore bun test runner
import { expect, test } from 'bun:test';
import { tellingTotaal } from '@/lib/voorraadproef';
import { telMoment } from './presentatie';

const plekken = [{ naam: 'zak', eenheid: 'zak', factor: 3 }, { naam: 'open', eenheid: 'gram', factor: .001 }, { naam: 'hopper', eenheid: 'gram', factor: .001 }];
test('alle drie opslagplekken moeten ingevuld zijn, ook een lege hopper als nul', () => {
  expect(tellingTotaal(plekken, { zak: '2', open: '500' })).toBeNull();
  expect(tellingTotaal(plekken, { zak: '2', open: '500', hopper: '0' })).toBe(6.5);
});
test('drie inline waarden gebruiken dezelfde conversie en telmoment als de oorspronkelijke telling', () => {
  expect(tellingTotaal(plekken, { zak: '2', open: '500', hopper: '250' })).toBe(6.75);
  expect(telMoment('dagelijks roulerend')).toBe('voor_opening');
});