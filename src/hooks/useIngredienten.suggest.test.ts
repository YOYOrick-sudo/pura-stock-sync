import { beforeEach, describe, expect, test, vi } from 'vitest';
import { useIngredientSuggestions } from './useIngredienten';

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  queries: [] as { queryKey?: unknown; enabled?: boolean; queryFn?: () => Promise<unknown> }[],
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: { rpc: mocks.rpc },
}));

vi.mock('@tanstack/react-query', async (origineel: <T>() => Promise<T>) => {
  const query = await origineel<typeof import('@tanstack/react-query')>();
  return {
    ...query,
    useQuery: (opts: { queryKey?: unknown; enabled?: boolean; queryFn?: () => Promise<unknown> }) => {
      mocks.queries.push(opts);
      return { data: undefined, isFetching: false };
    },
  };
});

beforeEach(() => {
  mocks.rpc.mockReset();
  mocks.queries.length = 0;
});

describe('ingredient suggesties', () => {
  test('vraagt rpc_ingredient_suggesties en geeft de rijen ongewijzigd terug', async () => {
    useIngredientSuggestions('  Taugé ');
    const opties = mocks.queries.at(-1);
    expect(opties?.queryKey).toEqual(['ingredienten', 'suggest', 'Taugé']);
    expect(opties?.enabled).toBe(true);
    const rijen = [{ id: '1', naam: 'Taugé' }, { id: '2', naam: 'Taugé vers' }];
    mocks.rpc.mockResolvedValue({ data: rijen, error: null });
    await expect(opties?.queryFn?.()).resolves.toEqual(rijen);
    expect(mocks.rpc).toHaveBeenCalledWith('rpc_ingredient_suggesties', { p_tekst: 'Taugé', p_limit: 15 });
  });

  test('onder twee letters wordt niet gezocht', () => {
    useIngredientSuggestions(' t ');
    expect(mocks.queries.at(-1)).toMatchObject({ enabled: false });
  });
});
