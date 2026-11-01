// @ts-ignore bun test runner
import { expect, test } from 'bun:test';
import { leverancierNaam, onderwegTabTeller, perLeverancier, telMoment } from './presentatie';
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