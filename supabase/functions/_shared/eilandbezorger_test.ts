import { assertEquals } from 'jsr:@std/assert@1';
import { BestellingSchema, beginStatus, controleer, gelijkeSleutel, uitkomstVan, vingerafdruk } from './eilandbezorgerLogica.ts';
import { geldigToken } from './lightspeedToken.ts';
import { verzend } from './eilandbezorgerVerzend.ts';

// ---------- mini in-memory database ----------
function fakeDb(tabellen: Record<string, any[]>) {
  let leaseHouder: string | null = null;
  const q = (t: string) => {
    let rijen = () => tabellen[t] ??= [];
    const f: ((r: any) => boolean)[] = []; let patch: any = null; let nieuw: any = null; let volg: any = null;
    const run = () => {
      if (nieuw) {
        const r = { id: crypto.randomUUID(), uitkomst: 'bezig', soort: 'verzenden', ...nieuw };
        if (t === 'externe_bestelling_poging' && r.soort === 'verzenden' && rijen().some((x) => x.bestelling_id === r.bestelling_id && x.soort === 'verzenden' && x.uitkomst === 'bezig')) return { data: null, error: { code: '23505' } };
        rijen().push(r); return { data: r, error: null };
      }
      const hit = rijen().filter((r) => f.every((g) => g(r)));
      if (patch) { hit.forEach((r) => Object.assign(r, patch)); return { data: hit[0] ? { ...hit[0] } : null, error: null }; }
      return { data: volg === 'many' ? hit : hit[0] ? { ...hit[0] } : null, error: null };
    };
    const b: any = {
      select: () => b, eq: (k: string, v: any) => (f.push((r) => r[k] === v), b), in: (k: string, v: any[]) => (f.push((r) => v.includes(r[k])), b),
      lt: () => b, lte: () => b, order: () => b, limit: () => b,
      update: (p: any) => (patch = p, b), insert: (r: any) => (nieuw = Array.isArray(r) ? r[0] : r, b),
      maybeSingle: async () => run(), single: async () => run(),
      then: (ok: any) => ok((volg = 'many', run())),
    };
    return b;
  };
  return {
    from: q,
    vernieuwingen: 0,
    rpc: async (naam: string) => {
      if (naam === 'sync_lease_acquire') { if (leaseHouder) return { data: null }; leaseHouder = crypto.randomUUID(); return { data: leaseHouder }; }
      leaseHouder = null; return { data: null };
    },
  };
}

const basis = {
  versie: 1, bestelnummer: 'EB1001', vestiging: '36864', ophaaltijd: '2026-11-21T17:30:00+01:00',
  klant: { naam: 'Test Gast' }, regels: [{ code: 'FRIET', aantal: 2, stukprijs_cent: 700, extras: [{ code: 'MAYO', aantal: 1, stukprijs_cent: 50 }] }],
  bedragen: { restaurant_cent: 1500 }, betaling: { wijze: 'vooraf_betaald' },
};
const kop = [
  { soort: 'product', externe_code: 'FRIET', lightspeed_product_id: '2842282', naam: 'Zoete Aardappel Friet', prijs_cent: 700, actief: true },
  { soort: 'extra', externe_code: 'MAYO', lightspeed_product_id: '9', naam: 'Mayo', prijs_cent: 50, actief: true },
] as any;
const parse = (x: unknown) => BestellingSchema.parse(x);

Deno.test('geldige bestelling: bedragen inclusief extras kloppen', () => {
  const r = controleer(parse(basis), kop); assertEquals(r.ok, true);
});
Deno.test('restaurantbedrag wijkt af -> afgekeurd', () => {
  const r = controleer(parse({ ...basis, bedragen: { restaurant_cent: 1400 } }), kop); assertEquals(r.ok, false);
});
Deno.test('onbekend product en onbekende extra -> afgekeurd', () => {
  assertEquals(controleer(parse({ ...basis, regels: [{ code: 'X', aantal: 1, stukprijs_cent: 1 }], bedragen: { restaurant_cent: 1 } }), kop).ok, false);
  assertEquals(controleer(parse({ ...basis, regels: [{ code: 'FRIET', aantal: 1, stukprijs_cent: 700, extras: [{ code: 'Y', aantal: 1, stukprijs_cent: 0 }] }], bedragen: { restaurant_cent: 700 } }), kop).ok, false);
});
Deno.test('prijs wijkt meer dan 1 cent af -> afgekeurd; 1 cent mag', () => {
  assertEquals(controleer(parse({ ...basis, regels: [{ code: 'FRIET', aantal: 1, stukprijs_cent: 701 }], bedragen: { restaurant_cent: 701 } }), kop).ok, true);
  assertEquals(controleer(parse({ ...basis, regels: [{ code: 'FRIET', aantal: 1, stukprijs_cent: 702 }], bedragen: { restaurant_cent: 702 } }), kop).ok, false);
});
Deno.test('betaalwijze anders dan vooraf_betaald -> afgekeurd', () => {
  assertEquals(controleer(parse({ ...basis, betaling: { wijze: 'contant' } }), kop).ok, false);
});
Deno.test('korting -> afgekeurd met reden, niet stilzwijgend weg', () => {
  const r = controleer(parse({ ...basis, bedragen: { restaurant_cent: 1500, korting: { actiecode: 'WELKOM', oorspronkelijk_cent: 1700, korting_cent: 200, betaald_door: 'eilandbezorger' } } }), kop);
  assertEquals(r, { ok: false, reden: 'Korting nog niet ondersteund.' });
});
Deno.test('onbekende vestiging wordt door schema geweigerd', () => {
  assertEquals(BestellingSchema.safeParse({ ...basis, vestiging: '99999' }).success, false);
});
Deno.test('testsleutel terwijl live aan staat -> test_ok', () => {
  assertEquals(beginStatus({ modus: 'test', liveAan: true, configCompleet: true, ophaaltijd: new Date().toISOString(), nu: Date.now(), vensterMin: 45 }).status, 'test_ok');
});
Deno.test('live-bestelling terwijl live uit staat -> geblokkeerd, nooit test_ok', () => {
  assertEquals(beginStatus({ modus: 'live', liveAan: false, configCompleet: true, ophaaltijd: new Date().toISOString(), nu: Date.now(), vensterMin: 45 }).status, 'geblokkeerd');
});
Deno.test('vooruitbestelling buiten venster -> gepland; binnen venster -> verzenden', () => {
  const nu = Date.parse('2026-11-21T12:00:00Z');
  assertEquals(beginStatus({ modus: 'live', liveAan: true, configCompleet: true, ophaaltijd: '2026-11-21T13:00:00Z', nu, vensterMin: 45 }).status, 'gepland');
  assertEquals(beginStatus({ modus: 'live', liveAan: true, configCompleet: true, ophaaltijd: '2026-11-21T12:30:00Z', nu, vensterMin: 45 }).status, 'verzenden');
});
Deno.test('vingerafdruk: tijdswijziging telt niet, inhoudswijziging wel', async () => {
  const a = await vingerafdruk(parse(basis));
  assertEquals(a, await vingerafdruk(parse({ ...basis, ophaaltijd: '2026-11-21T18:00:00+01:00' })));
  const anders = await vingerafdruk(parse({ ...basis, regels: [{ ...basis.regels[0], aantal: 3 }], bedragen: { restaurant_cent: 2250 } }));
  assertEquals(a === anders, false);
});
Deno.test('sleutelvergelijking', () => {
  assertEquals(gelijkeSleutel('abc', 'abc'), true); assertEquals(gelijkeSleutel('abc', 'abd'), false); assertEquals(gelijkeSleutel('', ''), false);
});
Deno.test('uitkomst: timeout/5xx onbekend, 4xx geweigerd, 2xx met id verzonden', () => {
  assertEquals(uitkomstVan(null, '').status, 'uitkomst_onbekend');
  assertEquals(uitkomstVan(502, '').status, 'uitkomst_onbekend');
  assertEquals(uitkomstVan(400, '{}').status, 'geweigerd');
  assertEquals(uitkomstVan(201, '{"id":77}'), { status: 'verzonden', orderId: '77' });
  assertEquals(uitkomstVan(200, 'ok').status, 'uitkomst_onbekend');
});

Deno.test('gelijktijdige tokenvernieuwing (omzet + order): één vernieuwing, beide nieuwste token', async () => {
  const db = fakeDb({ lightspeed_connections: [{ vestiging: 'Midsland', access_token: 'oud', refresh_token: 'r1', token_expires_at: '2000-01-01T00:00:00Z', status: 'gekoppeld' }] });
  let n = 0;
  const vernieuw = async (rt: string) => { n++; await new Promise((r) => setTimeout(r, 20)); return { access_token: 'nieuw-' + rt, refresh_token: 'r2', expires_in: 3600 }; };
  const [a, b] = await Promise.all([geldigToken(db, 'Midsland', { vernieuw, pollMs: 5 }), geldigToken(db, 'Midsland', { vernieuw, pollMs: 5 })]);
  assertEquals(n, 1); assertEquals(a, { token: 'nieuw-r1' }); assertEquals(b, { token: 'nieuw-r1' });
});

function rijDb() {
  const rij = { id: 'b1', versie: 2, status: 'verzenden', vestiging: 'Midsland', extern_id: 'EB1', orderbericht: {} };
  const db = fakeDb({
    lightspeed_connections: [{ vestiging: 'Midsland', access_token: 't', refresh_token: 'r', token_expires_at: '2999-01-01T00:00:00Z', status: 'gekoppeld' }],
    externe_kassa_config: [{ vestiging: 'Midsland', lightspeed_klant_id: '1', lightspeed_betaalwijze_id: '2', order_route: 'customer_order' }],
    externe_bestellingen: [rij], externe_bestelling_poging: [], externe_bestelling_log: [], user_roles: [], notifications: [],
  });
  return { db, rij };
}
Deno.test('Lightspeed verwerkt maar antwoord gaat verloren -> uitkomst_onbekend, één poging', async () => {
  const { db, rij } = rijDb(); let calls = 0;
  const r = await verzend(db, { ...rij }, (async () => { calls++; throw new Error('timeout'); }) as any);
  assertEquals(r.status, 'uitkomst_onbekend'); assertEquals(calls, 1);
});
Deno.test('tweede gelijktijdige poging wordt geweigerd: precies één verzending', async () => {
  const { db, rij } = rijDb(); let calls = 0;
  const traag = (async () => { calls++; await new Promise((r) => setTimeout(r, 20)); return new Response('{"id":5}', { status: 201 }); }) as any;
  await Promise.all([verzend(db, { ...rij }, traag), verzend(db, { ...rij }, traag)]);
  assertEquals(calls, 1);
});
Deno.test('laat succesantwoord na vastloop-markering -> verzonden met order-ID, geen nieuwe poging', async () => {
  const { db, rij } = rijDb(); let calls = 0;
  const traag = (async () => { calls++; const t = (db.from('externe_bestellingen') as any); await t.update({ status: 'uitkomst_onbekend', versie: 3 }).eq('id', 'b1').maybeSingle(); return new Response('{"id":9}', { status: 201 }); }) as any;
  const r = await verzend(db, { ...rij }, traag);
  assertEquals(calls, 1); assertEquals(r.status, 'verzonden'); assertEquals(r.lightspeed_order_id, '9');
});
