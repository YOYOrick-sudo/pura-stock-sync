import { assertEquals } from 'jsr:@std/assert@1';
import { verzend } from './eilandbezorgerVerzend.ts';
import { BestellingSchema, beginStatus, betaaldInBericht, controleer, orderbericht } from './eilandbezorgerLogica.ts';
import { gastVan, toetsKoppeling } from './eilandbezorgerKlant.ts';

// In-memory database met de unieke sleutel (vestiging, email) van externe_klant_koppeling.
function db(start: Record<string, any[]> = {}) {
  const t: Record<string, any[]> = { lightspeed_connections: [{ vestiging: 'Midsland', access_token: 't', refresh_token: 'r', token_expires_at: '2999-01-01T00:00:00Z', status: 'gekoppeld' }],
    externe_kassa_config: [{ vestiging: 'Midsland', lightspeed_betaalwijze_id: '77', lightspeed_betaalwijze_type_id: '3', order_route: 'customer_order' }],
    externe_klant_koppeling: [], externe_bestellingen: [], externe_bestelling_poging: [], externe_bestelling_log: [], user_roles: [], notifications: [], ...start };
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

// Nep-Lightspeed: klanten zoeken/aanmaken en orders. Telt elke schrijfactie.
function kassa(o: { aanmaakFaalt?: 'timeout-maar-aangemaakt' | 'timeout-niet-aangemaakt'; klanten?: any[] } = {}) {
  const klanten: any[] = o.klanten ?? []; const orders: any[] = []; let aanmaak = 0, volgId = 900;
  const haal = (async (url: string, init?: RequestInit) => {
    await new Promise((r) => setTimeout(r, 5));
    const u = new URL(url);
    if (u.pathname.endsWith('/rest/core/customer') && init?.method === 'POST') {
      aanmaak++; const b = JSON.parse(String(init.body)); const k = { id: ++volgId, firstName: b.firstName, lastName: b.lastName, email: b.email };
      if (o.aanmaakFaalt === 'timeout-niet-aangemaakt') throw new Error('timeout');
      klanten.push(k); if (o.aanmaakFaalt === 'timeout-maar-aangemaakt') throw new Error('timeout');
      return new Response(String(k.id), { status: 200 });
    }
    if (u.pathname.endsWith('/rest/core/customer')) return Response.json({ results: klanten.slice(Number(u.searchParams.get('offset')), Number(u.searchParams.get('offset')) + 100) });
    if (u.pathname.includes('/onlineordering/customer/')) { orders.push({ pad: u.pathname, body: JSON.parse(String(init!.body)) }); return Response.json({ id: 5000 + orders.length }, { status: 201 }); }
    return new Response('?', { status: 404 });
  }) as typeof fetch;
  return { haal, klanten, orders, aanmaak: () => aanmaak };
}

const friet = { soort: 'product', externe_code: 'PV-FFA8275F', lightspeed_product_id: '4636994', naam: 'Zoete Aardappel Friet', prijs_cent: 700, actief: true } as const;
const gast = { voornaam: 'Sanne', achternaam: 'de Vries', email: 'sanne@example.com', telefoon: '0562-EILANDBEZORGER' };
function bestelling(nr: string, opmerking: string, klant: any = gast) {
  const b = BestellingSchema.parse({ versie: 1, modus: 'live', bestelnummer: nr, vestiging: '36864', ophaaltijd: '2026-11-22T17:00:00+01:00', klant, opmerking,
    regels: [{ code: 'PV-FFA8275F', aantal: 3, stukprijs_cent: 700 }], bedragen: { restaurant_cent: 2100, korting: null }, betaling: { wijze: 'vooraf_betaald' } });
  const c = controleer(b, [friet as any]); if (!c.ok) throw new Error(c.reden);
  const bericht = orderbericht({ referentie: 'EB-' + nr, bestelnummer: nr, ophaaltijd: b.ophaaltijd, opmerking: b.opmerking, regels: c.regels, restaurant_cent: 2100, betaalwijzeId: '77', betaalwijzeTypeId: '3', route: 'customer_order' });
  return { id: 'r-' + nr, versie: 2, status: 'verzenden', modus: 'live', vestiging: 'Midsland', extern_id: nr, invoer: b, orderbericht: bericht };
}
const voeg = (d: any, r: any) => { d.t.externe_bestellingen.push({ ...r }); return { ...r }; };
const snel = { pollMs: 5, pollKeer: 50 };

Deno.test('nieuwe gast bestelt twee keer: één klant, zelfde customerId, elke order eigen notitie', async () => {
  const d = db(), k = kassa();
  const a = await verzend(d, voeg(d, bestelling('EB-2001', 'Saus apart')), k.haal, snel);
  const b = await verzend(d, voeg(d, bestelling('EB-2002', 'Geen bestek')), k.haal, snel);
  assertEquals([a.status, b.status], ['verzonden', 'verzonden']);
  assertEquals(k.aanmaak(), 1); assertEquals(k.klanten.length, 1); assertEquals(d.t.externe_klant_koppeling.length, 1);
  assertEquals(k.orders[0].body.customerId, k.orders[1].body.customerId);
  assertEquals(k.orders[0].pad, `/resto/rest/onlineordering/customer/${k.klanten[0].id}/order`);
  assertEquals([k.orders[0].body.note, k.orders[1].body.note], ['Saus apart', 'Geen bestek']);
  assertEquals([k.orders[0].body.description, k.orders[1].body.description], ['EB-2001', 'EB-2002']);
  assertEquals(JSON.stringify(k.orders).includes('EILANDBEZORGER'), false); // telefoon nooit mee
  assertEquals(k.klanten[0].phone, undefined);
});

Deno.test('gelijktijdige aanlevering van dezelfde nieuwe gast: één klant, twee orders', async () => {
  const d = db(), k = kassa();
  const [a, b] = await Promise.all([verzend(d, voeg(d, bestelling('EB-3001', 'Saus apart')), k.haal, snel), verzend(d, voeg(d, bestelling('EB-3002', 'Geen bestek')), k.haal, snel)]);
  assertEquals([a.status, b.status], ['verzonden', 'verzonden']); assertEquals(k.aanmaak(), 1);
  assertEquals(k.orders.length, 2); assertEquals(k.orders[0].body.customerId, k.orders[1].body.customerId);
});

Deno.test('dezelfde order twee keer tegelijk verzenden: precies één order', async () => {
  const d = db(), k = kassa(); const r = voeg(d, bestelling('EB-4001', 'Saus apart'));
  await Promise.all([verzend(d, { ...r }, k.haal, snel), verzend(d, { ...r }, k.haal, snel)]);
  assertEquals(k.orders.length, 1); assertEquals(k.aanmaak(), 1);
});

Deno.test('verbinding valt weg tijdens aanmaken maar klant bestaat: teruggevonden en gekoppeld, geen tweede klant', async () => {
  const d = db(), k = kassa({ aanmaakFaalt: 'timeout-maar-aangemaakt' });
  const a = await verzend(d, voeg(d, bestelling('EB-5001', 'Saus apart')), k.haal, snel);
  assertEquals(a.status, 'verzonden'); assertEquals(k.aanmaak(), 1); assertEquals(d.t.externe_klant_koppeling[0].status, 'gekoppeld');
  assertEquals(d.t.externe_klant_koppeling[0].lightspeed_klant_id, String(k.klanten[0].id));
});

Deno.test('aanmaken onzeker en niet terug te vinden: ter beoordeling, ook bij volgende order geen nieuwe aanmaak', async () => {
  const d = db(), k = kassa({ aanmaakFaalt: 'timeout-niet-aangemaakt' });
  const a = await verzend(d, voeg(d, bestelling('EB-6001', 'Saus apart')), k.haal, snel);
  assertEquals(a.status, 'ter_beoordeling'); assertEquals(d.t.externe_klant_koppeling[0].status, 'onzeker');
  const b = await verzend(d, voeg(d, bestelling('EB-6002', 'Geen bestek')), k.haal, snel);
  assertEquals(b.status, 'ter_beoordeling'); assertEquals(k.aanmaak(), 1); assertEquals(k.orders.length, 0);
});

Deno.test('meerdere Lightspeed-klanten met hetzelfde e-mailadres: ter beoordeling, niets verstuurd', async () => {
  const dubbel = [{ id: 1, firstName: 'Sanne', lastName: 'de Vries', email: 'sanne@example.com' }, { id: 2, firstName: 'Sanne', lastName: 'de Vries', email: 'Sanne@example.com' }];
  const d = db(), k = kassa({ klanten: dubbel });
  const a = await verzend(d, voeg(d, bestelling('EB-7001', 'Saus apart')), k.haal, snel);
  assertEquals(a.status, 'ter_beoordeling'); assertEquals(k.aanmaak(), 0); assertEquals(k.orders.length, 0);
});

Deno.test('bestaande Lightspeed-klant met exact e-mailadres wordt hergebruikt, andere naam gaat ter beoordeling', async () => {
  const d = db(), k = kassa({ klanten: [{ id: 42, firstName: 'Sanne', lastName: 'de Vries', email: 'sanne@example.com' }] });
  await verzend(d, voeg(d, bestelling('EB-8001', 'Saus apart')), k.haal, snel);
  assertEquals(k.orders[0].body.customerId, 42); assertEquals(k.aanmaak(), 0);
  const d2 = db(), k2 = kassa({ klanten: [{ id: 43, firstName: 'Piet', lastName: 'Jansen', email: 'sanne@example.com' }] });
  assertEquals((await verzend(d2, voeg(d2, bestelling('EB-8002', 'x')), k2.haal, snel)).status, 'ter_beoordeling');
});

Deno.test('bestaande koppeling: tegenstrijdige klantcode, e-mail of naam -> ter beoordeling', () => {
  const g = gastVan({ klant: { voornaam: 'Sanne', achternaam: 'de Vries', email: 'sanne@example.com', klantcode: 'EBK-1' } })!;
  const k = (x: any) => ({ id: 'a', vestiging: 'Midsland', email: 'sanne@example.com', klantcode: 'EBK-1', voornaam: 'Sanne', achternaam: 'de Vries', lightspeed_klant_id: '1', status: 'gekoppeld', ...x });
  assertEquals(toetsKoppeling(g, k({}), k({})).ok, true);
  assertEquals(toetsKoppeling(g, k({ email: 'ander@example.com' }), null).ok, false);
  assertEquals(toetsKoppeling(g, null, k({ klantcode: 'EBK-2' })).ok, false);
  assertEquals(toetsKoppeling(g, null, k({ voornaam: 'Piet' })).ok, false);
  assertEquals(toetsKoppeling(g, k({}), k({ id: 'b' })).ok, false);
});

Deno.test('oud bericht met alleen naam: ontvangsttest blijft ok, live gaat ter beoordeling', () => {
  const b = BestellingSchema.parse({ versie: 1, modus: 'test', bestelnummer: 'X', vestiging: '36864', ophaaltijd: '2026-11-22T17:00:00+01:00', klant: { naam: 'Karin' }, regels: [{ code: 'A', aantal: 1, stukprijs_cent: 1 }], bedragen: { restaurant_cent: 1 }, betaling: { wijze: 'vooraf_betaald' } });
  assertEquals(gastVan(b), null);
  const p = { liveAan: true, configCompleet: true, gastCompleet: false, ophaaltijd: new Date().toISOString(), nu: Date.now(), vensterMin: 45 };
  assertEquals(beginStatus({ ...p, modus: 'test' }).status, 'test_ok');
  assertEquals(beginStatus({ ...p, modus: 'live' }).status, 'ter_beoordeling');
});

Deno.test('kassaproef: 3x friet, €21 als één betalingsobject, opmerking ongewijzigd', () => {
  const r = bestelling('EB-PROEF', '  Saus apart ');
  assertEquals(Array.isArray(r.orderbericht.orderPayments), false);
  assertEquals((r.orderbericht.orderPayments as any).amount, 21); assertEquals((r.orderbericht.orderPayments as any).paymentTypeId, 77);
  assertEquals(betaaldInBericht(r.orderbericht), 2100); assertEquals(r.orderbericht.note, '  Saus apart ');
});
