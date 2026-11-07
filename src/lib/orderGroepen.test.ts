// @ts-ignore vitest types are not installed in the app tsconfig
import { describe, expect, test } from 'vitest';
import { groepeerBestellingen, type OrderRegel } from './orderGroepen';

interface Rij extends OrderRegel {
  id: string;
  leverancier: string;
}

const rij = (deel: Partial<Rij> & Pick<Rij, 'id' | 'leverancier'>): Rij => ({
  bestelreferentie: null,
  besteld_op: '2026-11-06T18:00:00Z',
  verwachte_levering: '2026-11-07',
  ...deel,
});

const namen = (groepen: { leverancier: string; referentie: string | null; leverdatum: string | null }[]) =>
  groepen.map((g) => `${g.leverancier}|${g.referentie ?? g.leverdatum ?? 'geen'}`);

describe('groepeerBestellingen', () => {
  test('zelfde leverancier met ander ordernummer blijft een aparte bestelling', () => {
    const groepen = groepeerBestellingen([
      rij({ id: 'a', leverancier: 'Kooyman', bestelreferentie: 'WEB-1', verwachte_levering: '2026-11-08' }),
      rij({ id: 'b', leverancier: 'Kooyman', bestelreferentie: 'WEB-2', verwachte_levering: '2026-11-08' }),
      rij({ id: 'c', leverancier: 'Kooyman', bestelreferentie: 'WEB-1', verwachte_levering: '2026-11-08' }),
    ], '2026-11-07', (r) => r.leverancier);
    expect(groepen).toHaveLength(2);
    expect(groepen.find((g) => g.referentie === 'WEB-1')?.regels.map((r) => r.id)).toEqual(['a', 'c']);
    expect(groepen.find((g) => g.referentie === 'WEB-2')?.regels.map((r) => r.id)).toEqual(['b']);
  });

  test('zonder referentie groepeert op leverancier en Amsterdamse besteldag', () => {
    // 23:30 UTC is 7 nov in Amsterdam; 18:00 UTC op 6 nov is nog 6 nov
    const groepen = groepeerBestellingen([
      rij({ id: 'vroeg', leverancier: 'Bidfood', besteld_op: '2026-11-06T18:00:00Z', verwachte_levering: '2026-11-09' }),
      rij({ id: 'laat', leverancier: 'Bidfood', besteld_op: '2026-11-06T23:30:00Z', verwachte_levering: '2026-11-09' }),
      rij({ id: 'zelfde', leverancier: 'Bidfood', besteld_op: '2026-11-06T16:00:00Z', verwachte_levering: '2026-11-09' }),
    ], '2026-11-07', (r) => r.leverancier);
    expect(groepen.map((g) => [g.besteldag, g.regels.map((r) => r.id)])).toEqual([
      ['2026-11-06', ['vroeg', 'zelfde']],
      ['2026-11-07', ['laat']],
    ]);
  });

  test('achterstallig bovenaan, dan vandaag, dan later; zonder datum onderaan', () => {
    const groepen = groepeerBestellingen([
      rij({ id: 'later', leverancier: 'Keen', bestelreferentie: 'K2', verwachte_levering: '2026-11-10' }),
      rij({ id: 'geen', leverancier: 'Hanos', bestelreferentie: 'H', verwachte_levering: null }),
      rij({ id: 'vandaag', leverancier: 'Boer', bestelreferentie: 'B', verwachte_levering: '2026-11-07' }),
      rij({ id: 'oud', leverancier: 'Kooyman', bestelreferentie: 'W1', verwachte_levering: '2026-11-05' }),
      rij({ id: 'minder-oud', leverancier: 'Bidfood', bestelreferentie: 'D', verwachte_levering: '2026-11-06' }),
    ], '2026-11-07', (r) => r.leverancier);
    expect(namen(groepen)).toEqual([
      'Kooyman|W1',
      'Bidfood|D',
      'Boer|B',
      'Keen|K2',
      'Hanos|H',
    ]);
    expect(groepen[0].leverdatum).toBe('2026-11-05');
    expect(groepen[4].leverdatum).toBeNull();
  });

  test('witruimte in het ordernummer telt niet als aparte bestelling', () => {
    const groepen = groepeerBestellingen([
      rij({ id: 'a', leverancier: 'Keen', bestelreferentie: '  42 ', verwachte_levering: '2026-11-12' }),
      rij({ id: 'b', leverancier: 'Keen', bestelreferentie: '42', verwachte_levering: '2026-11-12' }),
    ], '2026-11-07', (r) => r.leverancier);
    expect(groepen).toHaveLength(1);
    expect(groepen[0].referentie).toBe('42');
    expect(groepen[0].regels).toHaveLength(2);
  });
});
