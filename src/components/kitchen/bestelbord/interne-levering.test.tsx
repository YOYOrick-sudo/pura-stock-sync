// @ts-expect-error vitest types are not installed in the app tsconfig
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { createElement, Fragment, type ReactNode } from 'react';
import { renderToString } from 'react-dom/server';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { toast } from 'sonner';
import { InternBestellen } from './InternBestellen';
import { InternOnderweg } from './InternOnderweg';
import { AantalStapper } from '@/components/kitchen/AantalStapper';
import { MepVoorWest } from '@/components/kitchen/MepVoorWest';
import {
  inhoudPerEenheid, inhoudTotaal, internBestellenZichtbaar, klemAantal, maxGeleverdAantal, mepDagLang, mepKaartTitel,
  onderwegMenuLabels, onderwegTabAantal, stapperBevestig, stapperTekst, telInterneOnderweg,
  type InterneBestelling, type InterneMepRegel, type InternProduct,
} from '@/hooks/useInterneLevering';

type QueryOpts = { queryKey: readonly unknown[]; enabled?: boolean; queryFn?: () => Promise<unknown> };

const staat = vi.hoisted(() => ({
  vlag: {} as Record<string, boolean>,
  producten: undefined as InternProduct[] | null | undefined,
  bestellingen: undefined as InterneBestelling[] | null | undefined,
  mep: undefined as InterneMepRegel[] | null | undefined,
  knoppen: [] as { children?: ReactNode; onClick?: () => void | Promise<void>; disabled?: boolean; 'aria-label'?: string }[],
  invoeren: [] as { 'aria-label'?: string; onChange?: (e: { target: { value: string } }) => void; onBlur?: () => void }[],
  queries: [] as QueryOpts[],
  rpc: vi.fn(),
}));

function onthoudInvoer(type: unknown, props: unknown) {
  if (type === 'input' && props && typeof props === 'object' && 'onChange' in props) staat.invoeren.push(props as typeof staat.invoeren[number]);
}

vi.mock('react/jsx-runtime', async (origineel: <T>() => Promise<T>) => {
  const runtime = await origineel<typeof import('react/jsx-runtime')>();
  return {
    ...runtime,
    jsx: (type: unknown, props: unknown, key: unknown) => { onthoudInvoer(type, props); return runtime.jsx(type as never, props as never, key as never); },
    jsxs: (type: unknown, props: unknown, key: unknown) => { onthoudInvoer(type, props); return runtime.jsxs(type as never, props as never, key as never); },
  };
});
vi.mock('react/jsx-dev-runtime', async (origineel: <T>() => Promise<T>) => {
  const runtime = await origineel<typeof import('react/jsx-dev-runtime')>();
  return {
    ...runtime,
    jsxDEV: (type: unknown, props: unknown, key: unknown, isStatic: boolean, source: unknown, self: unknown) => {
      onthoudInvoer(type, props);
      return runtime.jsxDEV(type as never, props as never, key as never, isStatic, source as never, self as never);
    },
  };
});
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    rpc: (naam: string, args?: Record<string, unknown>) => staat.rpc(naam, args),
    auth: { getUser: vi.fn(async () => ({ data: { user: null } })) },
    channel: vi.fn(),
    removeChannel: vi.fn(),
  },
}));
vi.mock('@/hooks/useOntvangstV2', async (origineel: <T>() => Promise<T>) => {
  const echt = await origineel<typeof import('@/hooks/useOntvangstV2')>();
  return {
    ...echt,
    useFase2VlagAan: (vestiging: string | null | undefined, vlag: string) =>
      !!vestiging && vlag === 'interne_levering' && staat.vlag[vestiging] === true,
  };
});
vi.mock('@tanstack/react-query', async (origineel: <T>() => Promise<T>) => {
  const query = await origineel<typeof import('@tanstack/react-query')>();
  return {
    ...query,
    useQuery: (opts: QueryOpts) => {
      staat.queries.push(opts);
      const sleutel = String(opts.queryKey?.[0] ?? '');
      const fixture = sleutel === 'interne_producten_lijst' ? staat.producten
        : sleutel === 'interne_bestellingen_lezen' ? staat.bestellingen
        : sleutel === 'interne_mep_lijst' ? staat.mep
        : undefined;
      if (fixture !== undefined) {
        const data = opts.enabled === false ? undefined : fixture;
        return { data, isLoading: false, isPending: data === undefined, isError: false, error: null, refetch: vi.fn(), status: data === undefined ? 'pending' : 'success', fetchStatus: 'idle' };
      }
      return query.useQuery(opts as never);
    },
  };
});
vi.mock('@/components/ui/button', async (origineel: <T>() => Promise<T>) => {
  const echt = await origineel<typeof import('@/components/ui/button')>();
  return {
    ...echt,
    Button: (props: { children?: ReactNode; onClick?: () => void | Promise<void>; disabled?: boolean; 'aria-label'?: string }) => {
      staat.knoppen.push(props);
      return createElement(echt.Button, props);
    },
  };
});
vi.mock('@/components/pura/lijst', async (origineel: <T>() => Promise<T>) => {
  const echt = await origineel<typeof import('@/components/pura/lijst')>();
  return {
    ...echt,
    RijMenu: ({ naam, acties }: { naam: string; acties: { label: string; onClick: () => void }[] }) =>
      createElement('div', { 'aria-label': `Opties ${naam}` }, acties.map((a) => createElement('button', { key: a.label, type: 'button', onClick: a.onClick }, a.label))),
  };
});

const wortel: InternProduct = {
  product_id: '11111111-1111-4111-8111-111111111111',
  naam: 'Wortelspread', van_vestiging: 'Midsland', eenheid: 'bak',
  inhoud_per_eenheid: 3.2, inhoud_eenheid: 'kg', max_per_bestelling: 9,
  open_aantal: 1, volgende_mep_datum: '2026-11-04', volgorde: 1,
};

function bestelling(deel: Partial<InterneBestelling> & Pick<InterneBestelling, 'bestelling_id' | 'naam' | 'status'>): InterneBestelling {
  return {
    product_id: wortel.product_id, van_vestiging: 'Midsland', aantal: 2, eenheid: 'bak',
    mep_datum: '2026-11-04', taak_status: 'open', besteld_op: '2026-11-03T10:00:00Z',
    geleverd_aantal: null, geleverd_op: null, ontvangen_aantal: null, ontvangen_op: null,
    notitie: null, kan_annuleren: false, kan_ontvangen: true,
    ...deel,
  };
}

function mepRegel(deel: Partial<InterneMepRegel> = {}): InterneMepRegel {
  return {
    bestelling_id: '44444444-4444-4444-8444-444444444444', product_id: wortel.product_id,
    naam: 'Wortelspread', naar_vestiging: 'West', aantal: 2, eenheid: 'bak',
    inhoud_per_eenheid: 3.2, inhoud_eenheid: 'kg', mep_datum: '2026-11-04',
    mep_taak_id: '55555555-5555-4555-8555-555555555555', taak_status: 'open', status: 'besteld',
    besteld_op: '2026-11-03T10:00:00Z', geleverd_aantal: null, geleverd_op: null,
    notitie: 'zonder pitten', te_laat: false,
    ...deel,
  };
}

function tekstVan(knoop: ReactNode): string {
  if (knoop == null || typeof knoop === 'boolean') return '';
  if (typeof knoop === 'string' || typeof knoop === 'number') return String(knoop);
  if (Array.isArray(knoop)) return knoop.map(tekstVan).join('');
  if (typeof knoop === 'object' && 'props' in knoop) return tekstVan((knoop as { props: { children?: ReactNode } }).props.children);
  return '';
}

function htmlVan(node: ReactNode) {
  staat.knoppen = [];
  staat.invoeren = [];
  staat.queries = [];
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return renderToString(createElement(QueryClientProvider, { client }, node));
}

async function typEnKlik(invoerLabel: string, knopLabel: string, tekst = '5') {
  const invoer = staat.invoeren.find((i) => i['aria-label'] === invoerLabel);
  if (!invoer?.onChange) throw new Error(`invoer ${invoerLabel} ontbreekt`);
  invoer.onChange({ target: { value: tekst } });
  const knop = staat.knoppen.find((k) => k['aria-label'] === knopLabel);
  if (!knop?.onClick) throw new Error(`knop ${knopLabel} ontbreekt`);
  await knop.onClick();
}

function schermen(aan: boolean) {
  return createElement(Fragment, null,
    createElement(InternBestellen, { vestiging: 'West', aan }),
    createElement(InternOnderweg, { vestiging: 'West', aan }),
    createElement(MepVoorWest, { vestiging: 'Midsland' }),
  );
}

function internQueries(alleenAan = false) {
  return staat.queries.filter((q) => String(q.queryKey[0]).startsWith('interne_') && (!alleenAan || q.enabled !== false));
}

beforeEach(() => {
  staat.vlag = {};
  staat.producten = undefined;
  staat.bestellingen = undefined;
  staat.mep = undefined;
  staat.knoppen = [];
  staat.invoeren = [];
  staat.queries = [];
  staat.rpc.mockReset();
  vi.mocked(toast.success).mockClear();
  vi.mocked(toast.error).mockClear();
});

describe('interne levering achter de schakelaar', () => {
  test('vlag uit: geen kaarten en geen interne rpc', () => {
    staat.producten = [wortel];
    staat.bestellingen = [bestelling({ bestelling_id: 'b1', naam: 'Wortelspread', status: 'geleverd' })];
    staat.mep = [mepRegel({ te_laat: true })];
    const html = htmlVan(schermen(false));
    expect(html).not.toContain('Intern uit Midsland');
    expect(html).not.toContain('Van Midsland');
    expect(html).not.toContain('Voor West');
    expect(html).not.toContain('Wortelspread');
    expect(internQueries(true)).toEqual([]);
    expect(staat.rpc.mock.calls.filter((c) => String(c[0]).startsWith('interne_'))).toEqual([]);
  });

  test('testmodus toont niets', () => {
    expect(internBestellenZichtbaar({ vlagAan: true, test: true })).toBe(false);
    expect(internBestellenZichtbaar({ vlagAan: false, test: false })).toBe(false);
    staat.vlag = { West: true };
    staat.producten = [wortel];
    staat.bestellingen = [bestelling({ bestelling_id: 'b1', naam: 'Wortelspread', status: 'besteld' })];
    const html = htmlVan(createElement(Fragment, null,
      createElement(InternBestellen, { vestiging: 'West', aan: internBestellenZichtbaar({ vlagAan: true, test: true }) }),
      createElement(InternOnderweg, { vestiging: 'West', aan: false }),
      createElement(MepVoorWest, { vestiging: 'Test' }),
    ));
    expect(html).not.toContain('Wortelspread');
    expect(html).not.toContain('Van Midsland');
    expect(html).not.toContain('Voor West');
  });

  test('elke vestiging met vlag en productrijen toont de kaart, een lege lijst niet', () => {
    expect(internBestellenZichtbaar({ vlagAan: true, test: false })).toBe(true);
    staat.producten = [wortel];
    const met = htmlVan(createElement(InternBestellen, { vestiging: 'Midsland', aan: true }));
    expect(met).toContain('Intern uit Midsland');
    expect(met).toContain('Wortelspread');
    staat.producten = [];
    const leeg = htmlVan(createElement(InternBestellen, { vestiging: 'Midsland', aan: true }));
    expect(leeg).not.toContain('Intern uit Midsland');
    expect(leeg).not.toContain('Wortelspread');
  });

  test('West met vlag: Wortelspread, stepper tot het maximum, en dezelfde aanvraagsleutel na een netwerkfout', async () => {
    staat.vlag = { West: true };
    staat.producten = [{ ...wortel, max_per_bestelling: 1 }];
    let html = htmlVan(createElement(InternBestellen, { vestiging: 'West', aan: true }));
    expect(html).toContain('Intern uit Midsland');
    expect(html).toContain('Wortelspread');
    expect(staat.knoppen.find((k) => k['aria-label'] === 'Meer')?.disabled).toBe(true);
    expect(staat.knoppen.find((k) => k['aria-label'] === 'Minder')?.disabled).toBe(true);

    staat.producten = [wortel];
    html = htmlVan(createElement(InternBestellen, { vestiging: 'West', aan: true })).replace(/<!-- -->/g, '');
    expect(html).toContain('Komt op de MEP van Midsland van woensdag 4 nov.');
    expect(html).toContain('3,2 kg per bak');
    expect(html).toContain('1 onderweg');
    expect(html).toContain('>bak<');
    expect(staat.knoppen.find((k) => k['aria-label'] === 'Meer')?.disabled).toBe(false);
    expect(klemAantal(10, 1, 9)).toBe(9);
    expect(klemAantal(0, 1, 9)).toBe(1);

    staat.rpc
      .mockResolvedValueOnce({ data: null, error: { message: 'Failed to fetch', code: '' } })
      .mockResolvedValueOnce({ data: { bestelling_id: 'b1', mep_datum: '2026-11-04', mep_taak_id: 't1', taak_nieuw: true, doel_aantal: 1, eenheid: 'bak', bestond_al: false }, error: null });
    const bestel = staat.knoppen.find((k) => k['aria-label'] === 'Bestellen Wortelspread');
    if (!bestel?.onClick) throw new Error('knop Bestellen ontbreekt');
    await bestel.onClick();
    await bestel.onClick();
    const plaatsingen = staat.rpc.mock.calls.filter((c) => c[0] === 'interne_bestelling_plaatsen');
    expect(plaatsingen).toHaveLength(2);
    expect(plaatsingen[0][1]).toEqual({
      p_product_id: wortel.product_id, p_aantal: 1, p_notitie: null, p_aanvraag_sleutel: plaatsingen[0][1].p_aanvraag_sleutel,
    });
    expect(plaatsingen[0][1].p_aanvraag_sleutel).toEqual(expect.any(String));
    expect(plaatsingen[1][1].p_aanvraag_sleutel).toBe(plaatsingen[0][1].p_aanvraag_sleutel);
    expect(plaatsingen[0][1]).not.toHaveProperty('p_bestel_signaal_id');
    expect(toast.error).toHaveBeenCalledWith('Failed to fetch');
    expect(toast.success).toHaveBeenCalledWith('Wortelspread staat op de MEP van Midsland voor woensdag 4 nov');
  });

  test('Onderweg: Ontvangen schrijft, Annuleren alleen als het nog mag', async () => {
    staat.vlag = { West: true };
    const mee = bestelling({ bestelling_id: '22222222-2222-4222-8222-222222222222', naam: 'Wortelspread', status: 'geleverd', kan_annuleren: false, kan_ontvangen: true, geleverd_aantal: 2 });
    const open = bestelling({ bestelling_id: '33333333-3333-4333-8333-333333333333', naam: 'Hummus', status: 'besteld', kan_annuleren: true, kan_ontvangen: true, aantal: 1 });
    staat.bestellingen = [mee, open];
    const html = htmlVan(createElement(InternOnderweg, { vestiging: 'West', aan: true })).replace(/<!-- -->/g, '');
    expect(html).toContain('Van Midsland');
    const menuVan = (naam: string) => html.split(`aria-label="Opties ${naam}"`)[1]?.split('</div>')[0] ?? '';
    expect(html).toContain('Op de MEP');
    expect(html).toContain('Meegegeven');
    expect(menuVan('Hummus')).toContain('Annuleren');
    expect(menuVan('Hummus')).toContain('Ander aantal ontvangen');
    expect(menuVan('Wortelspread')).not.toContain('Annuleren');
    expect(menuVan('Wortelspread')).toContain('Ander aantal ontvangen');
    expect(onderwegMenuLabels({ kan_ontvangen: true, kan_annuleren: false })).toEqual(['Ander aantal ontvangen']);
    expect(onderwegMenuLabels({ kan_ontvangen: true, kan_annuleren: true })).toEqual(['Ander aantal ontvangen', 'Annuleren']);

    staat.rpc.mockResolvedValue({ data: { bestelling_id: mee.bestelling_id, status: 'ontvangen' }, error: null });
    const ontvangen = staat.knoppen.find((k) => k['aria-label'] === 'Ontvangen Wortelspread');
    if (!ontvangen?.onClick) throw new Error('knop Ontvangen ontbreekt');
    await ontvangen.onClick();
    expect(staat.rpc).toHaveBeenCalledWith('interne_bestelling_ontvangen', {
      p_bestelling_id: mee.bestelling_id, p_aantal: null, p_opmerking: null,
    });
    const annuleren = [...html.matchAll(/<button[^>]*>Annuleren<\/button>/g)];
    expect(annuleren.length).toBe(1);
    expect(staat.rpc).not.toHaveBeenCalledWith('interne_bestelling_annuleren', expect.anything());
  });

  test('Midsland MEP: Voor West met 2 bak, Geleverd en de badge te laat', async () => {
    staat.vlag = { Midsland: true };
    staat.mep = [
      mepRegel({ te_laat: true }),
      mepRegel({ bestelling_id: '66666666-6666-4666-8666-666666666666', naam: 'Gisteren spread', status: 'geleverd', te_laat: false, geleverd_aantal: 2 }),
    ];
    const html = htmlVan(createElement(MepVoorWest, { vestiging: 'Midsland' })).replace(/<!-- -->/g, '');
    expect(html).toContain('Voor West');
    expect(mepKaartTitel([mepRegel()])).toBe('Voor West');
    expect(html).toContain('Wortelspread');
    expect(html).toContain('2 bak · 6,4 kg · wo 4 nov');
    expect(html).toContain('te laat');
    expect(html).toContain('bg-warning/10');
    expect(html).toContain('zonder pitten');
    expect(html).toContain('Meegegeven');
    expect(html).not.toContain('Gisteren spread');
    expect(html).toContain('Ander aantal geleverd');

    staat.mep = [mepRegel({ te_laat: false, notitie: null })];
    const opTijd = htmlVan(createElement(MepVoorWest, { vestiging: 'Midsland' }));
    expect(opTijd).not.toContain('te laat');

    staat.mep = [mepRegel({ te_laat: true })];
    htmlVan(createElement(MepVoorWest, { vestiging: 'Midsland' }));
    staat.rpc.mockResolvedValue({ data: { bestelling_id: '44444444-4444-4444-8444-444444444444', status: 'geleverd', geleverd_aantal: 2, al_gedaan: false }, error: null });
    const knop = staat.knoppen.find((k) => k['aria-label'] === 'Geleverd Wortelspread');
    if (!knop?.onClick) throw new Error('knop Geleverd ontbreekt');
    await knop.onClick();
    expect(staat.rpc).toHaveBeenCalledWith('interne_bestelling_geleverd', {
      p_bestelling_id: '44444444-4444-4444-8444-444444444444', p_aantal: null,
    });
    expect(toast.success).toHaveBeenCalledWith('Wortelspread meegegeven');
  });

  test('MEP-titel volgt naar_vestiging uit de regels', () => {
    expect(mepKaartTitel([{ naar_vestiging: 'Noord', status: 'besteld' }])).toBe('Voor Noord');
    staat.vlag = { Midsland: true };
    staat.mep = [mepRegel({ naar_vestiging: 'Noord' })];
    const html = htmlVan(createElement(MepVoorWest, { vestiging: 'Midsland' }));
    expect(html).toContain('Voor Noord');
    expect(html).not.toContain('Voor West');
  });

  test('stepper laat het veld leeg tijdens het typen en begrenst bij blur', () => {
    expect(stapperTekst('')).toBe('');
    expect(stapperTekst('2a')).toBe('2');
    let tekst = stapperTekst('12');
    tekst = stapperTekst('');
    expect(tekst).toBe('');
    tekst = stapperTekst('3');
    expect(tekst).toBe('3');
    expect(stapperBevestig(tekst, 1, 9)).toBe(3);
    expect(stapperBevestig('', 1, 9)).toBe(1);
    expect(stapperBevestig('15', 1, 9)).toBe(9);
    const gezien: number[] = [];
    renderToString(createElement(AantalStapper, { waarde: 2, min: 1, max: 9, onChange: (n) => gezien.push(n), label: 'Aantal proef' }));
    const invoer = staat.invoeren.find((i) => i['aria-label'] === 'Aantal proef');
    if (!invoer?.onChange || !invoer.onBlur) throw new Error('invoer ontbreekt');
    invoer.onChange({ target: { value: '' } });
    expect(gezien).toEqual([]);
    invoer.onBlur();
    expect(gezien).toEqual([1]);
    invoer.onChange({ target: { value: '15' } });
    expect(gezien.at(-1)).toBe(9);
  });

  test('getypt aantal gaat mee zonder blur bij Bestellen, Ontvangen en Geleverd', async () => {
    staat.vlag = { West: true, Midsland: true };
    staat.producten = [wortel];
    staat.rpc.mockResolvedValue({ data: { bestelling_id: 'b1', mep_datum: '2026-11-04', mep_taak_id: 't1', taak_nieuw: true, doel_aantal: 5, eenheid: 'bak', bestond_al: false, status: 'ontvangen', geleverd_aantal: 5, al_gedaan: false }, error: null });
    htmlVan(createElement(InternBestellen, { vestiging: 'West', aan: true }));
    await typEnKlik('Aantal Wortelspread', 'Bestellen Wortelspread');
    expect(staat.rpc).toHaveBeenCalledWith('interne_bestelling_plaatsen', expect.objectContaining({ p_product_id: wortel.product_id, p_aantal: 5 }));

    const mee = bestelling({ bestelling_id: '22222222-2222-4222-8222-222222222222', naam: 'Wortelspread', status: 'geleverd', kan_ontvangen: true, geleverd_aantal: 2 });
    staat.bestellingen = [mee];
    staat.rpc.mockClear();
    htmlVan(createElement(InternOnderweg, { vestiging: 'West', aan: true, startAnderId: mee.bestelling_id }));
    await typEnKlik('Ontvangen aantal Wortelspread', 'Ontvangen Wortelspread ander aantal');
    expect(staat.rpc).toHaveBeenCalledWith('interne_bestelling_ontvangen', expect.objectContaining({ p_bestelling_id: mee.bestelling_id, p_aantal: 5 }));

    staat.mep = [mepRegel({ aantal: 9 })];
    staat.rpc.mockClear();
    htmlVan(createElement(MepVoorWest, { vestiging: 'Midsland', startAnderId: '44444444-4444-4444-8444-444444444444' }));
    await typEnKlik('Geleverd aantal Wortelspread', 'Geleverd Wortelspread ander aantal');
    expect(staat.rpc).toHaveBeenCalledWith('interne_bestelling_geleverd', expect.objectContaining({ p_bestelling_id: '44444444-4444-4444-8444-444444444444', p_aantal: 5 }));
  });

  test('ander aantal geleverd stopt bij het bestelde aantal', () => {
    expect(maxGeleverdAantal(2)).toBe(2);
    expect(klemAantal(5, 1, maxGeleverdAantal(2))).toBe(2);
    staat.knoppen = [];
    renderToString(createElement(AantalStapper, { waarde: 2, min: 1, max: maxGeleverdAantal(2), eenheid: 'bak', onChange: () => {}, label: 'Geleverd aantal Wortelspread' }));
    expect(staat.knoppen.find((k) => k['aria-label'] === 'Meer')?.disabled).toBe(true);
    staat.knoppen = [];
    renderToString(createElement(AantalStapper, { waarde: 1, min: 1, max: maxGeleverdAantal(2), eenheid: 'bak', onChange: () => {}, label: 'Geleverd aantal Wortelspread' }));
    expect(staat.knoppen.find((k) => k['aria-label'] === 'Meer')?.disabled).toBe(false);
  });

  test.each(['42501', '55000'])('RPC-fout %s verbergt de kaart zonder fouttekst', async (code) => {
    staat.vlag = { West: true, Midsland: true };
    staat.rpc.mockResolvedValue({ data: null, error: { code, message: 'geen toegang' } });
    htmlVan(schermen(true));
    const queries = internQueries(true);
    expect(queries.map((q) => q.queryKey[0]).sort()).toEqual(['interne_bestellingen_lezen', 'interne_mep_lijst', 'interne_producten_lijst']);
    for (const q of queries) {
      if (!q.queryFn) throw new Error('queryFn ontbreekt');
      expect(await q.queryFn()).toBeNull();
    }
    expect(staat.rpc).toHaveBeenCalledWith('interne_producten_lijst', { p_vestiging: 'West' });
    expect(staat.rpc).toHaveBeenCalledWith('interne_bestellingen_lezen', { p_vestiging: 'West', p_dagen: 14 });
    expect(staat.rpc).toHaveBeenCalledWith('interne_mep_lijst', { p_vestiging: 'Midsland' });
    staat.producten = null;
    staat.bestellingen = null;
    staat.mep = null;
    const html = htmlVan(schermen(true));
    expect(html).not.toContain('Intern uit Midsland');
    expect(html).not.toContain('Van Midsland');
    expect(html).not.toContain('Voor West');
    expect(html).not.toContain('geen toegang');
  });

  test('onderweg-teller telt alleen open interne regels als de vlag aan staat', () => {
    const regels = [
      bestelling({ bestelling_id: '1', naam: 'A', status: 'besteld' }),
      bestelling({ bestelling_id: '2', naam: 'B', status: 'geleverd' }),
      bestelling({ bestelling_id: '3', naam: 'C', status: 'ontvangen' }),
      bestelling({ bestelling_id: '4', naam: 'D', status: 'geannuleerd' }),
    ];
    expect(telInterneOnderweg(null)).toBe(0);
    expect(telInterneOnderweg(regels)).toBe(2);
    expect(onderwegTabAantal(4, false, regels)).toBe(4);
    expect(onderwegTabAantal(4, true, regels)).toBe(6);
    expect(mepDagLang('2026-11-04')).toBe('woensdag 4 nov');
    expect(inhoudPerEenheid(3.2, 'kg', 'bak')).toBe('3,2 kg per bak');
    expect(inhoudTotaal(2, 3.2, 'kg')).toBe('6,4 kg');
  });
});
