// Zes overige kanaalprijzen (Midsland). Alleen lokale fixtures; kassabruto bewust de oude masterprijs.
import { assertEquals, assertThrows } from 'jsr:@std/assert@1';
import { controleer, orderbericht, betaaldInBericht, KANAALPRIJS_OVERIG, type Bestelling, type Koppeling } from './eilandbezorgerLogica.ts';
import { prijsRegels, type KaartProduct } from './eilandbezorgerPrijzen.ts';
import { fictiefProduct, TEST_KLASSEN } from './eilandbezorgerPrijsFixtures.ts';

const P = (externe_code: string, id: string, plu: string, prijs_cent: number, soort: Koppeling['soort'] = 'product'): Koppeling => ({ soort, externe_code, lightspeed_product_id: id, lightspeed_plu: plu, naam: plu, prijs_cent, actief: true });
const kop: Koppeling[] = [P('PV-128F2537', '1515970', 'V7', 800), P('PV-2DEE5665', '1071040', 'Dv10', 1100), P('PV-0EB4E84F', '4705082', 'F77', 1150), P('PV-6593C2EE', '2380389', 'Z25', 550),
  P('PV-AC462190|PVK-6DE6849B-1', '5091637', 'L24', 550, 'formaat'), P('PV-AC462190|PVK-6DE6849B-2', '4538641', 'L14', 720, 'formaat'), P('PV-AC462190|PVK-6DE6849B-3', '3221352', 'B191', 970, 'formaat'),
  P('PV-6208BFEF|PVK-6DE6849B-1', '3278199', 'B194', 550, 'formaat'), P('PV-6208BFEF|PVK-6DE6849B-2', '5091636', 'L23', 720, 'formaat'), P('PV-6208BFEF|PVK-6DE6849B-3', '1057535', 'O&L20', 970, 'formaat'),
  { soort: 'extra', externe_code: 'PV-6208BFEF|3278199|PVK-DBE8A359-1', lightspeed_product_id: '1307819', naam: 'Glutenvrij brood', prijs_cent: 100, actief: true },
  { soort: 'extra', externe_code: 'PV-AC462190|5091637|PVK-DBE8A359-1', lightspeed_product_id: '1307819', naam: 'Glutenvrij brood', prijs_cent: 100, actief: true },
  P('PV-GINGER', '4636894', 'X', 490)];
const brood = { id: 142809, name: 'Glutenvrij (Brood)', values: [{ id: 1307819, name: 'Glutenvrij brood', price: 1, priceWithoutVAT: 0 }] };
const oud: Record<string, number> = { V7: 7.5, Dv10: 11.5, F77: 11.9, Z25: 5.7, L24: 4.7, B194: 4.7 };
const KAART: KaartProduct[] = [...Object.values(KANAALPRIJS_OVERIG).map(k => fictiefProduct(Number(k.id), oud[k.plu], 9)).map(p => p.id === 3278199 ? { ...p, additions: [brood] } : p),
  fictiefProduct(4538641, 7.2, 9), fictiefProduct(5091636, 7.2, 9)];
type E = { code: string; aantal: number; stukprijs_cent: number };
const r = (code: string, stukprijs_cent: number, extras: E[] = [], aantal = 1) => ({ code, aantal, stukprijs_cent, extras });
const maat = (n: 1 | 2 | 3, c = n === 1 ? 0 : n === 2 ? 170 : 420): E => ({ code: `PVK-6DE6849B-${n}`, aantal: 1, stukprijs_cent: c });
const best = (regels: Bestelling['regels'], restaurant_cent: number): Bestelling => ({ versie: 1, modus: 'test', bestelnummer: 'LOKAAL-ZES', vestiging: '36864', ophaaltijd: '2026-11-26T18:00:00+01:00',
  klant: { naam: 'Fictief' }, regels, bedragen: { restaurant_cent, bezorgkosten_cent: 0, fooi_cent: 0, korting: null }, betaling: { wijze: 'vooraf_betaald' } });
const ok = (b: Bestelling) => { const c = controleer(b, kop); if (!c.ok) throw new Error(c.reden); return c.regels; };
const bon = (b: Bestelling) => orderbericht({ referentie: 'LOKAAL', ophaaltijd: b.ophaaltijd, regels: prijsRegels(ok(b), KAART, TEST_KLASSEN), restaurant_cent: b.bedragen.restaurant_cent, betaalwijzeId: '285794', betaalwijzeTypeId: '4' });
const ZES = [r('PV-128F2537', 800), r('PV-2DEE5665', 1100), r('PV-0EB4E84F', 1150), r('PV-6593C2EE', 550), r('PV-AC462190', 550, [maat(1)]), r('PV-6208BFEF', 550, [maat(1)])];

Deno.test('SIX-mandje €47,00: kanaalbruto, netto uit 9%, betaling = restaurantbedrag', () => {
  const m = bon(best(ZES, 4700));
  assertEquals(m.orderItems.map((i: { unitPrice: number }) => i.unitPrice), [8, 11, 11.5, 5.5, 5.5, 5.5]);
  assertEquals(m.orderItems[0].unitPriceWithoutVat, 7.3394);
  assertEquals(betaaldInBericht(m), 4700);
});
Deno.test('middel/groot houden gewone kassaprijs 720/970', () => {
  for (const c of ['PV-AC462190', 'PV-6208BFEF']) {
    assertEquals(ok(best([r(c, 550, [maat(2)])], 720))[0].kanaal_prijs_cent, undefined);
    assertEquals(ok(best([r(c, 550, [maat(3)])], 970))[0].kanaal_prijs_cent, undefined);
  }
});
Deno.test('kleine vissoep + glutenvrij brood €6,50', () => {
  const m = bon(best([r('PV-6208BFEF', 550, [maat(1), { code: 'PVK-DBE8A359-1', aantal: 1, stukprijs_cent: 100 }])], 650));
  assertEquals([m.orderItems[0].unitPrice, m.orderItems[0].modifiers[0].price, betaaldInBericht(m)], [5.5, 1, 650]);
});
Deno.test('kleine kokos + brood: native niet toegewezen → actie Pura Midsland', () => {
  assertThrows(() => bon(best([r('PV-AC462190', 550, [maat(1), { code: 'PVK-DBE8A359-1', aantal: 1, stukprijs_cent: 100 }])], 650)), Error, 'Pura Midsland');
});
Deno.test('oude prijs, ontbrekende/vervalste maat en ander gerecht afgewezen', () => {
  assertEquals(controleer(best([r('PV-AC462190', 470, [maat(1)])], 470), kop).ok, false);
  assertEquals(controleer(best([r('PV-6208BFEF', 550)], 550), kop).ok, false);
  assertEquals(controleer(best([r('PV-AC462190', 550, [maat(2, 0)])], 550), kop).ok, false);
  assertEquals(controleer(best([r('PV-128F2537', 750)], 750), kop).ok, false);
  assertEquals(controleer(best([r('PV-GINGER', 550)], 550), kop).ok, false);
  const fout = kop.map(x => x.externe_code === 'PV-6208BFEF|PVK-6DE6849B-1' ? { ...x, lightspeed_product_id: '5091636' } : x);
  assertEquals(controleer(best([r('PV-6208BFEF', 550, [maat(1)])], 550), fout).ok, false);
});
Deno.test('opgeslagen kanaalregel op ander product/PLU geweigerd bij verzending', () => {
  assertThrows(() => prijsRegels([{ lightspeed_product_id: '4538641', lightspeed_plu: 'L14', naam: 'x', aantal: 1, stukprijs_cent: 550, kanaal_prijs_cent: 550, extras: [] }], KAART, TEST_KLASSEN));
});
