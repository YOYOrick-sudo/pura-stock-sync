// Kanaalprijs bieren, glutenvrij brood per portie en native-keuze-blokkades. Alleen lokale fixtures.
import { assertEquals, assertThrows } from 'jsr:@std/assert@1';
import { controleer, orderbericht, betaaldInBericht, KANAALPRIJS_BIER, type Bestelling, type Koppeling } from './eilandbezorgerLogica.ts';
import { prijsRegels, type KaartProduct } from './eilandbezorgerPrijzen.ts';
import { fictiefProduct, TEST_KLASSEN } from './eilandbezorgerPrijsFixtures.ts';

const oud: Record<string, number> = { B245: 3.5, B273: 7.5, B14: 5.5 };
const kop: Koppeling[] = Object.entries(KANAALPRIJS_BIER).map(([code, k]) => ({ soort: 'product', externe_code: code, lightspeed_product_id: k.id, lightspeed_plu: k.plu, naam: k.plu, prijs_cent: k.cent, actief: true }));
kop.push({ soort: 'product', externe_code: 'PV-85B02FF8', lightspeed_product_id: '4705084', lightspeed_plu: 'F79', naam: 'Loaded Labneh', prijs_cent: 1080, actief: true },
  { soort: 'extra', externe_code: 'PV-85B02FF8|4705084|PVK-DBE8A359-1', lightspeed_product_id: '1307819', naam: 'Glutenvrij brood', prijs_cent: 100, actief: true },
  { soort: 'product', externe_code: 'PV-586BEAF0', lightspeed_product_id: '4094171', lightspeed_plu: 'F67', naam: 'Paddenstoelen boter', prijs_cent: 900, actief: true },
  { soort: 'extra', externe_code: 'PV-586BEAF0|4094171|PVK-DBE8A359-1', lightspeed_product_id: '1307819', naam: 'Glutenvrij brood', prijs_cent: 100, actief: true },
  { soort: 'product', externe_code: 'PV-DDB41ADC', lightspeed_product_id: '5091855', lightspeed_plu: 'F91', naam: 'Thai kip spies', prijs_cent: 970, actief: true },
  { soort: 'extra', externe_code: 'PV-DDB41ADC|5091855|PVK-456C0BDC-1', lightspeed_product_id: '263905', naam: 'Glutenvrij', prijs_cent: 0, actief: true },
  { soort: 'product', externe_code: 'PV-GINGER', lightspeed_product_id: '4636894', lightspeed_plu: 'X', naam: 'Ginger', prijs_cent: 490, actief: true });
const brood = { id: 142809, name: 'Glutenvrij (Brood)', multiselect: true, maxSelectedAmount: -1, values: [{ id: 1307819, name: 'Glutenvrij brood', price: 1, priceWithoutVAT: 0 }] };
const gv = { id: 30001, name: 'Glutenvrij', values: [{ id: 263905, name: 'Glutenvrij', price: 0, priceWithoutVAT: 0 }] };
// Kassabruto bewust de oude masterprijs; tarief bier 21%, B14 (0.0) fictief laag tarief 9%.
const KAART: KaartProduct[] = [...Object.values(KANAALPRIJS_BIER).map(k => fictiefProduct(Number(k.id), oud[k.plu] ?? k.cent / 100, k.plu === 'B14' ? 9 : 21)),
  { ...fictiefProduct(4705084, 10.8), additions: [brood] }, fictiefProduct(4094171, 9), fictiefProduct(5091855, 9.7), { ...fictiefProduct(5091855, 9.7), id: 1, additions: [gv] }];
const r = (code: string, stukprijs_cent: number, aantal = 1, extras: { code: string; aantal: number; stukprijs_cent: number }[] = []) => ({ code, aantal, stukprijs_cent, extras });
const best = (regels: Bestelling['regels'], restaurant_cent: number): Bestelling => ({ versie: 1, modus: 'test', bestelnummer: 'LOKAAL-KANAAL', vestiging: '36864', ophaaltijd: '2026-11-26T18:00:00+01:00',
  klant: { naam: 'Fictief' }, regels, bedragen: { restaurant_cent, bezorgkosten_cent: 0, fooi_cent: 0, korting: null }, betaling: { wijze: 'vooraf_betaald' } });
const bon = (b: Bestelling, kaart = KAART) => { const c = controleer(b, kop); if (!c.ok) throw new Error(c.reden);
  return orderbericht({ referentie: 'LOKAAL', ophaaltijd: b.ophaaltijd, regels: prijsRegels(c.regels, kaart, TEST_KLASSEN), restaurant_cent: b.bedragen.restaurant_cent, betaalwijzeId: '285794', betaalwijzeTypeId: '4' }); };

Deno.test('B245 omhoog: kanaal €8,50 boven kassa €3,50, netto uit 21%', () => {
  const m = bon(best([r('PV-5021B6B2', 850, 2)], 1700));
  assertEquals([m.orderItems[0].unitPrice, m.orderItems[0].totalPrice, m.orderItems[0].unitPriceWithoutVat, m.orderItems[0].totalPriceWithoutVat, betaaldInBericht(m)], [8.5, 17, 7.0248, 14.05, 1700]);
});
Deno.test('B273 omlaag: kanaal €3,50 onder kassa €7,50', () => {
  const m = bon(best([r('PV-45681D3B', 350, 3)], 1050));
  assertEquals([m.orderItems[0].unitPrice, m.orderItems[0].unitPriceWithoutVat, m.orderItems[0].totalPriceWithoutVat], [3.5, 2.8926, 8.68]);
});
Deno.test('B14 Jever €5 met laag tarief uit de echte klasse', () => {
  const m = bon(best([r('PV-108DA217', 500)], 500));
  assertEquals([m.orderItems[0].unitPrice, m.orderItems[0].unitPriceWithoutVat], [5, 4.5872]);
});
Deno.test('alle 15 bieren: betaling = restaurantbedrag', () => {
  const regels = Object.entries(KANAALPRIJS_BIER).map(([c, k]) => r(c, k.cent));
  const som = regels.reduce((s, x) => s + x.stukprijs_cent, 0);
  assertEquals(som, 12025);
  assertEquals(betaaldInBericht(bon(best(regels, som))), som);
});
Deno.test('fout bierbedrag (oude kassaprijs) afgewezen', () => {
  const c = controleer(best([r('PV-5021B6B2', 350)], 350), kop); assertEquals(c.ok, false);
  const d = controleer(best([r('PV-5021B6B2', 851)], 851), kop); assertEquals(d.ok, false);
});
Deno.test('non-bier houdt gewone kassaprijscontrole', () => {
  const c = controleer(best([r('PV-GINGER', 490)], 490), kop); if (!c.ok) throw new Error(c.reden);
  assertEquals(c.regels[0].kanaal_prijs_cent, undefined);
  assertThrows(() => prijsRegels(c.regels, [fictiefProduct(4636894, 5)], TEST_KLASSEN));
});
Deno.test('kanaalprijs kan niet via ander product of vervalste regel', () => {
  const k2 = kop.map(x => x.externe_code === 'PV-5021B6B2' ? { ...x, lightspeed_product_id: '4636894' } : x);
  assertEquals(controleer(best([r('PV-5021B6B2', 850)], 850), k2).ok, false);
  assertThrows(() => prijsRegels([{ lightspeed_product_id: '4636894', lightspeed_plu: 'X', naam: 'x', aantal: 1, stukprijs_cent: 850, kanaal_prijs_cent: 850, extras: [] }], [fictiefProduct(4636894, 4.9)], TEST_KLASSEN));
});
Deno.test('2× Labneh + glutenvrij brood = €23,60, €1 per portie', () => {
  const m = bon(best([r('PV-85B02FF8', 1080, 2, [{ code: 'PVK-DBE8A359-1', aantal: 1, stukprijs_cent: 100 }])], 2360));
  assertEquals([m.orderItems.length, m.orderItems[0].totalPrice, m.orderItems[0].modifiers[0].price, betaaldInBericht(m)], [2, 11.8, 1, 2360]);
});
Deno.test('Labneh brood met verkeerde prijs of totaal afgewezen', () => {
  assertEquals(controleer(best([r('PV-85B02FF8', 1080, 2, [{ code: 'PVK-DBE8A359-1', aantal: 1, stukprijs_cent: 0 }])], 2160), kop).ok, false);
  assertEquals(controleer(best([r('PV-85B02FF8', 1080, 2, [{ code: 'PVK-DBE8A359-1', aantal: 1, stukprijs_cent: 100 }])], 2260), kop).ok, false);
});
Deno.test('Paddenstoelenboter: native brood nog niet toegewezen → blokkade met actie Karin', () => {
  assertThrows(() => bon(best([r('PV-586BEAF0', 900, 1, [{ code: 'PVK-DBE8A359-1', aantal: 1, stukprijs_cent: 100 }])], 1000)), Error, 'Actie Pura Midsland');
});
Deno.test('Thai saté: native Glutenvrij ontbreekt → blokkade; aanwezig → echte modifier 263905, geen notitie', () => {
  const b = best([r('PV-DDB41ADC', 970, 1, [{ code: 'PVK-456C0BDC-1', aantal: 1, stukprijs_cent: 0 }])], 970);
  assertThrows(() => bon(b), Error, 'Actie Pura Midsland');
  const kaart = KAART.map(p => p.id === 5091855 ? { ...p, additions: [gv] } : p);
  const m = bon(b, kaart);
  assertEquals([m.orderItems[0].modifiers[0].modifierValueId, m.note], [263905, undefined]);
});
