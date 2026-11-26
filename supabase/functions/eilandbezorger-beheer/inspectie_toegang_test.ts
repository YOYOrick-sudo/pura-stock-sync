import { assertEquals } from 'jsr:@std/assert@1';
import { magKassaInspectie } from './inspectie.ts';
Deno.test('kassa_inspectie: owner en admin mogen', () => { assertEquals(magKassaInspectie([{ role: 'owner' }]), true); assertEquals(magKassaInspectie([{ role: 'admin' }]), true); });
Deno.test('kassa_inspectie: manager, staff of geen rol niet', () => { assertEquals(magKassaInspectie([{ role: 'manager' }, { role: 'staff' }]), false); assertEquals(magKassaInspectie([]), false); });
Deno.test('kassa_inspectie: geen cron-sleutelroute meer in beheer', async () => {
  const src = await Deno.readTextFile(new URL('./index.ts', import.meta.url));
  assertEquals(/kassa_inspectie'[^\n]*x-sync-token/.test(src), false);
});
