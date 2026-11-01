// @ts-ignore vitest runs in the isolated test environment
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient, QueryObserver, useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { amsterdamDatum } from '@/lib/voorraadproef';
import { useOpenTelvragen, useVoorraadproef, voorraadRetry } from './useVoorraadproef';

const mocks = vi.hoisted(() => ({ invalidateQueries: vi.fn(), from: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: mocks.from } }));
vi.mock('@tanstack/react-query', async (original: <T>() => Promise<T>) => ({
  ...await original<typeof import('@tanstack/react-query')>(),
  useQuery: vi.fn(), useMutation: vi.fn(),
  useQueryClient: () => ({ invalidateQueries: mocks.invalidateQueries }),
}));

function opties() {
  const call = vi.mocked(useQuery).mock.calls.at(-1);
  if (!call) throw new Error('Geen query aangemaakt');
  return call[0];
}

beforeEach(() => vi.clearAllMocks());

describe('voorraad retry', () => {
  it.each([
    { code: '57014' }, { message: 'statement timeout' },
    { message: 'canceling statement due to statement timeout' },
    { status: 500 }, { status: 503 }, { statusCode: 502 },
  ])('herhaalt timeout/serverfout %j niet', (error) => {
    expect(voorraadRetry(0, error)).toBe(false);
  });
  it('herhaalt andere fouten maximaal eenmaal', () => {
    expect(voorraadRetry(0, { code: '42501' })).toBe(true);
    expect(voorraadRetry(1, { code: '42501' })).toBe(false);
    expect(voorraadRetry(2, new Error('Offline'))).toBe(false);
  });
});

describe('voorraad ophalen', () => {
  it('voert bij actief=false geen query uit', async () => {
    useVoorraadproef('Midsland', false);
    const options = opties();
    expect(options.enabled).toBe(false);
    expect(options.refetchInterval).toBe(false);
    const client = new QueryClient();
    const observer = new QueryObserver(client, options);
    const unsubscribe = observer.subscribe(() => {});
    await Promise.resolve();
    expect(observer.getCurrentResult().fetchStatus).toBe('idle');
    expect(supabase.from).not.toHaveBeenCalled();
    unsubscribe(); client.clear();
  });
  it('is standaard actief, maar stopt automatische herhaling na een fout', () => {
    useVoorraadproef('West');
    const options = opties();
    expect(options.enabled).toBe(true);
    expect(options.retry).toBe(voorraadRetry);
    expect(options.refetchOnWindowFocus).toBe(false);
    expect(options.retryOnMount).toBe(false);
    if (typeof options.refetchInterval !== 'function') throw new Error('Intervalfunctie verwacht');
    expect(options.refetchInterval({ state: { status: 'success' } } as Parameters<typeof options.refetchInterval>[0])).toBe(60_000);
    expect(options.refetchInterval({ state: { status: 'error' } } as Parameters<typeof options.refetchInterval>[0])).toBe(false);
  });
  it.each([['', true], ['West', false]])('lichte telling uit voor %s / %s', (vestiging, actief) => {
    useOpenTelvragen(vestiging, actief);
    expect(opties().enabled).toBe(false);
  });
  it('telt alleen open telvragen van vandaag en actieve artikelen in de vestiging', async () => {
    const query = { select: vi.fn(), eq: vi.fn() };
    query.select.mockReturnValue(query);
    query.eq.mockReturnValueOnce(query).mockReturnValueOnce(query).mockReturnValueOnce(query)
      .mockResolvedValueOnce({ count: 3, error: null, status: 200 });
    mocks.from.mockReturnValue(query);
    useOpenTelvragen('Midsland');
    const options = opties();
    expect(options.queryKey).toEqual(['voorraadproef-open', 'Midsland']);
    expect(options.refetchInterval).toBe(60_000);
    expect(options.retry).toBe(voorraadRetry);
    if (typeof options.queryFn !== 'function') throw new Error('Queryfunctie verwacht');
    expect(await options.queryFn({} as Parameters<typeof options.queryFn>[0])).toBe(3);
    expect(mocks.from).toHaveBeenCalledWith('voorraad_telvraag');
    expect(query.select).toHaveBeenCalledWith('voorraad_artikel!inner(actief)', { count: 'exact', head: true });
    expect(query.eq.mock.calls).toEqual([
      ['vestiging', 'Midsland'], ['datum', amsterdamDatum()], ['status', 'open'], ['voorraad_artikel.actief', true],
    ]);
  });
  it('invalideert na opslaan zowel stand als lichte telling', async () => {
    useVoorraadproef('West');
    const options = vi.mocked(useMutation).mock.calls.at(-1)?.[0];
    if (!options?.onSuccess) throw new Error('Opslaan-callback ontbreekt');
    await options.onSuccess(undefined, undefined, undefined);
    expect(mocks.invalidateQueries.mock.calls).toEqual([
      [{ queryKey: ['voorraadproef', 'West'] }], [{ queryKey: ['voorraadproef-open', 'West'] }],
    ]);
  });
});