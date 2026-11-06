// @ts-ignore bun test runner
import { describe, expect, test } from 'bun:test';
import {
  RECEPT_CATEGORIEEN,
  categorieKeuzes,
  ingredientenLabel,
  pastBijZoekterm,
  resultaatTekst,
  sorteerOpNaam,
  toonNaam,
} from './receptCategorieen';

const vast = RECEPT_CATEGORIEEN.map((c) => c.naam);

describe('categorieKeuzes', () => {
  test('zet Alle eerst, dan de vaste volgorde, dan onbekend alfabetisch', () => {
    const keuzes = categorieKeuzes(
      [
        { category: 'ontbijt (1)' },
        { category: 'Groenten' },
        { category: 'Groenten' },
        { category: 'ZZ Archief' },
        { category: 'Sauzen, dressings & dips' },
      ],
      null,
    );
    expect(keuzes.map((k) => k.label)).toEqual(['Alle', ...vast, 'ontbijt (1)', 'ZZ Archief']);
    expect(keuzes[0].aantal).toBe(5);
    expect(keuzes.find((k) => k.naam === 'Groenten')?.aantal).toBe(2);
    expect(keuzes.find((k) => k.naam === 'Soepen')?.aantal).toBe(0);
  });

  test('houdt een gekozen onbekende categorie zichtbaar als het aantal 0 is', () => {
    const keuzes = categorieKeuzes([{ category: 'Groenten' }], 'Oud');
    expect(keuzes.at(-1)?.naam).toBe('Oud');
    expect(keuzes.at(-1)?.aantal).toBe(0);
  });
});

describe('pastBijZoekterm', () => {
  const recept = { name: 'Harissa hummus', ingredient_namen: ['Kikkererwten', 'Citroen'] };

  test('lege term laat het recept door', () => {
    expect(pastBijZoekterm(recept, '  ')).toBe(true);
  });

  test('zoekt in de receptnaam en in de ingrediëntnaam', () => {
    expect(pastBijZoekterm(recept, 'hummus')).toBe(true);
    expect(pastBijZoekterm(recept, 'citroen')).toBe(true);
    expect(pastBijZoekterm(recept, 'pesto')).toBe(false);
  });
});

describe('lijsthelpers', () => {
  test('ingrediëntenlabel en alfabetische sortering', () => {
    expect(ingredientenLabel(1)).toBe('1 ingrediënt');
    expect(ingredientenLabel(4)).toBe('4 ingrediënten');
    expect(sorteerOpNaam([{ name: 'Zoet' }, { name: 'appel' }, { name: 'Brood' }]).map((r) => r.name)).toEqual([
      'appel',
      'Brood',
      'Zoet',
    ]);
  });

  test('toont alleen de eerste letter als hoofdletter', () => {
    expect(toonNaam('abrikozen')).toBe('Abrikozen');
    expect(toonNaam('agave siroop')).toBe('Agave siroop');
    expect(toonNaam('(Snelle) Croissant uit lade')).toBe('(Snelle) Croissant uit lade');
    expect(toonNaam('  Amandel')).toBe('Amandel');
  });

  test('resultaatregel noemt de categorie alleen als die gekozen is', () => {
    expect(resultaatTekst(608, null)).toBe('608 recepten');
    expect(resultaatTekst(1, null)).toBe('1 recept');
    expect(resultaatTekst(84, 'Sauzen, dressings & dips')).toBe('84 recepten in Sauzen, dressings & dips');
  });
});
