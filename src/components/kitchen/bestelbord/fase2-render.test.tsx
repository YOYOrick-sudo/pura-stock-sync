// @ts-ignore vitest types are not installed in the app tsconfig
import { describe, expect, test, vi } from 'vitest';
import { createElement, useState, type ReactElement, type ReactNode } from 'react';
import { renderToString } from 'react-dom/server';
import { BordTabel } from './BordTabel';
import { KeukenAdviesTabel } from './KeukenAdviesTabel';
import { KeukenTelblok } from './KeukenTelblok';
import { TikIcoon } from '@/components/pura';
import { Info } from 'lucide-react';
import { openRestVoorArtikel } from '@/lib/ontvangstV2';
import type { BestelSignaal } from '@/hooks/useBestelbord';
import type { KeukenAdviesRegel, KeukenStandRegel, KeukenTelpoolRegel, OntvangstRestant } from '@/hooks/useOntvangstV2';

vi.mock('react', async (origineel) => {
  const react = await origineel<typeof import('react')>();
  return { ...react, useState: vi.fn(react.useState) };
});

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
    expect(html).toContain('Vanavond tellen');
    expect(html).toContain('Granaatappel');
    expect(html).toContain('Komkommer');
    expect(html).not.toContain('nog niet geteld');
    expect(html).not.toContain('onbekend');
    expect(html).toContain('aria-label="Opslaan Granaatappel"');
    expect(html).toContain('aria-label="Opslaan Komkommer"');
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
    expect(html).not.toContain('2 zak (500 g)');
    expect(html).toContain('placeholder="Aantal"');
    expect(html).toMatch(/<span class="shrink-0 whitespace-nowrap text-sm text-muted-foreground">zak<\/span>/);
    expect(html).toContain('aria-label="Aantal Rucola in zak"');
  });
  test('telblok toont basiseenheid naast het veld zonder telinfo', () => {
    const regels: KeukenStandRegel[] = [{ telartikel_id: 'komkommer', artikel_id: null, naam: 'Komkommer', basis_eenheid: 'st', stand: 3, laatste_telling: null, geteld: null, ontvangen: null, verbruik: null, opslag: null, volledig: false, reden: null }];
    const html = renderToString(createElement(KeukenTelblok, { regels, laden: false, bezig: false, onOpslaan: async () => {} }));
    expect(html).toMatch(/<span class="shrink-0 whitespace-nowrap text-sm text-muted-foreground">st<\/span>/);
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
    expect(html).toContain('Vanavond tellen');
    expect(html).toMatch(/tabular-nums text-muted-foreground">2<\/span>/);
    expect(html).not.toContain('Morgen kiest de app');
    expect(html).toContain('Ook iets anders tellen (3)');
    expect(html).not.toContain('morgen besteldag Kooyman');
    expect(html).not.toContain('tel in: kist');
    expect(html).toContain('aria-label="geteld vandaag"');
    expect(html).not.toContain('Cranberry');
    expect(html).not.toContain('Druif');
    expect(html).not.toContain('Endive');
  });

  test('drie klaar waarvan één controle en twee vrije telartikelen', () => {
    const controlePool = pool.map((r) => r.telartikel_id === 't3' ? { ...r, klaar: true, controle: true, volgorde: 0, reden: 'controletelling' } : r);
    const html = renderToString(createElement(KeukenTelblok, { regels, pool: controlePool, laden: false, bezig: false, onOpslaan: async () => {} }));
    expect(html).toContain('aria-label="Controletelling Cranberry"');
    expect(html).toContain('Vanavond tellen');
    expect(html).toMatch(/tabular-nums text-muted-foreground">3<\/span>/);
    expect(html).not.toContain('Controletelling: de vorige telling week sterk af van het verwachte verbruik.');
    expect(html).toContain('Ook iets anders tellen (2)');
    expect(html).not.toContain('Morgen kiest de app');
  });

  test('zonder pool: alle 5 namen zichtbaar, geen inklaptekst', () => {
    const html = renderToString(createElement(KeukenTelblok, { regels, laden: false, bezig: false, onOpslaan: async () => {} }));
    for (const nm of ['Ananas', 'Banaan', 'Cranberry', 'Druif', 'Endive']) expect(html).toContain(nm);
    expect(html).not.toContain('Ook iets anders tellen');
    expect(html).toContain('Vanavond tellen');
  });

  test('nul klaar: kop zonder hardloper, alles in het inklapbare deel', () => {
    const nietsKlaar = pool.map((r) => ({ ...r, klaar: false, geteld_vandaag: false }));
    const html = renderToString(createElement(KeukenTelblok, { regels, pool: nietsKlaar, laden: false, bezig: false, onOpslaan: async () => {} }));
    expect(html).toMatch(/tabular-nums text-muted-foreground">0<\/span>/);
    expect(html).toContain('Ook iets anders tellen (5)');
    expect(html).toContain('Vanavond tellen');
  });

  test('één klaar: kop met dit artikel', () => {
    const eenKlaar = pool.map((r) => ({ ...r, klaar: r.telartikel_id === 't1' }));
    const html = renderToString(createElement(KeukenTelblok, { regels, pool: eenKlaar, laden: false, bezig: false, onOpslaan: async () => {} }));
    expect(html).toContain('Vanavond tellen');
    expect(html).toMatch(/tabular-nums text-muted-foreground">1<\/span>/);
    expect(html).toContain('Ook iets anders tellen (4)');
  });

  test('twee klaar: kop met deze 2 artikelen', () => {
    const tweeKlaar = pool.map((r) => ({ ...r, klaar: r.telartikel_id === 't1' || r.telartikel_id === 't2' }));
    const html = renderToString(createElement(KeukenTelblok, { regels, pool: tweeKlaar, laden: false, bezig: false, onOpslaan: async () => {} }));
    expect(html).toContain('Vanavond tellen');
    expect(html).toMatch(/tabular-nums text-muted-foreground">2<\/span>/);
    expect(html).toContain('Ook iets anders tellen (3)');
  });
});

describe('fase 2 telhints en plaatje', () => {
  const stand = (telartikel_id: string, naam: string): KeukenStandRegel => ({ telartikel_id, artikel_id: null, naam, basis_eenheid: 'kg', laatste_telling: null, geteld: null, ontvangen: null, verbruik: null, opslag: null, stand: null, volledig: false, reden: null });
  test('regel met hint en afbeelding: hint zichtbaar en knopje plaatje aanwezig', () => {
    const telinfo = { zalm: { tel_label: 'stuk', tel_factor: 1, basis_eenheid: 'kg', tel_hint: '≈ 1,5 kg/zijde', tel_afbeelding: '/telkaart/zalmzijde-visueel.png' } };
    const html = renderToString(createElement(KeukenTelblok, { regels: [stand('zalm', 'Zalmzijde')], telinfo, laden: false, bezig: false, onOpslaan: async () => {} }));
    expect(html).toContain('≈ 1,5 kg/zijde');
    expect(html).toContain('aria-label="Plaatje Zalmzijde"');
    expect(html).not.toContain('>plaatje<');
  });
  test('regel zonder hint: geen knopje plaatje', () => {
    const telinfo = { zalm: { tel_label: 'stuk', tel_factor: 1, basis_eenheid: 'kg' } };
    const html = renderToString(createElement(KeukenTelblok, { regels: [stand('zalm', 'Zalmzijde')], telinfo, laden: false, bezig: false, onOpslaan: async () => {} }));
    expect(html).not.toContain('aria-label="Plaatje Zalmzijde"');
    expect(html).not.toContain('1 hele zijde');
  });
  test('dichte avond: kop met schuift-door-tekst in plaats van 0-tekst', () => {
    const regels = [stand('t1', 'Zalmzijde'), stand('t2', 'Wortel')];
    const dichtePool: KeukenTelpoolRegel[] = [
      { telartikel_id: 't1', naam: 'Zalmzijde', basis_eenheid: 'kg', tel_label: null, leverancier_naam: null, in_telpool: true, laatste_telling: null, morgen_besteldag: true, klaar: false, geteld_vandaag: false, volgorde: 1, reden: 'vestiging dicht: schuift door' },
      { telartikel_id: 't2', naam: 'Wortel', basis_eenheid: 'kg', tel_label: null, leverancier_naam: null, in_telpool: true, laatste_telling: null, morgen_besteldag: true, klaar: false, geteld_vandaag: false, volgorde: 2, reden: 'vestiging dicht: schuift door' },
    ];
    const html = renderToString(createElement(KeukenTelblok, { regels, pool: dichtePool, laden: false, bezig: false, onOpslaan: async () => {} }));
    expect(html).toContain('Vanavond dicht');
    expect(html).toContain('aria-label="Info vanavond dicht"');
    expect(html).not.toContain('Niemand tellen. Wat aan de beurt was schuift door naar de volgende open avond.');
    expect(html).not.toContain('Vanavond geen hardloper aan de beurt');
    expect(html).toContain('Ook iets anders tellen (2)');
  });
});


describe('compacte telrij en opslaggedrag', () => {
  test('TikIcoon heeft een toegankelijk label en een onzichtbaar minimaal 44px tikvlak', () => {
    const html = renderToString(createElement(TikIcoon, { 'aria-label': 'Info telregel' }, createElement(Info)));
    expect(html).toContain('aria-label="Info telregel"');
    expect(html).toContain('after:h-11');
    expect(html).toContain('after:min-w-11');
    expect(html).toContain('after:absolute');
    expect(html).toContain('focus-visible:ring-2');
  });
  const regel: KeukenStandRegel = { telartikel_id: 'zalm', artikel_id: null, naam: 'Zalmzijde', basis_eenheid: 'kg', laatste_telling: '2026-10-30', geteld: null, ontvangen: null, verbruik: null, opslag: null, stand: 1.5, volledig: false, reden: null };
  test('naam, aantal, eenheid en opslag aanwezig; uitleg alleen achter info', () => {
    const html = renderToString(createElement(KeukenTelblok, { regels: [regel], laden: false, bezig: false, onOpslaan: async () => {} }));
    expect(html).toContain('Zalmzijde');
    expect(html).toContain('aria-label="Aantal Zalmzijde in kg"');
    expect(html).toContain('>kg</span>');
    expect(html).toContain('aria-label="Opslaan Zalmzijde"');
    expect(html).toContain('aria-label="Info Zalmzijde"');
    for (const tekst of ['laatst geteld', 'nog niet geteld', 'tel in:', 'Verwachte stand:', 'Controletelling:']) expect(html).not.toContain(tekst);
  });

  function vindActie(node: ReactNode, label: string): ReactElement<{ onClick: () => Promise<void>; disabled: boolean }> | undefined {
    if (Array.isArray(node)) {
      for (const kind of node) { const gevonden = vindActie(kind, label); if (gevonden) return gevonden; }
    } else if (node && typeof node === 'object' && 'props' in node) {
      const element = node as ReactElement<{ 'aria-label'?: string; children?: ReactNode; onClick: () => Promise<void>; disabled: boolean }>;
      if (element.props['aria-label'] === label) return element;
      return vindActie(element.props.children, label);
    }
  }

  test('opslaan gebruikt hetzelfde telartikel en geparseerd aantal; wist invoer na succes', async () => {
    const onOpslaan = vi.fn(async () => {});
    const setInvoer = vi.fn();
    vi.mocked(useState).mockReturnValueOnce([{ zalm: '1,5' }, setInvoer]);
    const element = KeukenTelblok({ regels: [regel], laden: false, bezig: false, onOpslaan });
    const knop = vindActie(element, 'Opslaan Zalmzijde');
    expect(knop).toBeDefined();
    if (!knop) throw new Error('Opslaan ontbreekt');
    expect(knop.props.disabled).toBe(false);
    await knop.props.onClick();
    expect(onOpslaan).toHaveBeenCalledExactlyOnceWith('zalm', 1.5);
    expect(setInvoer).toHaveBeenCalledTimes(1);
    expect(setInvoer.mock.calls[0][0]({ zalm: '1,5', ander: '2' })).toEqual({ zalm: '', ander: '2' });
  });

  test('mislukte opslag bewaart de invoer', async () => {
    const onOpslaan = vi.fn(async () => { throw new Error('Verbinding weg'); });
    const setInvoer = vi.fn();
    vi.mocked(useState).mockReturnValueOnce([{ zalm: '2' }, setInvoer]);
    const knop = vindActie(KeukenTelblok({ regels: [regel], laden: false, bezig: false, onOpslaan }), 'Opslaan Zalmzijde');
    if (!knop) throw new Error('Opslaan ontbreekt');
    await knop.props.onClick();
    expect(onOpslaan).toHaveBeenCalledExactlyOnceWith('zalm', 2);
    expect(setInvoer).not.toHaveBeenCalled();
  });
});
