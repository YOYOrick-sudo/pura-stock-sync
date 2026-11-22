// Lokale volledige beheer-/ontvangweg. Geen netwerkrechten of echte database.
import { assertEquals } from 'jsr:@std/assert@1';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { exacteProef, proefDatum, proefInvoer, PROEF_ORDER_ID, PROEF_POGING_ID, PROEF_REFERENTIE, PROEF_VRIJGAVE, PROEF_OWNER_ID, TWEEDE_PROEF, DERDE_PROEF, VIERDE_PROEF, VIJFDE_PROEF, ZESDE_PROEF, ZEVENDE_PROEF } from '../_shared/eilandbezorgerProef.ts';
import { verzend } from '../_shared/eilandbezorgerVerzend.ts';
import { mockKaart } from '../_shared/eilandbezorgerPrijsFixtures.ts';
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
    const kaart = mockKaart(input, init); if (kaart) return kaart;
    if (u.hostname === 'lightspeedapis.com') {
      if (method !== 'POST' || !['/resto/rest/onlineordering/customer/901/order', '/resto/rest/onlineordering/customer/13597022/order'].includes(u.pathname)) throw new Error('Verboden klant-/kassaverzoek');
      kassa.push(JSON.parse(String(init?.body)));
      if (mode === 'timeout') throw new Error('Verloren antwoord');
      return mode === 'weigering' ? Response.json({ error: 'geweigerd' }, { status: 400 }) : Response.json({ id: 8001 }, { status: 201 });
    }
    if (u.origin !== 'http://127.0.0.1:9876') throw new Error('Extern netwerk verboden');
    if (u.pathname === '/auth/v1/user') return Response.json({ id: t.user_roles[0].user_id, aud: 'authenticated', role: 'authenticated' });
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
      uit = nieuw.map((r) => ({ ...(tabel === 'externe_bestellingen' ? { bezorgtijd: null, orderbericht: null, lightspeed_klant_id: null, lightspeed_order_id: null } : {}), id: crypto.randomUUID(), bron: 'eilandbezorger', versie: 1, status: 'ontvangen', uitkomst: 'bezig', ...r })); rows.push(...uit);
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
  assertEquals(b.orderItems, [{ productId: 4636894, amount: 1, unitPrice: 4.9, totalPrice: 4.9, unitPriceWithoutVat: 4.4954, totalPriceWithoutVat: 4.5, modifiers: [], subitems: [] }]);
  assertEquals(b.orderPayments, [{ amount: 4.9, paymentTypeId: 285794, paymentTypeTypeId: 4, tip: 0 }]);
  assertEquals(b.deliveryDate, '2026-11-22T15:27:00.000Z'); assertEquals(b.status, 'ACCEPTED');
  assertEquals(t.fase2_vlag[0].aan, false); assertEquals(t.externe_bestelling_poging[0].id, PROEF_POGING_ID);
}));

for (const role of ['manager', 'staff']) Deno.test(`proef weigert ${role}`, async () => lokaal(async ({ post, t, kassa }) => {
  t.user_roles[0].role = role; assertEquals((await post()).status, 403); assertEquals(kassa.length, 0); assertEquals(t.externe_bestellingen.length, 0);
}));
Deno.test('partner-sleutel verleent geen beheer-vrijgave', async () => lokaal(async ({ post, kassa }) => { assertEquals((await post(opdracht, false)).status, 401); assertEquals(kassa.length, 0); }));
for (const role of ['manager', 'staff']) Deno.test(`hervattingsactie weigert ${role}`, async () => lokaal(async ({ post, t, kassa }) => {
  t.user_roles[0].role = role; assertEquals((await post({ ...opdracht, actie: 'ginger_beer_proef_hervatten' })).status, 403); assertEquals(kassa.length, 0);
}));
Deno.test('partner-sleutel verleent geen hervattingstoegang', async () => lokaal(async ({ post, kassa }) => {
  assertEquals((await post({ ...opdracht, actie: 'ginger_beer_proef_hervatten' }, false)).status, 401); assertEquals(kassa.length, 0);
}));
Deno.test('hervatting zonder expliciete bevestiging geweigerd', async () => lokaal(async ({ post, kassa }) => {
  assertEquals((await post({ ...opdracht, actie: 'ginger_beer_proef_hervatten', bevestiging: false })).status, 400); assertEquals(kassa.length, 0);
}));
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


const gb02 = { actie: 'ginger_beer_proef_gb02', referentie: TWEEDE_PROEF.referentie, bevestiging: true };
function metEersteWeigering(t: Record<string, Rij[]>) {
  t.user_roles[0].user_id = PROEF_OWNER_ID;
  Object.assign(t.externe_kassa_config[0], { merchant_id: '36864', lightspeed_klant_id: '13597022', lightspeed_company_id: null });
  t.externe_product_koppeling[0].lightspeed_plu = 'Kd-a11';
  t.externe_bestellingen.push({ id: PROEF_ORDER_ID, extern_id: PROEF_REFERENTIE, referentie: PROEF_REFERENTIE,
    vestiging: 'Midsland', merchant_id: '36864', modus: 'live', status: 'geweigerd', lightspeed_order_id: null });
  t.externe_bestelling_poging.push({ id: PROEF_POGING_ID, bestelling_id: PROEF_ORDER_ID, soort: 'verzenden',
    uitkomst: 'geweigerd', http_status: 400, antwoord: JSON.stringify({
      description: 'JSON parse error: Cannot deserialize value of type `java.util.ArrayList<com.xudox.pos.server.rest.shared.model.OrderPaymentDTO>` from Object value (token `JsonToken.START_OBJECT`); (through reference chain: com.xudox.pos.server.rest.shared.model.OrderDTO["orderPayments"])',
    }) });
}

Deno.test('GB02 verstuurt één keer vanuit Pura en houdt beide proefnummers gereserveerd', async () => lokaal(async ({ t, post, partner, kassa }) => {
  metEersteWeigering(t);
  const origineel = structuredClone([t.externe_bestellingen[0], t.externe_bestelling_poging[0]]);
  assertEquals((await partner(proefInvoer(NU, TWEEDE_PROEF))).status, 403);
  assertEquals((await partner({ actie: 'ophaaltijd', bestelnummer: TWEEDE_PROEF.referentie, modus: 'live', vestiging: '36864', ophaaltijd: new Date(NU).toISOString() })).status, 403);
  assertEquals((await post(gb02, false)).status, 401);
  const resultaten = await Promise.all([post(gb02), post(gb02)]);
  assertEquals(resultaten.map(r => r.status).sort(), [200, 409]);
  assertEquals((await post(gb02)).status, 409);
  assertEquals(kassa.length, 1);
  assertEquals(kassa[0].externalReference, TWEEDE_PROEF.referentie);
  assertEquals(kassa[0].deliveryDate, new Date(NU).toISOString());
  assertEquals(kassa[0].orderPayments, [{ amount: 4.9, paymentTypeId: 285794, paymentTypeTypeId: 4, tip: 0 }]);
  assertEquals(t.externe_bestelling_poging.map(p => p.id), [PROEF_POGING_ID, TWEEDE_PROEF.pogingId]);
  assertEquals([t.externe_bestellingen[0], t.externe_bestelling_poging[0]], origineel);
  assertEquals(t.fase2_vlag[0].aan, false);
  t.fase2_vlag[0].aan = true;
  for (const id of [PROEF_ORDER_ID, TWEEDE_PROEF.orderId]) {
    assertEquals((await post({ actie: 'herverzenden', id, bevestiging: true, reden: 'Geen herhaling van proef' })).status, 409);
  }
}));

for (const [naam, wijzig] of [
  ['verkeerd account', (t: Record<string, Rij[]>) => { t.user_roles[0].user_id = 'andere-owner'; }],
  ['andere klant', (t: Record<string, Rij[]>) => { t.externe_kassa_config[0].lightspeed_klant_id = '555'; }],
  ['andere eerste referentie', (t: Record<string, Rij[]>) => { t.externe_bestellingen[0].referentie = 'ANDER'; }],
  ['onzekere eerste order', (t: Record<string, Rij[]>) => { t.externe_bestellingen[0].status = 'uitkomst_onbekend'; }],
  ['eerste order-ID aanwezig', (t: Record<string, Rij[]>) => { t.externe_bestellingen[0].lightspeed_order_id = '44'; }],
  ['eerste poging ontbreekt', (t: Record<string, Rij[]>) => { t.externe_bestelling_poging = []; }],
  ['extra eerste poging', (t: Record<string, Rij[]>) => { t.externe_bestelling_poging.push({ ...t.externe_bestelling_poging[0], id: 'andere-poging' }); }],
  ['andere HTTP-status', (t: Record<string, Rij[]>) => { t.externe_bestelling_poging[0].http_status = 500; }],
  ['andere 400', (t: Record<string, Rij[]>) => { t.externe_bestelling_poging[0].antwoord = '{"description":"andere fout orderPayments"}'; }],
] as const) Deno.test('GB02 vóór verzending geblokkeerd: ' + naam, async () => lokaal(async ({ t, post, kassa }) => {
  metEersteWeigering(t); wijzig(t);
  assertEquals((await post(gb02)).status, 409);
  assertEquals(t.externe_bestellingen.length, 1);
  assertEquals(kassa.length, 0);
}));

Deno.test('GB02 met verloren antwoord wordt nooit herhaald', async () => lokaal(async ({ t, post, fout, kassa }) => {
  metEersteWeigering(t); fout('timeout');
  assertEquals((await (await post(gb02)).json()).status, 'uitkomst_onbekend');
  assertEquals((await post(gb02)).status, 409);
  assertEquals(kassa.length, 1);
}));

Deno.test('btw-diagnose door shared writer is owner-only en maakt geen bestelling/poging', async () => lokaal(async({post,t,kassa})=>{
  const b={actie:'kaart',bron:'product',prijscontrole:true};
  assertEquals((await post(b,false)).status,401);
  t.user_roles[0].role='manager';assertEquals((await post(b)).status,403);
  t.user_roles[0].role='owner';const r=await post(b);assertEquals(r.status,200);
  assertEquals(r.headers.get('X-Pura-Kassa-Schema'),'bezorg-netto-v1');
  const j=await r.json();assertEquals(j.alleen_lezen,true);assertEquals(j.orderItems[0].unitPriceWithoutVat,4.4954);assertEquals(j.orderItems[0].totalPriceWithoutVat,4.5);
  assertEquals(j.orderPayments,[{amount:4.9,paymentTypeId:285794,paymentTypeTypeId:4,tip:0}]);
  assertEquals(kassa.length,0);assertEquals(t.externe_bestellingen.length,0);assertEquals(t.externe_bestelling_poging.length,0);assertEquals(t.fase2_vlag[0].aan,false);
}));

const gb03 = { actie: 'ginger_beer_proef_gb03', referentie: DERDE_PROEF.referentie, bevestiging: true };
function metBeideWeigeringen(t: Record<string, Rij[]>) {
  metEersteWeigering(t);
  t.externe_bestellingen.push({ id: TWEEDE_PROEF.orderId, extern_id: TWEEDE_PROEF.referentie, referentie: TWEEDE_PROEF.referentie,
    vestiging: 'Midsland', merchant_id: '36864', modus: 'live', status: 'geweigerd', lightspeed_order_id: null });
  t.externe_bestelling_poging.push({ id: TWEEDE_PROEF.pogingId, bestelling_id: TWEEDE_PROEF.orderId, soort: 'verzenden',
    uitkomst: 'geweigerd', http_status: 400, antwoord: '{"errors":["orderItems[0].unitPriceWithoutVat may not be null"]}' });
}

Deno.test('GB03 exact één Ginger Beer €4,90 met btw en betaalarray; parallel/retry nooit tweede POST', async () => lokaal(async ({ t, post, partner, kassa }) => {
  metBeideWeigeringen(t);
  const historie = structuredClone([t.externe_bestellingen, t.externe_bestelling_poging]);
  assertEquals((await partner(proefInvoer(NU, DERDE_PROEF))).status, 403);
  assertEquals((await partner({ actie: 'ophaaltijd', bestelnummer: DERDE_PROEF.referentie, modus: 'live', vestiging: '36864', ophaaltijd: new Date(NU).toISOString() })).status, 403);
  assertEquals((await post(gb03, false)).status, 401);
  assertEquals((await Promise.all([post(gb03), post(gb03)])).map(r => r.status).sort(), [200, 409]);
  assertEquals((await post(gb03)).status, 409);
  assertEquals(kassa.length, 1);
  assertEquals(kassa[0].externalReference, 'PV-PROEF-MID-20261122-GB03');
  assertEquals(kassa[0].description, 'PV-PROEF-MID-20261122-GB03 — Pura Test');
  assertEquals(kassa[0].note, 'TEST – niet klaarmaken');
  assertEquals(kassa[0].deliveryDate, new Date(NU).toISOString());
  assertEquals(kassa[0].orderItems, [{ productId: 4636894, amount: 1, unitPrice: 4.9, totalPrice: 4.9, unitPriceWithoutVat: 4.4954, totalPriceWithoutVat: 4.5, modifiers: [], subitems: [] }]);
  assertEquals(kassa[0].orderPayments, [{ amount: 4.9, paymentTypeId: 285794, paymentTypeTypeId: 4, tip: 0 }]);
  assertEquals(t.externe_bestellingen[2].id, DERDE_PROEF.orderId);
  assertEquals(t.externe_bestelling_poging[2].id, DERDE_PROEF.pogingId);
  assertEquals([t.externe_bestellingen.slice(0, 2), t.externe_bestelling_poging.slice(0, 2)], historie);
  assertEquals(t.fase2_vlag[0].aan, false);
  t.fase2_vlag[0].aan = true;
  assertEquals((await post({ actie: 'herverzenden', id: DERDE_PROEF.orderId, bevestiging: true, reden: 'Geen herhaling van proef' })).status, 409);
  assertEquals((await post({ actie: 'vrijgeven', id: DERDE_PROEF.orderId })).status, 409);
  assertEquals(kassa.length, 1);
}));

for (const [naam, wijzig] of [
  ['ander eigenaaraccount', (t: Record<string, Rij[]>) => { t.user_roles[0].user_id = 'andere-owner'; }],
  ['manager', (t: Record<string, Rij[]>) => { t.user_roles[0].role = 'manager'; }],
  ['live aan', (t: Record<string, Rij[]>) => { t.fase2_vlag[0].aan = true; }],
  ['andere vaste klant', (t: Record<string, Rij[]>) => { t.externe_kassa_config[0].lightspeed_klant_id = '555'; }],
  ['ander betaaltype', (t: Record<string, Rij[]>) => { t.externe_kassa_config[0].lightspeed_betaalwijze_type_id = '3'; }],
  ['andere prijs', (t: Record<string, Rij[]>) => { t.externe_product_koppeling[0].prijs_cent = 491; }],
  ['GB01 niet definitief', (t: Record<string, Rij[]>) => { t.externe_bestellingen[0].status = 'uitkomst_onbekend'; }],
  ['GB02 niet definitief', (t: Record<string, Rij[]>) => { t.externe_bestellingen[1].status = 'uitkomst_onbekend'; }],
  ['GB02 order-ID aanwezig', (t: Record<string, Rij[]>) => { t.externe_bestellingen[1].lightspeed_order_id = '8000'; }],
  ['GB02 poging ontbreekt', (t: Record<string, Rij[]>) => { t.externe_bestelling_poging.pop(); }],
  ['GB02 twee pogingen', (t: Record<string, Rij[]>) => { t.externe_bestelling_poging.push({ ...t.externe_bestelling_poging[1], id: 'extra' }); }],
  ['GB02 andere HTTP-code', (t: Record<string, Rij[]>) => { t.externe_bestelling_poging[1].http_status = 500; }],
  ['GB02 andere fout', (t: Record<string, Rij[]>) => { t.externe_bestelling_poging[1].antwoord = '{"errors":["andere fout"]}'; }],
  ['GB03 permanente poging bestaat', (t: Record<string, Rij[]>) => { t.externe_bestelling_poging.push({ id: DERDE_PROEF.pogingId, bestelling_id: 'ander' }); }],
  ['GB03 poging op order bestaat', (t: Record<string, Rij[]>) => { t.externe_bestelling_poging.push({ id: 'ander', bestelling_id: DERDE_PROEF.orderId }); }],
  ['GB03 testorder bestaat', (t: Record<string, Rij[]>) => { t.externe_bestellingen.push({ id: 'test', extern_id: DERDE_PROEF.referentie, merchant_id: '36864', modus: 'test', status: 'test_ok' }); }],
] as const) Deno.test('GB03 blokkeert zonder POST: ' + naam, async () => lokaal(async ({ t, post, kassa }) => {
  metBeideWeigeringen(t); wijzig(t);
  const historie = structuredClone([t.externe_bestellingen, t.externe_bestelling_poging]);
  const r = await post(gb03); assertEquals(r.status, naam === 'manager' ? 403 : 409);
  assertEquals(kassa.length, 0);
  assertEquals([t.externe_bestellingen, t.externe_bestelling_poging], historie);
}));

for (const mode of ['timeout', 'weigering']) Deno.test('GB03 ' + mode + ' nooit opnieuw verzenden', async () => lokaal(async ({ t, post, fout, kassa }) => {
  metBeideWeigeringen(t); fout(mode);
  assertEquals((await (await post(gb03)).json()).status, mode === 'timeout' ? 'uitkomst_onbekend' : 'geweigerd');
  assertEquals((await post(gb03)).status, 409);
  const rij = t.externe_bestellingen[2]; rij.status = 'verzenden'; rij.versie = 2;
  await verzend(createClient('http://127.0.0.1:9876', 'lokaal'), { ...rij }, fetch, DERDE_PROEF.vrijgave);
  assertEquals(kassa.length, 1); assertEquals(t.externe_bestelling_poging.length, 3);
}));

Deno.test('GB03 weigert verlopen Amsterdamse datum en gewijzigde opdracht', async () => lokaal(async ({ t, post, kassa }) => {
  metBeideWeigeringen(t);
  for (const b of [{ ...gb03, bevestiging: false }, { ...gb03, referentie: 'ANDER' }, { ...gb03, regels: [] }]) assertEquals((await post(b)).status, 400);
  Date.now = () => Date.parse('2026-11-22T23:00:00Z');
  assertEquals((await post(gb03)).status, 409); assertEquals(kassa.length, 0);
}));

for (const [naam, wijzig] of [
  ['eigenaarsrol ingetrokken', (t: Record<string, Rij[]>) => { t.user_roles[0].is_active = false; }],
  ['live aangezet', (t: Record<string, Rij[]>) => { t.fase2_vlag[0].aan = true; }],
  ['klant gewijzigd', (t: Record<string, Rij[]>) => { t.externe_kassa_config[0].lightspeed_klant_id = '555'; }],
  ['opgeslagen inhoud gewijzigd', (t: Record<string, Rij[]>) => { t.externe_bestellingen[2].invoer.klant.naam = 'Andere gast'; }],
] as const) Deno.test('GB03 laatste controle blokkeert: ' + naam, async () => lokaal(async ({ t, post, naBericht, kassa }) => {
  metBeideWeigeringen(t); naBericht(() => wijzig(t));
  assertEquals((await (await post(gb03)).json()).status, 'geblokkeerd');
  assertEquals(kassa.length, 0); assertEquals(t.externe_bestelling_poging[2].uitkomst, 'niet_verstuurd');
}));


const gb04 = { actie: 'ginger_beer_proef_gb04', referentie: VIERDE_PROEF.referentie, bevestiging: true };
 Deno.test('GB04 verstrijken van 45 minuten vóór POST blokkeert zonder herhaling', async () => lokaal(async ({ t, post, naBericht, kassa }) => {
  metDrieProeven(t);
  naBericht(() => { Date.now = () => NU + 46 * 60_000; });
  assertEquals((await (await post(gb04)).json()).status, 'geblokkeerd');
  assertEquals(kassa.length, 0);
  assertEquals(t.externe_bestelling_poging[3].uitkomst, 'niet_verstuurd');
  assertEquals((await post(gb04)).status, 409);
  assertEquals(kassa.length, 0);
}));
 Deno.test('GB04 ontbrekende vaste klant of West-configuratie blokkeert zonder opslag', async () => lokaal(async ({ t, post, kassa }) => {
  metDrieProeven(t);
  t.externe_kassa_config[0].lightspeed_klant_id = null;
  assertEquals((await post(gb04)).status, 409);
  t.externe_kassa_config[0].lightspeed_klant_id = '13597022';
  t.externe_kassa_config[0].merchant_id = '41121';
  assertEquals((await post(gb04)).status, 409);
  assertEquals(t.externe_bestellingen.length, 3);
  assertEquals(t.externe_bestelling_poging.length, 3);
  assertEquals(kassa.length, 0);
}));
function metDrieProeven(t: Record<string, Rij[]>) {
  metBeideWeigeringen(t);
  t.externe_bestellingen.push({ id: DERDE_PROEF.orderId, extern_id: DERDE_PROEF.referentie, referentie: DERDE_PROEF.referentie,
    vestiging: 'Midsland', merchant_id: '36864', modus: 'live', status: 'verzonden', lightspeed_order_id: '19944303' });
  t.externe_bestelling_poging.push({ id: DERDE_PROEF.pogingId, bestelling_id: DERDE_PROEF.orderId, soort: 'verzenden',
    uitkomst: 'verzonden', http_status: 201, antwoord: '{"id":19944303}' });
}

Deno.test('GB04 exact één Ginger Beer €4,90 met btw en betaalarray; parallel/retry nooit tweede POST', async () => lokaal(async ({ t, post, partner, kassa }) => {
  metDrieProeven(t);
  const historie = structuredClone([t.externe_bestellingen, t.externe_bestelling_poging]);
  assertEquals((await partner(proefInvoer(NU, VIERDE_PROEF))).status, 403);
  assertEquals((await partner({ actie: 'ophaaltijd', bestelnummer: VIERDE_PROEF.referentie, modus: 'live', vestiging: '36864', ophaaltijd: new Date(NU).toISOString() })).status, 403);
  assertEquals((await post(gb04, false)).status, 401);
  assertEquals((await Promise.all([post(gb04), post(gb04)])).map(r => r.status).sort(), [200, 409]);
  assertEquals((await post(gb04)).status, 409);
  assertEquals(kassa.length, 1);
  assertEquals(kassa[0].externalReference, 'PV-PROEF-MID-20261122-GB04');
  assertEquals(kassa[0].description, 'PV-PROEF-MID-20261122-GB04 — Pura Test');
  assertEquals(kassa[0].note, 'TEST – niet klaarmaken');
  assertEquals(kassa[0].deliveryDate, new Date(NU).toISOString());
  assertEquals(kassa[0].orderItems, [{ productId: 4636894, amount: 1, unitPrice: 4.9, totalPrice: 4.9, unitPriceWithoutVat: 4.4954, totalPriceWithoutVat: 4.5, modifiers: [], subitems: [] }]);
  assertEquals(kassa[0].orderPayments, [{ amount: 4.9, paymentTypeId: 285794, paymentTypeTypeId: 4, tip: 0 }]);
  assertEquals(t.externe_bestellingen[3].id, VIERDE_PROEF.orderId);
  assertEquals(t.externe_bestelling_poging[3].id, VIERDE_PROEF.pogingId);
  assertEquals([t.externe_bestellingen.slice(0, 3), t.externe_bestelling_poging.slice(0, 3)], historie);
  assertEquals(t.fase2_vlag[0].aan, false);
  t.fase2_vlag[0].aan = true;
  assertEquals((await post({ actie: 'herverzenden', id: VIERDE_PROEF.orderId, bevestiging: true, reden: 'Geen herhaling van proef' })).status, 409);
  assertEquals((await post({ actie: 'vrijgeven', id: VIERDE_PROEF.orderId })).status, 409);
  assertEquals(kassa.length, 1);
}));

for (const [naam, wijzig] of [
  ['ander eigenaaraccount', (t: Record<string, Rij[]>) => { t.user_roles[0].user_id = 'andere-owner'; }],
  ['manager', (t: Record<string, Rij[]>) => { t.user_roles[0].role = 'manager'; }],
  ['live aan', (t: Record<string, Rij[]>) => { t.fase2_vlag[0].aan = true; }],
  ['andere vaste klant', (t: Record<string, Rij[]>) => { t.externe_kassa_config[0].lightspeed_klant_id = '555'; }],
  ['ander betaaltype', (t: Record<string, Rij[]>) => { t.externe_kassa_config[0].lightspeed_betaalwijze_type_id = '3'; }],
  ['andere prijs', (t: Record<string, Rij[]>) => { t.externe_product_koppeling[0].prijs_cent = 491; }],
  ['GB01 niet definitief', (t: Record<string, Rij[]>) => { t.externe_bestellingen[0].status = 'uitkomst_onbekend'; }],
  ['GB02 niet definitief', (t: Record<string, Rij[]>) => { t.externe_bestellingen[1].status = 'uitkomst_onbekend'; }],
  ['GB02 order-ID aanwezig', (t: Record<string, Rij[]>) => { t.externe_bestellingen[1].lightspeed_order_id = '8000'; }],
  ['GB02 poging ontbreekt', (t: Record<string, Rij[]>) => { t.externe_bestelling_poging.splice(1, 1); }],
  ['GB02 twee pogingen', (t: Record<string, Rij[]>) => { t.externe_bestelling_poging.push({ ...t.externe_bestelling_poging[1], id: 'extra' }); }],
  ['GB02 andere HTTP-code', (t: Record<string, Rij[]>) => { t.externe_bestelling_poging[1].http_status = 500; }],
  ['GB02 andere fout', (t: Record<string, Rij[]>) => { t.externe_bestelling_poging[1].antwoord = '{"errors":["andere fout"]}'; }],
  ['GB04 permanente poging bestaat', (t: Record<string, Rij[]>) => { t.externe_bestelling_poging.push({ id: VIERDE_PROEF.pogingId, bestelling_id: 'ander' }); }],
  ['GB04 poging op order bestaat', (t: Record<string, Rij[]>) => { t.externe_bestelling_poging.push({ id: 'ander', bestelling_id: VIERDE_PROEF.orderId }); }],
  ['GB04 testorder bestaat', (t: Record<string, Rij[]>) => { t.externe_bestellingen.push({ id: 'test', extern_id: VIERDE_PROEF.referentie, merchant_id: '36864', modus: 'test', status: 'test_ok' }); }],
] as const) Deno.test('GB04 blokkeert zonder POST: ' + naam, async () => lokaal(async ({ t, post, kassa }) => {
  metDrieProeven(t); wijzig(t);
  const historie = structuredClone([t.externe_bestellingen, t.externe_bestelling_poging]);
  const r = await post(gb04); assertEquals(r.status, naam === 'manager' ? 403 : 409);
  assertEquals(kassa.length, 0);
  assertEquals([t.externe_bestellingen, t.externe_bestelling_poging], historie);
}));

for (const mode of ['timeout', 'weigering']) Deno.test('GB04 ' + mode + ' nooit opnieuw verzenden', async () => lokaal(async ({ t, post, fout, kassa }) => {
  metDrieProeven(t); fout(mode);
  assertEquals((await (await post(gb04)).json()).status, mode === 'timeout' ? 'uitkomst_onbekend' : 'geweigerd');
  assertEquals((await post(gb04)).status, 409);
  const rij = t.externe_bestellingen[3]; rij.status = 'verzenden'; rij.versie = 2;
  await verzend(createClient('http://127.0.0.1:9876', 'lokaal'), { ...rij }, fetch, VIERDE_PROEF.vrijgave);
  assertEquals(kassa.length, 1); assertEquals(t.externe_bestelling_poging.length, 4);
}));

Deno.test('GB04 weigert verlopen Amsterdamse datum en gewijzigde opdracht', async () => lokaal(async ({ t, post, kassa }) => {
  metDrieProeven(t);
  for (const b of [{ ...gb04, bevestiging: false }, { ...gb04, referentie: 'ANDER' }, { ...gb04, regels: [] }]) assertEquals((await post(b)).status, 400);
  Date.now = () => Date.parse('2026-11-22T23:00:00Z');
  assertEquals((await post(gb04)).status, 409); assertEquals(kassa.length, 0);
}));

for (const [naam, wijzig] of [
  ['eigenaarsrol ingetrokken', (t: Record<string, Rij[]>) => { t.user_roles[0].is_active = false; }],
  ['live aangezet', (t: Record<string, Rij[]>) => { t.fase2_vlag[0].aan = true; }],
  ['klant gewijzigd', (t: Record<string, Rij[]>) => { t.externe_kassa_config[0].lightspeed_klant_id = '555'; }],
  ['opgeslagen inhoud gewijzigd', (t: Record<string, Rij[]>) => { t.externe_bestellingen[3].invoer.klant.naam = 'Andere gast'; }],
] as const) Deno.test('GB04 laatste controle blokkeert: ' + naam, async () => lokaal(async ({ t, post, naBericht, kassa }) => {
  metDrieProeven(t); naBericht(() => wijzig(t));
  assertEquals((await (await post(gb04)).json()).status, 'geblokkeerd');
  assertEquals(kassa.length, 0); assertEquals(t.externe_bestelling_poging[3].uitkomst, 'niet_verstuurd');
}));

function metVierProeven(t: Record<string, Rij[]>) {
  metDrieProeven(t);
  t.externe_bestellingen.push({ id: VIERDE_PROEF.orderId, extern_id: VIERDE_PROEF.referentie, referentie: VIERDE_PROEF.referentie, vestiging: "Midsland", merchant_id: "36864", modus: "live", status: "verzonden", lightspeed_order_id: "19944900" });
  t.externe_bestelling_poging.push({ id: VIERDE_PROEF.pogingId, bestelling_id: VIERDE_PROEF.orderId, soort: "verzenden", uitkomst: "verzonden", http_status: 201, antwoord: "19944900" });
}
const gb05 = { actie: 'ginger_beer_proef_gb05', referentie: VIJFDE_PROEF.referentie, bevestiging: true };
 Deno.test('GB05 verstrijken van 45 minuten vóór POST blokkeert zonder herhaling', async () => lokaal(async ({ t, post, naBericht, kassa }) => {
  metVierProeven(t);
  naBericht(() => { Date.now = () => NU + 46 * 60_000; });
  assertEquals((await (await post(gb05)).json()).status, 'geblokkeerd');
  assertEquals(kassa.length, 0);
  assertEquals(t.externe_bestelling_poging[4].uitkomst, 'niet_verstuurd');
  assertEquals((await post(gb05)).status, 409);
  assertEquals(kassa.length, 0);
}));
 Deno.test('GB05 ontbrekende vaste klant of West-configuratie blokkeert zonder opslag', async () => lokaal(async ({ t, post, kassa }) => {
  metVierProeven(t);
  t.externe_kassa_config[0].lightspeed_klant_id = null;
  assertEquals((await post(gb05)).status, 409);
  t.externe_kassa_config[0].lightspeed_klant_id = '13597022';
  t.externe_kassa_config[0].merchant_id = '41121';
  assertEquals((await post(gb05)).status, 409);
  assertEquals(t.externe_bestellingen.length, 4);
  assertEquals(t.externe_bestelling_poging.length, 4);
  assertEquals(kassa.length, 0);
}));
Deno.test('GB05 exact één Ginger Beer €4,90 met btw en betaalarray; parallel/retry nooit tweede POST', async () => lokaal(async ({ t, post, partner, kassa }) => {
  metVierProeven(t);
  const historie = structuredClone([t.externe_bestellingen, t.externe_bestelling_poging]);
  assertEquals((await partner(proefInvoer(NU, VIJFDE_PROEF))).status, 403);
  assertEquals((await partner({ actie: 'ophaaltijd', bestelnummer: VIJFDE_PROEF.referentie, modus: 'live', vestiging: '36864', ophaaltijd: new Date(NU).toISOString() })).status, 403);
  assertEquals((await post(gb05, false)).status, 401);
  assertEquals((await Promise.all([post(gb05), post(gb05)])).map(r => r.status).sort(), [200, 409]);
  assertEquals((await post(gb05)).status, 409);
  assertEquals(kassa.length, 1);
  assertEquals(kassa[0].externalReference, 'PV-PROEF-MID-20261122-GB05');
  assertEquals(kassa[0].description, 'PV-PROEF-MID-20261122-GB05 — Pura Test');
  assertEquals(kassa[0].note, 'TEST – niet klaarmaken');
  assertEquals(kassa[0].deliveryDate, new Date(NU).toISOString());
  assertEquals(kassa[0].orderItems, [{ productId: 4636894, amount: 1, unitPrice: 4.9, totalPrice: 4.9, unitPriceWithoutVat: 4.4954, totalPriceWithoutVat: 4.5, modifiers: [], subitems: [] }]);
  assertEquals(kassa[0].orderPayments, [{ amount: 4.9, paymentTypeId: 285794, paymentTypeTypeId: 4, tip: 0 }]);
  assertEquals(t.externe_bestellingen[4].id, VIJFDE_PROEF.orderId);
  assertEquals(t.externe_bestelling_poging[4].id, VIJFDE_PROEF.pogingId);
  assertEquals([t.externe_bestellingen.slice(0, 4), t.externe_bestelling_poging.slice(0, 4)], historie);
  assertEquals(t.fase2_vlag[0].aan, false);
  t.fase2_vlag[0].aan = true;
  assertEquals((await post({ actie: 'herverzenden', id: VIJFDE_PROEF.orderId, bevestiging: true, reden: 'Geen herhaling van proef' })).status, 409);
  assertEquals((await post({ actie: 'vrijgeven', id: VIJFDE_PROEF.orderId })).status, 409);
  assertEquals(kassa.length, 1);
}));

for (const [naam, wijzig] of [
  ['ander eigenaaraccount', (t: Record<string, Rij[]>) => { t.user_roles[0].user_id = 'andere-owner'; }],
  ['manager', (t: Record<string, Rij[]>) => { t.user_roles[0].role = 'manager'; }],
  ['live aan', (t: Record<string, Rij[]>) => { t.fase2_vlag[0].aan = true; }],
  ['andere vaste klant', (t: Record<string, Rij[]>) => { t.externe_kassa_config[0].lightspeed_klant_id = '555'; }],
  ['ander betaaltype', (t: Record<string, Rij[]>) => { t.externe_kassa_config[0].lightspeed_betaalwijze_type_id = '3'; }],
  ['andere prijs', (t: Record<string, Rij[]>) => { t.externe_product_koppeling[0].prijs_cent = 491; }],
  ['GB01 niet definitief', (t: Record<string, Rij[]>) => { t.externe_bestellingen[0].status = 'uitkomst_onbekend'; }],
  ['GB02 niet definitief', (t: Record<string, Rij[]>) => { t.externe_bestellingen[1].status = 'uitkomst_onbekend'; }],
  ['GB02 order-ID aanwezig', (t: Record<string, Rij[]>) => { t.externe_bestellingen[1].lightspeed_order_id = '8000'; }],
  ['GB02 poging ontbreekt', (t: Record<string, Rij[]>) => { t.externe_bestelling_poging.splice(1, 1); }],
  ['GB02 twee pogingen', (t: Record<string, Rij[]>) => { t.externe_bestelling_poging.push({ ...t.externe_bestelling_poging[1], id: 'extra' }); }],
  ['GB02 andere HTTP-code', (t: Record<string, Rij[]>) => { t.externe_bestelling_poging[1].http_status = 500; }],
  ['GB02 andere fout', (t: Record<string, Rij[]>) => { t.externe_bestelling_poging[1].antwoord = '{"errors":["andere fout"]}'; }],
  ['GB05 permanente poging bestaat', (t: Record<string, Rij[]>) => { t.externe_bestelling_poging.push({ id: VIJFDE_PROEF.pogingId, bestelling_id: 'ander' }); }],
  ['GB05 poging op order bestaat', (t: Record<string, Rij[]>) => { t.externe_bestelling_poging.push({ id: 'ander', bestelling_id: VIJFDE_PROEF.orderId }); }],
  ['GB05 testorder bestaat', (t: Record<string, Rij[]>) => { t.externe_bestellingen.push({ id: 'test', extern_id: VIJFDE_PROEF.referentie, merchant_id: '36864', modus: 'test', status: 'test_ok' }); }],
] as const) Deno.test('GB05 blokkeert zonder POST: ' + naam, async () => lokaal(async ({ t, post, kassa }) => {
  metVierProeven(t); wijzig(t);
  const historie = structuredClone([t.externe_bestellingen, t.externe_bestelling_poging]);
  const r = await post(gb05); assertEquals(r.status, naam === 'manager' ? 403 : 409);
  assertEquals(kassa.length, 0);
  assertEquals([t.externe_bestellingen, t.externe_bestelling_poging], historie);
}));

for (const mode of ['timeout', 'weigering']) Deno.test('GB05 ' + mode + ' nooit opnieuw verzenden', async () => lokaal(async ({ t, post, fout, kassa }) => {
  metVierProeven(t); fout(mode);
  assertEquals((await (await post(gb05)).json()).status, mode === 'timeout' ? 'uitkomst_onbekend' : 'geweigerd');
  assertEquals((await post(gb05)).status, 409);
  const rij = t.externe_bestellingen[4]; rij.status = 'verzenden'; rij.versie = 2;
  await verzend(createClient('http://127.0.0.1:9876', 'lokaal'), { ...rij }, fetch, VIJFDE_PROEF.vrijgave);
  assertEquals(kassa.length, 1); assertEquals(t.externe_bestelling_poging.length, 5);
}));

Deno.test('GB05 weigert verlopen Amsterdamse datum en gewijzigde opdracht', async () => lokaal(async ({ t, post, kassa }) => {
  metVierProeven(t);
  for (const b of [{ ...gb05, bevestiging: false }, { ...gb05, referentie: 'ANDER' }, { ...gb05, regels: [] }]) assertEquals((await post(b)).status, 400);
  Date.now = () => Date.parse('2026-11-22T23:00:00Z');
  assertEquals((await post(gb05)).status, 409); assertEquals(kassa.length, 0);
}));

for (const [naam, wijzig] of [
  ['eigenaarsrol ingetrokken', (t: Record<string, Rij[]>) => { t.user_roles[0].is_active = false; }],
  ['live aangezet', (t: Record<string, Rij[]>) => { t.fase2_vlag[0].aan = true; }],
  ['klant gewijzigd', (t: Record<string, Rij[]>) => { t.externe_kassa_config[0].lightspeed_klant_id = '555'; }],
  ['opgeslagen inhoud gewijzigd', (t: Record<string, Rij[]>) => { t.externe_bestellingen[4].invoer.klant.naam = 'Andere gast'; }],
] as const) Deno.test('GB05 laatste controle blokkeert: ' + naam, async () => lokaal(async ({ t, post, naBericht, kassa }) => {
  metVierProeven(t); naBericht(() => wijzig(t));
  assertEquals((await (await post(gb05)).json()).status, 'geblokkeerd');
  assertEquals(kassa.length, 0); assertEquals(t.externe_bestelling_poging[4].uitkomst, 'niet_verstuurd');
}));

function metVijfProeven(t: Record<string, Rij[]>) {
  metVierProeven(t);
  t.externe_bestellingen.push({ id: VIJFDE_PROEF.orderId, extern_id: VIJFDE_PROEF.referentie, referentie: VIJFDE_PROEF.referentie, vestiging: 'Midsland', merchant_id: '36864', modus: 'live', status: 'verzonden', lightspeed_order_id: '19944975' });
  t.externe_bestelling_poging.push({ id: VIJFDE_PROEF.pogingId, bestelling_id: VIJFDE_PROEF.orderId, soort: 'verzenden', uitkomst: 'verzonden', http_status: 201, antwoord: '19944975' });
}
const gb06 = { actie: 'ginger_beer_proef_gb06', referentie: ZESDE_PROEF.referentie, bevestiging: true };
 Deno.test('GB06 verstrijken van 45 minuten vóór POST blokkeert zonder herhaling', async () => lokaal(async ({ t, post, naBericht, kassa }) => {
  metVijfProeven(t);
  naBericht(() => { Date.now = () => NU + 46 * 60_000; });
  assertEquals((await (await post(gb06)).json()).status, 'geblokkeerd');
  assertEquals(kassa.length, 0);
  assertEquals(t.externe_bestelling_poging[5].uitkomst, 'niet_verstuurd');
  assertEquals((await post(gb06)).status, 409);
  assertEquals(kassa.length, 0);
}));
 Deno.test('GB06 ontbrekende vaste klant of West-configuratie blokkeert zonder opslag', async () => lokaal(async ({ t, post, kassa }) => {
  metVijfProeven(t);
  t.externe_kassa_config[0].lightspeed_klant_id = null;
  assertEquals((await post(gb06)).status, 409);
  t.externe_kassa_config[0].lightspeed_klant_id = '13597022';
  t.externe_kassa_config[0].merchant_id = '41121';
  assertEquals((await post(gb06)).status, 409);
  assertEquals(t.externe_bestellingen.length, 5);
  assertEquals(t.externe_bestelling_poging.length, 5);
  assertEquals(kassa.length, 0);
}));
Deno.test('GB06 exact één Ginger Beer €4,90 met btw en betaalarray; parallel/retry nooit tweede POST', async () => lokaal(async ({ t, post, partner, kassa }) => {
  metVijfProeven(t);
  const historie = structuredClone([t.externe_bestellingen, t.externe_bestelling_poging]);
  assertEquals((await partner(proefInvoer(NU, ZESDE_PROEF))).status, 403);
  assertEquals((await partner({ actie: 'ophaaltijd', bestelnummer: ZESDE_PROEF.referentie, modus: 'live', vestiging: '36864', ophaaltijd: new Date(NU).toISOString() })).status, 403);
  assertEquals((await post(gb06, false)).status, 401);
  assertEquals((await Promise.all([post(gb06), post(gb06)])).map(r => r.status).sort(), [200, 409]);
  assertEquals((await post(gb06)).status, 409);
  assertEquals(kassa.length, 1);
  assertEquals(kassa[0].externalReference, 'PV-PROEF-MID-20261122-GB06');
  assertEquals(kassa[0].description, 'PV-PROEF-MID-20261122-GB06 — Pura Test');
  assertEquals(kassa[0].note, 'TEST – niet klaarmaken');
  assertEquals(kassa[0].deliveryDate, new Date(NU).toISOString());
  assertEquals(kassa[0].orderItems, [{ productId: 4636894, amount: 1, unitPrice: 4.9, totalPrice: 4.9, unitPriceWithoutVat: 4.4954, totalPriceWithoutVat: 4.5, modifiers: [], subitems: [] }]);
  assertEquals(kassa[0].orderPayments, [{ amount: 4.9, paymentTypeId: 285794, paymentTypeTypeId: 4, tip: 0 }]);
  assertEquals(t.externe_bestellingen[5].id, ZESDE_PROEF.orderId);
  assertEquals(t.externe_bestelling_poging[5].id, ZESDE_PROEF.pogingId);
  assertEquals([t.externe_bestellingen.slice(0, 5), t.externe_bestelling_poging.slice(0, 5)], historie);
  assertEquals(t.fase2_vlag[0].aan, false);
  t.fase2_vlag[0].aan = true;
  assertEquals((await post({ actie: 'herverzenden', id: ZESDE_PROEF.orderId, bevestiging: true, reden: 'Geen herhaling van proef' })).status, 409);
  assertEquals((await post({ actie: 'vrijgeven', id: ZESDE_PROEF.orderId })).status, 409);
  assertEquals(kassa.length, 1);
}));

for (const [naam, wijzig] of [
  ['ander eigenaaraccount', (t: Record<string, Rij[]>) => { t.user_roles[0].user_id = 'andere-owner'; }],
  ['manager', (t: Record<string, Rij[]>) => { t.user_roles[0].role = 'manager'; }],
  ['live aan', (t: Record<string, Rij[]>) => { t.fase2_vlag[0].aan = true; }],
  ['andere vaste klant', (t: Record<string, Rij[]>) => { t.externe_kassa_config[0].lightspeed_klant_id = '555'; }],
  ['ander betaaltype', (t: Record<string, Rij[]>) => { t.externe_kassa_config[0].lightspeed_betaalwijze_type_id = '3'; }],
  ['andere prijs', (t: Record<string, Rij[]>) => { t.externe_product_koppeling[0].prijs_cent = 491; }],
  ['GB01 niet definitief', (t: Record<string, Rij[]>) => { t.externe_bestellingen[0].status = 'uitkomst_onbekend'; }],
  ['GB02 niet definitief', (t: Record<string, Rij[]>) => { t.externe_bestellingen[1].status = 'uitkomst_onbekend'; }],
  ['GB02 order-ID aanwezig', (t: Record<string, Rij[]>) => { t.externe_bestellingen[1].lightspeed_order_id = '8000'; }],
  ['GB02 poging ontbreekt', (t: Record<string, Rij[]>) => { t.externe_bestelling_poging.splice(1, 1); }],
  ['GB02 twee pogingen', (t: Record<string, Rij[]>) => { t.externe_bestelling_poging.push({ ...t.externe_bestelling_poging[1], id: 'extra' }); }],
  ['GB02 andere HTTP-code', (t: Record<string, Rij[]>) => { t.externe_bestelling_poging[1].http_status = 500; }],
  ['GB02 andere fout', (t: Record<string, Rij[]>) => { t.externe_bestelling_poging[1].antwoord = '{"errors":["andere fout"]}'; }],
  ['GB06 permanente poging bestaat', (t: Record<string, Rij[]>) => { t.externe_bestelling_poging.push({ id: ZESDE_PROEF.pogingId, bestelling_id: 'ander' }); }],
  ['GB06 poging op order bestaat', (t: Record<string, Rij[]>) => { t.externe_bestelling_poging.push({ id: 'ander', bestelling_id: ZESDE_PROEF.orderId }); }],
  ['GB06 testorder bestaat', (t: Record<string, Rij[]>) => { t.externe_bestellingen.push({ id: 'test', extern_id: ZESDE_PROEF.referentie, merchant_id: '36864', modus: 'test', status: 'test_ok' }); }],
] as const) Deno.test('GB06 blokkeert zonder POST: ' + naam, async () => lokaal(async ({ t, post, kassa }) => {
  metVijfProeven(t); wijzig(t);
  const historie = structuredClone([t.externe_bestellingen, t.externe_bestelling_poging]);
  const r = await post(gb06); assertEquals(r.status, naam === 'manager' ? 403 : 409);
  assertEquals(kassa.length, 0);
  assertEquals([t.externe_bestellingen, t.externe_bestelling_poging], historie);
}));

for (const mode of ['timeout', 'weigering']) Deno.test('GB06 ' + mode + ' nooit opnieuw verzenden', async () => lokaal(async ({ t, post, fout, kassa }) => {
  metVijfProeven(t); fout(mode);
  assertEquals((await (await post(gb06)).json()).status, mode === 'timeout' ? 'uitkomst_onbekend' : 'geweigerd');
  assertEquals((await post(gb06)).status, 409);
  const rij = t.externe_bestellingen[5]; rij.status = 'verzenden'; rij.versie = 2;
  await verzend(createClient('http://127.0.0.1:9876', 'lokaal'), { ...rij }, fetch, ZESDE_PROEF.vrijgave);
  assertEquals(kassa.length, 1); assertEquals(t.externe_bestelling_poging.length, 6);
}));

Deno.test('GB06 weigert verlopen Amsterdamse datum en gewijzigde opdracht', async () => lokaal(async ({ t, post, kassa }) => {
  metVijfProeven(t);
  for (const b of [{ ...gb06, bevestiging: false }, { ...gb06, referentie: 'ANDER' }, { ...gb06, regels: [] }]) assertEquals((await post(b)).status, 400);
  Date.now = () => Date.parse('2026-11-22T23:00:00Z');
  assertEquals((await post(gb06)).status, 409); assertEquals(kassa.length, 0);
}));

for (const [naam, wijzig] of [
  ['eigenaarsrol ingetrokken', (t: Record<string, Rij[]>) => { t.user_roles[0].is_active = false; }],
  ['live aangezet', (t: Record<string, Rij[]>) => { t.fase2_vlag[0].aan = true; }],
  ['klant gewijzigd', (t: Record<string, Rij[]>) => { t.externe_kassa_config[0].lightspeed_klant_id = '555'; }],
  ['opgeslagen inhoud gewijzigd', (t: Record<string, Rij[]>) => { t.externe_bestellingen[5].invoer.klant.naam = 'Andere gast'; }],
] as const) Deno.test('GB06 laatste controle blokkeert: ' + naam, async () => lokaal(async ({ t, post, naBericht, kassa }) => {
  metVijfProeven(t); naBericht(() => wijzig(t));
  assertEquals((await (await post(gb06)).json()).status, 'geblokkeerd');
  assertEquals(kassa.length, 0); assertEquals(t.externe_bestelling_poging[5].uitkomst, 'niet_verstuurd');
}));

function metZesProeven(t: Record<string, Rij[]>) {
  metVijfProeven(t);
  t.externe_bestellingen.push({ id: ZESDE_PROEF.orderId, extern_id: ZESDE_PROEF.referentie, referentie: ZESDE_PROEF.referentie, vestiging: 'Midsland', merchant_id: '36864', modus: 'live', status: 'verzonden', lightspeed_order_id: '19946163' });
  t.externe_bestelling_poging.push({ id: ZESDE_PROEF.pogingId, bestelling_id: ZESDE_PROEF.orderId, soort: 'verzenden', uitkomst: 'verzonden', http_status: 201, antwoord: '19946163' });
}
const gb07 = { actie: 'ginger_beer_proef_gb07', referentie: ZEVENDE_PROEF.referentie, bevestiging: true };
 Deno.test('GB07 verstrijken van 45 minuten vóór POST blokkeert zonder herhaling', async () => lokaal(async ({ t, post, naBericht, kassa }) => {
  metZesProeven(t);
  naBericht(() => { Date.now = () => NU + 46 * 60_000; });
  assertEquals((await (await post(gb07)).json()).status, 'geblokkeerd');
  assertEquals(kassa.length, 0);
  assertEquals(t.externe_bestelling_poging[6].uitkomst, 'niet_verstuurd');
  assertEquals((await post(gb07)).status, 409);
  assertEquals(kassa.length, 0);
}));
 Deno.test('GB07 ontbrekende vaste klant of West-configuratie blokkeert zonder opslag', async () => lokaal(async ({ t, post, kassa }) => {
  metZesProeven(t);
  t.externe_kassa_config[0].lightspeed_klant_id = null;
  assertEquals((await post(gb07)).status, 409);
  t.externe_kassa_config[0].lightspeed_klant_id = '13597022';
  t.externe_kassa_config[0].merchant_id = '41121';
  assertEquals((await post(gb07)).status, 409);
  assertEquals(t.externe_bestellingen.length, 6);
  assertEquals(t.externe_bestelling_poging.length, 6);
  assertEquals(kassa.length, 0);
}));
Deno.test('GB07 exact één Ginger Beer €4,90 met btw en betaalarray; parallel/retry nooit tweede POST', async () => lokaal(async ({ t, post, partner, kassa }) => {
  metZesProeven(t);
  const historie = structuredClone([t.externe_bestellingen, t.externe_bestelling_poging]);
  assertEquals((await partner(proefInvoer(NU, ZEVENDE_PROEF))).status, 403);
  assertEquals((await partner({ actie: 'ophaaltijd', bestelnummer: ZEVENDE_PROEF.referentie, modus: 'live', vestiging: '36864', ophaaltijd: new Date(NU).toISOString() })).status, 403);
  assertEquals((await post(gb07, false)).status, 401);
  assertEquals((await Promise.all([post(gb07), post(gb07)])).map(r => r.status).sort(), [200, 409]);
  assertEquals((await post(gb07)).status, 409);
  assertEquals(kassa.length, 1);
  assertEquals(kassa[0].externalReference, 'PV-PROEF-MID-20261122-GB07');
  assertEquals(kassa[0].description, 'PV-PROEF-MID-20261122-GB07 — Pura Test');
  assertEquals(kassa[0].note, 'TEST – niet klaarmaken');
  assertEquals(kassa[0].deliveryDate, new Date(NU).toISOString());
  assertEquals(kassa[0].orderItems, [{ productId: 4636894, amount: 1, unitPrice: 4.9, totalPrice: 4.9, unitPriceWithoutVat: 4.4954, totalPriceWithoutVat: 4.5, modifiers: [], subitems: [] }]);
  assertEquals(kassa[0].orderPayments, [{ amount: 4.9, paymentTypeId: 285794, paymentTypeTypeId: 4, tip: 0 }]);
  assertEquals(t.externe_bestellingen[6].id, ZEVENDE_PROEF.orderId);
  assertEquals(t.externe_bestelling_poging[6].id, ZEVENDE_PROEF.pogingId);
  assertEquals([t.externe_bestellingen.slice(0, 6), t.externe_bestelling_poging.slice(0, 6)], historie);
  assertEquals(t.fase2_vlag[0].aan, false);
  t.fase2_vlag[0].aan = true;
  assertEquals((await post({ actie: 'herverzenden', id: ZEVENDE_PROEF.orderId, bevestiging: true, reden: 'Geen herhaling van proef' })).status, 409);
  assertEquals((await post({ actie: 'vrijgeven', id: ZEVENDE_PROEF.orderId })).status, 409);
  assertEquals(kassa.length, 1);
}));

for (const [naam, wijzig] of [
  ['ander eigenaaraccount', (t: Record<string, Rij[]>) => { t.user_roles[0].user_id = 'andere-owner'; }],
  ['manager', (t: Record<string, Rij[]>) => { t.user_roles[0].role = 'manager'; }],
  ['live aan', (t: Record<string, Rij[]>) => { t.fase2_vlag[0].aan = true; }],
  ['andere vaste klant', (t: Record<string, Rij[]>) => { t.externe_kassa_config[0].lightspeed_klant_id = '555'; }],
  ['ander betaaltype', (t: Record<string, Rij[]>) => { t.externe_kassa_config[0].lightspeed_betaalwijze_type_id = '3'; }],
  ['andere prijs', (t: Record<string, Rij[]>) => { t.externe_product_koppeling[0].prijs_cent = 491; }],
  ['GB01 niet definitief', (t: Record<string, Rij[]>) => { t.externe_bestellingen[0].status = 'uitkomst_onbekend'; }],
  ['GB02 niet definitief', (t: Record<string, Rij[]>) => { t.externe_bestellingen[1].status = 'uitkomst_onbekend'; }],
  ['GB02 order-ID aanwezig', (t: Record<string, Rij[]>) => { t.externe_bestellingen[1].lightspeed_order_id = '8000'; }],
  ['GB02 poging ontbreekt', (t: Record<string, Rij[]>) => { t.externe_bestelling_poging.splice(1, 1); }],
  ['GB02 twee pogingen', (t: Record<string, Rij[]>) => { t.externe_bestelling_poging.push({ ...t.externe_bestelling_poging[1], id: 'extra' }); }],
  ['GB02 andere HTTP-code', (t: Record<string, Rij[]>) => { t.externe_bestelling_poging[1].http_status = 500; }],
  ['GB02 andere fout', (t: Record<string, Rij[]>) => { t.externe_bestelling_poging[1].antwoord = '{"errors":["andere fout"]}'; }],
  ['GB07 permanente poging bestaat', (t: Record<string, Rij[]>) => { t.externe_bestelling_poging.push({ id: ZEVENDE_PROEF.pogingId, bestelling_id: 'ander' }); }],
  ['GB07 poging op order bestaat', (t: Record<string, Rij[]>) => { t.externe_bestelling_poging.push({ id: 'ander', bestelling_id: ZEVENDE_PROEF.orderId }); }],
  ['GB07 testorder bestaat', (t: Record<string, Rij[]>) => { t.externe_bestellingen.push({ id: 'test', extern_id: ZEVENDE_PROEF.referentie, merchant_id: '36864', modus: 'test', status: 'test_ok' }); }],
] as const) Deno.test('GB07 blokkeert zonder POST: ' + naam, async () => lokaal(async ({ t, post, kassa }) => {
  metZesProeven(t); wijzig(t);
  const historie = structuredClone([t.externe_bestellingen, t.externe_bestelling_poging]);
  const r = await post(gb07); assertEquals(r.status, naam === 'manager' ? 403 : 409);
  assertEquals(kassa.length, 0);
  assertEquals([t.externe_bestellingen, t.externe_bestelling_poging], historie);
}));

for (const mode of ['timeout', 'weigering']) Deno.test('GB07 ' + mode + ' nooit opnieuw verzenden', async () => lokaal(async ({ t, post, fout, kassa }) => {
  metZesProeven(t); fout(mode);
  assertEquals((await (await post(gb07)).json()).status, mode === 'timeout' ? 'uitkomst_onbekend' : 'geweigerd');
  assertEquals((await post(gb07)).status, 409);
  const rij = t.externe_bestellingen[6]; rij.status = 'verzenden'; rij.versie = 2;
  await verzend(createClient('http://127.0.0.1:9876', 'lokaal'), { ...rij }, fetch, ZEVENDE_PROEF.vrijgave);
  assertEquals(kassa.length, 1); assertEquals(t.externe_bestelling_poging.length, 7);
}));

Deno.test('GB07 weigert verlopen Amsterdamse datum en gewijzigde opdracht', async () => lokaal(async ({ t, post, kassa }) => {
  metZesProeven(t);
  for (const b of [{ ...gb07, bevestiging: false }, { ...gb07, referentie: 'ANDER' }, { ...gb07, regels: [] }]) assertEquals((await post(b)).status, 400);
  Date.now = () => Date.parse('2026-11-22T23:00:00Z');
  assertEquals((await post(gb07)).status, 409); assertEquals(kassa.length, 0);
}));

for (const [naam, wijzig] of [
  ['eigenaarsrol ingetrokken', (t: Record<string, Rij[]>) => { t.user_roles[0].is_active = false; }],
  ['live aangezet', (t: Record<string, Rij[]>) => { t.fase2_vlag[0].aan = true; }],
  ['klant gewijzigd', (t: Record<string, Rij[]>) => { t.externe_kassa_config[0].lightspeed_klant_id = '555'; }],
  ['opgeslagen inhoud gewijzigd', (t: Record<string, Rij[]>) => { t.externe_bestellingen[6].invoer.klant.naam = 'Andere gast'; }],
] as const) Deno.test('GB07 laatste controle blokkeert: ' + naam, async () => lokaal(async ({ t, post, naBericht, kassa }) => {
  metZesProeven(t); naBericht(() => wijzig(t));
  assertEquals((await (await post(gb07)).json()).status, 'geblokkeerd');
  assertEquals(kassa.length, 0); assertEquals(t.externe_bestelling_poging[6].uitkomst, 'niet_verstuurd');
}));
