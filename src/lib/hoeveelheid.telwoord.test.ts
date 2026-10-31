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
