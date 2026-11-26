// Volledige ontvang- en gesimuleerde liveweg, uitsluitend in geheugen; geen netwerkrechten.
import { assertEquals } from 'jsr:@std/assert@1';
import { fictiefProduct, GINGER_KAART, mockKaart, TEST_KLASSEN } from '../_shared/eilandbezorgerPrijsFixtures.ts';
import { orderbericht } from '../_shared/eilandbezorgerLogica.ts';
import { prijsRegels } from '../_shared/eilandbezorgerPrijzen.ts';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { verzend } from '../_shared/eilandbezorgerVerzend.ts';

type Rij = Record<string, any>;
let handler: ((req: Request) => Promise<Response>) | undefined;
const serve = Deno.serve;
Object.defineProperty(Deno, 'serve', { value: (fn: typeof handler) => { handler = fn; return {}; }, configurable: true });
await import('./index.ts');
Object.defineProperty(Deno, 'serve', { value: serve, configurable: true });

const gast = { voornaam: 'Sanne', achternaam: 'de Vries' };
const bericht = (nr: string, modus = 'test') => ({ versie: 1, modus, bestelnummer: nr, vestiging: '36864',
  ophaaltijd: '2026-11-22T18:00:00+01:00', klant: gast, opmerking: 'Saus apart',
  regels: [{ code: 'PV-FFA8275F', naam: 'Zoete Aardappel Friet', aantal: 3, stukprijs_cent: 700, extras: [] }],
  bedragen: { restaurant_cent: 2100, bezorgkosten_cent: 350, fooi_cent: 0, korting: null }, betaling: { wijze: 'vooraf_betaald', referentie: 'tr_testfictief' } });

async function proef(run: (t: Record<string, Rij[]>, post: (b: unknown) => Promise<Response>, kassa: Rij[], kaartGets: string[]) => Promise<void>) {
  const vars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'EILANDBEZORGER_SLEUTEL'];
  const oud = vars.map((k) => Deno.env.get(k));
  Deno.env.set(vars[0], 'http://127.0.0.1:9876'); Deno.env.set(vars[1], 'lokaal'); Deno.env.set(vars[2], 'lokaal');
  const t: Record<string, Rij[]> = {
    externe_bestellingen: [], externe_bestelling_log: [], externe_bestelling_poging: [], user_roles: [], notifications: [],
    kaart_producten: [fictiefProduct(4636994, 7)],
    externe_product_koppeling: [{ vestiging: 'Midsland', soort: 'product', externe_code: 'PV-FFA8275F', lightspeed_product_id: '4636994', naam: 'Zoete Aardappel Friet', prijs_cent: 700, actief: true }],
    externe_kassa_config: [{ vestiging: 'Midsland', lightspeed_klant_id: '901', lightspeed_betaalwijze_id: '77', lightspeed_betaalwijze_type_id: '3', order_route: 'customer_order', venster_minuten: 45 }],
    fase2_vlag: [{ vestiging: 'Midsland', vlag: 'eilandbezorger_live', aan: true }],
    lightspeed_connections: [{ vestiging: 'Midsland', merchant_id: '36864', status: 'gekoppeld', access_token: 'lokaal', token_expires_at: '2999-01-01T00:00:00Z' }],
  };
  const kassa: Rij[] = [], kaartGets: string[] = []; const fetchOud = globalThis.fetch; const nuOud = Date.now;
  Date.now = () => Date.parse('2026-11-22T16:30:00Z');
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const u = new URL(String(input)); const method = init?.method ?? 'GET';
    const kaart = mockKaart(input, init, t.kaart_producten as any); if (kaart) { kaartGets.push(u.pathname); return kaart; }
    if (u.hostname === 'lightspeedapis.com') {
      if (u.pathname !== '/resto/rest/onlineordering/customer/901/order' || method !== 'POST') throw new Error('Verboden Lightspeed-klantactie');
      kassa.push(JSON.parse(String(init?.body))); return Response.json({ id: 8001 }, { status: 201 });
    }
    if (u.origin !== 'http://127.0.0.1:9876' || !u.pathname.startsWith('/rest/v1/')) throw new Error('Netwerk buiten lokale mock verboden');
    const tabel = u.pathname.split('/').at(-1) ?? ''; const rijen = t[tabel] ??= [];
    const past = (r: Rij) => [...u.searchParams].every(([k, v]) => {
      if (['select', 'limit', 'order'].includes(k)) return true;
      if (v.startsWith('eq.')) return String(r[k]) === v.slice(3);
      if (v.startsWith('in.(')) return v.slice(4, -1).split(',').includes(String(r[k]));
      throw new Error('Niet ondersteunde lokale filter');
    });
    let uit = rijen.filter(past);
    if (method === 'POST') {
      const raw = JSON.parse(String(init?.body)); const nieuw = Array.isArray(raw) ? raw : [raw];
      if (tabel === 'externe_bestellingen' && nieuw.some((r: Rij) => rijen.some((x) => x.extern_id === r.extern_id && x.modus === r.modus && x.merchant_id === r.merchant_id))) return Response.json({ code: '23505' }, { status: 409 });
      uit = nieuw.map((r: Rij) => ({ id: crypto.randomUUID(), bron: 'eilandbezorger', versie: 1, updated_at: new Date().toISOString(), uitkomst: 'bezig', ...r })); rijen.push(...uit);
    } else if (method === 'PATCH') { const patch = JSON.parse(String(init?.body)); uit.forEach((r) => Object.assign(r, patch)); }
    const accept = new Headers(init?.headers).get('Accept');
    return Response.json(accept?.includes('vnd.pgrst.object') ? uit[0] : uit, { status: method === 'POST' ? 201 : 200 });
  }) as typeof fetch;
  try {
    const fn = handler; if (!fn) throw new Error('Ontvangfunctie ontbreekt');
    await run(t, (b) => fn(new Request('http://lokaal/bestelling', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-eilandbezorger-sleutel': 'lokaal' }, body: JSON.stringify(b) })), kassa, kaartGets);
  } finally {
    globalThis.fetch = fetchOud; Date.now = nuOud;
    vars.forEach((k, i) => { const v = oud[i]; if (v === undefined) Deno.env.delete(k); else Deno.env.set(k, v); });
  }
}

Deno.test('ontvangst Sanne: test_ok, contactgegevens niet opgeslagen, nul kassatoegang', async () => {
  await proef(async (t, post, kassa, kaartGets) => {
    const b = { ...bericht('EB-TEST-20261122-120013'), klant: { ...gast, email: 'ongeldig', telefoon: 123, klantcode: null } };
    const r = await post(b); assertEquals(r.status, 201); assertEquals((await r.json()).status, 'test_ok');
    assertEquals(t.externe_bestellingen[0].invoer.klant, { naam: 'Sanne de Vries' });
    assertEquals(t.externe_bestellingen[0].orderbericht, null);
    assertEquals(t.externe_bestellingen[0].invoer.opmerking, 'Saus apart');
    assertEquals(kassa.length, 0); assertEquals(t.externe_bestelling_poging.length, 0);
    assertEquals(kaartGets.length, 0);
    for (const veld of ['email', 'telefoon', 'klantcode']) assertEquals(JSON.stringify(t.externe_bestellingen).includes(veld), false);
    const herhaald = await post(b); assertEquals(herhaald.status, 200); await herhaald.json(); assertEquals(t.externe_bestellingen.length, 1);
  });
});

Deno.test('ontvangst geplande order: numerieke netto in bericht, nog geen verzendpoging', async () => {
  await proef(async(t,post,kassa,gets)=>{
    const r=await post({...bericht('LOKAAL-GEPLAND','live'),ophaaltijd:'2026-11-22T20:00:00+01:00'});
    assertEquals((await r.json()).status,'gepland');
    assertEquals(t.externe_bestellingen[0].orderbericht.orderItems[0].unitPriceWithoutVat,6.422);
    assertEquals(t.externe_bestellingen[0].orderbericht.orderItems[0].totalPriceWithoutVat,19.27);
    assertEquals(t.externe_bestellingen[0].orderbericht.orderPayments,[{amount:21,paymentTypeId:77,paymentTypeTypeId:3,tip:0}]);
    assertEquals(gets.length,2);assertEquals(kassa.length,0);assertEquals(t.externe_bestelling_poging.length,0);
  });
});
for(const [naam,patch] of [
  ['tegenstrijdig netto',{deliveryPriceWithoutVat:7}],
  ['onbekende bezorgklasse',{deliveryTaxClass:'onbekend'}],
  ['actuele prijs gewijzigd',{deliveryPrice:7.01}],
] as const) Deno.test(`ontvangst blokkeert ${naam} vóór plannen of verzenden`,async()=>{
  await proef(async(t,post,kassa)=>{
    Object.assign(t.kaart_producten[0],patch);
    const r=await post(bericht('LOKAAL-FOUT-'+naam.replaceAll(' ','-'),'live'));assertEquals(r.status,201);assertEquals((await r.json()).status,'geblokkeerd');
    assertEquals(t.externe_bestellingen[0].orderbericht,null);assertEquals(t.externe_bestelling_poging.length,0);assertEquals(kassa.length,0);
  });
});
Deno.test('gepland bericht is geen bypass: veranderde kaart blokkeert latere echte zendroute',async()=>{
  await proef(async(t,post,kassa,gets)=>{
    const res=await post({...bericht('LOKAAL-HERCONTROLE','live'),ophaaltijd:'2026-11-22T20:00:00+01:00'});assertEquals((await res.json()).status,'gepland');
    Object.assign(t.kaart_producten[0],{deliveryPriceWithoutVat:7});
    Date.now=()=>Date.parse('2026-11-22T16:31:01Z');
    const rij=t.externe_bestellingen[0];rij.status='verzenden';rij.versie++;
    const uit=await verzend(createClient('http://127.0.0.1:9876','lokaal'),{...rij});
    assertEquals(uit.status,'geblokkeerd');assertEquals(gets.length,4);assertEquals(kassa.length,0);assertEquals(t.externe_bestelling_poging.length,0);
  });
});

Deno.test('volledige gesimuleerde liveweg: vaste klant, één order, €21 en Sanne zonder contactvelden', async () => {
  await proef(async (t, post, kassa) => {
    const r = await post(bericht('LOKAAL-LIVE', 'live')); assertEquals(r.status, 201); assertEquals((await r.json()).status, 'verzonden');
    assertEquals(kassa.length, 1); assertEquals(kassa[0].customerId, 901);
    assertEquals(kassa[0].description, 'LOKAAL-LIVE — Sanne de Vries'); assertEquals(kassa[0].note, 'Saus apart');
    assertEquals(kassa[0].orderItems[0].amount, 3); assertEquals(kassa[0].orderItems[0].totalPrice, 21);
    assertEquals(kassa[0].orderPayments, [{ amount: 21, paymentTypeId: 77, paymentTypeTypeId: 3, tip: 0 }]);
    assertEquals(t.externe_bestelling_poging.length, 1);
  });
});

Deno.test('ontvangst live zonder vaste klant: opgeslagen geblokkeerd, nul kassatoegang', async () => {
  await proef(async (t, post, kassa) => {
    t.externe_kassa_config[0].lightspeed_klant_id = null;
    const r = await post(bericht('LOKAAL-GEEN-KLANT', 'live')); assertEquals(r.status, 201);
    const j = await r.json(); assertEquals(j.status, 'geblokkeerd'); assertEquals(j.reden, 'Vaste Lightspeed-klant Eilandbezorger voor Midsland ontbreekt.');
    assertEquals(kassa.length, 0); assertEquals(t.externe_bestelling_poging.length, 0);
  });
});

Deno.test('historische herhaling via ontvangfunctie: oude hash/contactvelden behouden, wijzigingen 409', async () => {
  await proef(async (t, post, kassa) => {
    const b = bericht('EB-TEST-20261122-120013');
    t.externe_bestellingen.push({ id: 'historisch', bron: 'eilandbezorger', merchant_id: '36864', extern_id: b.bestelnummer, modus: 'test', status: 'test_ok', ophaaltijd: b.ophaaltijd,
      vingerafdruk: 'oude-hash', invoer: { ...b, bedragen: { restaurant_cent: 2100, bezorgkosten_cent: 350, fooi_cent: 0 }, klant: { ...gast, email: 'oud@example.com', klantcode: 'oud' } } });
    const r = await post(b); assertEquals(r.status, 200); assertEquals((await r.json()).status, 'test_ok');
    const conflict = await post({ ...b, opmerking: 'Saus erbij' }); assertEquals(conflict.status, 409); await conflict.json();
    assertEquals(t.externe_bestellingen.length, 1); assertEquals(t.externe_bestellingen[0].vingerafdruk, 'oude-hash');
    assertEquals(t.externe_bestellingen[0].invoer.klant.email, 'oud@example.com'); assertEquals(kassa.length, 0);
  });
});

for (const aantal of [1, 3]) Deno.test(`ontvangst en zendroute onderschept: Ginger Beer ${aantal}× met bevestigde netto`, async () => {
  await proef(async (t, post, kassa, gets) => {
    t.kaart_producten = [structuredClone(GINGER_KAART)];
    Object.assign(t.externe_product_koppeling[0], { externe_code: 'PV-0680E844', lightspeed_product_id: '4636894', naam: 'Naturfrisk Ginger beer', prijs_cent: 490 });
    Object.assign(t.externe_kassa_config[0], { lightspeed_betaalwijze_id: '285794', lightspeed_betaalwijze_type_id: '4' });
    const b = { ...bericht('LOKAAL-GINGER-' + aantal, 'live'), regels: [{ code: 'PV-0680E844', aantal, stukprijs_cent: 490, extras: [] }], bedragen: { restaurant_cent: 490 * aantal, bezorgkosten_cent: 0, fooi_cent: 0, korting: null } };
    const r = await post(b); assertEquals((await r.json()).status, 'verzonden');
    assertEquals(kassa.length, 1); assertEquals(gets.length, 2); assertEquals(t.externe_bestelling_poging.length, 1);
    assertEquals(kassa[0].orderItems[0].unitPrice, 4.9);
    assertEquals(kassa[0].orderItems[0].unitPriceWithoutVat, 4.4954);
    assertEquals(kassa[0].orderItems[0].totalPriceWithoutVat, aantal === 1 ? 4.5 : 13.49);
    assertEquals(kassa[0].orderPayments, [{ amount: 490 * aantal / 100, paymentTypeId: 285794, paymentTypeTypeId: 4, tip: 0 }]);
    assertEquals(t.externe_bestellingen[0].orderbericht, kassa[0]);
  });
});

for (const scenario of ['toepasselijk', 'ontbreekt', 'verkeerde-prijs', 'tegenstrijdig', 'betaald'] as const) Deno.test(`testontvangst reguliere extra ${scenario}: cataloguscontrole, nooit kassabericht of poging`, async () => {
  await proef(async (t, post, kassa, gets) => {
    // Fictieve uitsluitend lokale optiegegevens, nooit echte mappings of kassaverzoeken.
    t.externe_product_koppeling.push({ vestiging: 'Midsland', soort: 'extra', externe_code: 'PV-FFA8275F|OPT', lightspeed_product_id: '9001', naam: 'Fictieve optie', prijs_cent: scenario === 'betaald' ? 50 : 0, actief: true });
    const values = [{ id: 9001, name: 'Fictief', price: scenario === 'verkeerde-prijs' ? 1 : 0, priceWithoutVAT: 0 }];
    if (scenario === 'tegenstrijdig') {
      values.push({ id: 9002, name: 'Fictief ander', price: 0, priceWithoutVAT: 0 });
      t.externe_product_koppeling.push({ vestiging: 'Midsland', soort: 'extra', externe_code: 'PV-FFA8275F|ANDER', lightspeed_product_id: '9002', naam: 'Fictieve andere optie', prijs_cent: 0, actief: true });
    }
    t.kaart_producten[0].additions = scenario === 'ontbreekt' ? [] : [{ id: 9000, name: 'Fictieve groep', values }];
    const basis = bericht('LOKAAL-EXTRA-' + scenario);
    const b = { ...basis, regels: [{ ...basis.regels[0], extras: [{ code: 'OPT', aantal: 1, stukprijs_cent: scenario === 'betaald' ? 50 : 0 }] }] };
    if (scenario === 'tegenstrijdig') b.regels[0].extras.push({ code: 'ANDER', aantal: 1, stukprijs_cent: 0 });
    b.bedragen.restaurant_cent = scenario === 'betaald' ? 2250 : 2100;
    const res = await post(b);
    assertEquals(res.status, scenario === 'toepasselijk' ? 201 : 422);
    assertEquals((await res.json()).status, scenario === 'toepasselijk' ? 'test_ok' : 'afgekeurd');
    assertEquals(gets.length, 2);
    assertEquals(t.externe_bestellingen[0].orderbericht, null);
    assertEquals(t.externe_bestelling_poging.length, 0);
    assertEquals(kassa.length, 0);
  });
});

for (const modus of ['test', 'live']) Deno.test(`bloemkool beide dieetkeuzes ${modus}: rauw behouden, bonnotitie bij planning/heropbouw, geen kassa-POST`, async () => {
  await proef(async (t, post, kassa) => {
    t.externe_product_koppeling = [{ vestiging: 'Midsland', soort: 'product', externe_code: 'PV-3AC166C3', lightspeed_product_id: '4705081', lightspeed_plu: 'F76', naam: 'Geroosterde bloemkool', prijs_cent: 1050, actief: true }];
    t.kaart_producten = [fictiefProduct(4705081, 10.5)];
    const basis = bericht('LOKAAL-BLOEMKOOL-' + modus, modus);
    const b = { ...basis, opmerking: '  Gastnotitie intact  ', ophaaltijd: '2026-11-22T20:00:00+01:00', regels: [{ code: 'PV-3AC166C3', aantal: 2, stukprijs_cent: 1050, extras: [{ code: 'PVK-AD715B1F-1', aantal: 1, stukprijs_cent: 0 }, { code: 'PVK-AD715B1F-2', aantal: 1, stukprijs_cent: 0 }] }] };
    const res = await post(b); assertEquals(res.status, 201); assertEquals((await res.json()).status, modus === 'test' ? 'test_ok' : 'gepland');
    const rij = t.externe_bestellingen[0];
    assertEquals(rij.invoer.regels, b.regels); assertEquals(rij.regels[0].extras, []); assertEquals(rij.regels[0].gast_verzoek, 'bloemkool_glutenvrij');
    const opnieuw = orderbericht({ referentie: rij.referentie, regels: prijsRegels(rij.regels, t.kaart_producten as any, TEST_KLASSEN), restaurant_cent: rij.restaurant_cent, ophaaltijd: rij.ophaaltijd, opmerking: rij.invoer.opmerking, betaalwijzeId: '77' });
    assertEquals(opnieuw.note, '  Gastnotitie intact  \n\nRegel 1 (2×) – Geroosterde bloemkool – gast vraagt glutenvrij');
    if (modus === 'live') assertEquals(rij.orderbericht.note, opnieuw.note); else assertEquals(rij.orderbericht, null);
    assertEquals(kassa.length, 0); assertEquals(t.externe_bestelling_poging.length, 0);
  });
});
for (const beide of [false, true]) Deno.test(`Saté twee regels, ${beide ? 'beide' : 'één'} glutenvrij: normale testontvangst, echte modifier en unieke regelnotitie`, async () => {
  await proef(async (t, post, kassa) => {
    t.externe_product_koppeling = [
      { vestiging: 'Midsland', soort: 'product', externe_code: 'PV-51FDF8F3', lightspeed_product_id: '1071041', lightspeed_plu: 'Dv11', naam: 'Saté Spicy Tahoe', prijs_cent: 1100, actief: true },
      { vestiging: 'Midsland', soort: 'extra', externe_code: 'PV-51FDF8F3|1071041|PVK-456C0BDC-1', lightspeed_product_id: '263905', naam: 'Glutenvrij', prijs_cent: 0, actief: true },
    ];
    t.kaart_producten = [{ ...fictiefProduct(1071041, 11), additions: [{ id: 9000, name: 'Lokale groep', values: [{ id: 263905, name: 'Glutenvrij', price: 0, priceWithoutVAT: 0 }] }] }];
    const keuze = { code: 'PVK-456C0BDC-1', aantal: 1, stukprijs_cent: 0 };
    const b = { ...bericht('LOKAAL-SATE-' + beide), opmerking: '  Eigen gastnotitie  ', regels: [
      { code: 'PV-51FDF8F3', aantal: 1, stukprijs_cent: 1100, extras: beide ? [keuze] : [] },
      { code: 'PV-51FDF8F3', aantal: 1, stukprijs_cent: 1100, extras: [keuze] },
    ], bedragen: { restaurant_cent: 2200, bezorgkosten_cent: 0, fooi_cent: 0, korting: null } };
    const res = await post(b); assertEquals(res.status, 201); assertEquals((await res.json()).status, 'test_ok');
    const rij = t.externe_bestellingen[0]; assertEquals(rij.invoer.regels, b.regels);
    const uit = orderbericht({ referentie: rij.referentie, regels: prijsRegels(rij.regels, t.kaart_producten as any, TEST_KLASSEN), restaurant_cent: rij.restaurant_cent, ophaaltijd: rij.ophaaltijd, opmerking: rij.invoer.opmerking, betaalwijzeId: '77' });
    const tekst = 'Saté Spicy Tahoe – glutenvrij verzocht, zonder gefruite uitjes';
    assertEquals(uit.note, '  Eigen gastnotitie  \n\n' + (beide ? 'Regel 1 (1×) – ' + tekst + '\n' : '') + 'Regel 2 (1×) – ' + tekst);
    assertEquals(uit.orderItems.map(r => r.modifiers.map(m => m.modifierValueId)), beide ? [[263905], [263905]] : [[], [263905]]);
    assertEquals(rij.orderbericht, null); assertEquals(kassa.length, 0); assertEquals(t.externe_bestelling_poging.length, 0);
  });
});
