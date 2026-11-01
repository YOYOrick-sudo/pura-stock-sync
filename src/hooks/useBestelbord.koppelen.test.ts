import { beforeEach, describe, expect, test, vi } from 'vitest';
import { useBestelbordMutaties, useLeverancierSoorten, useLeveranciersVoorVestiging } from './useBestelbord';

const mocks = vi.hoisted(() => ({
  invalidate: vi.fn(),
  rpc: vi.fn(),
  from: vi.fn(),
  mutaties: [] as { mutationFn?: (v: never) => Promise<unknown>; onSettled?: () => void }[],
  queries: [] as { queryKey?: unknown; queryFn?: () => Promise<unknown> }[],
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { rpc: mocks.rpc, from: mocks.from, auth: { getUser: vi.fn() } },
}));
vi.mock('@tanstack/react-query', async (origineel: <T>() => Promise<T>) => {
  const query = await origineel<typeof import('@tanstack/react-query')>();
  return {
    ...query,
    useQueryClient: () => ({ invalidateQueries: mocks.invalidate }),
    useMutation: (opts: { mutationFn?: (v: never) => Promise<unknown>; onSettled?: () => void }) => {
      mocks.mutaties.push(opts);
      return { mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false };
    },
    useQuery: (opts: { queryKey?: unknown; queryFn?: () => Promise<unknown> }) => {
      mocks.queries.push(opts);
      return { data: undefined };
    },
  };
});

function keten(data: unknown) {
  const klaar = Promise.resolve({ data, error: null });
  const b: {
    select: ReturnType<typeof vi.fn>;
    eq: ReturnType<typeof vi.fn>;
    is: ReturnType<typeof vi.fn>;
    then: Promise<{ data: unknown; error: null }>['then'];
  } = {
    select: vi.fn(),
    eq: vi.fn(),
    is: vi.fn(),
    then: klaar.then.bind(klaar),
  };
  b.select.mockReturnValue(b);
  b.eq.mockReturnValue(b);
  b.is.mockReturnValue(b);
  return b;
}

beforeEach(() => {
  mocks.invalidate.mockClear();
  mocks.rpc.mockReset();
  mocks.from.mockReset();
  mocks.mutaties.length = 0;
  mocks.queries.length = 0;
});

describe('bord koppelen en artikel aanmaken', () => {
  test('koppelen roept bord_regel_koppelen aan met de drie p_-parameters', async () => {
    useBestelbordMutaties('Test');
    const opties = mocks.mutaties.find((m) => m.mutationFn?.toString().includes('bord_regel_koppelen'));
    if (!opties?.mutationFn) throw new Error('koppelen ontbreekt');
    mocks.rpc.mockResolvedValue({ data: { eenheid_vorm: 'bak', artikel_id: 'a', artikel_vorm_id: 'v' }, error: null });
    await opties.mutationFn({ signaalId: 's1', artikelId: 'a1', artikelVormId: 'v1' } as never);
    expect(mocks.rpc).toHaveBeenCalledWith('bord_regel_koppelen', {
      p_signaal_id: 's1', p_artikel_id: 'a1', p_artikel_vorm_id: 'v1',
    });
    mocks.invalidate.mockClear();
    opties.onSettled?.();
    expect(mocks.invalidate.mock.calls).toEqual([
      [{ queryKey: ['bestel-signalen', 'Test'] }],
      [{ queryKey: ['artikel-vormen', 'Test'] }],
    ]);
  });

  test('artikel aanmaken stuurt exact 9 parameters en null voor lege velden', async () => {
    useBestelbordMutaties('West');
    const opties = mocks.mutaties.find((m) => m.mutationFn?.toString().includes('bord_artikel_aanmaken'));
    if (!opties?.mutationFn) throw new Error('artikelAanmaken ontbreekt');
    mocks.rpc.mockResolvedValue({ data: { artikel_id: 'a', artikel_vorm_id: 'v' }, error: null });
    await opties.mutationFn({ naam: 'Yoghurt', leverancierId: 'lev', eenheid: 'bak' } as never);
    expect(mocks.rpc).toHaveBeenCalledWith('bord_artikel_aanmaken', {
      p_vestiging: 'West',
      p_naam: 'Yoghurt',
      p_leverancier_id: 'lev',
      p_eenheid: 'bak',
      p_vorm: null,
      p_inhoud_basis: null,
      p_inhoud_eenheid: null,
      p_artikelnummer: null,
      p_prijs: null,
    });
    mocks.rpc.mockResolvedValueOnce({ data: null, error: { message: 'Alleen een manager mag een prijs invullen' } });
    await expect(opties.mutationFn({ naam: 'Yoghurt', leverancierId: 'lev', eenheid: 'bak', prijs: 2 } as never)).rejects.toMatchObject({
      message: 'Alleen een manager mag een prijs invullen',
    });
    mocks.invalidate.mockClear();
    opties.onSettled?.();
    expect(mocks.invalidate.mock.calls).toEqual([
      [{ queryKey: ['bestel-signalen', 'West'] }],
      [{ queryKey: ['artikel-vormen', 'West'] }],
    ]);
  });
});

describe('leverancierssoort en vestiging', () => {
  test('soorten komen uit id en soort, zonder verwijderde rijen', async () => {
    useLeverancierSoorten();
    const opties = mocks.queries.at(-1);
    expect(opties?.queryKey).toEqual(['leveranciers-soort']);
    const b = keten([
      { id: 'a', soort: 'extern' },
      { id: 'b', soort: 'winkel' },
      { id: 'c', soort: 'intern' },
      { id: 'd', soort: 'iets-anders' },
    ]);
    mocks.from.mockReturnValue(b);
    expect(await opties?.queryFn?.()).toEqual(new Map([['a', 'extern'], ['b', 'winkel'], ['c', 'intern'], ['d', 'extern']]));
    expect(mocks.from).toHaveBeenCalledWith('leveranciers');
    expect(b.select).toHaveBeenCalledWith('id, soort');
    expect(b.is).toHaveBeenCalledWith('deleted_at', null);
  });

  test('ontbrekende soort-kolom geeft een lege kaart, dus iedereen telt als extern', async () => {
    useLeverancierSoorten();
    const opties = mocks.queries.at(-1);
    const klaar = Promise.resolve({ data: null, error: { code: '42703', message: 'column leveranciers.soort does not exist' } });
    const b = { select: vi.fn(), is: vi.fn(), then: klaar.then.bind(klaar) };
    b.select.mockReturnValue(b);
    b.is.mockReturnValue(b);
    mocks.from.mockReturnValue(b);
    expect(await opties?.queryFn?.()).toEqual(new Map());
  });

  test('vestigingslijst leest geen klantnummer en sorteert extern, winkel, intern', async () => {
    useLeveranciersVoorVestiging('West');
    const opties = mocks.queries.at(-1);
    expect(opties?.queryKey).toEqual(['leveranciers-voor-vestiging', 'West']);
    const b = keten([
      { leveranciers: { id: 'i', naam: 'Midsland (intern)', soort: 'intern', actief: true, deleted_at: null } },
      { leveranciers: { id: 'w', naam: 'Spar (zelf halen)', soort: 'winkel', actief: true, deleted_at: null } },
      { leveranciers: { id: 'e2', naam: 'Zuid', soort: 'extern', actief: true, deleted_at: null } },
      { leveranciers: { id: 'e1', naam: 'Boer & Chef', soort: 'extern', actief: true, deleted_at: null } },
      { leveranciers: { id: 'uit', naam: 'Oud', soort: 'extern', actief: false, deleted_at: null } },
      { leveranciers: { id: 'weg', naam: 'Weg', soort: 'winkel', actief: true, deleted_at: '2026-01-01' } },
    ]);
    mocks.from.mockReturnValue(b);
    const lijst = await opties?.queryFn?.() as { id: string }[];
    expect(lijst.map((l) => l.id)).toEqual(['e1', 'e2', 'w', 'i']);
    expect(mocks.from).toHaveBeenCalledWith('leverancier_vestiging_config');
    const select = String(b.select.mock.calls[0][0]);
    expect(select).toContain('leverancier_id, vestiging, actief, deleted_at');
    expect(select).not.toMatch(/klantnummer|portal_login|api_sleutel/);
    expect(b.eq.mock.calls).toEqual([['vestiging', 'West'], ['actief', true]]);
    expect(b.is).toHaveBeenCalledWith('deleted_at', null);
  });

  test('zonder vestiging wordt de lijst niet opgehaald', () => {
    useLeveranciersVoorVestiging(null);
    expect(mocks.queries.at(-1)).toMatchObject({ enabled: false });
  });
});
