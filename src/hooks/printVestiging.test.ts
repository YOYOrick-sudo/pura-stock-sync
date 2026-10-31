// @ts-ignore vitest runs from the existing isolated test environment
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import { useCreatePrintJob } from './usePrintJobs';
import { useCreateStickerPrintJob } from './useStickerProducten';

const mocks = vi.hoisted(() => ({
  location: '',
  insert: vi.fn(async (_rows: unknown) => ({ error: null })),
  rpc: vi.fn(async () => ({ error: null })),
  invoke: vi.fn(async () => { throw new Error('Geen functies/netwerk toegestaan in printtests'); }),
  invalidateQueries: vi.fn(),
  recent: vi.fn(async () => ({ data: [] })),
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: (table: string) => {
      if (table !== 'print_jobs') throw new Error(`Onverwachte tabel: ${table}`);
      const read = { eq: () => read, gte: () => read, limit: mocks.recent };
      return { insert: mocks.insert, select: () => read };
    },
    rpc: mocks.rpc,
    functions: { invoke: mocks.invoke },
  },
}));
vi.mock('@/contexts/UserLocationContext', () => ({
  useUserLocation: () => ({ userLocation: mocks.location }),
}));
vi.mock('@/lib/appWake', () => ({ metHerstel: (operation: () => unknown) => operation() }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() } }));
vi.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({ invalidateQueries: mocks.invalidateQueries }),
  useMutation: (options: { mutationFn: (input: unknown) => Promise<unknown> }) => ({
    mutateAsync: options.mutationFn,
    // Return the promise so the source handler's fire-and-forget call can be awaited in tests.
    mutate: options.mutationFn,
  }),
}));

type Scope = Record<string, unknown>;
const root = new URL('../../', import.meta.url);

/** Run the actual source handler, not a hand-copied approximation of its payload.
 * No component rendering or real data mutation: every external dependency is supplied below.
 */
function sourceHandler(file: string, name: string, scope: Scope) {
  const text = readFileSync(new URL(file, root), 'utf8');
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let expression: string | undefined;
  const visit = (node: ts.Node) => {
    if (ts.isVariableDeclaration(node) && node.name.getText(source) === name && node.initializer) {
      expression = node.initializer.getText(source);
    }
    if (ts.isFunctionDeclaration(node) && node.name?.text === name) {
      expression = node.getText(source);
    }
    if (name === 'recipePrint' && ts.isArrowFunction(node) && ts.isBlock(node.body)
      && node.body.getText(source).includes('createPrintJob.mutate(')) {
      expression = node.getText(source);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  if (!expression) throw new Error(`Printhandler ontbreekt: ${file}:${name}`);
  const js = ts.transpileModule(`const handler = (${expression});`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
  }).outputText;
  return new Function(...Object.keys(scope), `${js}\nreturn handler;`)(...Object.values(scope));
}

const noop = () => {};
const datum = () => 'za 31-10';
const toast = { success: noop, error: noop, warning: noop };

async function runChain(chain: string) {
  if (chain === 'recept') {
    const handler = sourceHandler('src/pages/kitchen/RecipeDetail.tsx', 'recipePrint', {
      createPrintJob: useCreatePrintJob(),
      recipe: { id: 'mock-recept', name: 'Mock soep', tht_dagen: 3 },
      printAantal: 2, setPrintOpen: noop, setPrintAantal: noop,
    });
    await handler();
    return;
  }
  const printSticker = useCreateStickerPrintJob();
  if (chain === 'snel_printen') {
    await sourceHandler('src/pages/kitchen/SnelPrinten.tsx', 'handlePrint', {
      createJob: printSticker, naam: 'Mock soep', type: 'bereid', datum1: datum(), datum2: datum(),
      thtDagen: 3, aantal: 2, toast, setNaam: noop, setAantal: noop,
    })();
  } else if (chain === 'mep') {
    await sourceHandler('src/components/kitchen/MepAfrondDialog.tsx', 'bevestig', {
      printSticker, taak: { id: 'mock-taak', titel: 'Mock soep' }, aantal: 2, temperatuur: '',
      setBezig: noop, onAfronden: vi.fn(async () => ({ batch_nummer: 'MOCK' })),
      toast, sticker: true, stickerNaam: 'Mock soep', stickerType: 'bereid',
      thtDagen: 3, stickerAantal: 2, fmtDatum: datum,
      addDays: (d: Date, n: number) => new Date(d.getTime() + n * 86400000), onOpenChange: noop,
    })();
  } else if (chain === 'bain_marie') {
    const { supabase } = await import('@/integrations/supabase/client');
    const { buildStickerOmschrijving } = await import('@/lib/labelZpl');
    const hook = sourceHandler('src/components/foh/BainMarie.tsx', 'useBainSticker', {
      useCreateStickerPrintJob: () => printSticker,
      useRef: (current: unknown) => ({ current }), useState: () => [null, noop],
      korteDatum: datum, plusDagen: () => '2026-11-02', buildStickerOmschrijving,
      supabase, window: { setTimeout: vi.fn() },
    });
    const result = await hook().print('mock-product', 'Mock soep', '2026-10-31', 3);
    expect(result).toBe(true);
  } else {
    const file = chain === 'voorraadronde'
      ? 'src/components/foh/VoorraadRonde.tsx' : 'src/components/foh/KoelcelCheckBlok.tsx';
    await sourceHandler(file, 'printOntdooid', { printSticker, stickerDatum: datum, toast })({ naam: 'Mock soep' }, 2);
  }
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.location = '';
});

describe.each(['snel_printen', 'recept', 'mep', 'bain_marie', 'voorraadronde', 'koelcelcheck'])('%s printketen', (chain: string) => {
  test.each(['West', 'Midsland', 'Test', ''])('insert gebruikt actieve vestiging %j, onbekend blijft null', async (location: string) => {
    mocks.location = location;
    await runChain(chain);
    expect(mocks.insert).toHaveBeenCalledTimes(1);
    const rows = mocks.insert.mock.calls[0]?.[0] as Array<Record<string, unknown>>;
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(Object.hasOwn(row, 'vestiging')).toBe(true);
      expect(row.vestiging).toBe(location || null);
      expect(row.bron).toBe(chain === 'voorraadronde' || chain === 'koelcelcheck' ? 'koelcel_check' : chain);
    }
    expect(mocks.invoke).not.toHaveBeenCalled();
    expect(mocks.rpc.mock.calls.length).toBe(chain === 'bain_marie' || chain === 'recept' ? 0 : 1);
  });
});

describe('alle exemplaren hebben de actieve vestiging', () => {
  test.each(['recept', 'snel_printen'])('%s: ook het tweede exemplaar heeft Test, nooit null', async (chain: string) => {
    mocks.location = 'Test';
    await runChain(chain);
    expect(mocks.insert).toHaveBeenCalledWith([
      expect.objectContaining({ vestiging: 'Test' }),
      expect.objectContaining({ vestiging: 'Test' }),
    ]);
  });
});