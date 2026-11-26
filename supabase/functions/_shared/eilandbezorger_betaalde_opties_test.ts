// Regressies voor betaalde keuzes volgens aangetoonde Lightspeed-onlineorders (unitPrice = basis,
// modifier.price = bruto toeslag per portie, betaling = som). Uitsluitend lokale fixtures.
import { assertEquals, assertThrows } from 'jsr:@std/assert@1';
import { controleer, orderbericht, type Bestelling, type Koppeling } from './eilandbezorgerLogica.ts';
import { prijsRegels, type KaartProduct } from './eilandbezorgerPrijzen.ts';
import { fictiefProduct, TEST_KLASSEN } from './eilandbezorgerPrijsFixtures.ts';

const saus = [{ id: 167648, name: 'Sriracha (Home made)', multiselect: true, maxSelectedAmount: 1, values: [{ id: 1625385, name: 'Sriracha', price: 0.5, priceWithoutVAT: 0 }] },
  { id: 175168, name: 'Sambal', multiselect: true, maxSelectedAmount: 1, values: [{ id: 1716435, name: 'Sambal', price: 0.5, priceWithoutVAT: 0 }] }];
const brood = { id: 142809, name: 'Glutenvrij (Brood)', multiselect: true, maxSelectedAmount: -1, values: [{ id: 1307819, name: 'Glutenvrij brood', price: 1, priceWithoutVAT: 0 }] };
const kaart = (id: number, bruto: number, additions: KaartProduct['additions']): KaartProduct => ({ ...fictiefProduct(id, bruto), additions });
const KAART = [kaart(3278962, 26, saus), kaart(5091636, 7.2, [brood]), kaart(2084809, 10.8, [brood]), kaart(4499175, 22.5, [brood, ...saus]), kaart(3370275, 22.5, saus), kaart(3467557, 3.9, [])];
const kop: Koppeling[] = [
  { soort: 'formaat', externe_code: 'PV-FB9B6AE8|PVK-B6B834AB-2', lightspeed_product_id: '3278962', lightspeed_plu: 'B208', naam: 'Uluwatu Groot', prijs_cent: 2600, actief: true },
  { soort: 'extra', externe_code: 'PV-FB9B6AE8|3278962|PVK-050E53CA-1', lightspeed_product_id: '1625385', naam: 'Sriracha', prijs_cent: 0, actief: true },
  { soort: 'extra', externe_code: 'PV-FB9B6AE8|3278962|PVK-050E53CA-2', lightspeed_product_id: '1716435', naam: 'Sambal', prijs_cent: 0, actief: true },
  { soort: 'formaat', externe_code: 'PV-6208BFEF|PVK-6DE6849B-2', lightspeed_product_id: '5091636', lightspeed_plu: 'L23', naam: 'Vissoep Middel', prijs_cent: 720, actief: true },
  { soort: 'extra', externe_code: 'PV-6208BFEF|5091636|PVK-DBE8A359-1', lightspeed_product_id: '1307819', naam: 'Glutenvrij brood', prijs_cent: 100, actief: true },
  { soort: 'product', externe_code: 'PV-6F37A149', lightspeed_product_id: '2084809', lightspeed_plu: 'V11', naam: 'Loaded Hummus', prijs_cent: 1080, actief: true },
  { soort: 'extra', externe_code: 'PV-6F37A149|2084809|PVK-DBE8A359-1', lightspeed_product_id: '1307819', naam: 'Glutenvrij brood', prijs_cent: 100, actief: true },
  { soort: 'product', externe_code: 'PV-7B1071AD', lightspeed_product_id: '2843422', lightspeed_plu: 'F47', naam: 'Tom Kha', prijs_cent: 1190, actief: true },
  { soort: 'product', externe_code: 'PV-KD7', lightspeed_product_id: '3467557', lightspeed_plu: 'KD7', naam: 'Schulp Appelsap', prijs_cent: 390, actief: true },
];
const e = (code: string, stukprijs_cent = 0, aantal = 1) => ({ code, aantal, stukprijs_cent });
const best = (regels: Bestelling['regels'], restaurant_cent: number): Bestelling => ({ versie: 1, modus: 'test', bestelnummer: 'LOKAAL-BETAALD', vestiging: '36864', ophaaltijd: '2026-11-25T18:00:00+01:00',
  klant: { naam: 'Fictief' }, regels, bedragen: { restaurant_cent, bezorgkosten_cent: 0, fooi_cent: 0, korting: null }, betaling: { wijze: 'vooraf_betaald' } });
const bon = (b: Bestelling) => { const c = controleer(b, kop); if (!c.ok) throw new Error(c.reden);
  return orderbericht({ referentie: 'LOKAAL', ophaaltijd: b.ophaaltijd, opmerking: b.opmerking, regels: prijsRegels(c.regels, KAART, TEST_KLASSEN), restaurant_cent: b.bedragen.restaurant_cent, betaalwijzeId: '285794', betaalwijzeTypeId: '4' }); };

Deno.test('Uluwatu Groot zonder saus: €26, geen modifiers', () => {
  const m = bon(best([{ code: 'PV-FB9B6AE8', aantal: 1, stukprijs_cent: 1750, extras: [e('PVK-B6B834AB-2', 850)] }], 2600));
  assertEquals(m.orderItems.map(i => [i.unitPrice, i.totalPrice, i.modifiers.length]), [[26, 26, 0]]);
});
for (const [code, naam] of [['PVK-050E53CA-1', 'Sriracha'], ['PVK-050E53CA-2', 'Sambal']] as const) Deno.test(`Uluwatu Groot + gratis ${naam}: €26, geen €0,50-modifier, instructie op regel`, () => {
  const m = bon(best([{ code: 'PV-FB9B6AE8', aantal: 1, stukprijs_cent: 1750, extras: [e('PVK-B6B834AB-2', 850), e(code)] }], 2600));
  assertEquals([m.orderItems[0].totalPrice, m.orderItems[0].modifiers.length, m.orderPayments?.[0].amount], [26, 0, 26]);
  assertEquals(m.note, `Regel 1 (1×) – Uluwatu Groot – extra saus (gratis): ${naam}`);
});
Deno.test('Uluwatu Groot ×2 + Sriracha + Sambal gratis: €52, beide sauzen op juiste regel, gastnotitie behouden', () => {
  const m = bon({ ...best([{ code: 'PV-FB9B6AE8', aantal: 2, stukprijs_cent: 1750, extras: [e('PVK-B6B834AB-2', 850), e('PVK-050E53CA-1'), e('PVK-050E53CA-2')] }], 5200), opmerking: 'Bel aan' });
  assertEquals([m.orderItems.length, m.orderItems[0].amount, m.orderItems[0].totalPrice, m.orderPayments?.[0].amount], [1, 2, 52, 52]);
  assertEquals(m.note, 'Bel aan\n\nRegel 1 (2×) – Uluwatu Groot – extra saus (gratis): Sriracha + Sambal');
});
Deno.test('Verouderde sausprijs €0,50 afgewezen; saus bij verkeerd gerecht afgewezen', () => {
  const r = controleer(best([{ code: 'PV-FB9B6AE8', aantal: 1, stukprijs_cent: 1750, extras: [e('PVK-B6B834AB-2', 850), e('PVK-050E53CA-1', 50)] }], 2650), kop);
  assertEquals(r.ok === false && r.reden.includes('kassa 0, kreeg 50'), true);
  assertEquals(controleer(best([{ code: 'PV-6F37A149', aantal: 1, stukprijs_cent: 1080, extras: [e('PVK-050E53CA-1')] }], 1080), kop).ok, false);
});
Deno.test('Gratis saus + betaald brood (Bietenburger met friet): €23,50, alleen broodmodifier', () => {
  const k: Koppeling[] = [...kop, { soort: 'formaat', externe_code: 'PV-CE0EF3F3|PVK-174BACEE-1', lightspeed_product_id: '4499175', lightspeed_plu: 'BPB6', naam: 'Bietenburger friet', prijs_cent: 2250, actief: true, keuze_verplicht: false, keuze_toeslag_cent: 700 } as Koppeling,
    { soort: 'extra', externe_code: 'PV-CE0EF3F3|4499175|PVK-174BACEE-3', lightspeed_product_id: '1716435', naam: 'Sambal', prijs_cent: 0, actief: true },
    { soort: 'extra', externe_code: 'PV-CE0EF3F3|4499175|PVK-DBE8A359-1', lightspeed_product_id: '1307819', naam: 'Glutenvrij brood', prijs_cent: 100, actief: true }];
  const b = best([{ code: 'PV-CE0EF3F3', aantal: 1, stukprijs_cent: 1550, extras: [e('PVK-DBE8A359-1', 100), e('PVK-174BACEE-1', 700), e('PVK-174BACEE-3')] }], 2350);
  const c = controleer(b, k); if (!c.ok) throw new Error(c.reden);
  const m = orderbericht({ referentie: 'L', ophaaltijd: b.ophaaltijd, regels: prijsRegels(c.regels, KAART, TEST_KLASSEN), restaurant_cent: 2350, betaalwijzeId: '285794', betaalwijzeTypeId: '4' });
  assertEquals([m.orderItems[0].totalPrice, m.orderItems[0].modifiers.map(x => [x.modifierValueId, x.price]), m.orderPayments?.[0].amount], [23.5, [[1307819, 1]], 23.5]);
  assertEquals(m.note, 'Regel 1 (1×) – Bietenburger friet – extra saus (gratis): Sambal');
});
Deno.test('Uluwatu Vegan blijft echte modifier; Hummus Vegan alleen informatief', () => {
  const k: Koppeling[] = [...kop, { soort: 'extra', externe_code: 'PV-FB9B6AE8|3278962|PVK-319766B2-1', lightspeed_product_id: '999001', naam: 'Vegan', prijs_cent: 0, actief: true }];
  const u = controleer(best([{ code: 'PV-FB9B6AE8', aantal: 1, stukprijs_cent: 1750, extras: [e('PVK-B6B834AB-2', 850), e('PVK-319766B2-1')] }], 2600), k);
  assertEquals(u.ok && u.regels[0].extras.map(x => x.lightspeed_product_id), ['999001']);
  const h = controleer(best([{ code: 'PV-6F37A149', aantal: 1, stukprijs_cent: 1080, extras: [e('PVK-AD715B1F-1')] }], 1080), k);
  assertEquals(h.ok && h.regels[0].extras, []);
});
Deno.test('Vissoep Middel ×2 met glutenvrij brood: twee porties van €8,20, toeslag exact één keer per portie', () => {
  const m = bon(best([{ code: 'PV-6208BFEF', aantal: 2, stukprijs_cent: 550, extras: [e('PVK-6DE6849B-2', 170), e('PVK-DBE8A359-1', 100)] }], 1640));
  assertEquals(m.orderItems.map(i => [i.amount, i.unitPrice, i.totalPrice, i.modifiers.map(x => x.price)]), [[1, 7.2, 8.2, [1]], [1, 7.2, 8.2, [1]]]);
  assertEquals(m.orderPayments?.[0].amount, 16.4);
});
Deno.test('Loaded Hummus: zonder broodwissel, met broodwissel, twee porties', () => {
  assertEquals(bon(best([{ code: 'PV-6F37A149', aantal: 1, stukprijs_cent: 1080 }], 1080)).orderItems[0].totalPrice, 10.8);
  assertEquals(bon(best([{ code: 'PV-6F37A149', aantal: 1, stukprijs_cent: 1080, extras: [e('PVK-DBE8A359-1', 100)] }], 1180)).orderPayments?.[0].amount, 11.8);
  assertEquals(bon(best([{ code: 'PV-6F37A149', aantal: 2, stukprijs_cent: 1080, extras: [e('PVK-DBE8A359-1', 100)] }], 2360)).orderItems.length, 2);
});
Deno.test('Restaurantbedrag zonder toeslag blokkeert; dubbele saus blokkeert', () => {
  assertEquals(controleer(best([{ code: 'PV-6F37A149', aantal: 1, stukprijs_cent: 1080, extras: [e('PVK-DBE8A359-1', 100)] }], 1080), kop).ok, false);
  assertEquals(controleer(best([{ code: 'PV-FB9B6AE8', aantal: 1, stukprijs_cent: 1750, extras: [e('PVK-B6B834AB-2', 850), e('PVK-050E53CA-1'), e('PVK-050E53CA-1')] }], 2600), kop).ok, false);
});
Deno.test('Kassamodifier met andere prijs dan aangeleverd blokkeert', () => {
  const c = controleer(best([{ code: 'PV-6F37A149', aantal: 1, stukprijs_cent: 1080, extras: [e('PVK-DBE8A359-1', 100)] }], 1180), kop); if (!c.ok) throw new Error(c.reden);
  assertThrows(() => prijsRegels(c.regels, [kaart(2084809, 10.8, [{ ...brood, values: [{ ...brood.values[0], price: 1.5 }] }])], TEST_KLASSEN));
});
Deno.test('Tom Kha Vegan is informatief; Bietenburger Glutenvrij en Lamsburger brood blokkeren met concrete reden', () => {
  const c = controleer(best([{ code: 'PV-7B1071AD', aantal: 1, stukprijs_cent: 1190, extras: [e('PVK-319766B2-1')] }], 1190), kop); if (!c.ok) throw new Error(c.reden);
  assertEquals(c.regels[0].extras, []);
  const biet: Koppeling = { soort: 'product', externe_code: 'PV-CE0EF3F3', lightspeed_product_id: '4499170', lightspeed_plu: 'BPB4', naam: 'Bietenburger', prijs_cent: 1550, actief: true };
  const r = controleer(best([{ code: 'PV-CE0EF3F3', aantal: 1, stukprijs_cent: 1550, extras: [e('PVK-319766B2-1'), e('PVK-456C0BDC-1')] }], 1550), [biet]);
  assertEquals(r.ok === false && r.reden.startsWith('Bietenburger Glutenvrij'), true);
  const lam: Koppeling = { soort: 'product', externe_code: 'PV-BE202ED8', lightspeed_product_id: '3278381', lightspeed_plu: 'B198', naam: 'Lamsburger', prijs_cent: 1550, actief: true };
  const l = controleer(best([{ code: 'PV-BE202ED8', aantal: 1, stukprijs_cent: 1550, extras: [e('PVK-DBE8A359-1', 100)] }], 1650), [lam]);
  assertEquals(l.ok === false && l.reden.startsWith('Glutenvrij brood is in de kassa niet beschikbaar voor Lamsburger'), true);
});
Deno.test('Schulp Appelsap: €4,00 blijft steken, €3,90 per beker zonder statiegeld slaagt', () => {
  assertEquals(controleer(best([{ code: 'PV-KD7', aantal: 2, stukprijs_cent: 400 }], 800), kop).ok, false);
  assertEquals(bon(best([{ code: 'PV-KD7', aantal: 2, stukprijs_cent: 390 }], 780)).orderItems.map(i => [i.amount, i.totalPrice]), [[2, 7.8]]);
});
