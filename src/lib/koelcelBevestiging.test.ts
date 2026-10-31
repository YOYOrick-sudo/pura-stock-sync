// @ts-ignore bun test runner
import { expect, mock, test } from 'bun:test';
// @ts-ignore node test API is outside the browser app types
import { readFileSync } from 'node:fs';
import ts from 'typescript';
import type { KoelcelCheckItem } from '@/hooks/useKoelcelCheck';

mock.module('@/integrations/supabase/client', () => ({
  supabase: new Proxy({}, { get() { throw new Error('Geen echte database in deze tests'); } }),
}));
const { vraagtKoelcelBevestiging } = await import('./koelcelBevestiging');
const { diepsteBron } = await import('@/hooks/useKoelcelCheck');

const werkbank: KoelcelCheckItem = {
  id: 'werkbank', vestiging: 'West', naam: 'Blauwe bessen',
  doel_aantal: 1, doel_aantal_druk: null, eenheid: 'bak', type: 'koelcel',
  plek: 'werkbank', bron: 'koelcel_inkoop', product_sleutel: 'blauwe-bessen',
  bak_maat: null, volgorde: 1, actief: true,
};
const koelcel: KoelcelCheckItem = { ...werkbank, id: 'koelcel', plek: 'koelcel' };
const items = [werkbank, koelcel];

/** Execute the actual component handlers with injected mocks, never real mutations. */
function handler(name: string, scope: Record<string, unknown>) {
  const text = readFileSync(new URL('../components/foh/AfvinkRonde.tsx', import.meta.url), 'utf8');
  const source = ts.createSourceFile('AfvinkRonde.tsx', text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let expression = '';
  const visit = (node: ts.Node) => {
    if (ts.isVariableDeclaration(node) && node.name.getText(source) === name && node.initializer) {
      expression = node.initializer.getText(source);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  if (!expression) throw new Error(`Ontbrekende handler ${name}`);
  const code = ts.transpileModule(`const action = (${expression});`, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.None },
  }).outputText;
  return new Function(...Object.keys(scope), `${code}; const ${name} = action; return action;`)(...Object.values(scope));
}

test('werkbank vereist koelcelcontrole, koelcel zelf en andere producten niet', () => {
  expect(vraagtKoelcelBevestiging(werkbank, items)).toBe(true);
  expect(vraagtKoelcelBevestiging(koelcel, items)).toBe(false);
  expect(vraagtKoelcelBevestiging({ ...werkbank, product_sleutel: 'anders' }, items)).toBe(false);
  expect(vraagtKoelcelBevestiging(werkbank, [werkbank])).toBe(false);
});

test('bijbestellen opent alleen de keuze; annuleren maakt geen bestelling', () => {
  const keuze = mock();
  const mutateAsync = mock();
  const op = handler('op', { items, vraagtKoelcelBevestiging, setKoelcelKeuze: keuze,
    metStatus: mock(), bronOp: { mutateAsync } });
  op(werkbank);
  expect(keuze).toHaveBeenCalledWith(werkbank);
  expect(mutateAsync).not.toHaveBeenCalled();
});

test('aanvullen gebruikt alleen de bestaande afvinkmutatie', async () => {
  const mutateAsync = mock(async () => undefined);
  const vink = handler('vink', { checks: new Map(), zetStatus: { mutateAsync },
    metStatus: (_id: string, action: () => unknown) => action() });
  await vink(werkbank);
  expect(mutateAsync).toHaveBeenCalledTimes(1);
  expect(mutateAsync).toHaveBeenCalledWith({ item: werkbank, status: 'aanwezig', uit: false });
});

test('expliciet lege koelcel gebruikt bestaande bestelactie en bewaart toestemming bij retry', async () => {
  const mutateAsync = mock(async () => ({ bronItem: koelcel, bestemming: { soort: 'bestelbord' } }));
  const keuze = mock();
  let retry: (() => void) | undefined;
  const op = handler('op', { items, vraagtKoelcelBevestiging, setKoelcelKeuze: keuze,
    taakDatum: '2026-11-01', bronOp: { mutateAsync }, BEVESTIG: { bestelbord: 'is bijbesteld' },
    toast: { success: mock() },
    metStatus: (_id: string, action: () => unknown, again: () => void) => { retry = again; return action(); },
  });
  await op(werkbank, true);
  expect(mutateAsync).toHaveBeenCalledWith({ item: werkbank, taakDatum: '2026-11-01' });
  expect(diepsteBron(werkbank, items)).toEqual({
    item: koelcel, bestemming: { soort: 'bestelbord', label: 'het bestelbord' },
  });
  if (!retry) throw new Error('Retry ontbreekt');
  retry();
  expect(mutateAsync).toHaveBeenCalledTimes(2);
  expect(keuze).not.toHaveBeenCalled();
});