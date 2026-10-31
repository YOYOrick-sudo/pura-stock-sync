// @ts-ignore vitest types are not installed in the app tsconfig
import { describe, expect, test } from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { BordTabel } from './BordTabel';
import { KeukenAdviesTabel } from './KeukenAdviesTabel';
import { KeukenTelblok } from './KeukenTelblok';
import { openRestVoorArtikel } from '@/lib/ontvangstV2';
import type { BestelSignaal } from '@/hooks/useBestelbord';
import type { KeukenAdviesRegel, KeukenStandRegel, KeukenTelpoolRegel, OntvangstRestant } from '@/hooks/useOntvangstV2';

describe('fase 2 zichtbaar in HTML', () => {
  test('Wortelspread zonder artikel of leverancier toont Komt nog 2 via naam-match', () => {
    const regel: BestelSignaal = {
      id: 's1', vestiging: 'Test', naam: 'Wortelspread', aantal: 1, eenheid: 'stuk', notitie: null,
      status: 'open', bron: 'handmatig', created_at: '2026-10-31', besteld_op: null,
      bestelreferentie: null, besteld_via: null, leverancier_id: null, artikel_id: null,
      artikel_vorm_id: null, verwachte_levering: null, geleverd_op: null, geleverd_door: null,
      levering_status: null, levering_opmerking: null, restant_van: null,
    };
    const rest: OntvangstRestant = {
      naam: 'Wortelspread', artikel_id: null, soort: 'wordt_nageleverd', aantal: 2,
      telt_als_onderweg: true, opnieuw_besteld: false, regel_id: 'r1', api_backorder_id: null,
      bestel_signaal_id: null, leverancier_id: null, leverancier_naam: null, eenheid: null,
      bron: null, notitie: null, sinds: '2026-10-31', verwacht_op: null, controle_op: null,
    };
    const html = renderToString(createElement(BordTabel, {
      regels: [regel], leverancier: () => 'Leverancier onbekend', deadlineHint: () => null,
      prijsVan: () => null, prijsSignaal: () => null, prijsTip: () => '',
      onBesteld: () => {}, onBewerk: () => {}, onVervallen: () => {}, alleenLezen: true,
      artikelRest: (s) => openRestVoorArtikel([rest], { artikel_id: s.artikel_id, naam: s.naam }),
    }));
    expect(html).toContain('Komt nog');
    expect(html).toMatch(/Komt nog(?:<!-- -->)?\s*(?:<!-- -->)?2/);
  });
  test('telblok toont beide nog niet getelde artikelen met onbekende stand en Opslaan', () => {
    const regels: KeukenStandRegel[] = ['Granaatappel', 'Komkommer'].map((naam, i) => ({
      telartikel_id: `t${i}`, artikel_id: null, naam, basis_eenheid: null, laatste_telling: null,
      geteld: null, ontvangen: null, verbruik: null, opslag: null, stand: null, volledig: false, reden: null,
    }));
    const html = renderToString(createElement(KeukenTelblok, { regels, laden: false, bezig: false, onOpslaan: async () => {} }));
    expect(html).toContain('Tellen');
    expect(html).toContain('Granaatappel');
    expect(html).toContain('Komkommer');
    expect(html.match(/nog niet geteld/g)).toHaveLength(2);
    expect(html.match(/onbekend/g)).toHaveLength(2);
    expect(html.match(/>Opslaan<\/button>/g)).toHaveLength(2);
  });
  test("advies keuken toont streepje bij geen advies in plaats van 0", () => {
    const regels: KeukenAdviesRegel[] = [
      { telartikel_id: 'a1', naam: 'Komkommer', basis_eenheid: 'st', leverancier_naam: null, stand: 3, onderweg_op_tijd: 0, onderweg_restant: 0, behoefte: null, vorm: null, advies_vormen: null, status: 'geen_advies', reden: 'leverdagen onbekend; bestelvorm zonder inhoud' },
      { telartikel_id: 'a2', naam: 'Granaatappel', basis_eenheid: null, leverancier_naam: null, stand: null, onderweg_op_tijd: 0, onderweg_restant: 0, behoefte: null, vorm: null, advies_vormen: null, status: 'geen_advies', reden: null },
      { telartikel_id: 'a3', naam: 'IJsbergsla', basis_eenheid: null, leverancier_naam: null, stand: 1, onderweg_op_tijd: 0, onderweg_restant: 0, behoefte: 3, vorm: 'stuk', advies_vormen: 2, status: 'advies', reden: null },
    ];
    const html = renderToString(createElement(KeukenAdviesTabel, { regels, laden: false }));
    expect(html).toContain('3 st');
    expect(html.match(/Geen advies/g)).toHaveLength(2);
    const rijVan = (naam: string) => html.split('<tr>').find((r) => r.includes(naam)) ?? '';
    expect(rijVan('Komkommer')).toContain('>—</td>');
    expect(rijVan('Komkommer')).not.toContain('font-semibold">0<');
    expect(rijVan('Granaatappel')).not.toContain('font-semibold">0<');
    expect(rijVan('IJsbergsla')).toContain('font-semibold">2<');
  });
});

describe('fase 2 teleenheden in HTML', () => {
  const telinfo = { rucola: { tel_label: 'zak (250 g)', tel_factor: 250, basis_eenheid: 'g' } };
  test('advies toont teleenheden en totale inhoud van bestelvorm', () => {
    const regels: KeukenAdviesRegel[] = [
      { telartikel_id: 'rucola', naam: 'Rucola', basis_eenheid: 'g', leverancier_naam: null, stand: 500, behoefte: 125, onderweg_op_tijd: 0, onderweg_restant: 0, advies_vormen: 1, vorm: 'zak 250 g', inhoud_vorm: 250, status: 'advies', reden: null },
      { telartikel_id: 'komkommer', naam: 'Komkommer', basis_eenheid: 'st', leverancier_naam: null, stand: 3, behoefte: null, onderweg_op_tijd: 0, onderweg_restant: 0, advies_vormen: null, vorm: null, status: 'geen_advies', reden: null },
    ];
    const html = renderToString(createElement(KeukenAdviesTabel, { regels, telinfo, laden: false }));
    expect(html).toContain('2 zak (500 g)');
    expect(html).toContain('0,5 zak (125 g)');
    expect(html.replace(/<!-- -->/g, '')).toContain('(250 g)');
    expect(html).not.toContain('>500<');
    expect(html).toContain('3 st');
  });
  test('telblok toont stand in zakken en zichtbare teleenheid naast het veld', () => {
    const regels: KeukenStandRegel[] = [{ telartikel_id: 'rucola', artikel_id: null, naam: 'Rucola', basis_eenheid: 'g', stand: 500, laatste_telling: null, geteld: null, ontvangen: null, verbruik: null, opslag: null, volledig: false, reden: null }];
    const html = renderToString(createElement(KeukenTelblok, { regels, telinfo, laden: false, bezig: false, onOpslaan: async () => {} }));
    expect(html).toContain('2 zak (500 g)');
    expect(html).toContain('placeholder="Aantal"');
    expect(html).toMatch(/<span class="whitespace-nowrap text-sm text-muted-foreground">zak<\/span>/);
    expect(html).toContain('aria-label="Aantal Rucola in zak"');
  });
  test('telblok toont basiseenheid naast het veld zonder telinfo', () => {
    const regels: KeukenStandRegel[] = [{ telartikel_id: 'komkommer', artikel_id: null, naam: 'Komkommer', basis_eenheid: 'st', stand: 3, laatste_telling: null, geteld: null, ontvangen: null, verbruik: null, opslag: null, volledig: false, reden: null }];
    const html = renderToString(createElement(KeukenTelblok, { regels, laden: false, bezig: false, onOpslaan: async () => {} }));
    expect(html).toMatch(/<span class="whitespace-nowrap text-sm text-muted-foreground">st<\/span>/);
    expect(html).toContain('placeholder="Aantal"');
    expect(html).toContain('aria-label="Aantal Komkommer in st"');
  });
});
describe('fase 2 telblok met telpool', () => {
  const regels: KeukenStandRegel[] = [
    { telartikel_id: 't1', artikel_id: null, naam: 'Ananas', basis_eenheid: null, laatste_telling: null, geteld: null, ontvangen: null, verbruik: null, opslag: null, stand: null, volledig: false, reden: null },
    { telartikel_id: 't2', artikel_id: null, naam: 'Banaan', basis_eenheid: null, laatste_telling: null, geteld: null, ontvangen: null, verbruik: null, opslag: null, stand: null, volledig: false, reden: null },
    { telartikel_id: 't3', artikel_id: null, naam: 'Cranberry', basis_eenheid: null, laatste_telling: null, geteld: null, ontvangen: null, verbruik: null, opslag: null, stand: null, volledig: false, reden: null },
    { telartikel_id: 't4', artikel_id: null, naam: 'Druif', basis_eenheid: null, laatste_telling: null, geteld: null, ontvangen: null, verbruik: null, opslag: null, stand: null, volledig: false, reden: null },
    { telartikel_id: 't5', artikel_id: null, naam: 'Endive', basis_eenheid: null, laatste_telling: null, geteld: null, ontvangen: null, verbruik: null, opslag: null, stand: null, volledig: false, reden: null },
  ];
  const pool: KeukenTelpoolRegel[] = [
    { telartikel_id: 't2', naam: 'Banaan', basis_eenheid: null, tel_label: 'kist', leverancier_naam: 'Kooyman', in_telpool: true, laatste_telling: null, morgen_besteldag: true, klaar: true, geteld_vandaag: true, volgorde: 1, reden: 'morgen besteldag Kooyman' },
    { telartikel_id: 't1', naam: 'Ananas', basis_eenheid: null, tel_label: null, leverancier_naam: 'Kooyman', in_telpool: true, laatste_telling: null, morgen_besteldag: true, klaar: true, geteld_vandaag: false, volgorde: 2, reden: 'morgen besteldag Kooyman; 3 dagen niet geteld' },
    { telartikel_id: 't3', naam: 'Cranberry', basis_eenheid: null, tel_label: null, leverancier_naam: null, in_telpool: true, laatste_telling: null, morgen_besteldag: false, klaar: false, geteld_vandaag: false, volgorde: 3, reden: null },
    { telartikel_id: 't4', naam: 'Druif', basis_eenheid: null, tel_label: null, leverancier_naam: null, in_telpool: true, laatste_telling: null, morgen_besteldag: false, klaar: false, geteld_vandaag: false, volgorde: 4, reden: null },
    { telartikel_id: 't5', naam: 'Endive', basis_eenheid: null, tel_label: null, leverancier_naam: null, in_telpool: true, laatste_telling: null, morgen_besteldag: false, klaar: false, geteld_vandaag: false, volgorde: 5, reden: null },
  ];

  test('toont alleen vandaag, uitleg, reden en geteld-badge; overig dichtgeklapt', () => {
    const html = renderToString(createElement(KeukenTelblok, { regels, pool, laden: false, bezig: false, onOpslaan: async () => {} }));
    expect(html).toContain('Ananas');
    expect(html).toContain('Banaan');
    expect(html).toContain('Vanavond tellen: deze 2 artikelen. Morgen kiest de app weer andere.');
    expect(html).toContain('Ook iets anders tellen (3)');
    expect(html).toContain('morgen besteldag Kooyman');
    expect(html).toContain('tel in: kist');
    expect(html).toContain('>geteld<');
    expect(html).not.toContain('Cranberry');
    expect(html).not.toContain('Druif');
    expect(html).not.toContain('Endive');
  });

  test('zonder pool: alle 5 namen zichtbaar, geen inklaptekst', () => {
    const html = renderToString(createElement(KeukenTelblok, { regels, laden: false, bezig: false, onOpslaan: async () => {} }));
    for (const nm of ['Ananas', 'Banaan', 'Cranberry', 'Druif', 'Endive']) expect(html).toContain(nm);
    expect(html).not.toContain('Ook iets anders tellen');
    expect(html).not.toContain('Vanavond tellen');
  });
});
