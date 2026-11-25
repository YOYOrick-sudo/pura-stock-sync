import { assertEquals } from 'jsr:@std/assert@1';
import { controleer, type Bestelling, type Koppeling } from './eilandbezorgerLogica.ts';
import { prijsRegels } from './eilandbezorgerPrijzen.ts';
import { fictiefProduct, TEST_KLASSEN } from './eilandbezorgerPrijsFixtures.ts';

const hula = 'PV-F7B26912', vegan = 'PVK-319766B2-1', gluten = 'PVK-456C0BDC-1';
const maten = [
  { code: 'PVK-241B2733-1', id: '1071103', plu: 'Dh16', toeslag: 0, prijs: 1650 },
  { code: 'PVK-241B2733-2', id: '2385828', plu: 'B140', toeslag: 850, prijs: 2500 },
];
const mappings: Koppeling[] = maten.flatMap(m => [
  { soort: 'formaat', externe_code: `${hula}|${m.code}`, lightspeed_product_id: m.id, lightspeed_plu: m.plu, naam: 'Hula', prijs_cent: m.prijs, actief: true },
  { soort: 'extra', externe_code: `${hula}|${m.id}|${gluten}`, lightspeed_product_id: '263905', naam: 'Glutenvrij', prijs_cent: 0, actief: true },
]);
const optie = (code: string, aantal = 1, stukprijs_cent = 0) => ({ code, aantal, stukprijs_cent });
const bestelling = (maat = maten[0], opties = [optie(vegan)], aantal = 1): Bestelling => ({
  versie: 1, modus: 'test', bestelnummer: 'LOKAAL-HULA-VEGAN', vestiging: '36864', ophaaltijd: '2026-11-23T20:00:00+01:00', klant: { naam: 'Fictieve proef' },
  regels: [{ code: hula, aantal, stukprijs_cent: 1650, extras: [optie(maat.code, 1, maat.toeslag), ...opties] }],
  bedragen: { restaurant_cent: aantal * (maat.prijs + opties.reduce((s, e) => s + e.aantal * e.stukprijs_cent, 0)), bezorgkosten_cent: 0, fooi_cent: 0, korting: null },
  betaling: { wijze: 'vooraf_betaald' },
});
const _oudeAfkeur = { ok: false, reden: 'Hula is niet standaard vegan; er is geen door de eigenaar bevestigde vegan variant. Vegan-keuzes zijn niet toegestaan bij Klein of Groot.' };
for (const m of maten) {
  for (const aantal of [1, 2]) Deno.test(`Hula ${m.plu} ${aantal}x zonder Vegan behoudt product en totaal`, () => {
    const b = bestelling(m, [], aantal), bron = structuredClone(b);
    const c = controleer(b, mappings); if (!c.ok) throw new Error(c.reden);
    assertEquals(c.regels.map(r => [r.lightspeed_product_id, r.lightspeed_plu, r.aantal, r.stukprijs_cent, r.extras]), [[m.id, m.plu, aantal, m.prijs, []]]);
    assertEquals(c.regels[0].aantal * c.regels[0].stukprijs_cent, aantal * m.prijs);
    assertEquals(b, bron);
    assertEquals(prijsRegels(c.regels, [fictiefProduct(Number(m.id), m.prijs / 100)], TEST_KLASSEN)[0].kassa_modifiers, []);
  });
  Deno.test(`Hula ${m.plu} Vegan is informatieve bevestiging, rauwe keuze intact`, () => {
    const b = bestelling(m), bron = structuredClone(b);
    const c = controleer(b, mappings); if (!c.ok) throw new Error(c.reden);
    assertEquals(c.regels.map(r => [r.lightspeed_product_id, r.aantal, r.stukprijs_cent, r.extras]), [[m.id, 1, m.prijs, []]]);
    assertEquals(b, bron);
  });
  for (const opts of [[optie(vegan, 2)], [optie(vegan, 1, 100)]]) {
    Deno.test(`Hula ${m.plu} Vegan afwijkend aantal/prijs blijft afkeur ${JSON.stringify(opts)}`, () => assertEquals(controleer(bestelling(m, opts), mappings).ok, false));
  }
  Deno.test(`Hula ${m.plu} Vegan + Glutenvrij: alleen echte Glutenvrij-modifier`, () => {
    const c = controleer(bestelling(m, [optie(vegan), optie(gluten)]), mappings); if (!c.ok) throw new Error(c.reden);
    assertEquals(c.regels[0].extras.map(e => e.lightspeed_product_id), ['263905']);
  });
  Deno.test(`Hula ${m.plu} ongekoppelde Vegan-alias blijft afkeur`, () => assertEquals(controleer(bestelling(m, [optie('PVK-AD715B1F-1')]), mappings).ok, false));
  Deno.test(`Hula ${m.plu} onbekende optie blijft afkeur`, () => assertEquals(controleer(bestelling(m, [optie('ONBEKEND')]), mappings).ok, false));
  Deno.test(`Hula ${m.plu} onafhankelijk Glutenvrij behoudt echte modifier`, () => {
    const c = controleer(bestelling(m, [optie(gluten)]), mappings); if (!c.ok) throw new Error(c.reden);
    assertEquals(c.regels[0].extras, [{ lightspeed_product_id: '263905', naam: 'Glutenvrij', aantal: 1, stukprijs_cent: 0 }]);
    const p = { ...fictiefProduct(Number(m.id), m.prijs / 100), additions: [{ id: 263904, name: 'Lokale testgroep', values: [{ id: 263905, name: 'Glutenvrij', price: 0, priceWithoutVAT: 0 }] }] };
    assertEquals(prijsRegels(c.regels, [p], TEST_KLASSEN)[0].kassa_modifiers.map(v => [v.modifierValueId, v.price]), [[263905, 0]]);
  });
}
Deno.test('Hula dubbele Vegan-keuze blijft afkeur (Dubbel)', () => assertEquals(controleer(bestelling(maten[0], [optie(vegan), optie(vegan)]), mappings).ok, false));
Deno.test('Hula zonder maat blijft afkeur', () => {
  const b = bestelling(maten[0], []); b.regels[0].extras = [];
  assertEquals(controleer(b, mappings).ok, false);
});
Deno.test('Hula restaurantbedrag blijft exact gecontroleerd zonder Vegan', () => {
  const b = bestelling(maten[1], []); b.bedragen.restaurant_cent = 2501;
  assertEquals(controleer(b, mappings), { ok: false, reden: 'Restaurantbedrag klopt niet: regels 2500, opgegeven 2501' });
});
Deno.test('Sashimi Vegan blijft ongeoorloofd', () => {
  const b = bestelling(); b.regels[0].code = 'PV-0F623FEC'; b.regels[0].stukprijs_cent = 1700; b.bedragen.restaurant_cent = 1700;
  b.regels[0].extras = [optie('PVK-77BFC4AF-1'), optie(vegan)];
  const kop: Koppeling = { soort: 'formaat', externe_code: 'PV-0F623FEC|PVK-77BFC4AF-1', lightspeed_product_id: '2385824', lightspeed_plu: 'B136', naam: 'Sashimi', prijs_cent: 1700, actief: true };
  assertEquals(controleer(b, [kop]), { ok: false, reden: 'Onbekende of niet toepasselijke extra voor PV-0F623FEC (kassaproduct 2385824): PVK-319766B2-1' });
});
Deno.test('Uluwatu Vegan blijft een echte bereidingsmodifier', () => {
  const b = bestelling(); b.regels[0].code = 'PV-FB9B6AE8'; b.regels[0].stukprijs_cent = 1750; b.bedragen.restaurant_cent = 1750;
  b.regels[0].extras = [optie('PVK-B6B834AB-1'), optie(vegan)];
  const kop: Koppeling[] = [
    { soort: 'formaat', externe_code: 'PV-FB9B6AE8|PVK-B6B834AB-1', lightspeed_product_id: '3278252', lightspeed_plu: 'B197', naam: 'Uluwatu', prijs_cent: 1750, actief: true },
    { soort: 'extra', externe_code: `PV-FB9B6AE8|3278252|${vegan}`, lightspeed_product_id: '1307820', naam: 'Vegan', prijs_cent: 0, actief: true },
  ];
  const c = controleer(b, kop); if (!c.ok) throw new Error(c.reden);
  assertEquals(c.regels[0].extras, [{ lightspeed_product_id: '1307820', naam: 'Vegan', aantal: 1, stukprijs_cent: 0 }]);
});