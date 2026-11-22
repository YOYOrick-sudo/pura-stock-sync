import { assertEquals } from 'jsr:@std/assert@1';
import { verzend } from './eilandbezorgerVerzend.ts';
import { BestellingSchema, beginStatus, betaaldInBericht, controleer, orderbericht, kassaBlokkade, zelfdeBestelling, vingerafdruk } from './eilandbezorgerLogica.ts';
import { gastNaam } from './eilandbezorgerKlant.ts';
import { mockKaart, testPrijsRegels } from './eilandbezorgerPrijsFixtures.ts';

// In-memory database met de unieke sleutel (vestiging, email) van externe_klant_koppeling.
function db(start: Record<string, any[]> = {}) {
  const t: Record<string, any[]> = { lightspeed_connections: [{ vestiging: 'Midsland', access_token: 't', refresh_token: 'r', token_expires_at: '2999-01-01T00:00:00Z', status: 'gekoppeld' }],
    externe_kassa_config: [{ vestiging: 'Midsland', lightspeed_klant_id: '901', lightspeed_betaalwijze_id: '77', lightspeed_betaalwijze_type_id: '3', order_route: 'customer_order' }],
    fase2_vlag: [{ vestiging: 'Midsland', vlag: 'eilandbezorger_live', aan: true }], externe_klant_koppeling: [], externe_bestellingen: [], externe_bestelling_poging: [], externe_bestelling_log: [], user_roles: [], notifications: [], ...start };
  const q = (naam: string) => {
    const f: ((r: any) => boolean)[] = []; let patch: any = null, nieuw: any = null, veel = false;
    const run = () => {
      const rijen = t[naam] ??= [];
      if (nieuw) {
        const r = { id: crypto.randomUUID(), uitkomst: 'bezig', soort: 'verzenden', ...nieuw };
        if (naam === 'externe_bestelling_poging' && rijen.some((x) => x.bestelling_id === r.bestelling_id && x.uitkomst === 'bezig')) return { data: null, error: { code: '23505' } };
        if (naam === 'externe_klant_koppeling' && rijen.some((x) => x.vestiging === r.vestiging && x.email === r.email)) return { data: null, error: { code: '23505' } };
        rijen.push(r); return { data: { ...r }, error: null };
      }
      const hit = rijen.filter((r) => f.every((g) => g(r)));
      if (patch) { hit.forEach((r) => Object.assign(r, patch)); return { data: hit[0] ? { ...hit[0] } : null, error: null }; }
      return { data: veel ? hit : hit[0] ? { ...hit[0] } : null, error: null };
    };
    const b: any = { select: () => b, eq: (k: string, v: any) => (f.push((r) => r[k] === v), b), in: (k: string, v: any[]) => (f.push((r) => v.includes(r[k])), b),
      update: (p: any) => (patch = p, b), insert: (r: any) => (nieuw = Array.isArray(r) ? r[0] : r, b), maybeSingle: async () => run(), single: async () => run(), then: (ok: any) => ok((veel = true, run())) };
    return b;
  };
  return { t, from: q, rpc: async () => ({ data: 'x' }) };
}

// Alleen een orderverzoek is toegestaan. Klantacties laten de test falen.
function kassa(route: 'order' | 'establishmentorder' = 'order') {
  const orders: any[] = []; const calls: string[] = [];
  const haal = (async (url: string, init?: RequestInit) => {
    const kaart = mockKaart(url, init); if (kaart) return kaart;
    calls.push(url);
    if (new URL(url).pathname !== `/resto/rest/onlineordering/customer/901/${route}` || init?.method !== 'POST') throw new Error('Verboden klantactie');
    orders.push({ pad: new URL(url).pathname, body: JSON.parse(String(init.body)) });
    return Response.json({ id: 5000 + orders.length }, { status: 201 });
  }) as typeof fetch;
  return { haal, orders, calls };
}

const friet = { soort: 'product', externe_code: 'PV-FFA8275F', lightspeed_product_id: '4636994', naam: 'Zoete Aardappel Friet', prijs_cent: 700, actief: true } as const;
const gast = { voornaam: 'Sanne', achternaam: 'de Vries' };
function bestelling(nr: string, opmerking: string, klant: any = gast) {
  const b = BestellingSchema.parse({ versie: 1, modus: 'live', bestelnummer: nr, vestiging: '36864', ophaaltijd: '2026-11-22T17:00:00+01:00', klant, opmerking,
    regels: [{ code: 'PV-FFA8275F', aantal: 3, stukprijs_cent: 700 }], bedragen: { restaurant_cent: 2100, korting: null }, betaling: { wijze: 'vooraf_betaald' } });
  const c = controleer(b, [friet as any]); if (!c.ok) throw new Error(c.reden);
  const bericht = orderbericht({ referentie: 'EB-' + nr, bestelnummer: nr, ophaaltijd: b.ophaaltijd, opmerking: b.opmerking, regels: testPrijsRegels(c.regels), restaurant_cent: 2100, betaalwijzeId: '77', betaalwijzeTypeId: '3', route: 'customer_order', klant: b.klant, klantId: '901' });
  return { id: 'r-' + nr, versie: 2, status: 'verzenden', modus: 'live', vestiging: 'Midsland', merchant_id: '36864', extern_id: nr, referentie: 'EB-' + nr, ophaaltijd: b.ophaaltijd, restaurant_cent: 2100, regels: c.regels, invoer: b, orderbericht: bericht };
}
const voeg = (d: any, r: any) => { d.t.externe_bestellingen.push({ ...r }); return { ...r }; };
Deno.test('Sanne 3x friet: gesimuleerd live met vaste klant, €21 betaald en orderspecifieke naam/notitie', async () => {
  const d = db(), k = kassa();
  const a = await verzend(d, voeg(d, bestelling('EB-TEST-20261122-120013', 'Saus apart')), k.haal);
  assertEquals(a.status, 'verzonden'); assertEquals(k.calls.length, 1);
  assertEquals(k.orders[0].body.customerId, 901);
  assertEquals(k.orders[0].body.description, 'EB-TEST-20261122-120013 — Sanne de Vries');
  assertEquals(k.orders[0].body.note, 'Saus apart');
  assertEquals(k.orders[0].body.orderItems[0].amount, 3);
  assertEquals(k.orders[0].body.orderItems[0].productId, 4636994);
  assertEquals(betaaldInBericht(k.orders[0].body), 2100);
  assertEquals(d.t.externe_klant_koppeling, []);
});

Deno.test('verschillende gasten, dezelfde vaste klant; elk eigen description en note', async () => {
  const d = db(), k = kassa();
  await verzend(d, voeg(d, bestelling('EB-2001', 'Saus apart')), k.haal);
  await verzend(d, voeg(d, bestelling('EB-2002', 'Geen bestek', { naam: 'Karin Gast' })), k.haal);
  assertEquals(k.orders.map((x) => x.body.customerId), [901, 901]);
  assertEquals(k.orders.map((x) => x.body.description), ['EB-2001 — Sanne de Vries', 'EB-2002 — Karin Gast']);
  assertEquals(k.orders.map((x) => x.body.note), ['Saus apart', 'Geen bestek']);
  assertEquals(k.calls.length, 2); assertEquals(d.t.externe_klant_koppeling, []);
});

Deno.test('ontbrekende vaste klant blokkeert verzending zonder tokenbeheer, klantactie of poging', async () => {
  const d = db(); d.t.externe_kassa_config[0].lightspeed_klant_id = null;
  d.t.lightspeed_connections = []; const k = kassa();
  const a = await verzend(d, voeg(d, bestelling('EB-GEEN-KLANT', 'Saus apart')), k.haal);
  assertEquals(a.status, 'geblokkeerd');
  assertEquals(a.reden, 'Vaste Lightspeed-klant Eilandbezorger voor Midsland ontbreekt.');
  assertEquals(k.calls.length, 0); assertEquals(d.t.externe_bestelling_poging, []);
});

Deno.test('live uit: geen kassatoegang of poging, ook bij direct verzendpad', async () => {
  const d = db(); d.t.fase2_vlag[0].aan = false; const k = kassa();
  assertEquals((await verzend(d, voeg(d, bestelling('EB-UIT', 'Saus apart')), k.haal)).status, 'geblokkeerd');
  assertEquals(k.calls.length, 0); assertEquals(d.t.externe_bestelling_poging, []);
});

Deno.test('testmodus blijft test_ok, ook met vaste klant en live aan', async () => {
  const d = db(), k = kassa(); const r = { ...bestelling('EB-TEST', 'Saus apart'), modus: 'test', status: 'test_ok' };
  assertEquals((await verzend(d, voeg(d, r), k.haal)).status, 'test_ok');
  assertEquals(k.calls.length, 0); assertEquals(d.t.externe_bestelling_poging, []);
  assertEquals(beginStatus({ modus: 'test', liveAan: true, configCompleet: false, ophaaltijd: r.ophaaltijd, nu: Date.now(), vensterMin: 45 }).status, 'test_ok');
});

Deno.test('ontbrekende betaalwijze blijft geblokkeerd', async () => {
  const d = db(); d.t.externe_kassa_config[0].lightspeed_betaalwijze_id = null; const k = kassa();
  assertEquals(kassaBlokkade(d.t.externe_kassa_config[0]), 'Kassa-instellingen (betaalwijze) ontbreken.');
  assertEquals((await verzend(d, voeg(d, bestelling('EB-BETAAL', 'Saus apart')), k.haal)).status, 'geblokkeerd');
  assertEquals(k.calls.length, 0);
});

Deno.test('dezelfde order gelijktijdig: één bestelling, geen klantactie', async () => {
  const d = db(), k = kassa(); const r = voeg(d, bestelling('EB-4001', 'Saus apart'));
  await Promise.all([verzend(d, { ...r }, k.haal), verzend(d, { ...r }, k.haal)]);
  assertEquals(k.orders.length, 1); assertEquals(k.calls.length, 1);
});

Deno.test('contactvelden ook ongeldig genegeerd; naamcombinatie wint van volledige naam', () => {
  const r = bestelling('EB-CONTACT', 'Saus apart', { ...gast, naam: 'Oude Naam', email: 'ongeldig', telefoon: { onverwacht: true }, klantcode: 42 });
  assertEquals(r.invoer.klant, { naam: 'Sanne de Vries' });
  assertEquals(gastNaam(r.invoer), 'Sanne de Vries');
  assertEquals(Object.keys(r.invoer.klant), ['naam']);
});

Deno.test('historische invoer bij verzenden: contactgegevens niet in nieuw kassabericht/logs', async () => {
  const d = db(), k = kassa(); const r = bestelling('EB-OUD', 'Saus apart');
  r.invoer.klant = { ...gast, email: 'oud@example.com', klantcode: 'OLD', telefoon: '000' } as any;
  await verzend(d, voeg(d, r), k.haal);
  const tekst = JSON.stringify([k.orders, d.t.externe_bestelling_log, d.t.externe_bestelling_poging]);
  for (const veld of ['email', 'telefoon', 'klantcode', 'oud@example.com']) assertEquals(tekst.includes(veld), false);
});

Deno.test('historische herhaling met oude hash/contactvelden: gelijk; contactwijzigingen irrelevant', async () => {
  const r = bestelling('EB-TEST-20261122-120013', 'Saus apart');
  const b = BestellingSchema.parse({ ...r.invoer, modus: 'test' });
  const oud = { ...r, modus: 'test', vingerafdruk: 'historische-hash', invoer: { ...b, klant: { ...gast, email: 'oud@example.com', klantcode: 'OLD' } } };
  assertEquals(await zelfdeBestelling(oud, b, await vingerafdruk(b)), true);
  const anderContact = BestellingSchema.parse({ ...b, klant: { ...gast, email: null, telefoon: 'nieuw' } });
  assertEquals(await zelfdeBestelling(oud, anderContact, await vingerafdruk(anderContact)), true);
  assertEquals(oud.vingerafdruk, 'historische-hash');
});

Deno.test('historische herhaling: gewijzigde operationele inhoud, modus, tijd of nummer conflict', async () => {
  const r = bestelling('EB-OUD', 'Saus apart'); const b = r.invoer;
  const oud = { ...r, vingerafdruk: 'historische-hash' };
  for (const patch of [
    { klant: { naam: 'Andere Gast' } }, { opmerking: 'Saus erbij' },
    { regels: [{ code: 'PV-FFA8275F', aantal: 2, stukprijs_cent: 700 }] },
    { bedragen: { restaurant_cent: 1400 } }, { betaling: { wijze: 'contant' } },
    { modus: 'test' }, { bestelnummer: 'ANDER' }, { ophaaltijd: '2026-11-22T18:00:00+01:00' },
  ]) {
    const ander = BestellingSchema.parse({ ...b, ...patch });
    assertEquals(await zelfdeBestelling(oud, ander, await vingerafdruk(ander)), false);
  }
});

Deno.test('kassaproef: €21 in één betaalregel, opmerking inclusief spaties ongewijzigd', () => {
  const r = bestelling('EB-PROEF', '  Saus apart ');
  assertEquals(r.orderbericht.orderPayments, [{ amount: 21, paymentTypeId: 77, paymentTypeTypeId: 3, tip: 0 }]);
  assertEquals(betaaldInBericht(r.orderbericht), 2100); assertEquals(r.orderbericht.note, '  Saus apart ');
});

Deno.test('establishmentorder verzendt één betaalregel op de vestigingsroute', async () => {
  const d = db();
  const k = kassa('establishmentorder');
  d.t.externe_kassa_config[0].order_route = 'establishment_order';
  d.t.externe_kassa_config[0].lightspeed_company_id = '42';
  const rij = bestelling('EB-VESTIGING', 'Saus apart');
  rij.regels[0].lightspeed_plu = 'F-a12';

  const resultaat = await verzend(d, voeg(d, rij), k.haal);
  assertEquals(resultaat.status, 'verzonden');
  assertEquals(k.calls.length, 1);
  const body = k.orders[0].body;
  assertEquals(body.companyId, 42);
  assertEquals(body.orderItems[0].productPlu, 'F-a12');
  assertEquals(body.orderPayments, [{ amount: 21, paymentTypeId: 77, paymentTypeTypeId: 3, tip: 0 }]);
});
