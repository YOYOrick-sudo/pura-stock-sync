import { assertEquals, assertThrows } from 'jsr:@std/assert@1';
import { controleer, extraSleutel, type Bestelling, type Koppeling } from './eilandbezorgerLogica.ts';
import { prijsRegels } from './eilandbezorgerPrijzen.ts';
import { fictiefProduct, TEST_KLASSEN } from './eilandbezorgerPrijsFixtures.ts';

const friet = 'PVK-174BACEE-1';
const burgers = [
  { code: 'PV-BE202ED8', solo: '3278381', soloPlu: 'B198', combo: '3370275', comboPlu: 'B215' },
  { code: 'PV-CE0EF3F3', solo: '4499170', soloPlu: 'BPB4', combo: '4499175', comboPlu: 'BPB6' },
];
// Uitsluitend lokale fixtures; de solokoppelingen worden niet door deze opdracht opgeslagen.
const mappings: Koppeling[] = burgers.flatMap(b => [
  { soort: 'product', externe_code: b.code, lightspeed_product_id: b.solo, lightspeed_plu: b.soloPlu, naam: b.code, prijs_cent: 1550, actief: true },
  { soort: 'formaat', externe_code: `${b.code}|${friet}`, lightspeed_product_id: b.combo, lightspeed_plu: b.comboPlu, naam: b.code, prijs_cent: 2250, actief: true, keuze_verplicht: false, keuze_toeslag_cent: 700 },
]);
const bestelling = (code: string, extras: Bestelling['regels'][number]['extras'] = [], aantal = 1, prijs = 1550): Bestelling => ({
  versie: 1, modus: 'test', bestelnummer: 'LOKAAL-BURGER', vestiging: '36864', ophaaltijd: '2026-11-23T16:00:00+01:00', klant: { naam: 'Pura Test' },
  regels: [{ code, aantal, stukprijs_cent: prijs, extras }], bedragen: { restaurant_cent: aantal * (prijs + extras.reduce((s, e) => s + e.aantal * e.stukprijs_cent, 0)), bezorgkosten_cent: 0, fooi_cent: 0, korting: null }, betaling: { wijze: 'vooraf_betaald' },
});
const keuze = (code = friet, aantal = 1, stukprijs_cent = 700) => ({ code, aantal, stukprijs_cent });
for (const b of burgers) {
  Deno.test(`${b.code} solo kiest ${b.soloPlu}/${b.solo} €15,50`, () => {
    const c = controleer(bestelling(b.code), mappings); if (!c.ok) throw new Error(c.reden);
    assertEquals(c.regels.map(r => [r.lightspeed_product_id, r.stukprijs_cent, r.aantal, r.extras]), [[b.solo, 1550, 1, []]]);
  });
  for (const aantal of [1, 2]) Deno.test(`${b.code} ${aantal}x met friet kiest één ${b.comboPlu}/${b.combo} regel zonder dubbele toeslag`, () => {
    const c = controleer(bestelling(b.code, [keuze()], aantal), mappings); if (!c.ok) throw new Error(c.reden);
    assertEquals(c.regels.map(r => [r.lightspeed_product_id, r.stukprijs_cent, r.aantal, r.extras]), [[b.combo, 2250, aantal, []]]);
    assertEquals(c.regels[0].aantal * c.regels[0].stukprijs_cent, aantal * 2250);
    const p = prijsRegels(c.regels, [fictiefProduct(Number(b.combo), 22.5)], TEST_KLASSEN);
    assertEquals(p[0].bezorg_btw_pct, 9); assertEquals(p[0].netto_euro, 20.6422); assertEquals(p[0].kassa_modifiers, []);
    assertThrows(() => prijsRegels(c.regels, [fictiefProduct(Number(b.combo), 22.51)], TEST_KLASSEN));
  });
  Deno.test(`${b.code} friet aantal 2 per burger blokkeert`, () => assertEquals(controleer(bestelling(b.code, [keuze(friet, 2)]), mappings).ok, false));
  Deno.test(`${b.code} dubbele friet blokkeert`, () => assertEquals(controleer(bestelling(b.code, [keuze(), keuze()]), mappings).ok, false));
  Deno.test(`${b.code} basis 15 + friet 7,50 mag niet tegen totaal 22,50 wegvallen`, () => assertEquals(controleer(bestelling(b.code, [keuze(friet, 1, 750)], 1, 1500), mappings).ok, false));
}
Deno.test('combo werkt zonder solomapping; solo wordt niet zelf bedacht', () => {
  const alleen = mappings.filter(m => m.soort === 'formaat');
  assertEquals(controleer(bestelling(burgers[0].code, [keuze()]), alleen).ok, true);
  assertEquals(controleer(bestelling(burgers[0].code), alleen).ok, false);
});
Deno.test('2x burger met friet blijft €45; €59 met dubbele toeslag wordt afgekeurd', () => {
  const b = bestelling(burgers[0].code, [keuze()], 2);
  b.bedragen.restaurant_cent = 5900;
  assertEquals(controleer(b, mappings), { ok: false, reden: 'Restaurantbedrag klopt niet: regels 4500, opgegeven 5900' });
});
const bowl: Koppeling = { soort: 'formaat', externe_code: 'PV-F7B26912|PVK-241B2733-1', lightspeed_product_id: '1071103', lightspeed_plu: 'Dh16', naam: 'Hula klein', prijs_cent: 1650, actief: true };
Deno.test('bowlformaat blijft verplicht, ook als er een basisproduct bestaat', () => {
  const basis: Koppeling = { ...bowl, soort: 'product', externe_code: 'PV-F7B26912' };
  assertEquals(controleer(bestelling('PV-F7B26912', [], 1, 1650), [bowl, basis]).ok, false);
  assertEquals(controleer(bestelling('PV-F7B26912', [keuze('PVK-241B2733-1', 1, 0)], 1, 1650), [bowl, basis]).ok, true);
});
Deno.test('bowlmaat bij burger en burgerfriet bij bowl blokkeren', () => {
  assertEquals(controleer(bestelling(burgers[0].code, [keuze('PVK-241B2733-1', 1, 0)]), [...mappings, bowl]).ok, false);
  assertEquals(controleer(bestelling('PV-F7B26912', [keuze()], 1, 1650), [...mappings, bowl]).ok, false);
});
// Het onderstaande is een fictieve, uitsluitend lokale optie: nooit als echte koppeling opslaan.
const extra = (code: string, id = '9001', cent = 0): Koppeling => ({ soort: 'extra', externe_code: code, lightspeed_product_id: id, naam: 'Fictieve optie', prijs_cent: cent, actief: true });
const gerecht = burgers[0].code;
Deno.test('gerechtgebonden gratis optie normaliseert, globale of andermans optie niet', () => {
  const b = bestelling(gerecht, [keuze('OPT', 1, 0)]);
  assertEquals(controleer(b, [...mappings, extra(extraSleutel(gerecht, 'OPT'))]).ok, true);
  assertEquals(controleer(b, [...mappings, extra('OPT')]).ok, false);
  assertEquals(controleer(b, [...mappings, extra(extraSleutel(burgers[1].code, 'OPT'))]).ok, false);
});
Deno.test('optie voor soloproduct mag niet bij gekozen combiproduct', () => {
  const kop = [...mappings, extra(extraSleutel(gerecht, 'OPT', burgers[0].solo))];
  assertEquals(controleer(bestelling(gerecht, [keuze('OPT', 1, 0)]), kop).ok, true);
  assertEquals(controleer(bestelling(gerecht, [keuze(), keuze('OPT', 1, 0)]), kop).ok, false);
});
Deno.test('productgebonden mapping gaat vóór gerechtmapping; inactief blokkeert fallback', () => {
  const b = bestelling(gerecht, [keuze('OPT', 1, 0)]);
  const kop = [...mappings, extra(extraSleutel(gerecht, 'OPT')), { ...extra(extraSleutel(gerecht, 'OPT', burgers[0].solo), '9002'), actief: false }];
  assertEquals(controleer(b, kop).ok, false);
});
Deno.test('betaalde extra alleen met exact opgeslagen prijs', () => {
  assertEquals(controleer(bestelling(gerecht, [keuze('OPT', 1, 50)]), [...mappings, extra(extraSleutel(gerecht, 'OPT'), '9001', 50)]).ok, true);
  assertEquals(controleer(bestelling(gerecht, [keuze('OPT', 1, 50)]), [...mappings, extra(extraSleutel(gerecht, 'OPT'), '9001', 60)]).ok, false);
});
Deno.test('optie moet echt in additions van het definitieve kassaproduct staan', () => {
  const c = controleer(bestelling(gerecht, [keuze('OPT', 1, 0)]), [...mappings, extra(extraSleutel(gerecht, 'OPT'))]); if (!c.ok) throw new Error(c.reden);
  const p = { ...fictiefProduct(Number(burgers[0].solo), 15.5), additions: [{ id: 9000, name: 'Fictief', values: [{ id: 9001, name: 'Optie', price: 0, priceWithoutVAT: 0 }] }] };
  assertEquals(prijsRegels(c.regels, [p], TEST_KLASSEN)[0].kassa_modifiers[0].modifierId, 9000);
  assertThrows(() => prijsRegels(c.regels, [{ ...p, additions: [] }], TEST_KLASSEN));
  assertThrows(() => prijsRegels(c.regels, [{ ...p, additions: [{ ...p.additions[0], values: [{ ...p.additions[0].values[0], price: 1 }] }] }], TEST_KLASSEN));
});
Deno.test('twee verschillende keuzes in één modifiergroep blokkeren', () => {
  const c = controleer(bestelling(gerecht, [keuze('OPT', 1, 0), keuze('ANDER', 1, 0)]), [...mappings, extra(extraSleutel(gerecht, 'OPT')), extra(extraSleutel(gerecht, 'ANDER'), '9002')]); if (!c.ok) throw new Error(c.reden);
  const p = { ...fictiefProduct(Number(burgers[0].solo), 15.5), additions: [{ id: 9000, name: 'Fictief', values: [9001, 9002].map(id => ({ id, name: 'Optie', price: 0, priceWithoutVAT: 0 })) }] };
  assertThrows(() => prijsRegels(c.regels, [p], TEST_KLASSEN));
});