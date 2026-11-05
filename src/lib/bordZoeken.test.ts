import { describe, expect, test } from 'vitest';
import {
  BORD_SUGGESTIE_LIMIET,
  HISTORIE_SCORE_FACTOR,
  INGREDIENT_LIMIET,
  STERKE_KOPPEL_DREMPEL,
  actieveSuggestieIndex,
  bestelbotNormaliseer,
  bordScore,
  enterKiestSuggestie,
  filterIngredienten,
  herhaalNormen,
  isSterkeArtikeltreffer,
  suggestieSubtekst,
} from './bordZoeken';

describe('bordzoeken normalisatie en scores', () => {
  test('tauge vindt Taugé en spaties vallen weg', () => {
    expect(bestelbotNormaliseer('Taugé')).toBe('tauge');
    expect(bestelbotNormaliseer('amandel meel')).toBe('amandelmeel');
    expect(bestelbotNormaliseer('Amandelmeel grof')).toBe('amandelmeelgrof');
    const rijen = [
      { id: '1', naam: 'Tomaat' },
      { id: '2', naam: 'Taugé' },
      { id: '3', naam: 'Amandelmeel grof' },
    ];
    expect(filterIngredienten(rijen, 'tauge').map((r) => r.naam)).toEqual(['Taugé']);
    expect(filterIngredienten(rijen, 'amandel meel').map((r) => r.naam)).toEqual(['Amandelmeel grof']);
    expect(filterIngredienten(rijen, 'a')).toEqual([]);
  });

  test('ingrediëntenlijst is minstens zo lang als het bord', () => {
    expect(INGREDIENT_LIMIET).toBe(BORD_SUGGESTIE_LIMIET);
    expect(INGREDIENT_LIMIET).toBeGreaterThanOrEqual(15);
    const rijen = Array.from({ length: 20 }, (_, i) => ({ naam: `Amandel ${i}` }));
    expect(filterIngredienten(rijen, 'amandel')).toHaveLength(15);
  });

  test('exacte artikelalias blijft score 1', () => {
    expect(bordScore('Naturfrisk', 'naturfrisk', 'artikel')).toBe(1);
    expect(bordScore('NF-ginger', 'nf ginger', 'artikel')).toBe(1);
    expect(bordScore('Gemberbier', 'gemb', 'artikel')).toBe(0.9);
  });

  test('historie en concept krijgen het label eerder besteld en een lagere score', () => {
    const historie = bordScore('Naturfrisk ginger beer', 'naturfrisk ginger beer', 'historie');
    const concept = bordScore('losse munt', 'losse munt', 'concept');
    expect(historie).toBeCloseTo(HISTORIE_SCORE_FACTOR, 3);
    expect(concept).toBeCloseTo(HISTORIE_SCORE_FACTOR, 3);
    expect(historie).toBeLessThan(1);
    expect(concept).toBeLessThan(STERKE_KOPPEL_DREMPEL);
    expect(suggestieSubtekst('historie', '')).toBe('eerder besteld');
    expect(suggestieSubtekst('concept', 'doos')).toBe('eerder besteld · doos');
    expect(suggestieSubtekst('artikel', 'doos')).toBe('doos');
  });

  test('Enter koppelt alleen een zichtbaar sterk artikel, nooit stil onder 0.9', () => {
    const sterk = { score: STERKE_KOPPEL_DREMPEL, artikel_id: 'a1', bron: 'artikel' as const };
    const zwak = { score: 0.899, artikel_id: 'a1', bron: 'artikel' as const };
    const historie = { score: 1, artikel_id: null, bron: 'historie' as const };
    const concept = { score: 1, artikel_id: null, bron: 'concept' as const };
    expect(isSterkeArtikeltreffer(sterk)).toBe(true);
    expect(isSterkeArtikeltreffer(zwak)).toBe(false);
    expect(isSterkeArtikeltreffer(historie)).toBe(false);
    expect(isSterkeArtikeltreffer(concept)).toBe(false);
    expect(isSterkeArtikeltreffer({ score: '0.900', artikel_id: 'a1', bron: 'artikel' })).toBe(true);
    expect(actieveSuggestieIndex([sterk, zwak])).toBe(0);
    expect(actieveSuggestieIndex([zwak])).toBe(-1);
    expect(actieveSuggestieIndex([historie])).toBe(-1);
    expect(actieveSuggestieIndex([concept])).toBe(-1);
    expect(enterKiestSuggestie(true, 0)).toBe(true);
    expect(enterKiestSuggestie(true, -1)).toBe(false);
    expect(enterKiestSuggestie(false, 0)).toBe(false);
  });

  test('Maak artikel vanaf twee vrije regels of een historienorm', () => {
    const een = [{ naam: 'Taugé', artikel_id: null, status: 'open' }];
    const twee = [
      { naam: 'Taugé', artikel_id: null, status: 'open' },
      { naam: 'tauge', artikel_id: null, status: 'besteld' },
      { naam: 'tauge', artikel_id: 'art', status: 'open' },
      { naam: 'tauge', artikel_id: null, status: 'vervallen' },
    ];
    expect(herhaalNormen(een).has('tauge')).toBe(false);
    expect(herhaalNormen(twee).has('tauge')).toBe(true);
    expect(herhaalNormen(een, ['tauge']).has('tauge')).toBe(true);
    expect(herhaalNormen([{ naam: 'Melk', artikel_id: 'x', status: 'open' }, { naam: 'Melk', artikel_id: 'x', status: 'open' }]).size).toBe(0);
  });
});
