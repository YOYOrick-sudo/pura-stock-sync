// @ts-ignore bun test runner
import { expect, test } from 'bun:test';
import { leverancierNaam, perLeverancier, telMoment } from './presentatie';
import type { ArtikelVorm, BestelSignaal } from '@/hooks/useBestelbord';

test('dagelijks roulerend gebruikt voor_opening', () => {
  expect(telMoment('dagelijks roulerend')).toBe('voor_opening');
  expect(telMoment(null)).toBe('voor_opening');
});
test('alleen exact na_sluiting gebruikt na_sluiting', () => {
  expect(telMoment('na_sluiting')).toBe('na_sluiting');
  expect(telMoment('Na_sluiting')).toBe('voor_opening');
});
test('leverancier van signaal gaat voor artikelvorm, daarna onbekend', () => {
  const s = { leverancier_id: 'a', artikel_vorm_id: 'vorm' } as BestelSignaal;
  const vormen = new Map([['vorm', { leverancier_id: 'b' } as ArtikelVorm]]);
  const leveranciers = new Map([['a', 'A'], ['b', 'B']]);
  expect(leverancierNaam(s, leveranciers, vormen)).toBe('A');
  expect(leverancierNaam({ ...s, leverancier_id: null }, leveranciers, vormen)).toBe('B');
  expect(leverancierNaam({ ...s, leverancier_id: null, artikel_vorm_id: null }, leveranciers, vormen)).toBe('Leverancier onbekend');
});
test('onbekende leverancier staat onderaan zonder dubbele productregels', () => {
  const regels = [{ id: 1, lev: 'Leverancier onbekend' }, { id: 2, lev: 'Z' }, { id: 3, lev: 'A' }];
  const groepen = perLeverancier(regels, (r) => r.lev);
  expect(groepen.map(([naam]) => naam)).toEqual(['A', 'Z', 'Leverancier onbekend']);
  expect(groepen.flatMap(([, rs]) => rs).map((r) => r.id).sort()).toEqual([1, 2, 3]);
});