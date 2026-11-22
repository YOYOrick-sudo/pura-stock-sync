import { assertEquals } from 'jsr:@std/assert@1';

// Importeren zonder een server te openen; deze tests krijgen geen netwerkrechten.
const serve = Deno.serve;
Object.defineProperty(Deno, 'serve', { value: () => ({}), configurable: true });
const { kassaInstellingen } = await import('./index.ts');
Object.defineProperty(Deno, 'serve', { value: serve, configurable: true });

const admin = { from: (tabel: string) => {
  assertEquals(tabel, 'lightspeed_connections');
  const q = { select: () => q, eq: (veld: string, waarde: string) => {
    assertEquals([veld, waarde], ['vestiging', 'Midsland']); return q;
  }, maybeSingle: async () => ({ data: { status: 'gekoppeld', access_token: 'lokaal', token_expires_at: '2999-01-01T00:00:00Z' } }) };
  return q;
} };

Deno.test('betaalwijzen: exact één GET op enkelvoudige onlineordering-route, geen klanten/bonnen', async () => {
  const oud = globalThis.fetch; const calls: string[] = [];
  globalThis.fetch = (async (url: string, init?: RequestInit) => {
    calls.push(url);
    assertEquals(url, 'https://lightspeedapis.com/resto/rest/onlineordering/paymenttype');
    assertEquals(init?.method, 'GET');
    return Response.json([{ id: 123, typeId: 7, name: 'eilandbezorger' }]);
  }) as typeof fetch;
  try {
    const r = await kassaInstellingen(admin, true);
    assertEquals(calls.length, 1); assertEquals(r.http_status, 200);
    assertEquals(r.betaalwijzen, [{ id: 123, typeId: 7, name: 'eilandbezorger' }]);
  } finally { globalThis.fetch = oud; }
});

Deno.test('betaalwijzen: 429 en Retry-After behouden, geen directe herhaling', async () => {
  const oud = globalThis.fetch; let calls = 0;
  globalThis.fetch = (async () => { calls++; return new Response('limiet', { status: 429, headers: { 'Retry-After': '60' } }); }) as typeof fetch;
  try {
    const r = await kassaInstellingen(admin, true);
    assertEquals(r.http_status, 429); assertEquals(r.betaalwijzen.http_status, 429);
    assertEquals(r.betaalwijzen.retry_after, '60'); assertEquals(calls, 1);
  } finally { globalThis.fetch = oud; }
});