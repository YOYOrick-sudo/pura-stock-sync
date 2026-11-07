// @ts-ignore vitest types are not installed in the app tsconfig
import { describe, expect, test } from 'vitest';
import { eerstvolgendeLeverdagen, leverdagLabel, standaardLeverdag, type BesteldagRegel } from './standaardLeverdag';

const open = () => true;
const midsDicht = new Set([1, 2]);
const midsOpen = (dag: string) => !midsDicht.has(new Date(`${dag}T12:00:00Z`).getUTCDay());

const regel = (deel: Partial<BesteldagRegel> & Pick<BesteldagRegel, 'weekdag'>): BesteldagRegel => ({
  leverancierId: 'bidfood',
  vestiging: 'West',
  deadlineTijd: '20:30:00',
  offset: 1,
  actief: true,
  geldigVanaf: null,
  geldigTot: null,
  ...deel,
});

const dag = (regels: BesteldagRegel[], tijd: string | null, basis = '2026-11-05', leverancierId: string | null = 'bidfood', isOpen: (d: string) => boolean = open) =>
  standaardLeverdag({ basis, tijd, leverancierId, vestiging: 'West', regels, isOpen });

describe('standaardLeverdag', () => {
  test('zonder leverancier: morgen', () => {
    expect(dag([], '12:00:00', '2026-11-05', null)).toBe('2026-11-06');
  });

  test('zonder schema: morgen, dichte dag schuift door', () => {
    // zo 1 nov, Midsland ma+di dicht → wo 4 nov
    expect(dag([], null, '2026-11-01', null, midsOpen)).toBe('2026-11-04');
  });

  test('vandaag vóór de deadline: vandaag plus offset', () => {
    // do 5 nov 2026, besteldag donderdag, offset 1, 18:00 < 20:30 → vr 6 nov
    expect(dag([regel({ weekdag: 4 })], '18:00:00')).toBe('2026-11-06');
  });

  test('precies op de deadline telt vandaag niet meer', () => {
    // do 5 nov voorbij → volgende do 12 nov + 1 = vr 13 nov
    expect(dag([regel({ weekdag: 4 })], '20:30:00')).toBe('2026-11-13');
  });

  test('na de deadline de eerstvolgende besteldag', () => {
    expect(dag([regel({ weekdag: 4, deadlineTijd: '20:30' })], '21:00:00')).toBe('2026-11-13');
  });

  test('lege tijd slaat de deadline over, vandaag telt nog', () => {
    expect(dag([regel({ weekdag: 4 })], null)).toBe('2026-11-06');
  });

  test('meerdere besteldagen: vroegste leverdag wint', () => {
    const regels = [
      regel({ weekdag: 0, offset: 0 }), // zo 8 nov
      regel({ weekdag: 5, offset: 1, deadlineTijd: null }), // vr 6 nov + 1 = za 7 nov
    ];
    expect(dag(regels, '21:00:00')).toBe('2026-11-07');
  });

  test('offset 0 levert op de besteldag zelf, null-offset telt als 1', () => {
    expect(dag([regel({ weekdag: 4, offset: 0, deadlineTijd: null })], '18:00:00')).toBe('2026-11-05');
    expect(dag([regel({ weekdag: 4, offset: null, deadlineTijd: null })], '18:00:00')).toBe('2026-11-06');
  });

  test('leverdag op een dichte dag schuift één keer door na de vroegste', () => {
    // zo 8 nov + offset 0, Midsland zondag open, maar we forceren ma dicht via midsOpen en kiezen maandag
    // besteldag zo 1 nov (weekdag 0), offset 1 → ma 2 nov dicht, di 3 nov dicht → wo 4 nov
    expect(dag([regel({ weekdag: 0, offset: 1, deadlineTijd: null })], null, '2026-11-01', 'bidfood', midsOpen)).toBe('2026-11-04');
  });

  test('vestiging-specifiek en inactief onderdrukt de gedeelde actieve rij', () => {
    const regels = [
      regel({ id: 'west', weekdag: 4, vestiging: 'West', actief: false }),
      regel({ id: 'gedeeld', weekdag: 4, vestiging: null, actief: true, offset: 1 }),
      regel({ id: 'vrijdag', weekdag: 5, vestiging: 'West', deadlineTijd: null, offset: 1 }),
    ];
    // donderdag valt af, vrijdag 6 nov + 1 = za 7 nov
    expect(dag(regels, '10:00:00')).toBe('2026-11-07');
  });

  test('een rij met datums wint van een altijd-geldige rij', () => {
    const regels = [
      regel({ id: 'altijd', weekdag: 4, offset: 3, deadlineTijd: null }),
      regel({ id: 'seizoen', weekdag: 4, offset: 1, deadlineTijd: null, geldigVanaf: '2026-11-01', geldigTot: '2026-11-30' }),
    ];
    expect(dag(regels, '10:00:00')).toBe('2026-11-06');
  });

  test('buiten het seizoen valt die rij weg', () => {
    const regels = [
      regel({ weekdag: 4, offset: 1, deadlineTijd: null, geldigVanaf: '2026-12-01', geldigTot: '2026-12-31' }),
    ];
    expect(dag(regels, '10:00:00')).toBe('2026-11-06');
  });

  test('een rij van een andere vestiging telt niet', () => {
    expect(dag([regel({ weekdag: 4, vestiging: 'Midsland', offset: 0, deadlineTijd: null })], '10:00:00')).toBe('2026-11-06');
  });

  test('een andere leverancier telt niet', () => {
    expect(dag([regel({ weekdag: 4, leverancierId: 'keen', offset: 0, deadlineTijd: null })], '10:00:00')).toBe('2026-11-06');
  });
});

describe('leverdagLabel', () => {
  test('maandag 9 november is ma 9 nov', () => {
    expect(leverdagLabel('2026-11-09')).toBe('ma 9 nov');
    expect(leverdagLabel('2026-11-10')).toBe('di 10 nov');
  });
});

describe('eerstvolgendeLeverdagen', () => {
  test('begint bij het voorstel en slaat dichte dagen over', () => {
    const dicht = new Set([1, 2]);
    const open = (d: string) => !dicht.has(new Date(`${d}T12:00:00Z`).getUTCDay());
    // wo 4 nov, Midsland ma+di dicht
    expect(eerstvolgendeLeverdagen('2026-11-04', '2026-11-04', '2026-11-20', open)).toEqual([
      '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07',
    ]);
    expect(eerstvolgendeLeverdagen('2026-11-08', '2026-11-07', '2026-11-20', open).map(leverdagLabel)).toEqual([
      'zo 8 nov', 'wo 11 nov', 'do 12 nov', 'vr 13 nov',
    ]);
  });
});
