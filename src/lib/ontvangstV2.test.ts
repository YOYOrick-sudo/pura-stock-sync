// @ts-ignore vitest types are not installed in the app tsconfig
import { describe, expect, test } from 'vitest';
import { formatTelHoeveelheid, telEenheidKort } from './ontvangstV2';
import { telInvoer, openRestVoorArtikel, restWaarschuwing, vandaagZonderOpenRest, afrondWaarschuwingen, annuleerGeldig, bordRestStatus, bordRestStatusPerSignaal, onderwegBlokken, onderwegMetRest, onderwegTellers, isAutomatisch, bepaalModus, bouwRegel, eindcheckFout, restSoortLabel, splitsTelpool, type EindcheckInvoer } from './ontvangstV2';

describe('telInvoer', () => {
  test.each([
    ['3', 3], ['2,5', 2.5], [' 4 ', 4], ['', null], ['-1', null], ['abc', null], ['100001', null],
    ['0', 0], ['100000', 100000], ['Infinity', null], ['2,5,1', null],
  ])('%s geeft %s', (tekst: string, verwacht: number | null) => {
    expect(telInvoer(tekst)).toBe(verwacht);
  });
});

describe('telhoeveelheid', () => {
  const zak = { tel_label: 'zak (250 g)', tel_factor: 250, basis_eenheid: 'g' };
  test.each([
    [500, '2 zak (500 g)'], [375, '1,5 zak (375 g)'], [929.2, '≈3,7 zak (929 g)'],
    [0, '0 zak (0 g)'], [-250, '-1 zak (-250 g)'],
  ])('%s gram in zakken', (basis: number, verwacht: string) => {
    expect(formatTelHoeveelheid(basis, zak)).toBe(verwacht);
  });
  test('stuks blijven basiseenheid', () => {
    expect(formatTelHoeveelheid(3, { tel_label: 'stuks', tel_factor: 1, basis_eenheid: 'st' })).toBe('3 st');
  });
  test.each([null, undefined])('ontbrekende hoeveelheid %s', (basis: null | undefined) => {
    expect(formatTelHoeveelheid(basis, zak)).toBeNull();
  });
  test('geen info toont alleen het getal', () => {
    expect(formatTelHoeveelheid(3, undefined)).toBe('3');
  });
  test('lege factor of factor 1 blijft basis', () => {
    expect(formatTelHoeveelheid(500, { ...zak, tel_factor: null })).toBe('500 g');
    expect(formatTelHoeveelheid(500, { ...zak, tel_factor: 1 })).toBe('500 g');
  });
  test('zelfde teleenheid of st blijft basis', () => {
    expect(formatTelHoeveelheid(500, { ...zak, tel_label: 'g' })).toBe('500 g');
    expect(formatTelHoeveelheid(500, { ...zak, tel_label: 'stuk' })).toBe('500 g');
  });
  test('basiseenheden ronden af met Nederlandse komma', () => {
    expect(formatTelHoeveelheid(3.25, { tel_label: null, tel_factor: 1, basis_eenheid: 'st' })).toBe('3,3 st');
    expect(formatTelHoeveelheid(929.2, { tel_label: null, tel_factor: 1, basis_eenheid: 'ml' })).toBe('929 ml');
  });
  test.each([['zak (1 kg)', 'zak'], ['stuks', 'st'], ['stuk', 'st'], ['', 'st'], ['   ', 'st'], [null, null]])('korte eenheid %s', (label: string | null, verwacht: string | null) => {
    expect(telEenheidKort(label)).toBe(verwacht);
  });
});

const basis: EindcheckInvoer = {
  soort: 'onderweg', signaal_id: 's1', open_regel_id: null, pakbon_regel_id: null, geleverd_vorm_id: null,
  besteld: 5, binnen: 3, kapot: 0, ander_product: false, ander_product_tekst: '', nageleverd: false,
  rest_bron: null, rest_notitie: '', verwacht_op: '', opmerking: '', automatisch: false,
};

describe('openRestVoorArtikel', () => {
  const rij = { artikel_id: 'a1', naam: 'Koksroom', telt_als_onderweg: true, opnieuw_besteld: false };
  test('artikel-id gaat voor een eerdere naam-match', () => {
    const naamMatch = { ...rij, artikel_id: 'a2' };
    expect(openRestVoorArtikel([naamMatch, rij], { artikel_id: 'a1', naam: 'Koksroom' })).toBe(rij);
  });
  test('naam-match normaliseert hoofdletters en extra spaties', () => {
    const r = { ...rij, naam: '  Koksroom   Vol  ' };
    expect(openRestVoorArtikel([r], { naam: ' KOKSROOM  vol ' })).toBe(r);
    expect(openRestVoorArtikel([r], { artikel_id: 'ander', naam: 'koksroom vol' })).toBe(r);
  });
  test('opnieuw bestelde rijen worden genegeerd, ook bij naam-match', () => {
    expect(openRestVoorArtikel([{ ...rij, opnieuw_besteld: true }], { artikel_id: 'a1', naam: 'Koksroom' })).toBe(null);
  });
  test('rijen die niet als onderweg tellen worden genegeerd', () => {
    expect(openRestVoorArtikel([{ ...rij, telt_als_onderweg: false }], { artikel_id: 'a1', naam: 'Koksroom' })).toBe(null);
  });
  test('lege lijst geeft null', () => {
    expect(openRestVoorArtikel([], { artikel_id: 'a1', naam: 'Koksroom' })).toBe(null);
  });
  test('lege invoer en onbekend artikel geven null', () => {
    expect(openRestVoorArtikel([rij], {})).toBe(null);
    expect(openRestVoorArtikel([rij], { artikel_id: null, naam: '  ' })).toBe(null);
    expect(openRestVoorArtikel([rij], { artikel_id: 'ander', naam: 'Melk' })).toBe(null);
  });
});

describe('restWaarschuwing', () => {
  const rest = { soort: 'mist', aantal: 2, eenheid: 'doos', sinds: '2026-11-05', verwacht_op: null };
  test('mist zonder verwachte datum', () => {
    expect(restWaarschuwing(rest)).toBe('Let op: 2 doos mist nog sinds do 5 nov');
  });
  test('mist met verwachte datum', () => {
    expect(restWaarschuwing({ ...rest, verwacht_op: '2026-11-06' })).toBe('Let op: 2 doos mist nog sinds do 5 nov, verwacht vr 6 nov');
  });
  test('nageleverd zonder eenheid, ook bij een lege eenheid', () => {
    expect(restWaarschuwing({ ...rest, soort: 'wordt_nageleverd', eenheid: null })).toBe('Let op: 2 wordt nog nageleverd sinds do 5 nov');
    expect(restWaarschuwing({ ...rest, soort: 'wordt_nageleverd', eenheid: '  ' })).toBe('Let op: 2 wordt nog nageleverd sinds do 5 nov');
  });
  test('ook de API-soort backorder geeft alleen personeelstaal', () => {
    const tekst = restWaarschuwing({ ...rest, soort: 'backorder' });
    expect(tekst).toBe('Let op: 2 doos wordt nog nageleverd sinds do 5 nov');
    expect(tekst.toLowerCase()).not.toContain('backorder');
  });
});

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

describe('vandaagZonderOpenRest', () => {
  const r = (soort: string, id: string) => ({ soort, id });
  test('mist en backorder eruit', () => {
    expect(vandaagZonderOpenRest([r('mist', 'a'), r('backorder', 'b')])).toEqual([]);
  });
  test('nalevering, onderweg en alleen_pakbon blijven in volgorde', () => {
    const lijst = [r('alleen_pakbon', '1'), r('mist', 'x'), r('onderweg', '2'), r('backorder', 'y'), r('nalevering', '3')];
    expect(vandaagZonderOpenRest(lijst).map((x) => x.id)).toEqual(['1', '2', '3']);
  });
  test('lege lijst', () => {
    expect(vandaagZonderOpenRest([])).toEqual([]);
  });
});

describe('splitsTelpool', () => {
  const stand = (id: string, naam: string) => ({ telartikel_id: id, naam, artikel_id: null, basis_eenheid: null, laatste_telling: null, geteld: null, ontvangen: null, verbruik: null, opslag: null, stand: null, volledig: false, reden: null });
  const pool = (telartikel_id: string, klaar: boolean, volgorde: number) => ({
    telartikel_id, naam: '', basis_eenheid: null, tel_label: null, leverancier_naam: null, in_telpool: true,
    laatste_telling: null, morgen_besteldag: false, klaar, geteld_vandaag: false, volgorde, reden: null,
  });
  const regels = [stand('t1', 'Cranberry'), stand('t2', 'Banaan'), stand('t3', 'Druif'), stand('t4', 'Ananas'), stand('t5', 'Endive')];

  test('twee klaar (volgorde 2 en 1) komen eerst in volgorde, rest op naam', () => {
    const p = [pool('t3', true, 2), pool('t2', true, 1), pool('t1', false, 3), pool('t4', false, 4), pool('t5', false, 5)];
    const { vandaag, overig } = splitsTelpool(regels, p);
    expect(vandaag.map((r) => r.telartikel_id)).toEqual(['t2', 't3']);
    expect(overig.map((r) => r.naam)).toEqual(['Ananas', 'Cranberry', 'Endive']);
  });
  test('regel zonder poolregel gaat naar vandaag', () => {
    const p = [pool('t2', true, 1)];
    const { vandaag, overig } = splitsTelpool(regels, p);
    expect(vandaag.map((r) => r.telartikel_id)).toEqual(['t1', 't3', 't4', 't5', 't2']);
    expect(overig).toEqual([]);
  });
  test('pool leeg of undefined: alles vandaag, overig leeg', () => {
    expect(splitsTelpool(regels, undefined).vandaag).toHaveLength(5);
    expect(splitsTelpool(regels, undefined).overig).toEqual([]);
    expect(splitsTelpool(regels, []).vandaag).toHaveLength(5);
    expect(splitsTelpool(regels, []).overig).toEqual([]);
  });
});
