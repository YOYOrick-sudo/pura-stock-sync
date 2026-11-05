// @ts-ignore vitest types are not installed in the app tsconfig
import { describe, expect, test } from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { buildStickerZpl } from './labelZpl';
import { VriezerNaarKoelcelRij } from '@/components/foh/VriezerNaarKoelcelRij';
import {
  VRIEZER_NAAR_KOELCEL,
  heeftVriezerNaarKoelcel,
  hoeveelheidTekst,
  koelcelRegelVoor,
  leesVriezerStappen,
  ontdooiStickerOpdracht,
  vriezerNaarKoelcelAantal,
  vriezerNaarKoelcelEenheid,
  vriezerNaarKoelcelTitel,
  vriezerStapSleutel,
} from './aanvulketen';

const lade = { batch_aantal: 1, doel_aantal: 2, eenheid: 'bak', product_sleutel: 'falafel', plek: 'werkbank', actief: true };

describe('alleen falafel in de vriezer-keten', () => {
  test('de lijst bevat nu alleen falafel', () => {
    expect(VRIEZER_NAAR_KOELCEL.map((p) => p.sleutel)).toEqual(['falafel']);
  });

  test('falafel wel, een naam die er alleen op lijkt niet', () => {
    expect(heeftVriezerNaarKoelcel({ naam: 'Falafel', product_sleutel: 'iets' })).toBe(true);
    expect(heeftVriezerNaarKoelcel({ naam: 'Falafel balletjes', product_sleutel: 'falafel' })).toBe(true);
    expect(heeftVriezerNaarKoelcel({ naam: 'Falafelwrap', product_sleutel: 'falafelwrap' })).toBe(false);
    expect(heeftVriezerNaarKoelcel({ naam: 'Döner kebab', product_sleutel: 'doner-kebab' })).toBe(false);
  });

  test('de titel noemt product, vriezer en koelcel', () => {
    expect(vriezerNaarKoelcelTitel('Falafel')).toBe('Falafel uit vriezer naar koelcel');
    expect(vriezerNaarKoelcelTitel('  Tempeh ')).toBe('Tempeh uit vriezer naar koelcel');
  });
});

describe('aantal', () => {
  test('zonder koelcelkaart dezelfde hoeveelheid als uit de koelcel gehaald', () => {
    expect(vriezerNaarKoelcelAantal({ batch_aantal: 2, doel_aantal: 1 }, null)).toEqual({ aantal: 2, bron: 'gehaald' });
    expect(vriezerNaarKoelcelAantal({ doel_aantal: 1 }, null)).toEqual({ aantal: 1, bron: 'gehaald' });
    expect(vriezerNaarKoelcelAantal({}, null)).toEqual({ aantal: 1, bron: 'gehaald' });
    expect(hoeveelheidTekst(1, 'bak')).toBe('1 bak');
    expect(hoeveelheidTekst(2, 'bak')).toBe('2 bakken');
  });

  test('een koelcelpeil gaat voor: aanvullen-tot, anders het doel', () => {
    expect(vriezerNaarKoelcelAantal(lade, { aanvul_tot: 4, doel_aantal: 2 })).toEqual({ aantal: 4, bron: 'peil' });
    expect(vriezerNaarKoelcelAantal(lade, { aanvul_tot: null, doel_aantal: 3 })).toEqual({ aantal: 3, bron: 'peil' });
    expect(vriezerNaarKoelcelAantal(lade, { aanvul_tot: 0, doel_aantal: 0 })).toEqual({ aantal: 1, bron: 'gehaald' });
  });

  test('de eenheid volgt het peil, anders de lade', () => {
    expect(vriezerNaarKoelcelEenheid('peil', { eenheid: 'bak' }, { eenheid: 'zak' })).toBe('zak');
    expect(vriezerNaarKoelcelEenheid('gehaald', { eenheid: 'bak' }, { eenheid: 'zak' })).toBe('bak');
    expect(vriezerNaarKoelcelEenheid('peil', { eenheid: 'bak' }, { eenheid: '  ' })).toBe('bak');
  });

  test('alleen een actieve koelcelkaart van hetzelfde product telt', () => {
    const zelf = { ...lade, id: 'lade' };
    const kaarten = [
      zelf,
      { ...lade, id: 'uit', plek: 'koelcel', actief: false, doel_aantal: 9, aanvul_tot: 9 },
      { ...lade, id: 'ander', plek: 'koelcel', product_sleutel: 'tempeh', doel_aantal: 8, aanvul_tot: 8 },
      { ...lade, id: 'vries', plek: 'vriezer', doel_aantal: 6, aanvul_tot: 6 },
    ];
    expect(koelcelRegelVoor(zelf, kaarten)).toBeNull();
    const koelcel = { ...lade, id: 'koel', plek: 'koelcel', doel_aantal: 3, aanvul_tot: 5, eenheid: 'bak' };
    expect(koelcelRegelVoor(zelf, [...kaarten, koelcel])).toBe(koelcel);
  });
});

describe('ontdooisticker', () => {
  test('de ontdooidatum staat op de sticker als Uit vriezer, zonder printer', () => {
    const nu = new Date(2026, 10, 5, 12, 0, 0);
    const opdracht = ontdooiStickerOpdracht('Falafel', 2, nu);
    expect(opdracht).toMatchObject({
      type: 'ontdooid',
      naam: 'Falafel',
      tht_dagen: 2,
      aantal: 2,
      bron: 'sluitlijst',
    });
    expect(opdracht.datum1).toContain('05-11');
    expect(opdracht.datum2).toContain('07-11');
    expect(opdracht).not.toHaveProperty('ontdooidDatum');

    const zpl = buildStickerZpl(opdracht);
    expect(zpl).toContain('ONTDOOID');
    expect(zpl).toContain(`Uit vriezer: ${opdracht.datum1}`);
    expect(zpl).toContain(`Gebruiken t/m: ${opdracht.datum2}`);
    expect(zpl).toContain('Falafel');
    expect(zpl).not.toContain('http');
  });

  test('het aantal stickers blijft tussen 1 en 50', () => {
    const nu = new Date(2026, 10, 5, 12, 0, 0);
    expect(ontdooiStickerOpdracht('Falafel', 0, nu).aantal).toBe(1);
    expect(ontdooiStickerOpdracht('Falafel', 1.4, nu).aantal).toBe(1);
    expect(ontdooiStickerOpdracht('Falafel', 80, nu).aantal).toBe(50);
  });
});

describe('sessie', () => {
  test('alleen open en af blijven bewaard', () => {
    expect(vriezerStapSleutel('Test', '2026-11-05')).toBe('sluit-vriezer-koelcel:Test:2026-11-05');
    expect(leesVriezerStappen(null)).toEqual({});
    expect(leesVriezerStappen('kapot')).toEqual({});
    expect(leesVriezerStappen('[]')).toEqual({});
    expect(leesVriezerStappen(JSON.stringify({ a: 'open', b: 'af', c: 'weg' }))).toEqual({ a: 'open', b: 'af' });
  });
});

describe('vervolgstap', () => {
  test('ziet eruit als een afvinkregel, zonder ja of nee', () => {
    const open = renderToString(createElement(VriezerNaarKoelcelRij, {
      titel: 'Falafel uit vriezer naar koelcel',
      aantalTekst: '1 bak',
      afgevinkt: false,
      laden: false,
      fout: false,
      onVink: () => {},
    }));
    expect(open).toContain('Falafel uit vriezer naar koelcel');
    expect(open).toContain('1 bak');
    expect(open).toContain('text-[16px]');
    expect(open).toContain('text-[13px]');
    expect(open).toContain('h-11');
    expect(open).toContain('animate-in');
    expect(open).toContain('duration-200');
    expect(open).toContain('active:scale-[0.98]');
    expect(open).toContain('motion-safe:animate-in');
    expect(open).not.toContain('Ja');
    expect(open).not.toContain('Nee');
    expect(open).not.toContain('Ontdooien gestart');
    expect(open).not.toContain('Vriezer onvoldoende');
    expect(open).not.toContain('min-h-16');

    const af = renderToString(createElement(VriezerNaarKoelcelRij, {
      titel: 'Falafel uit vriezer naar koelcel',
      aantalTekst: '1 bak',
      afgevinkt: true,
      laden: false,
      fout: false,
      onVink: () => {},
    }));
    expect(af).toContain('line-through');
    expect(af).toContain('aria-pressed="true"');
    expect(af).toContain('1 bak');
  });
});
