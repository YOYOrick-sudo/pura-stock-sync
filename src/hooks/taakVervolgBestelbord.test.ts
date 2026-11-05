// @ts-ignore bun test runner
import { beforeEach, expect, mock, test } from 'bun:test';
import type { KoelcelCheckItem } from './useKoelcelCheck';

type Rij = Record<string, unknown>;

const inserts: { tabel: string; rij: Rij }[] = [];
const updates: { tabel: string; rij: Rij }[] = [];
const wachtrij = new Map<string, Array<{ data?: unknown; error?: unknown }>>();

function antwoord(tabel: string) {
  return wachtrij.get(tabel)?.shift() ?? { data: null, error: null };
}

function keten(tabel: string) {
  const b: Record<string, unknown> = {};
  const zelf = () => b;
  b.select = zelf;
  b.eq = zelf;
  b.in = zelf;
  b.ilike = zelf;
  b.limit = zelf;
  b.insert = (rij: Rij) => {
    inserts.push({ tabel, rij });
    return b;
  };
  b.update = (rij: Rij) => {
    updates.push({ tabel, rij });
    return b;
  };
  b.upsert = () => b;
  b.single = () => Promise.resolve(antwoord(tabel));
  b.then = (ok: (v: unknown) => unknown, fout?: (e: unknown) => unknown) => Promise.resolve(antwoord(tabel)).then(ok, fout);
  return b;
}

mock.module('@/integrations/supabase/client', () => ({
  supabase: {
    from: (tabel: string) => keten(tabel),
    auth: { getUser: async () => ({ data: { user: { id: 'user-1' } } }) },
    rpc: async () => ({ data: null, error: null }),
  },
}));
mock.module('@/lib/appWake', () => ({ metHerstel: (fn: () => unknown) => fn() }));
mock.module('@/hooks/useInterneLevering', () => ({
  useInternePlaatsen: () => ({ mutateAsync: async () => ({}) }),
}));
mock.module('@tanstack/react-query', () => ({
  useQuery: () => ({ data: [] }),
  useQueryClient: () => ({ invalidateQueries() {}, setQueryData() {} }),
  useMutation: () => ({ mutateAsync: async () => ({}), isPending: false }),
}));

const { useTaakVervolg } = await import('./useTaakVervolg');

const falafel: KoelcelCheckItem = {
  id: 'falafel-1',
  vestiging: 'West',
  naam: 'Falafel',
  doel_aantal: 1,
  doel_aantal_druk: null,
  eenheid: 'bak',
  type: 'koelcel',
  plek: 'werkbank',
  bron: 'vriezer',
  bak_maat: null,
  volgorde: 1,
  actief: true,
  product_sleutel: 'falafel',
};

function bestel() {
  return useTaakVervolg('West', '2026-11-05', true).bestelbord;
}

beforeEach(() => {
  inserts.length = 0;
  updates.length = 0;
  wachtrij.clear();
});

test('zonder open regel komt er een bordregel met dezelfde velden als de sluitlijst', async () => {
  wachtrij.set('bestel_signalen', [{ data: [], error: null }, { error: null }]);
  wachtrij.set('koelcel_checks', [{ error: null }]);
  const uit = await bestel()(falafel);
  expect(uit).toMatchObject({ dubbel: false, aantal: 1 });
  expect(inserts).toHaveLength(1);
  expect(inserts[0].tabel).toBe('bestel_signalen');
  expect(Object.keys(inserts[0].rij).sort()).toEqual(
    ['aantal', 'bron', 'eenheid', 'gemeld_door', 'naam', 'notitie', 'vestiging'],
  );
  expect(inserts[0].rij).toEqual({
    vestiging: 'West',
    naam: 'Falafel',
    aantal: 1,
    eenheid: 'bak',
    notitie: 'Vanuit de sluitlijst',
    bron: 'sluitlijst',
    gemeld_door: 'user-1',
  });
  expect(updates).toEqual([]);
});

test('een open regel voor hetzelfde product en dezelfde vestiging wordt bijgewerkt, niet verdubbeld', async () => {
  wachtrij.set('bestel_signalen', [
    { data: [{ id: 'sig-1', aantal: 4 }], error: null },
    { error: null },
  ]);
  wachtrij.set('koelcel_checks', [{ error: null }]);
  const uit = await bestel()(falafel);
  expect(uit).toMatchObject({ dubbel: true, aantal: 1 });
  expect(inserts).toEqual([]);
  expect(updates).toEqual([
    { tabel: 'bestel_signalen', rij: { aantal: 1, eenheid: 'bak', notitie: 'Vanuit de sluitlijst' } },
  ]);
});

test('een open regel met hetzelfde aantal blijft staan', async () => {
  wachtrij.set('bestel_signalen', [{ data: [{ id: 'sig-1', aantal: 1 }], error: null }]);
  wachtrij.set('koelcel_checks', [{ error: null }]);
  const uit = await bestel()(falafel);
  expect(uit).toMatchObject({ dubbel: true, aantal: 1 });
  expect(inserts).toEqual([]);
  expect(updates).toEqual([]);
});
