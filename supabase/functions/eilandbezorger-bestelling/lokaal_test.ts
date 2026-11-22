// Volledige ontvang- en gesimuleerde liveweg, uitsluitend in geheugen; geen netwerkrechten.
import { assertEquals } from 'jsr:@std/assert@1';

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

async function proef(run: (t: Record<string, Rij[]>, post: (b: unknown) => Promise<Response>, kassa: Rij[]) => Promise<void>) {
  const vars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'EILANDBEZORGER_SLEUTEL'];
  const oud = vars.map((k) => Deno.env.get(k));
  Deno.env.set(vars[0], 'http://127.0.0.1:9876'); Deno.env.set(vars[1], 'lokaal'); Deno.env.set(vars[2], 'lokaal');
  const t: Record<string, Rij[]> = {
    externe_bestellingen: [], externe_bestelling_log: [], externe_bestelling_poging: [], user_roles: [], notifications: [],
    externe_product_koppeling: [{ vestiging: 'Midsland', soort: 'product', externe_code: 'PV-FFA8275F', lightspeed_product_id: '4636994', naam: 'Zoete Aardappel Friet', prijs_cent: 700, actief: true }],
    externe_kassa_config: [{ vestiging: 'Midsland', lightspeed_klant_id: '901', lightspeed_betaalwijze_id: '77', lightspeed_betaalwijze_type_id: '3', order_route: 'customer_order', venster_minuten: 45 }],
    fase2_vlag: [{ vestiging: 'Midsland', vlag: 'eilandbezorger_live', aan: true }],
    lightspeed_connections: [{ vestiging: 'Midsland', merchant_id: '36864', status: 'gekoppeld', access_token: 'lokaal', token_expires_at: '2999-01-01T00:00:00Z' }],
  };
  const kassa: Rij[] = []; const fetchOud = globalThis.fetch; const nuOud = Date.now;
  Date.now = () => Date.parse('2026-11-22T16:30:00Z');
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const u = new URL(String(input)); const method = init?.method ?? 'GET';
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
    await run(t, (b) => fn(new Request('http://lokaal/bestelling', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-eilandbezorger-sleutel': 'lokaal' }, body: JSON.stringify(b) })), kassa);
  } finally {
    globalThis.fetch = fetchOud; Date.now = nuOud;
    vars.forEach((k, i) => { const v = oud[i]; if (v === undefined) Deno.env.delete(k); else Deno.env.set(k, v); });
  }
}

Deno.test('ontvangst Sanne: test_ok, contactgegevens niet opgeslagen, nul kassatoegang', async () => {
  await proef(async (t, post, kassa) => {
    const b = { ...bericht('EB-TEST-20261122-120013'), klant: { ...gast, email: 'ongeldig', telefoon: 123, klantcode: null } };
    const r = await post(b); assertEquals(r.status, 201); assertEquals((await r.json()).status, 'test_ok');
    assertEquals(t.externe_bestellingen[0].invoer.klant, { naam: 'Sanne de Vries' });
    assertEquals(t.externe_bestellingen[0].orderbericht.description, 'EB-TEST-20261122-120013 — Sanne de Vries');
    assertEquals(t.externe_bestellingen[0].orderbericht.note, 'Saus apart');
    assertEquals(kassa.length, 0); assertEquals(t.externe_bestelling_poging.length, 0);
    for (const veld of ['email', 'telefoon', 'klantcode']) assertEquals(JSON.stringify(t.externe_bestellingen).includes(veld), false);
    const herhaald = await post(b); assertEquals(herhaald.status, 200); await herhaald.json(); assertEquals(t.externe_bestellingen.length, 1);
  });
});

Deno.test('volledige gesimuleerde liveweg: vaste klant, één order, €21 en Sanne zonder contactvelden', async () => {
  await proef(async (t, post, kassa) => {
    const r = await post(bericht('LOKAAL-LIVE', 'live')); assertEquals(r.status, 201); assertEquals((await r.json()).status, 'verzonden');
    assertEquals(kassa.length, 1); assertEquals(kassa[0].customerId, 901);
    assertEquals(kassa[0].description, 'LOKAAL-LIVE — Sanne de Vries'); assertEquals(kassa[0].note, 'Saus apart');
    assertEquals(kassa[0].orderItems[0].amount, 3); assertEquals(kassa[0].orderItems[0].totalPrice, 21);
    assertEquals(kassa[0].orderPayments.amount, 21); assertEquals(t.externe_bestelling_poging.length, 1);
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
