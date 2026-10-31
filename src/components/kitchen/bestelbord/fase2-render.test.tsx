// @ts-ignore vitest types are not installed in the app tsconfig
import { describe, expect, test } from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { BordTabel } from './BordTabel';
import { KeukenAdviesTabel } from './KeukenAdviesTabel';
import { KeukenTelblok } from './KeukenTelblok';
import { openRestVoorArtikel } from '@/lib/ontvangstV2';
import type { BestelSignaal } from '@/hooks/useBestelbord';
import type { KeukenAdviesRegel, KeukenStandRegel, OntvangstRestant } from '@/hooks/useOntvangstV2';

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
      { telartikel_id: 'a1', naam: 'Komkommer', basis_eenheid: null, leverancier_naam: null, stand: 3, onderweg_op_tijd: 0, onderweg_restant: 0, behoefte: null, vorm: null, advies_vormen: null, status: 'geen_advies', reden: 'leverdagen onbekend; bestelvorm zonder inhoud' },
      { telartikel_id: 'a2', naam: 'Granaatappel', basis_eenheid: null, leverancier_naam: null, stand: null, onderweg_op_tijd: 0, onderweg_restant: 0, behoefte: null, vorm: null, advies_vormen: null, status: 'geen_advies', reden: null },
      { telartikel_id: 'a3', naam: 'IJsbergsla', basis_eenheid: null, leverancier_naam: null, stand: 1, onderweg_op_tijd: 0, onderweg_restant: 0, behoefte: 3, vorm: 'stuk', advies_vormen: 2, status: 'advies', reden: null },
    ];
    const html = renderToString(createElement(KeukenAdviesTabel, { regels, laden: false }));
    expect(html).toContain('>3<');
    expect(html.match(/Geen advies/g)).toHaveLength(2);
    const rijVan = (naam: string) => html.split('<tr>').find((r) => r.includes(naam)) ?? '';
    expect(rijVan('Komkommer')).toContain('>—</td>');
    expect(rijVan('Komkommer')).not.toContain('font-semibold">0<');
    expect(rijVan('Granaatappel')).not.toContain('font-semibold">0<');
    expect(rijVan('IJsbergsla')).toContain('font-semibold">2<');
  });
});