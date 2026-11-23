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
for (const m of maten) {
  for (const aantal of [1, 2]) Deno.test(`Hula ${m.plu} ${aantal}x Vegan bevestiging: vaste ID, prijs en geen modifier`, () => {
    const b = bestelling(m, [optie(vegan)], aantal), bron = structuredClone(b);
    const c = controleer(b, mappings); if (!c.ok) throw new Error(c.reden);
    assertEquals(c.regels.map(r => [r.lightspeed_product_id, r.lightspeed_plu, r.aantal, r.stukprijs_cent, r.extras]), [[m.id, m.plu, aantal, m.prijs, []]]);
    assertEquals(c.regels[0].aantal * c.regels[0].stukprijs_cent, aantal * m.prijs);
    assertEquals(b, bron);
    assertEquals(b.regels[0].extras?.filter(e => e.code === vegan), [optie(vegan)]);
    const geprijsd = prijsRegels(c.regels, [fictiefProduct(Number(m.id), m.prijs / 100)], TEST_KLASSEN);
    assertEquals(geprijsd[0].kassa_modifiers, []);
  });
  Deno.test(`Hula ${m.plu} zonder Vegan blijft identiek`, () => {
    assertEquals(controleer(bestelling(m, []), mappings), controleer(bestelling(m), mappings));
  });
  Deno.test(`Hula ${m.plu} Vegan verwijdert nooit echte Glutenvrij modifier`, () => {
    const b = bestelling(m, [optie(vegan), optie(gluten)]), bron = structuredClone(b);
    const c = controleer(b, mappings); if (!c.ok) throw new Error(c.reden);
    assertEquals(c.regels[0].extras, [{ lightspeed_product_id: '263905', naam: 'Glutenvrij', aantal: 1, stukprijs_cent: 0 }]);
    assertEquals(b, bron);
    const p = { ...fictiefProduct(Number(m.id), m.prijs / 100), additions: [{ id: 263904, name: 'Lokale testgroep', values: [{ id: 263905, name: 'Glutenvrij', price: 0, priceWithoutVAT: 0 }] }] };
    const priced = prijsRegels(c.regels, [p], TEST_KLASSEN);
    assertEquals(priced[0].kassa_modifiers.map(v => [v.modifierValueId, v.price]), [[263905, 0]]);
  });
  for (const field of ['lightspeed_product_id', 'lightspeed_plu', 'prijs_cent', 'keuze_verplicht'] as const) Deno.test(`Hula Vegan weigert gewijzigde ${field} bij ${m.plu}`, () => {
    const fout = mappings.map(k => k.soort === 'formaat' && k.lightspeed_product_id === m.id ? { ...k, [field]: field === 'prijs_cent' ? m.prijs + 1 : field === 'keuze_verplicht' ? false : 'ONJUIST' } : k);
    assertEquals(controleer(bestelling(m), fout).ok, false);
  });
  Deno.test(`Hula Vegan weigert inactive formaat ${m.plu}`, () => {
    assertEquals(controleer(bestelling(m), mappings.map(k => k.soort === 'formaat' && k.lightspeed_product_id === m.id ? { ...k, actief: false } : k)).ok, false);
  });
  Deno.test(`Hula Vegan weigert één cent afwijkende basisprijs ${m.plu}`, () => {
    const b = bestelling(m); b.regels[0].stukprijs_cent += 1; b.bedragen.restaurant_cent += 1;
    assertEquals(controleer(b, mappings).ok, false);
  });
}
Deno.test('Hula Vegan dubbele keuze blokkeert', () => assertEquals(controleer(bestelling(maten[0], [optie(vegan), optie(vegan)]), mappings), { ok: false, reden: `Dubbele extra of keuze voor ${hula}` }));
Deno.test('Hula Vegan aantal 2 per product blokkeert', () => assertEquals(controleer(bestelling(maten[0], [optie(vegan, 2)]), mappings).ok, false));
Deno.test('Hula Vegan één cent toeslag blokkeert', () => assertEquals(controleer(bestelling(maten[0], [optie(vegan, 1, 1)]), mappings).ok, false));
Deno.test('Hula Vegan zonder formaat blokkeert, ook met solomapping', () => {
  const b = bestelling(); b.regels[0].extras = [optie(vegan)];
  const solo: Koppeling = { soort: 'product', externe_code: hula, lightspeed_product_id: '1071103', lightspeed_plu: 'Dh16', naam: 'Hula', prijs_cent: 1650, actief: true };
  assertEquals(controleer(b, [...mappings, solo]).ok, false);
  assertEquals(controleer(b, [solo]).ok, false);
});
Deno.test('Hula Vegan verkeerd formaat blokkeert', () => {
  const b = bestelling(); b.regels[0].extras = [optie('PVK-77BFC4AF-1'), optie(vegan)];
  assertEquals(controleer(b, mappings).ok, false);
});
Deno.test('Hula Vegan twee formaten blokkeert', () => assertEquals(controleer(bestelling(maten[0], [optie(maten[1].code, 1, 850), optie(vegan)]), mappings).ok, false));
Deno.test('Hula Vegan basis 16,49 en maat 8,51 mogen niet wegvallen tot 25', () => {
  const b = bestelling(maten[1]); b.regels[0].stukprijs_cent = 1649;
  const formaat = b.regels[0].extras?.[0]; if (!formaat) throw new Error('Fixture ontbreekt'); formaat.stukprijs_cent = 851;
  assertEquals(controleer(b, mappings).ok, false);
});
Deno.test('Hula Vegan restaurantbedrag blijft exact gecontroleerd', () => {
  const b = bestelling(maten[1]); b.bedragen.restaurant_cent = 2501;
  assertEquals(controleer(b, mappings), { ok: false, reden: 'Restaurantbedrag klopt niet: regels 2500, opgegeven 2501' });
});
Deno.test('Sashimi Vegan blijft ongeoorloofd', () => {
  const b = bestelling(); b.regels[0].code = 'PV-0F623FEC'; b.regels[0].stukprijs_cent = 1700; b.bedragen.restaurant_cent = 1700;
  b.regels[0].extras = [optie('PVK-77BFC4AF-1'), optie(vegan)];
  const kop: Koppeling = { soort: 'formaat', externe_code: 'PV-0F623FEC|PVK-77BFC4AF-1', lightspeed_product_id: '2385824', lightspeed_plu: 'B136', naam: 'Sashimi', prijs_cent: 1700, actief: true };
  assertEquals(controleer(b, [kop]), { ok: false, reden: 'Onbekende of niet toepasselijke extra voor PV-0F623FEC: PVK-319766B2-1' });
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