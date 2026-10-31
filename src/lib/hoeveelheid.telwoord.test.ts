// @ts-ignore vitest runs from the existing isolated test environment
import { describe, it, expect } from 'vitest';
import { telwoord } from './hoeveelheid';

describe('telwoord buiten Fase 2', () => {
  it.each([
    ['artikel', 'artikelen'], ['taak staat', 'taken staan'], ['taak vervalt', 'taken vervallen'],
    ['regel', 'regels'], ['dag', 'dagen'], ['week', 'weken'],
  ])('%s / %s', (enkel, meer) => {
    expect(telwoord(1, enkel, meer)).toBe(`1 ${enkel}`);
    expect(telwoord(2, enkel, meer)).toBe(`2 ${meer}`);
  });
});

describe('dekking in dagen met breuken', () => {
  it.each([
    [0, '0 dagen'], [1, '1 dag'], [1.5, '1,5 dag'], [2, '2 dagen'], [2.5, '2,5 dag'], [3, '3 dagen'],
  ])('%s → %s', (dekking_dagen, tekst) => {
    expect(telwoord(dekking_dagen, 'dag', 'dagen', { breukenEnkelvoud: true })).toBe(tekst);
  });
});
