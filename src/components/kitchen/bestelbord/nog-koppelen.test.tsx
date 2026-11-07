import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createElement, type ReactNode } from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '@/components/ui/tooltip';
import Bestelbord from '@/pages/kitchen/Bestelbord';
import { KoppelPaneel } from './KoppelPaneel';
import { bouwAanmaakVelden, koppelAanBestaand, koppelNieuwArtikel, leverancierKeuzeLabel, planKoppelZoek } from './koppelActies';
import type { ArtikelVorm, BestelSignaal, BordSuggestie } from '@/hooks/useBestelbord';

const staat = vi.hoisted(() => ({
  vlag: false,
  isManager: false,
  signalen: [] as BestelSignaal[],
  vormen: [] as ArtikelVorm[],
  soorten: new Map<string, 'extern' | 'winkel' | 'intern'>(),
  leveranciers: new Map<string, string>(),
  markeer: vi.fn(),
  knoppen: [] as { children?: ReactNode; onClick?: () => void }[],
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { from: vi.fn(), rpc: vi.fn(), auth: { getUser: vi.fn() }, channel: vi.fn(), removeChannel: vi.fn() },
}));
vi.mock('@/components/SidebarLayout', () => ({ SidebarLayout: ({ children }: { children: ReactNode }) => createElement('div', null, children) }));
vi.mock('@/components/kitchen/Voorraadproef', () => ({ Voorraadproef: () => null }));
vi.mock('@/contexts/UserLocationContext', () => ({ useUserLocation: () => ({ userLocation: 'Test' }) }));
vi.mock('@/hooks/useRole', () => ({ useRole: () => ({ isManager: staat.isManager, loading: false }) }));
vi.mock('@/hooks/useBesteldeadlines', () => ({ useBesteldeadlines: () => ({ hint: () => null, verstreken: () => false }) }));
vi.mock('@/hooks/usePrijsSignalen', () => ({ usePrijsSignalen: () => ({ data: [] }) }));
vi.mock('@/hooks/useVoorraadproef', () => ({ useOpenTelvragen: () => ({ data: 0, isSuccess: true }) }));
vi.mock('@/hooks/useOntvangstV2', () => ({
  useFase2VlagAan: (_vestiging: string, vlag: string) => vlag === 'leverancier_kiezen' && staat.vlag,
  useOntvangstModus: () => ({ ontvangstV2: false, test: false, keukenadvies: false, magBeslissen: false, pVestiging: 'Test' }),
  useOntvangstData: () => ({ restanten: { data: [] }, vandaag: { data: [], isLoading: false }, mandje: { data: [] } }),
  useKeukenAdvies: () => ({ data: [], isLoading: false }),
  useKeukenStand: () => ({ data: [], isLoading: false }),
  useKeukenTelpool: () => ({ data: [] }),
  useKeukenTelInfo: () => ({ data: undefined }),
  useKeukenTelling: () => ({ isPending: false, mutateAsync: vi.fn() }),
}));
vi.mock('@/hooks/useBestelbord', async () => {
  const echt = await vi.importActual<typeof import('@/hooks/useBestelbord')>('@/hooks/useBestelbord');
  const mut = () => ({ mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false });
  return {
    ...echt,
    zoekBordSuggesties: vi.fn(async () => []),
    useBestelSignalen: () => ({ data: staat.signalen, isLoading: false }),
    useLeveranciers: () => ({ data: staat.leveranciers }),
    useLeverancierSoorten: () => ({ data: staat.soorten }),
    useLeveranciersVoorVestiging: () => ({ data: [] }),
    useVestigingOpenDagen: () => ({ isOpen: () => true }),
    useArtikelVormen: () => ({ data: staat.vormen }),
    useBordRegelInfo: () => ({ data: new Map() }),
    useBestelAdvies: () => ({ data: { leverdag: null, regels: [] }, isLoading: false, zetOpBord: { mutateAsync: vi.fn() } }),
    useBestelbordMutaties: () => ({
      toevoegen: mut(), zetBesteld: mut(), markeerBesteldRegels: mut(), verwijderen: mut(), herstel: mut(), wijzig: mut(),
      markeerGeleverd: { mutate: staat.markeer, mutateAsync: vi.fn(), isPending: false },
      nietGeleverd: mut(), deelsGeleverd: mut(), terugNaarBesteld: mut(), zetVerwachteLevering: mut(),
      koppelen: mut(), artikelAanmaken: mut(),
    }),
  };
});
vi.mock('@/components/ui/button', async (origineel: <T>() => Promise<T>) => {
  const echt = await origineel<typeof import('@/components/ui/button')>();
  return {
    ...echt,
    Button: (props: { children?: ReactNode; onClick?: () => void }) => {
      staat.knoppen.push(props);
      return createElement(echt.Button, props);
    },
  };
});

function signaal(deel: Partial<BestelSignaal> & Pick<BestelSignaal, 'id' | 'naam'>): BestelSignaal {
  return {
    vestiging: 'Test', aantal: 2, eenheid: 'stuks', notitie: null, status: 'open', bron: 'handmatig',
    created_at: '2026-11-01', besteld_op: null, bestelreferentie: null, besteld_via: null,
    leverancier_id: null, artikel_id: null, artikel_vorm_id: null, verwachte_levering: null,
    geleverd_op: null, geleverd_door: null, levering_status: null, levering_opmerking: null, restant_van: null,
    ...deel,
  };
}

function vorm(id: string, leverancierId: string): ArtikelVorm {
  return {
    id, artikel_id: id, vorm: 'stuks', eenheid: 'stuks', leverancier_id: leverancierId,
    prijs: null, prijs_datum: null, prijs_bron: null, is_standaard: true,
  };
}

function bordHtml() {
  staat.knoppen.length = 0;
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return renderToString(createElement(QueryClientProvider, { client },
    createElement(TooltipProvider, null,
      createElement(MemoryRouter, null, createElement(Bestelbord)))));
}

function tekstVan(knoop: ReactNode): string {
  if (knoop == null || typeof knoop === 'boolean') return '';
  if (typeof knoop === 'string' || typeof knoop === 'number') return String(knoop);
  if (Array.isArray(knoop)) return knoop.map(tekstVan).join('');
  return '';
}

beforeEach(() => {
  staat.vlag = false;
  staat.isManager = false;
  staat.markeer.mockClear();
  staat.vormen = [vorm('vorm-spar', 'lev-spar'), vorm('vorm-mid', 'lev-mid'), vorm('vorm-boer', 'lev-boer')];
  staat.soorten = new Map([['lev-spar', 'winkel'], ['lev-mid', 'intern'], ['lev-boer', 'extern']]);
  staat.leveranciers = new Map([['lev-spar', 'Spar (zelf halen)'], ['lev-mid', 'Midsland (intern)'], ['lev-boer', 'Boer & Chef']]);
  staat.signalen = [
    signaal({ id: 'mysterie', naam: 'Mysterieuze spread' }),
    signaal({ id: 'yoghurt', naam: 'Griekse yoghurt', artikel_id: 'art-yoghurt', artikel_vorm_id: 'vorm-spar' }),
    signaal({ id: 'roomsaus', naam: 'Roomsaus', artikel_id: 'art-room', artikel_vorm_id: 'vorm-mid' }),
    signaal({ id: 'tomaat', naam: 'Cherry tomaat', artikel_id: 'art-tomaat', artikel_vorm_id: 'vorm-boer' }),
  ];
});

describe('bestelbord leverancier kiezen', () => {
  test('vlag uit houdt de kaart Leverancier kiezen en de gewone lijst', () => {
    const html = bordHtml();
    expect(html).toContain('Leverancier kiezen');
    expect(html).not.toContain('Nog koppelen');
    expect(html).not.toContain('Zelf halen');
    expect(html).not.toContain('Intern uit Midsland');
    expect(html).not.toContain('>Gehaald<');
    expect(html).toContain('aria-label="Griekse yoghurt besteld"');
    expect(html).toContain('Boer &amp; Chef');
    expect(html).toContain('Mysterieuze spread');
  });

  test('vlag aan splitst nog koppelen, zelf halen, intern en de gewone groep', () => {
    staat.vlag = true;
    const html = bordHtml();
    expect(html).toContain('Nog koppelen');
    expect(html).toContain('Mysterieuze spread');
    expect(html).not.toContain('Leverancier kiezen');
    const zelf = html.split('Zelf halen')[1]?.split('Intern uit Midsland')[0] ?? '';
    expect(zelf).toContain('Griekse yoghurt');
    expect(zelf).toContain('Spar (zelf halen)');
    expect(zelf).toContain('>Gehaald<');
    expect(zelf).toContain('Alles gehaald');
    expect(zelf).not.toContain('besteld');
    const intern = html.split('Intern uit Midsland')[1]?.split('Per leverancier')[0] ?? '';
    expect(intern).toContain('Roomsaus');
    expect(intern).toContain('Komt op de MEP van Midsland');
    expect(intern).toContain('Midsland (intern)');
    expect(intern).not.toContain('Gehaald');
    expect(intern).not.toContain('besteld');
    expect(html).toContain('Boer &amp; Chef');
    expect(html).toContain('aria-label="Cherry tomaat besteld"');
    expect(html).not.toContain('aria-label="Griekse yoghurt besteld"');
    expect(html).not.toContain('aria-label="Roomsaus besteld"');
  });

  test('twee vrije regels met dezelfde naam tonen Maak artikel', () => {
    staat.vlag = true;
    staat.signalen = [
      signaal({ id: 'a', naam: 'Taugé' }),
      signaal({ id: 'b', naam: 'tauge' }),
      signaal({ id: 'c', naam: 'Melk' }),
    ];
    bordHtml();
    const knoppen = staat.knoppen.filter((k) => tekstVan(k.children) === 'Maak artikel');
    expect(knoppen).toHaveLength(2);
  });

  test('één vrije regel of de koppelflow uit toont geen Maak artikel', () => {
    staat.vlag = true;
    staat.signalen = [signaal({ id: 'a', naam: 'Taugé' })];
    expect(bordHtml()).not.toContain('Maak artikel');
    staat.vlag = false;
    staat.signalen = [signaal({ id: 'a', naam: 'Taugé' }), signaal({ id: 'b', naam: 'tauge' })];
    expect(bordHtml()).not.toContain('Maak artikel');
  });

  test('Gehaald roept markeerGeleverd aan met het regel-id', () => {
    staat.vlag = true;
    bordHtml();
    const knop = staat.knoppen.find((k) => tekstVan(k.children) === 'Gehaald');
    if (!knop?.onClick) throw new Error('knop Gehaald ontbreekt');
    knop.onClick();
    expect(staat.markeer).toHaveBeenCalledWith(['yoghurt'], expect.any(Object));
  });
});

describe('koppelen en nieuw artikel', () => {
  test('koppelen roept eerst de rpc-wrapper aan en daarna wijzig met eenheid_vorm', async () => {
    const koppelen = vi.fn(async () => ({ eenheid_vorm: 'bak' }));
    const wijzig = vi.fn(async () => undefined);
    await koppelAanBestaand({
      test: false, koppelen, wijzig, signaalId: 's1', aantal: 3, artikelId: 'a1', artikelVormId: 'v1',
    });
    expect(koppelen).toHaveBeenCalledWith({ signaalId: 's1', artikelId: 'a1', artikelVormId: 'v1' });
    expect(wijzig).toHaveBeenCalledWith({ id: 's1', aantal: 3, eenheid: 'bak' });
    expect(koppelen.mock.invocationCallOrder[0]).toBeLessThan(wijzig.mock.invocationCallOrder[0]);
    koppelen.mockClear();
    await koppelAanBestaand({ test: true, koppelen, wijzig, signaalId: 's1', aantal: 1, artikelId: 'a', artikelVormId: 'v' });
    expect(koppelen).not.toHaveBeenCalled();
  });

  test('nieuw artikel koppelt met de gekozen eenheid en null voor lege velden', async () => {
    const velden = bouwAanmaakVelden({
      naam: ' Yoghurt ', leverancierId: 'lev', eenheid: 'bak', vorm: '  ', inhoud: '', inhoudEenheid: null,
      artikelnummer: ' ', prijs: '4,50', metPrijs: false,
    });
    if (velden.ok === false) throw new Error(velden.fout);
    expect(velden.velden).toEqual({
      naam: 'Yoghurt', leverancierId: 'lev', eenheid: 'bak', vorm: null, inhoudBasis: null,
      inhoudEenheid: null, artikelnummer: null, prijs: null,
    });
    const aanmaken = vi.fn(async () => ({ artikel_id: 'a9', artikel_vorm_id: 'v9' }));
    const koppelen = vi.fn(async () => undefined);
    const wijzig = vi.fn(async () => undefined);
    await koppelNieuwArtikel({ test: false, aanmaken, koppelen, wijzig, signaalId: 's1', aantal: 2, velden: velden.velden });
    expect(aanmaken).toHaveBeenCalledWith(velden.velden);
    expect(koppelen).toHaveBeenCalledWith({ signaalId: 's1', artikelId: 'a9', artikelVormId: 'v9' });
    expect(wijzig).toHaveBeenCalledWith({ id: 's1', aantal: 2, eenheid: 'bak' });
  });

  test('de knop Koppelen geeft artikel, vorm en leverancier door', () => {
    const onKoppel = vi.fn();
    const suggestie: BordSuggestie = {
      artikel_id: 'a1', naam: 'Yoghurt', leverancier_id: 'lev', score: 1, standaard_eenheid: 'bak', standaard_vorm: 'bak', bron: 'artikel',
      vormen: [{ id: 'v1', artikel_id: 'a1', vorm: 'bak', eenheid: 'bak', leverancier_id: 'lev', leverancier_naam: 'Spar (zelf halen)', prijs: null, prijs_datum: null, prijs_bron: null, is_standaard: true }],
    };
    staat.knoppen.length = 0;
    renderToString(createElement(KoppelPaneel, {
      vestiging: 'Test', beginNaam: 'Yoghurt', leveranciersKeuze: [], isManager: false, zoek: async () => [],
      bereidVormen: (v) => v, startGekozen: suggestie, renderVormKeuze: () => null, renderSoortKeuze: () => null,
      onKoppel, onAanmaken: vi.fn(),
    }));
    const knop = staat.knoppen.find((k) => tekstVan(k.children) === 'Koppelen');
    if (!knop?.onClick) throw new Error('knop Koppelen ontbreekt');
    knop.onClick();
    expect(onKoppel).toHaveBeenCalledWith({
      artikelId: 'a1', artikelVormId: 'v1', leverancierNaam: 'Spar (zelf halen)', artikelNaam: 'Yoghurt',
    });
  });

  test('de knop Aanmaken en koppelen geeft lege velden als null door', () => {
    const onAanmaken = vi.fn();
    staat.knoppen.length = 0;
    renderToString(createElement(KoppelPaneel, {
      vestiging: 'Test', beginNaam: 'Yoghurt', leveranciersKeuze: [{ id: 'lev', naam: 'Spar (zelf halen)', soort: 'winkel' }],
      isManager: false, zoek: async () => [], bereidVormen: (v) => v, startTab: 'nieuw',
      beginNieuw: { leverancierId: 'lev', eenheid: 'bak' },
      renderVormKeuze: () => null, renderSoortKeuze: () => null, onKoppel: vi.fn(), onAanmaken,
    }));
    const knop = staat.knoppen.find((k) => tekstVan(k.children) === 'Aanmaken en koppelen');
    if (!knop?.onClick) throw new Error('knop ontbreekt');
    knop.onClick();
    expect(onAanmaken).toHaveBeenCalledWith({
      naam: 'Yoghurt', leverancierId: 'lev', eenheid: 'bak', vorm: null, inhoudBasis: null,
      inhoudEenheid: null, artikelnummer: null, prijs: null,
    });
  });

  test('het prijsveld is alleen zichtbaar voor een manager', () => {
    const props = {
      vestiging: 'Test', beginNaam: 'Yoghurt', leveranciersKeuze: [], isManager: false, zoek: async () => [] as BordSuggestie[],
      bereidVormen: (v: ArtikelVorm[]) => v, startTab: 'nieuw' as const, renderVormKeuze: () => null, renderSoortKeuze: () => null,
      onKoppel: vi.fn(), onAanmaken: vi.fn(),
    };
    const zonder = renderToString(createElement(KoppelPaneel, props));
    expect(zonder).not.toContain('id="nieuw-prijs"');
    expect(zonder).not.toContain('>Prijs<');
    const met = renderToString(createElement(KoppelPaneel, { ...props, isManager: true }));
    expect(met).toContain('id="nieuw-prijs"');
    expect(met).toContain('>Prijs<');
  });

  test('zoeken wacht 150 ms en een winkel krijgt het label erachter', async () => {
    vi.useFakeTimers();
    const zoek = vi.fn(async () => []);
    const toon = vi.fn();
    planKoppelZoek('yo', 'Test', false, zoek, toon);
    expect(zoek).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(149);
    expect(zoek).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(zoek).toHaveBeenCalledWith('Test', 'yo');
    vi.useRealTimers();
    expect(leverancierKeuzeLabel({ naam: 'Spar', soort: 'winkel' })).toBe('Spar (zelf halen)');
    expect(leverancierKeuzeLabel({ naam: 'Spar (zelf halen)', soort: 'winkel' })).toBe('Spar (zelf halen)');
    expect(leverancierKeuzeLabel({ naam: 'Midsland', soort: 'intern' })).toBe('Midsland (intern)');
    expect(leverancierKeuzeLabel({ naam: 'Boer & Chef', soort: 'extern' })).toBe('Boer & Chef');
  });
});
