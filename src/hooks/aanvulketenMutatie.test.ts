// @ts-ignore bun test runner
import { beforeEach, expect, mock, test } from 'bun:test';
import type { KoelcelCheckItem } from './useKoelcelCheck';

type Rij = Record<string, unknown>;

const inserts: { tabel: string; rij: Rij }[] = [];
const upserts: { tabel: string; rij: Rij }[] = [];
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
  b.update = zelf;
  b.insert = (rij: Rij) => {
    inserts.push({ tabel, rij });
    return b;
  };
  b.upsert = (rij: Rij) => {
    upserts.push({ tabel, rij });
    return b;
  };
  b.single = () => Promise.resolve(antwoord(tabel));
  b.then = (ok: (v: unknown) => unknown, fout?: (e: unknown) => unknown) => Promise.resolve(antwoord(tabel)).then(ok, fout);
  return b;
}

const supabase = {
  from: (tabel: string) => keten(tabel),
  auth: { getUser: async () => ({ data: { user: { id: 'user-1' } } }) },
};

mock.module('@/integrations/supabase/client', () => ({ supabase }));
mock.module('@/lib/appWake', () => ({ metHerstel: (fn: () => unknown) => fn() }));
mock.module('@/lib/realtime', () => ({ useKanaalHerstel: () => () => {} }));
mock.module('@tanstack/react-query', () => ({
  useQuery: () => ({}),
  useQueryClient: () => ({
    invalidateQueries() {},
    cancelQueries: async () => {},
    getQueryData: () => undefined,
    setQueryData() {},
  }),
  useMutation: (opties: { retry?: boolean; mutationFn: (input: unknown) => Promise<unknown> }) => ({
    mutateAsync: opties.mutationFn,
    retry: opties.retry,
  }),
}));

const { useKoelcelCheckMutaties } = await import('./useKoelcelCheck');

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
  vulnorm: 'half',
};

function haak() {
  return useKoelcelCheckMutaties('West', '2026-11-05', [falafel]) as unknown as {
    ontdooiDirect: { retry?: boolean; mutateAsync: (input: unknown) => Promise<unknown> };
    bestelUitSluitlijst: { retry?: boolean; mutateAsync: (input: unknown) => Promise<unknown> };
  };
}

beforeEach(() => {
  inserts.length = 0;
  upserts.length = 0;
  wachtrij.clear();
});

test('ontdooien en bestellen hebben geen automatische nieuwe poging', () => {
  const api = haak();
  expect(api.ontdooiDirect.retry).toBe(false);
  expect(api.bestelUitSluitlijst.retry).toBe(false);
});

test('ontdooien maakt een MEP-taak Ontdooien en vinkt de regel door', async () => {
  wachtrij.set('mep_taken', [
    { data: [], error: null },
    { data: [], error: null },
    { data: { id: 'mep-9' }, error: null },
  ]);
  wachtrij.set('koelcel_checks', [{ error: null }]);
  const uit = await haak().ontdooiDirect.mutateAsync({ item: falafel, taakDatum: '2026-11-06' });
  expect(uit).toMatchObject({ dubbel: false, aantal: 1 });
  expect(inserts.map((r) => r.tabel)).toEqual(['mep_taken']);
  expect(inserts[0].rij).toMatchObject({
    vestiging: 'West',
    titel: 'Falafel',
    handeling: 'Ontdooien',
    doel_aantal: 1,
    doel_eenheid: 'bak',
    taak_datum: '2026-11-06',
    notitie: 'Ontdooien uit de vriezer voor de volgende service',
  });
  expect(upserts[0]).toMatchObject({
    tabel: 'koelcel_checks',
    rij: { item_id: 'falafel-1', status: 'naar_mep', doorgezet_naar: 'mep', mep_taak_id: 'mep-9' },
  });
});

test('een open ontdooitaak wordt niet nog een keer aangemaakt', async () => {
  wachtrij.set('mep_taken', [{ data: [{ id: 'mep-1', prioriteit: 2 }], error: null }]);
  wachtrij.set('koelcel_checks', [{ error: null }]);
  const uit = await haak().ontdooiDirect.mutateAsync({ item: falafel, taakDatum: '2026-11-06' });
  expect(uit).toMatchObject({ dubbel: true });
  expect(inserts).toEqual([]);
  expect(upserts[0].rij).toMatchObject({ mep_taak_id: 'mep-1', doorgezet_naar: 'mep' });
});

test('vriezer onvoldoende schrijft een bestelsignaal met de bestaande velden', async () => {
  wachtrij.set('bestel_signalen', [{ data: [], error: null }, { error: null }]);
  wachtrij.set('koelcel_checks', [{ error: null }]);
  const uit = await haak().bestelUitSluitlijst.mutateAsync({ item: falafel });
  expect(uit).toMatchObject({ dubbel: false, aantal: 1 });
  expect(Object.keys(inserts[0].rij).sort()).toEqual(
    ['aantal', 'bron', 'eenheid', 'gemeld_door', 'naam', 'notitie', 'vestiging'],
  );
  expect(inserts[0].rij).toEqual({
    vestiging: 'West',
    naam: 'Falafel',
    aantal: 1,
    eenheid: 'bak',
    notitie: 'Vriezer onvoldoende bij sluiten',
    bron: 'sluitlijst',
    gemeld_door: 'user-1',
  });
  expect(upserts[0].rij).toMatchObject({ status: 'gemeld', doorgezet_naar: 'bestelbord', aantal_doorgezet: 1 });
});

test('een open bestelsignaal voor falafel wordt bijgewerkt, niet verdubbeld', async () => {
  wachtrij.set('bestel_signalen', [
    { data: [{ id: 'sig-1', aantal: 2 }], error: null },
    { error: null },
  ]);
  wachtrij.set('koelcel_checks', [{ error: null }]);
  const uit = await haak().bestelUitSluitlijst.mutateAsync({ item: falafel });
  expect(uit).toMatchObject({ dubbel: true, aantal: 1 });
  expect(inserts).toEqual([]);
});
