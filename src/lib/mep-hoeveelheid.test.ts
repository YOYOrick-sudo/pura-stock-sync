import { describe, expect, it } from 'vitest';
import { splitsAantalUitTitel } from './mep-hoeveelheid';

describe('splitsAantalUitTitel', () => {
  it('haalt aantal + eenheid achteraan weg', () => {
    expect(splitsAantalUitTitel('taco 4 stuks')).toMatchObject({
      titel: 'Taco',
      aantal: 4,
      eenheid: 'stuks',
      aangepast: true,
    });
  });

  it('neemt bij een reeks het hoogste getal', () => {
    expect(splitsAantalUitTitel('taco 4 a 5 stuks')).toMatchObject({
      titel: 'Taco',
      aantal: 5,
      eenheid: 'stuks',
    });
    expect(splitsAantalUitTitel('taco 4/5 stuks')).toMatchObject({ aantal: 5 });
  });

  it('snapt gewichten en inhoud', () => {
    expect(splitsAantalUitTitel('500 g kruidenbus')).toMatchObject({
      titel: 'Kruidenbus',
      aantal: 500,
      eenheid: 'gram',
    });
    expect(splitsAantalUitTitel('bouillon 1,5 liter')).toMatchObject({ aantal: 1.5, eenheid: 'liter' });
    expect(splitsAantalUitTitel('saus 3 bakken')).toMatchObject({ aantal: 3, eenheid: 'bak' });
  });

  it('snapt 5x en x5 als stuks', () => {
    expect(splitsAantalUitTitel('5x taco')).toMatchObject({ titel: 'Taco', aantal: 5, eenheid: 'stuks' });
    expect(splitsAantalUitTitel('taco x5')).toMatchObject({ titel: 'Taco', aantal: 5 });
  });

  it('laat legitieme namen met cijfers met rust', () => {
    expect(splitsAantalUitTitel('Sap 100%')).toMatchObject({ titel: 'Sap 100%', aantal: null, aangepast: false });
    expect(splitsAantalUitTitel('Saus nr 2 maken')).toMatchObject({ aantal: null, aangepast: false });
  });

  it('meldt een los getal dat blijft staan', () => {
    expect(splitsAantalUitTitel('taco 4')).toMatchObject({ titel: 'Taco 4', losGetal: true });
  });

  it('laat een tekst zonder naam ongemoeid', () => {
    expect(splitsAantalUitTitel('4 stuks')).toMatchObject({ titel: '4 stuks', aantal: null });
  });
});
