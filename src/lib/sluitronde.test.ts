// @ts-ignore bun test runner
import { describe, expect, test } from 'bun:test';
import { aanvulTekst, herkomstLabel, peilBlokjes, bronVoorSoort, isTeldag, soortVanBron, volgendeOpenDag } from './sluitronde';

const dinsdagDicht = (d: Date) => d.getDay() !== 2;

describe('sluitronde', () => {
  test('snijden en zelf maken krijgen de MEP-knop, de rest is pakken', () => {
    expect(soortVanBron('snijden')).toBe('snijden');
    expect(soortVanBron('zelf_west')).toBe('maken');
    expect(soortVanBron('magazijn')).toBe('pakken');
    expect(soortVanBron('koelcel_inkoop')).toBe('pakken');
  });

  test('terug naar pakken maakt van een MEP-bron inkoop, bestaande bron blijft', () => {
    expect(bronVoorSoort('pakken', 'zelf_west')).toBe('koelcel_inkoop');
    expect(bronVoorSoort('pakken', 'magazijn')).toBe('magazijn');
  });

  test('tellen alleen op maandag', () => {
    expect(isTeldag('2026-10-19', dinsdagDicht)).toBe(true); // maandag
    expect(isTeldag('2026-10-20', dinsdagDicht)).toBe(false);
    expect(isTeldag('2026-10-23', dinsdagDicht)).toBe(false); // vrijdag
  });

  test('gesloten maandag schuift de telling naar de eerste open dag', () => {
    const maDiDicht = (d: Date) => d.getDay() !== 1 && d.getDay() !== 2;
    expect(isTeldag('2026-10-19', maDiDicht)).toBe(false);
    expect(isTeldag('2026-10-21', maDiDicht)).toBe(true); // woensdag
    expect(isTeldag('2026-10-22', maDiDicht)).toBe(false);
  });

  test('MEP van maandagavond komt op woensdag als dinsdag dicht is', () => {
    expect(volgendeOpenDag('2026-10-19', dinsdagDicht)).toBe('2026-10-21');
    expect(volgendeOpenDag('2026-10-17', dinsdagDicht)).toBe('2026-10-18');
  });
});

test('terug naar pakken herstelt bron uit de keten', () => {
  expect(bronVoorSoort('pakken', 'snijden', ['magazijn'])).toBe('magazijn');
  expect(bronVoorSoort('pakken', 'snijden', ['magazijn', 'koelcel'])).toBe('koelcel_inkoop');
  expect(bronVoorSoort('pakken', 'zelf_west', [])).toBe('koelcel_inkoop');
  expect(bronVoorSoort('pakken', 'midsland', ['magazijn'])).toBe('midsland');
});

test('minimum per vulnorm', () => {
  expect(aanvulTekst('vol')).toBe('Moet vol zijn');
  expect(aanvulTekst(null)).toBe('Moet vol zijn');
  expect(aanvulTekst('half')).toBe('Minstens half vol');
  expect(aanvulTekst('bodem')).toBe('Bodempje is genoeg');
});

test('peilblokjes per vulnorm', () => {
  expect(peilBlokjes('vol')).toBe(3);
  expect(peilBlokjes('half')).toBe(2);
  expect(peilBlokjes('bodem')).toBe(1);
});

test('actie bij te weinig', () => {
  expect(herkomstLabel('pakken', 'uit de koelcel')).toBe('Aanvullen uit koelcel');
  expect(herkomstLabel('pakken', 'uit het magazijn')).toBe('Aanvullen uit magazijn');
  expect(herkomstLabel('pakken', 'uit de vriescel')).toBe('Ontdooien uit vriescel');
  expect(herkomstLabel('pakken', 'uit Midsland')).toBe('Bestellen bij Midsland');
  expect(herkomstLabel('snijden', 'snijden')).toBe('Naar MEP (snijden)');
  expect(herkomstLabel('maken', 'zelf maken')).toBe('Naar MEP (maken)');
});
