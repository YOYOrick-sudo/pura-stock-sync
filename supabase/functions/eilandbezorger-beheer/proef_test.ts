// Lokale volledige beheer-/ontvangweg. Geen netwerkrechten of echte database.
import { assertEquals } from 'jsr:@std/assert@1';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { exacteProef, proefDatum, proefInvoer, PROEF_ORDER_ID, PROEF_POGING_ID, PROEF_REFERENTIE, PROEF_VRIJGAVE } from '../_shared/eilandbezorgerProef.ts';
import { verzend } from '../_shared/eilandbezorgerVerzend.ts';
type Rij = Record<string, any>;
type Handler = (req: Request) => Promise<Response>;
let captured: Handler | undefined;
const serve = Deno.serve;
Object.defineProperty(Deno, 'serve', { value: (fn: Handler) => { captured = fn; return {}; }, configurable: true });
await import('./index.ts');
const beheer = captured;
await import('../eilandbezorger-bestelling/index.ts');
const ontvangst = captured;
Object.defineProperty(Deno, 'serve', { value: serve, configurable: true });
const opdracht = { actie: 'ginger_beer_proef', referentie: PROEF_REFERENTIE, bevestiging: true };
const NU = Date.parse('2026-11-22T15:27:00Z');

async function lokaal(run: (s: { t: Record<string, Rij[]>; kassa: Rij[]; post: (b?: unknown, auth?: boolean) => Promise<Response>; partner: (b: unknown) => Promise<Response>; fout: (mode: string) => void; naBericht: (f: () => void) => void }) => Promise<void>) {
  const vars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_ANON_KEY', 'EILANDBEZORGER_SLEUTEL'];
  const old = vars.map((k) => Deno.env.get(k));
  vars.forEach((k, i) => Deno.env.set(k, i === 0 ? 'http://127.0.0.1:9876' : 'lokaal'));
  const now = Date.now, fetchOld = globalThis.fetch;
  Date.now = () => NU;
  const t: Record<string, Rij[]> = {
    externe_bestellingen: [], externe_bestelling_poging: [], externe_bestelling_log: [], notifications: [],
    user_roles: [{ user_id: 'owner-lokaal', role: 'owner', location: 'Midsland', is_active: true }],
    externe_product_koppeling: [{ vestiging: 'Midsland', soort: 'product', externe_code: 'PV-0680E844', lightspeed_product_id: '4636894', naam: 'Naturfrisk Ginger beer', prijs_cent: 490, actief: true }],
    externe_kassa_config: [{ vestiging: 'Midsland', lightspeed_klant_id: '901', lightspeed_betaalwijze_id: '285794', lightspeed_betaalwijze_type_id: '4', order_route: 'customer_order', venster_minuten: 45 }],
    fase2_vlag: [{ vestiging: 'Midsland', vlag: 'eilandbezorger_live', aan: false }],
    lightspeed_connections: [{ vestiging: 'Midsland', merchant_id: '36864', status: 'gekoppeld', access_token: 'lokaal', token_expires_at: '2999-01-01T00:00:00Z' }],
  };
  const kassa: Rij[] = []; let mode = '', na: (() => void) | undefined;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const u = new URL(String(input)), method = init?.method ?? 'GET';
    if (u.hostname === 'lightspeedapis.com') {
      if (method !== 'POST' || u.pathname !== '/resto/rest/onlineordering/customer/901/order') throw new Error('Verboden klant-/kassaverzoek');
      kassa.push(JSON.parse(String(init?.body)));
      if (mode === 'timeout') throw new Error('Verloren antwoord');
      return mode === 'weigering' ? Response.json({ error: 'geweigerd' }, { status: 400 }) : Response.json({ id: 8001 }, { status: 201 });
    }
    if (u.origin !== 'http://127.0.0.1:9876') throw new Error('Extern netwerk verboden');
    if (u.pathname === '/auth/v1/user') return Response.json({ id: 'owner-lokaal', aud: 'authenticated', role: 'authenticated' });
    if (!u.pathname.startsWith('/rest/v1/')) throw new Error('Onbekende lokale route');
    const tabel = u.pathname.split('/').at(-1) ?? '', rows = t[tabel] ??= [];
    const past = (r: Rij) => [...u.searchParams].every(([k, v]) => {
      if (['select', 'limit', 'order'].includes(k)) return true;
      if (v.startsWith('eq.')) return String(r[k]) === v.slice(3);
      if (v.startsWith('in.(')) return v.slice(4, -1).split(',').includes(String(r[k]));
      throw new Error('Niet ondersteunde filter');
    });
    let uit = rows.filter(past);
    if (method === 'POST') {
      const raw = JSON.parse(String(init?.body)), nieuw: Rij[] = Array.isArray(raw) ? raw : [raw];
      if (nieuw.some((r) => rows.some((x) => (r.id && x.id === r.id) || (tabel === 'externe_bestellingen' && (x.referentie === r.referentie || (x.extern_id === r.extern_id && x.modus === r.modus && x.merchant_id === r.merchant_id)))))) return Response.json({ code: '23505' }, { status: 409 });
      uit = nieuw.map((r) => ({ id: crypto.randomUUID(), bron: 'eilandbezorger', versie: 1, status: 'ontvangen', uitkomst: 'bezig', ...r })); rows.push(...uit);
    } else if (method === 'PATCH') {
      const patch = JSON.parse(String(init?.body)); uit.forEach((r) => Object.assign(r, patch));
      if (tabel === 'externe_bestellingen' && patch.orderbericht) na?.();
    }
    const object = new Headers(init?.headers).get('Accept')?.includes('vnd.pgrst.object');
    return Response.json(object ? uit[0] ?? null : uit, { status: method === 'POST' ? 201 : 200 });
  }) as typeof fetch;
  const post = async (b: unknown = opdracht, auth = true) => {
    if (!beheer) throw new Error('Beheerhandler ontbreekt');
    return beheer(new Request('http://lokaal/beheer', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(auth ? { Authorization: 'Bearer lokaal' } : { 'x-eilandbezorger-sleutel': 'lokaal' }) }, body: JSON.stringify(b) }));
  };
  try {
    await run({ t, kassa, post, fout: (m) => { mode = m; }, naBericht: (f) => { na = f; }, partner: async (b) => {
      if (!ontvangst) throw new Error('Ontvanghandler ontbreekt');
      return ontvangst(new Request('http://lokaal/ontvangst', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-eilandbezorger-sleutel': 'lokaal' }, body: JSON.stringify(b) }));
    } });
  } finally {
    globalThis.fetch = fetchOld; Date.now = now;
    vars.forEach((k, i) => { const v = old[i]; if (v === undefined) Deno.env.delete(k); else Deno.env.set(k, v); });
  }
}

Deno.test('vaste owner-proef: volledige Pura-weg, €4,90, één product en bestaande betaalwijze', async () => lokaal(async ({ post, kassa, t }) => {
  const r = await post(); assertEquals(r.status, 200); assertEquals((await r.json()).status, 'verzonden');
  assertEquals(kassa.length, 1); const b = kassa[0];
  assertEquals(b.externalReference, 'PV-PROEF-MID-20261122-GB01');
  assertEquals(b.description, 'PV-PROEF-MID-20261122-GB01 — Pura Test'); assertEquals(b.note, 'TEST – niet klaarmaken');
  assertEquals(b.orderItems, [{ productId: 4636894, amount: 1, unitPrice: 4.9, totalPrice: 4.9, modifiers: [], subitems: [] }]);
  assertEquals(b.orderPayments, { amount: 4.9, paymentTypeId: 285794, paymentTypeTypeId: 4, tip: 0 });
  assertEquals(b.deliveryDate, '2026-11-22T15:27:00.000Z'); assertEquals(b.status, 'ACCEPTED');
  assertEquals(t.fase2_vlag[0].aan, false); assertEquals(t.externe_bestelling_poging[0].id, PROEF_POGING_ID);
}));

for (const role of ['manager', 'staff']) Deno.test(`proef weigert ${role}`, async () => lokaal(async ({ post, t, kassa }) => {
  t.user_roles[0].role = role; assertEquals((await post()).status, 403); assertEquals(kassa.length, 0); assertEquals(t.externe_bestellingen.length, 0);
}));
Deno.test('partner-sleutel verleent geen beheer-vrijgave', async () => lokaal(async ({ post, kassa }) => { assertEquals((await post(opdracht, false)).status, 401); assertEquals(kassa.length, 0); }));
Deno.test('partner kan vaste referentie niet ontvangen of tijd wijzigen', async () => lokaal(async ({ partner, kassa, t }) => {
  assertEquals((await partner(proefInvoer(NU))).status, 403);
  assertEquals((await partner({ actie: 'ophaaltijd', bestelnummer: PROEF_REFERENTIE, modus: 'live', vestiging: '36864', ophaaltijd: new Date(NU).toISOString() })).status, 403);
  assertEquals(kassa.length, 0); assertEquals(t.externe_bestellingen.length, 0);
}));
for (const b of [{ ...opdracht, referentie: 'ANDER' }, { ...opdracht, bevestiging: false }, { ...opdracht, regels: [] }]) Deno.test(`alleen exacte opdracht: ${JSON.stringify(b)}`, async () => lokaal(async ({ post, kassa }) => { assertEquals((await post(b)).status, 400); assertEquals(kassa.length, 0); }));

const wijzigingen: [string, (t: Record<string, Rij[]>) => void][] = [
  ['klant ontbreekt', (t) => { t.externe_kassa_config[0].lightspeed_klant_id = null; }],
  ['live aan', (t) => { t.fase2_vlag[0].aan = true; }],
  ['vlag ontbreekt', (t) => { t.fase2_vlag = []; }],
  ['betaal-ID verkeerd', (t) => { t.externe_kassa_config[0].lightspeed_betaalwijze_id = '1'; }],
  ['betaaltype verkeerd', (t) => { t.externe_kassa_config[0].lightspeed_betaalwijze_type_id = '3'; }],
  ['product verkeerd', (t) => { t.externe_product_koppeling[0].lightspeed_product_id = '4636994'; }],
  ['product niet actief', (t) => { t.externe_product_koppeling[0].actief = false; }],
  ['prijs één cent anders', (t) => { t.externe_product_koppeling[0].prijs_cent = 491; }],
  ['venster ongeldig', (t) => { t.externe_kassa_config[0].venster_minuten = 0; }],
];
for (const [naam, wijzig] of wijzigingen) Deno.test(`preflight blokkeert: ${naam}`, async () => lokaal(async ({ post, kassa, t }) => {
  wijzig(t); assertEquals((await post()).status, 409); assertEquals(kassa.length, 0); assertEquals(t.externe_bestellingen.length, 0);
}));
Deno.test('verlopen Amsterdamse datum blokkeert volledige actie', async () => lokaal(async ({ post, kassa }) => { Date.now = () => Date.parse('2026-11-22T23:00:00Z'); assertEquals((await post()).status, 409); assertEquals(kassa.length, 0); }));
Deno.test('Amsterdamse daggrenzen exact, niet UTC', () => {
  assertEquals(proefDatum(Date.parse('2026-11-21T23:00:00Z')), true);
  assertEquals(proefDatum(Date.parse('2026-11-22T22:59:59Z')), true);
  assertEquals(proefDatum(Date.parse('2026-11-22T23:00:00Z')), false);
});
Deno.test('bestaande test nooit geconverteerd of opnieuw opgeslagen', async () => lokaal(async ({ post, t, kassa }) => {
  t.externe_bestellingen.push({ id: 'oude-test', modus: 'test', merchant_id: '36864', extern_id: PROEF_REFERENTIE, status: 'test_ok' });
  assertEquals((await post()).status, 409); assertEquals(t.externe_bestellingen.length, 1); assertEquals(t.externe_bestellingen[0].modus, 'test'); assertEquals(kassa.length, 0);
}));
Deno.test('gelijktijdigheid en opeenvolgende herhaling maximaal één kassaverzoek', async () => lokaal(async ({ post, kassa, t }) => {
  await Promise.all([post(), post(), post()]); await post(); assertEquals(kassa.length, 1); assertEquals(t.externe_bestellingen.length, 1); assertEquals(t.externe_bestelling_poging.length, 1);
}));
for (const mode of ['timeout', 'weigering']) Deno.test(`${mode}: ook bij status-reset permanente pogingclaim, nooit tweede POST`, async () => lokaal(async ({ post, fout, t, kassa }) => {
  fout(mode); await post(); await post(); assertEquals(kassa.length, 1);
  const rij = t.externe_bestellingen[0]; assertEquals(rij.status, mode === 'timeout' ? 'uitkomst_onbekend' : 'geweigerd');
  rij.status = 'verzenden'; rij.versie++;
  const admin = createClient('http://127.0.0.1:9876', 'lokaal');
  await verzend(admin, { ...rij }, fetch, PROEF_VRIJGAVE);
  assertEquals(kassa.length, 1); assertEquals(t.externe_bestelling_poging.length, 1);
  // De normale beheerroute weigert zelfs als de globale vlag later aan zou staan.
  t.fase2_vlag[0].aan = true;
  assertEquals((await post({ actie: 'herverzenden', id: PROEF_ORDER_ID, bevestiging: true, reden: 'Niet nog een keer verzenden' })).status, 409);
  assertEquals(kassa.length, 1);
}));
Deno.test('laatste controle: livewijziging na token/berichtopslag verhindert POST', async () => lokaal(async ({ post, kassa, t, naBericht }) => {
  naBericht(() => { t.fase2_vlag[0].aan = true; }); await post(); assertEquals(kassa.length, 0); assertEquals(t.externe_bestellingen[0].status, 'geblokkeerd'); assertEquals(t.externe_bestelling_poging.length, 1);
}));
for (const [naam, wijzig] of [
  ['vaste klant gewijzigd', (t: Record<string, Rij[]>) => { t.externe_kassa_config[0].lightspeed_klant_id = '902'; }],
  ['eigenaarsrol ingetrokken', (t: Record<string, Rij[]>) => { t.user_roles[0].is_active = false; }],
  ['product gedeactiveerd', (t: Record<string, Rij[]>) => { t.externe_product_koppeling[0].actief = false; }],
] as const) Deno.test(`laatste controle: ${naam}`, async () => lokaal(async ({ post, kassa, t, naBericht }) => {
  naBericht(() => wijzig(t)); await post(); assertEquals(kassa.length, 0); assertEquals(t.externe_bestelling_poging[0].uitkomst, 'niet_verstuurd');
}));
Deno.test('gedeelde verzender zonder interne owner-capability weigert proef', async () => lokaal(async ({ post, kassa, t, fout }) => {
  fout('timeout'); await post(); const rij = t.externe_bestellingen[0]; rij.status = 'verzenden'; rij.versie++;
  await verzend(createClient('http://127.0.0.1:9876', 'lokaal'), { ...rij }); assertEquals(kassa.length, 1);
}));
Deno.test('gewone partner-liveorder blijft geblokkeerd, niet door proefvrijgave', async () => lokaal(async ({ partner, kassa, t }) => {
  const b = proefInvoer(NU); b.bestelnummer = 'GEWONE-ORDER';
  const r = await partner(b); assertEquals(r.status, 201); assertEquals((await r.json()).status, 'geblokkeerd'); assertEquals(kassa.length, 0); assertEquals(t.fase2_vlag[0].aan, false);
}));
const inhoudWijzigingen: [string, Rij][] = [
  ['testmodus', { modus: 'test' }], ['bedrag 491', { restaurant_cent: 491 }], ['bezorgkosten', { bezorgkosten_cent: 1 }],
  ['fooi', { fooi_cent: 1 }], ['West', { merchant_id: '41121' }], ['andere referentie', { referentie: 'ANDER' }],
  ['ander product', { invoer: { ...proefInvoer(NU), regels: [{ code: 'ANDER', aantal: 1, stukprijs_cent: 490 }] } }],
  ['twee producten', { invoer: { ...proefInvoer(NU), regels: [{ code: 'PV-0680E844', aantal: 2, stukprijs_cent: 490 }] } }],
  ['extra', { invoer: { ...proefInvoer(NU), regels: [{ code: 'PV-0680E844', aantal: 1, stukprijs_cent: 490, extras: [{ code: 'EXTRA', aantal: 1, stukprijs_cent: 0 }] }] } }],
  ['andere naam', { invoer: { ...proefInvoer(NU), klant: { naam: 'Andere naam' } } }],
  ['korting', { invoer: { ...proefInvoer(NU), bedragen: { ...proefInvoer(NU).bedragen, korting: { actiecode: 'A', oorspronkelijk_cent: 491, korting_cent: 1, betaald_door: 'restaurant' } } } }],
];
for (const [naam, patch] of inhoudWijzigingen) Deno.test(`exacte proef weigert ${naam}`, () => {
  const b = proefInvoer(NU), cfg = { venster_minuten: 45 };
  const regels = [{ lightspeed_product_id: '4636894' }];
  const rij = { id: PROEF_ORDER_ID, referentie: PROEF_REFERENTIE, extern_id: PROEF_REFERENTIE, merchant_id: '36864', vestiging: 'Midsland', modus: 'live', vrijgegeven_door: 'owner', restaurant_cent: 490, bezorgkosten_cent: 0, fooi_cent: 0, korting: null, ophaaltijd: b.ophaaltijd, invoer: b, regels };
  assertEquals(exacteProef(rij, NU, cfg, regels), true);
  assertEquals(exacteProef({ ...rij, ...patch }, NU, cfg, regels), false);
});
