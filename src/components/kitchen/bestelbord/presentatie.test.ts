// @ts-ignore bun test runner
import { expect, test } from 'bun:test';
import { leverancierNaam, leverancierSoort, onderwegTabTeller, perLeverancier, telMoment } from './presentatie';
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
test('leverancierSoort volgt dezelfde id als de naam en is null als de soort ontbreekt', () => {
  const s = { leverancier_id: 'a', artikel_vorm_id: 'vorm' } as BestelSignaal;
  const vormen = new Map([['vorm', { leverancier_id: 'b' } as ArtikelVorm]]);
  const soorten = new Map([['a', 'extern' as const], ['b', 'winkel' as const], ['c', 'intern' as const]]);
  expect(leverancierSoort(s, soorten, vormen)).toBe('extern');
  expect(leverancierSoort({ ...s, leverancier_id: null }, soorten, vormen)).toBe('winkel');
  expect(leverancierSoort({ ...s, leverancier_id: 'c', artikel_vorm_id: 'vorm' }, soorten, vormen)).toBe('intern');
  expect(leverancierSoort({ ...s, leverancier_id: null, artikel_vorm_id: null }, soorten, vormen)).toBe(null);
  expect(leverancierSoort({ ...s, leverancier_id: 'ontbreekt' }, soorten, vormen)).toBe(null);
  expect(leverancierSoort(s, undefined, vormen)).toBe(null);
});
test('onderweg-tab telt besteld en losse nalevering als één getal', () => {
  const metStip = onderwegTabTeller({
    besteldIds: ['b1'],
    teChecken: 1,
    restanten: [
      { soort: 'wordt_nageleverd', opnieuw_besteld: false, bestel_signaal_id: null },
      { soort: 'wordt_nageleverd', opnieuw_besteld: false, bestel_signaal_id: null },
      { soort: 'wordt_nageleverd', opnieuw_besteld: false, bestel_signaal_id: null },
      { soort: 'wordt_nageleverd', opnieuw_besteld: false, bestel_signaal_id: null },
      { soort: 'wordt_nageleverd', opnieuw_besteld: true, bestel_signaal_id: null },
    ],
  });
  expect(metStip).toEqual({ aantal: 5, aandacht: 'te checken' });

  const rust = onderwegTabTeller({ besteldIds: ['b1', 'b2'], teChecken: 0, restanten: [] });
  expect(rust).toEqual({ aantal: 2, aandacht: null });
});

test('onderweg-tab telt een restant aan een bestelde regel niet dubbel', () => {
  const gekoppeld = onderwegTabTeller({
    besteldIds: ['b1'],
    teChecken: 0,
    restanten: [{ soort: 'wordt_nageleverd', opnieuw_besteld: false, bestel_signaal_id: 'b1' }],
  });
  expect(gekoppeld).toEqual({ aantal: 1, aandacht: null });

  const mist = onderwegTabTeller({
    besteldIds: ['b1'],
    teChecken: 1,
    restanten: [{ soort: 'mist', opnieuw_besteld: false, bestel_signaal_id: null }],
  });
  expect(mist).toEqual({ aantal: 2, aandacht: 'te checken en mist' });
});

test('onbekende leverancier staat onderaan zonder dubbele productregels', () => {
  const regels = [{ id: 1, lev: 'Leverancier onbekend' }, { id: 2, lev: 'Z' }, { id: 3, lev: 'A' }];
  const groepen = perLeverancier(regels, (r) => r.lev);
  expect(groepen.map(([naam]) => naam)).toEqual(['A', 'Z', 'Leverancier onbekend']);
  expect(groepen.flatMap(([, rs]) => rs).map((r) => r.id).sort()).toEqual([1, 2, 3]);
});