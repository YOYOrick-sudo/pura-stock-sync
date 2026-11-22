import { assertEquals } from 'jsr:@std/assert@1';
import { betaaldInBericht, controleer, formaatSleutel, orderbericht, orderPad, type Bestelling, type Koppeling } from './eilandbezorgerLogica.ts';
import { testPrijsRegels } from './eilandbezorgerPrijsFixtures.ts';

const basis = (regels: Bestelling['regels'], restaurant_cent: number): Bestelling => ({
  versie: 1, modus: 'test', bestelnummer: 'LOKAAL-1', vestiging: '36864', ophaaltijd: '2026-11-22T17:00:00+01:00',
  klant: { naam: 'Test' }, regels, bedragen: { restaurant_cent, bezorgkosten_cent: 0, fooi_cent: 0, korting: null }, betaling: { wijze: 'vooraf_betaald' },
});
const friet: Koppeling = { soort: 'product', externe_code: 'PV-FFA8275F', lightspeed_product_id: '4636994', lightspeed_plu: 'F-a12', naam: 'Zoete Aardappel Friet', prijs_cent: 700, actief: true };
// Kandidaat bezorgset (zelfde reeks als friet). Prijzen uit Lightspeed Midsland 21-11-2026.
const f = (p: string, k: string, id: string, naam: string, prijs: number): Koppeling => ({ soort: 'formaat', externe_code: formaatSleutel(p, k), lightspeed_product_id: id, naam, prijs_cent: prijs, actief: true });
const bowls = [
  f('PV-F7B26912', 'PVK-241B2733-1', '4636945', 'Hula - KLEIN', 1690),
  f('PV-F7B26912', 'PVK-241B2733-2', '4636952', 'Hula - GROOT', 2500),
  f('PV-0F623FEC', 'PVK-77BFC4AF-1', '4636944', 'Sashimi Zalm - KLEIN', 1690),
  f('PV-0F623FEC', 'PVK-77BFC4AF-2', '4636951', 'Sashimi Zalm - GROOT', 2500),
];
const bowl = (code: string, prijs: number, keuze: string, toeslag: number, aantal = 1) => ({ code, aantal, stukprijs_cent: prijs, extras: [{ code: keuze, aantal: 1, stukprijs_cent: toeslag }] });

Deno.test('friet 3x: €21 restaurant en precies €21 vooraf betaald, route met klant', () => {
  const c = controleer(basis([{ code: 'PV-FFA8275F', aantal: 3, stukprijs_cent: 700 }], 2100), [friet]);
  if (!c.ok) throw new Error(c.reden);
  const m = orderbericht({ referentie: 'EB-T-1', ophaaltijd: '2026-11-22T17:00:00+01:00', klant: { naam: 'Test' }, regels: testPrijsRegels(c.regels), restaurant_cent: 2100, betaalwijzeId: '1', betaalwijzeTypeId: '2', klantId: '9' });
  assertEquals(betaaldInBericht(m), 2100);
  assertEquals(m.orderItems.reduce((s, r) => s + Math.round(r.totalPrice * 100), 0), 2100);
  assertEquals(m.status, 'ACCEPTED');
  assertEquals(orderPad('customer_order', '9'), '/rest/onlineordering/customer/9/order');
  assertEquals(orderPad('establishment_order', '9'), '/rest/onlineordering/customer/9/establishmentorder');
  assertEquals(orderPad('customer_order', null), null);
});

Deno.test('Hula Groot: €16,50 + €8,50 wordt 1x Hula - GROOT €25, toeslag niet dubbel', () => {
  const c = controleer(basis([bowl('PV-F7B26912', 1650, 'PVK-241B2733-2', 850)], 2500), bowls);
  if (!c.ok) throw new Error(c.reden);
  assertEquals(c.regels.length, 1); assertEquals(c.regels[0].lightspeed_product_id, '4636952');
  assertEquals(c.regels[0].aantal, 1); assertEquals(c.regels[0].stukprijs_cent, 2500); assertEquals(c.regels[0].extras, []);
});

Deno.test('2x Hula Groot = 2x Hula - GROOT, samen €50', () => {
  const c = controleer(basis([bowl('PV-F7B26912', 1650, 'PVK-241B2733-2', 850, 2)], 5000), bowls);
  if (!c.ok) throw new Error(c.reden);
  assertEquals(c.regels[0].aantal, 2); assertEquals(c.regels[0].aantal * c.regels[0].stukprijs_cent, 5000);
});

Deno.test('Sashimi Groot: Karin €25,50 vs kassa €25,00 wordt zichtbaar geblokkeerd', () => {
  const c = controleer(basis([bowl('PV-0F623FEC', 1700, 'PVK-77BFC4AF-2', 850)], 2550), bowls);
  assertEquals(c.ok, false); if (!c.ok) assertEquals(c.reden.includes('kassa 2500, kreeg 2550'), true);
});

Deno.test('Klein met €0 toeslag kiest expliciet het kleine product; prijsverschil blokkeert', () => {
  const h = controleer(basis([bowl('PV-F7B26912', 1650, 'PVK-241B2733-1', 0)], 1650), bowls);
  assertEquals(h.ok, false); if (!h.ok) assertEquals(h.reden.includes('kassa 1690, kreeg 1650'), true);
  const gelijk = controleer(basis([bowl('PV-F7B26912', 1690, 'PVK-241B2733-1', 0)], 1690), bowls);
  if (!gelijk.ok) throw new Error(gelijk.reden);
  assertEquals(gelijk.regels[0].lightspeed_product_id, '4636945');
});

Deno.test('bowl zonder formaat wordt afgekeurd', () => {
  const c = controleer(basis([{ code: 'PV-F7B26912', aantal: 1, stukprijs_cent: 1650 }], 1650), bowls);
  assertEquals(c.ok, false);
});
