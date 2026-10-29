// @ts-ignore bun test runner
import { describe, expect, it } from 'bun:test';
import { gerechtPrijzen, voldoetAanGerechtFilter } from './gerecht-labels';

describe('Veilige selectie van gerechten', () => {
  it('ongecontroleerd blijft voor navraag zichtbaar, ook met een uitgesloten handmatig label', () => {
    expect(voldoetAanGerechtFilter({ gecontroleerd: false, labels: ['gluten'] }, ['gluten'], false)).toBe(true);
  });
  it('ongecontroleerd blijft bij vrij-van zichtbaar zonder handmatig veganlabel', () => {
    expect(voldoetAanGerechtFilter({ gecontroleerd: false, labels: [] }, ['gluten'], true)).toBe(true);
  });
  it('een gecontroleerd gerecht met gluten valt buiten zonder gluten', () => {
    expect(voldoetAanGerechtFilter({ gecontroleerd: true, labels: ['gluten'] }, ['gluten'], false)).toBe(false);
  });
  it('een gecontroleerd gerecht zonder gluten voldoet aan zonder gluten', () => {
    expect(voldoetAanGerechtFilter({ gecontroleerd: true, labels: ['ei'] }, ['gluten'], false)).toBe(true);
  });
  it('vegan blijft op handmatig label gebaseerd zonder vrij-van-filter', () => {
    expect(voldoetAanGerechtFilter({ gecontroleerd: false, labels: [] }, [], true)).toBe(false);
  });
});

describe('Menukaartprijzen', () => {
  it('toont klein 16,60 en groot 25,00 in dezelfde volgorde als hun namen', () => {
    expect(gerechtPrijzen(null, { groot: 25, klein: 16.6 })).toEqual({ bedragen: '16,60 / 25,00', namen: 'klein / groot' });
  });
  it('gebruikt de bestaande prijs zonder varianten', () => {
    expect(gerechtPrijzen(3.8)).toEqual({ bedragen: '3,80', namen: '' });
  });
});