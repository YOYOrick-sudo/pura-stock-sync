import { describe, expect, test } from 'bun:test';
import { bepaalModus, bouwRegel, eindcheckFout, restSoortLabel, type EindcheckInvoer } from './ontvangstV2';

const basis: EindcheckInvoer = {
  soort: 'onderweg', signaal_id: 's1', open_regel_id: null, pakbon_regel_id: null, geleverd_vorm_id: null,
  besteld: 5, binnen: 3, kapot: 0, ander_product: false, ander_product_tekst: '', nageleverd: false,
  rest_bron: null, rest_notitie: '', verwacht_op: '', opmerking: '', automatisch: false,
};

describe('schakelaar', () => {
  test('geen rijen of mislukte rpc: alles uit', () => {
    const m = bepaalModus(null, 'West', false);
    expect(m.ontvangstV2).toBe(false);
    expect(m.keukenadvies).toBe(false);
    expect(m.pVestiging).toBe('West');
    expect(m.pBron).toBe(null);
  });
  test('vlag aan voor andere vestiging telt niet', () => {
    expect(bepaalModus([{ vestiging: 'Midsland', vlag: 'ontvangst_v2', aan: true, mag_beslissen: true }], 'West', false).ontvangstV2).toBe(false);
  });
  test('?locatie=Test zonder Test-rij: geen testmodus', () => {
    expect(bepaalModus([{ vestiging: 'West', vlag: 'ontvangst_v2', aan: false, mag_beslissen: false }], 'West', true).test).toBe(false);
  });
  test('testmodus: p_vestiging Test, bron = actieve vestiging', () => {
    const m = bepaalModus([{ vestiging: 'Test', vlag: 'ontvangst_v2', aan: true, mag_beslissen: true }], 'Midsland', true);
    expect(m.test).toBe(true);
    expect(m.pVestiging).toBe('Test');
    expect(m.pBron).toBe('Midsland');
    expect(m.magBeslissen).toBe(true);
  });
});

describe('eindcheck', () => {
  test('restant standaard mist', () => {
    expect(bouwRegel(basis).rest).toBe('mist');
  });
  test('wordt nageleverd vraagt bron en notitie', () => {
    expect(eindcheckFout({ ...basis, nageleverd: true })).not.toBe(null);
    expect(eindcheckFout({ ...basis, nageleverd: true, rest_bron: 'mail' })).not.toBe(null);
    expect(eindcheckFout({ ...basis, nageleverd: true, rest_bron: 'mail', rest_notitie: 'mail Bidfood' })).toBe(null);
  });
  test('wordt nageleverd stuurt backorder met bron', () => {
    const r = bouwRegel({ ...basis, nageleverd: true, rest_bron: 'pakbon', rest_notitie: 'x', verwacht_op: '2026-11-05' });
    expect(r.rest).toBe('backorder');
    expect(r.rest_bron).toBe('pakbon');
    expect(r.verwacht_op).toBe('2026-11-05');
  });
  test('automatische melding: geen rest meesturen', () => {
    expect(bouwRegel({ ...basis, automatisch: true }).rest).toBeUndefined();
  });
  test('nalevering gebruikt open_regel_id', () => {
    const r = bouwRegel({ ...basis, soort: 'nalevering', open_regel_id: 'o1', besteld: 2, binnen: 2 });
    expect(r.open_regel_id).toBe('o1');
    expect(r.signaal_id).toBeUndefined();
    expect(r.rest).toBeUndefined();
  });
  test('alleen toegestane sleutels', () => {
    const toegestaan = ['signaal_id', 'open_regel_id', 'pakbon_regel_id', 'geleverd_vorm_id', 'binnen', 'kapot', 'ander_product', 'ander_product_tekst', 'verkeerde_vestiging', 'retour', 'emballage', 'rest', 'rest_bron', 'rest_notitie', 'verwacht_op', 'opmerking'];
    const r = bouwRegel({ ...basis, kapot: 1, ander_product: true, ander_product_tekst: 'a', nageleverd: true, rest_bron: 'mail', rest_notitie: 'n', opmerking: 'o' });
    expect(Object.keys(r).every((k) => toegestaan.includes(k))).toBe(true);
  });
  test('personeel ziet nooit backorder', () => {
    expect(restSoortLabel('backorder')).toBe('Wordt nageleverd');
    expect(restSoortLabel('mist')).toBe('Mist');
  });
});
