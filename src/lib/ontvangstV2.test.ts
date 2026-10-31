// @ts-ignore bun test runner
import { describe, expect, test } from 'bun:test';
import { afrondWaarschuwingen, annuleerGeldig, bordRestStatus, bordRestStatusPerSignaal, onderwegBlokken, onderwegMetRest, onderwegTellers, isAutomatisch, bepaalModus, bouwRegel, eindcheckFout, restSoortLabel, type EindcheckInvoer } from './ontvangstV2';

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
  test('Bidfood met pakbon blijft mist en kan Wordt nageleverd kiezen', () => {
    const auto = isAutomatisch({ signaal_id: 's1', pakbon_notitie: null }, []);
    expect(auto).toBe(false);
    const r = { ...basis, pakbon_regel_id: 'p1', automatisch: auto };
    expect(bouwRegel(r).rest).toBe('mist');
    expect(eindcheckFout({ ...r, nageleverd: true })).not.toBe(null);
    expect(bouwRegel({ ...r, nageleverd: true, rest_bron: 'pakbon', rest_notitie: 'volgt di' }).rest).toBe('backorder');
  });
  test('automatisch alleen bij API-backorder of volgt-melding', () => {
    expect(isAutomatisch({ signaal_id: 's1', pakbon_notitie: null }, [{ bron: 'api', api_backorder_id: 'b1', bestel_signaal_id: 's1' }])).toBe(true);
    expect(isAutomatisch({ signaal_id: 's1', pakbon_notitie: null }, [{ bron: 'api', api_backorder_id: 'b1', bestel_signaal_id: 's2' }])).toBe(false);
    expect(isAutomatisch({ signaal_id: 's1', pakbon_notitie: 'follows_later' }, [])).toBe(true);
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

describe('onderweg met reststatus', () => {
  const teChecken = [{ id: 'mist' }, { id: 'zonder' }, { id: 'nageleverd' }];
  const onderweg = [{ id: 'later-2' }, { id: 'later-1' }];
  const status = new Map<string, 'nageleverd' | 'mist'>([['mist', 'mist'], ['nageleverd', 'nageleverd']]);
  test('te-checkenregels met status staan eerst, in dezelfde volgorde', () => {
    expect(onderwegMetRest(teChecken, onderweg, status).map((r) => r.id)).toEqual(['mist', 'nageleverd', 'later-2', 'later-1']);
  });
  test('te-checkenregels zonder status blijven verborgen', () => {
    expect(onderwegMetRest([{ id: 'zonder' }], [], status)).toEqual([]);
  });
  test('bestaande onderwegregels en invoerlijsten blijven ongewijzigd', () => {
    const resultaat = onderwegMetRest(teChecken, onderweg, status);
    expect(resultaat.slice(2)).toEqual(onderweg);
    expect(resultaat[2]).toBe(onderweg[0]);
    expect(teChecken.map((r) => r.id)).toEqual(['mist', 'zonder', 'nageleverd']);
    expect(onderweg.map((r) => r.id)).toEqual(['later-2', 'later-1']);
  });
  test('lege statusmap geeft alleen de ongewijzigde onderweglijst', () => {
    expect(onderwegMetRest(teChecken, onderweg, new Map())).toEqual(onderweg);
  });
});

describe('onderweg-blokken en badges', () => {
  const rijen = [
    { soort: 'wordt_nageleverd', opnieuw_besteld: false },
    { soort: 'wordt_nageleverd', opnieuw_besteld: true },
    { soort: 'mist', opnieuw_besteld: false },
    { soort: 'mist', opnieuw_besteld: false },
    { soort: 'mist', opnieuw_besteld: true },
  ];
  test('mist apart, opnieuw besteld niet in teller', () => {
    expect(onderwegTellers(rijen)).toEqual({ nageleverd: 1, mist: 2 });
    const b = onderwegBlokken(rijen);
    expect(b.nageleverd.opnieuw.length).toBe(1);
    expect(b.mist.opnieuw.length).toBe(1);
  });
  test('bordbadge alleen bij niet opnieuw bestelde regels', () => {
    expect(bordRestStatus({ soort: 'wordt_nageleverd', opnieuw_besteld: false })).toBe('nageleverd');
    expect(bordRestStatus({ soort: 'wordt_nageleverd', opnieuw_besteld: true })).toBe(null);
    expect(bordRestStatus({ soort: 'mist', opnieuw_besteld: false })).toBe('mist');
    expect(bordRestStatus({ soort: 'mist', opnieuw_besteld: true })).toBe(null);
  });
  test('badge per bestel_signaal_id: nageleverd wint van mist, opnieuw besteld telt niet', () => {
    const mist = { soort: 'mist', opnieuw_besteld: false, bestel_signaal_id: 's1' };
    const nageleverd = { soort: 'wordt_nageleverd', opnieuw_besteld: false, bestel_signaal_id: 's1' };
    const opnieuw = { soort: 'wordt_nageleverd', opnieuw_besteld: true, bestel_signaal_id: 's1' };
    // beide volgordes
    expect(bordRestStatusPerSignaal([mist, nageleverd]).get('s1')).toBe('nageleverd');
    expect(bordRestStatusPerSignaal([nageleverd, mist]).get('s1')).toBe('nageleverd');
    // mist + opnieuw bestelde nageleverd = mist
    expect(bordRestStatusPerSignaal([opnieuw, mist]).get('s1')).toBe('mist');
    // alleen opnieuw bestelde regels: geen badge
    expect(bordRestStatusPerSignaal([opnieuw]).has('s1')).toBe(false);
  });
  test('annuleren vraagt bron en minstens 3 tekens', () => {
    expect(annuleerGeldig('mail', '  ab ')).toBe(false);
    expect(annuleerGeldig('', 'abc')).toBe(false);
    expect(annuleerGeldig('mail', 'abc')).toBe(true);
  });
  test('waarschuwing opnieuw besteld wordt gelezen', () => {
    expect(afrondWaarschuwingen({ waarschuwingen: ['let op: ook opnieuw besteld'] })).toEqual(['let op: ook opnieuw besteld']);
    expect(afrondWaarschuwingen({ waarschuwingen: [
      { regel: 'r1', naam: 'Oatly Barista Light', waarschuwing: 'let op: ook opnieuw besteld' },
      { regel: 'r2', naam: 'Melk', waarschuwing: 'geen inhoud per verpakking: telt niet in voorraad' },
    ] })).toEqual(['Oatly Barista Light: let op: ook opnieuw besteld']);
    expect(afrondWaarschuwingen(null)).toEqual([]);
  });
});
