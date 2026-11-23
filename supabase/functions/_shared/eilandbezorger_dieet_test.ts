import { assertEquals, assertThrows } from 'jsr:@std/assert@1';
import { controleer, gastVerzoekNotitie, orderbericht, type Bestelling, type Koppeling, type Regel } from './eilandbezorgerLogica.ts';
import { prijsRegels } from './eilandbezorgerPrijzen.ts';
import { fictiefProduct, TEST_KLASSEN } from './eilandbezorgerPrijsFixtures.ts';

const vegan = 'PVK-AD715B1F-1', gluten = 'PVK-AD715B1F-2';
const doelen = [
  { code: 'PV-6F37A149', id: '2084809', plu: 'V11', prijs: 1080, naam: 'Loaded Hummus' },
  { code: 'PV-3AC166C3', id: '4705081', plu: 'F76', prijs: 1050, naam: 'Geroosterde bloemkool' },
];
const mappings: Koppeling[] = doelen.map(d => ({ soort: 'product', externe_code: d.code, lightspeed_product_id: d.id, lightspeed_plu: d.plu, naam: d.naam, prijs_cent: d.prijs, actief: true }));
const e = (code: string, aantal = 1, stukprijs_cent = 0) => ({ code, aantal, stukprijs_cent });
const b = (d = doelen[0], opties = [e(vegan)], aantal = 1): Bestelling => ({
  versie: 1, modus: 'test', bestelnummer: 'LOKAAL-DIEET', vestiging: '36864', ophaaltijd: '2026-11-23T20:00:00+01:00', klant: { naam: 'Fictieve proef' }, opmerking: '  Originele gastnotitie\nSaus apart  ',
  regels: [{ code: d.code, aantal, stukprijs_cent: d.prijs, extras: opties }],
  bedragen: { restaurant_cent: aantal * (d.prijs + opties.reduce((s, o) => s + o.aantal * o.stukprijs_cent, 0)), bezorgkosten_cent: 0, fooi_cent: 0, korting: null }, betaling: { wijze: 'vooraf_betaald' },
});
const check = (bestelling: Bestelling, kop = mappings) => {
  const c = controleer(bestelling, kop); if (!c.ok) throw new Error(c.reden); return c.regels;
};
const prijzen = (regels: Regel[]) => prijsRegels(regels, regels.filter((r, i) => regels.findIndex(x => x.lightspeed_product_id === r.lightspeed_product_id) === i).map(r => {
  const opties = regels.filter(x => x.lightspeed_product_id === r.lightspeed_product_id).flatMap(x => x.extras);
  const uniek = opties.filter((x, i) => opties.findIndex(y => y.lightspeed_product_id === x.lightspeed_product_id) === i);
  return { ...fictiefProduct(Number(r.lightspeed_product_id), r.stukprijs_cent / 100), additions: uniek.map((x, i) => ({ id: 9000 + i, name: 'Lokale testgroep', values: [{ id: Number(x.lightspeed_product_id), name: x.naam, price: 0, priceWithoutVAT: 0 }] })) };
}), TEST_KLASSEN);
const bon = (regels: Regel[], opmerking?: string) => orderbericht({ referentie: 'LOKAAL-DIEET', regels: prijzen(regels), restaurant_cent: regels.reduce((s, r) => s + r.aantal * r.stukprijs_cent, 0), ophaaltijd: '2026-11-23T20:00:00+01:00', opmerking, betaalwijzeId: '77' });

for (const d of doelen) {
  for (const aantal of [1, 2]) Deno.test(`${d.naam} Vegan bevestiging ${aantal}x: zelfde product, rauwe keuze, geen modifier`, () => {
    const input = b(d, [e(vegan)], aantal), bron = structuredClone(input), regels = check(input);
    assertEquals(regels.map(r => [r.lightspeed_product_id, r.lightspeed_plu, r.aantal, r.stukprijs_cent, r.extras, r.gast_verzoek]), [[d.id, d.plu, aantal, d.prijs, [], undefined]]);
    assertEquals(input, bron);
    const uit = bon(regels, input.opmerking);
    assertEquals(uit.orderItems.length, 1); assertEquals(uit.orderItems[0].amount, aantal);
    assertEquals(uit.orderItems[0].modifiers, []); assertEquals(uit.note, input.opmerking);
  });
  Deno.test(`${d.naam} zonder keuze start geen bereidingsverzoek`, () => {
    assertEquals(check(b(d, [])), check(b(d)));
    assertEquals(bon(check(b(d, []))).note, undefined);
  });
  Deno.test(`${d.naam} volgt gewone gekoppelde prijs, geen historische vaste prijs`, () => {
    const input = b(d); input.regels[0].stukprijs_cent = 1160; input.bedragen.restaurant_cent = 1160;
    const kop = mappings.map(k => k.externe_code === d.code ? { ...k, prijs_cent: 1160 } : k);
    assertEquals(check(input, kop)[0].stukprijs_cent, 1160);
    assertEquals(controleer(input, mappings).ok, false);
  });
  for (const [naam,opts] of [
    ['dubbele keuze', [e(vegan), e(vegan)]], ['aantal 2', [e(vegan, 2)]], ['toeslag', [e(vegan, 1, 1)]],
  ] as const) Deno.test(`${d.naam} weigert ${naam}`, () => assertEquals(controleer(b(d, [...opts]), mappings).ok, false));
  for (const field of ['lightspeed_product_id', 'lightspeed_plu'] as const) Deno.test(`${d.naam} weigert verkeerd ${field}`, () => {
    assertEquals(controleer(b(d), mappings.map(k => k.externe_code === d.code ? { ...k, [field]: 'ONJUIST' } : k)).ok, false);
  });
}
for (const opts of [[e(gluten)], [e(vegan), e(gluten)]]) Deno.test(`Bloemkool gastverzoek met ${opts.length} keuze(n), geen fictieve modifier`, () => {
  const input = b(doelen[1], opts), bron = structuredClone(input), regels = check(input), uit = bon(regels, input.opmerking);
  assertEquals(regels[0].gast_verzoek, 'bloemkool_glutenvrij'); assertEquals(regels[0].extras, []);
  assertEquals(input, bron); const item = uit.orderItems[0]; assertEquals('productId' in item ? item.productId : undefined, 4705081); assertEquals(item.modifiers, []);
  assertEquals(uit.note, input.opmerking + '\n\nRegel 1 (1×) – Geroosterde bloemkool – gast vraagt glutenvrij');
});
for (const [naam,opts] of [
  ['dubbel', [e(gluten), e(gluten)]], ['aantal 2', [e(gluten, 2)]], ['betaald', [e(gluten, 1, 1)]],
] as const) Deno.test(`Bloemkool Glutenvrij ${naam} blijft afkeur`, () => assertEquals(controleer(b(doelen[1], [...opts]), mappings).ok, false));
Deno.test('Bloemkool-keuze mag niet bij Hummus of verkeerde doelkoppeling', () => {
  assertEquals(controleer(b(doelen[0], [e(gluten)]), mappings).ok, false);
  assertEquals(controleer(b(doelen[1], [e(gluten)]), mappings.map(k => k.externe_code === doelen[1].code ? { ...k, lightspeed_product_id: doelen[0].id } : k)).ok, false);
});
Deno.test('Bloemkool-gastverzoek benoemt juiste regel, niet de andere maaltijd', () => {
  const input = b(doelen[0], []); input.regels.push(b(doelen[1], [e(gluten)], 2).regels[0]); input.bedragen.restaurant_cent += 2100;
  assertEquals(bon(check(input), input.opmerking).note, input.opmerking + '\n\nRegel 2 (2×) – Geroosterde bloemkool – gast vraagt glutenvrij');
});

const echteOpties = [
  { code: 'PV-F7B26912', id: '1071103', plu: 'Dh16', prijs: 1650, maat: 'PVK-241B2733-1', opt: 'PVK-456C0BDC-1', value: '263905' },
  { code: 'PV-0F623FEC', id: '2385824', plu: 'B136', prijs: 1700, maat: 'PVK-77BFC4AF-1', opt: 'PVK-456C0BDC-1', value: '263905' },
  { code: 'PV-FB9B6AE8', id: '3278252', plu: 'B197', prijs: 1750, maat: 'PVK-B6B834AB-1', opt: 'PVK-319766B2-1', value: '1307820' },
  { code: 'PV-97B8CCA0', id: '1059431', plu: 'V4', prijs: 1150, opt: vegan, value: '1307820' },
  { code: 'PV-98D87FE7', id: '1071044', plu: 'Dv14', prijs: 890, opt: 'PVK-456C0BDC-1', value: '263905' },
  { code: 'PV-51FDF8F3', id: '1071041', plu: 'Dv11', prijs: 1100, opt: 'PVK-456C0BDC-1', value: '263905' },
];
const echteKop: Koppeling[] = echteOpties.flatMap(d => [
  { soort: d.maat ? 'formaat' : 'product', externe_code: d.code + (d.maat ? '|' + d.maat : ''), lightspeed_product_id: d.id, lightspeed_plu: d.plu, naam: d.code, prijs_cent: d.prijs, actief: true },
  { soort: 'extra', externe_code: `${d.code}|${d.id}|${d.opt}`, lightspeed_product_id: d.value, naam: 'Echte keuze', prijs_cent: 0, actief: true },
]);
const echt = (d = echteOpties[5], gekozen = true) => b({ ...d, naam: d.code }, [...(d.maat ? [e(d.maat)] : []), ...(gekozen ? [e(d.opt)] : [])]);
for (const d of echteOpties) Deno.test(`Echte bereidingskeuze ${d.code} / ${d.value} blijft modifier`, () => {
  const regels = check(echt(d), echteKop), uit = bon(regels);
  assertEquals(regels[0].extras.map(e => e.lightspeed_product_id), [d.value]);
  assertEquals(uit.orderItems[0].modifiers.map(m => m.modifierValueId), [Number(d.value)]);
});
Deno.test('Saté zonder vinkje heeft geen modifier, verzoek of extra tekst', () => {
  const input = echt(echteOpties[5], false), regels = check(input, echteKop);
  assertEquals(regels[0].extras, []); assertEquals(regels[0].gast_verzoek, undefined); assertEquals(bon(regels, input.opmerking).note, input.opmerking);
});
Deno.test('Saté glutenvrij: echte modifier én exacte aanwijzing zonder uitjes', () => {
  const input = echt(), regels = check(input, echteKop), uit = bon(regels, input.opmerking);
  assertEquals(regels[0].gast_verzoek, 'tahoe_glutenvrij');
  assertEquals(uit.note, input.opmerking + '\n\nRegel 1 (1×) – Saté Spicy Tahoe – glutenvrij verzocht, zonder gefruite uitjes');
  assertEquals(uit.orderItems[0].modifiers[0].modifierValueId, 263905);
});
for (const beide of [false, true]) Deno.test(`Twee Saté-regels ${beide ? 'beide' : 'één'} aangevinkt: juiste regel, geen dubbele tekst`, () => {
  const input = echt(echteOpties[5], beide); input.regels.push(echt().regels[0]); input.bedragen.restaurant_cent = 2200;
  const uit = bon(check(input, echteKop), input.opmerking);
  const tekst = 'Saté Spicy Tahoe – glutenvrij verzocht, zonder gefruite uitjes';
  assertEquals(uit.note, input.opmerking + '\n\n' + (beide ? 'Regel 1 (1×) – ' + tekst + '\n' : '') + 'Regel 2 (1×) – ' + tekst);
  assertEquals(uit.orderItems.map(r => r.modifiers.length), beide ? [1, 1] : [0, 1]);
});
Deno.test('Saté met verkeerde modifier-ID blokkeert', () => {
  assertEquals(controleer(echt(), echteKop.map(k => k.externe_code === 'PV-51FDF8F3|1071041|PVK-456C0BDC-1' ? { ...k, lightspeed_product_id: '1307820' } : k)).ok, false);
});
Deno.test('Bonopbouw weigert verkeerd gekoppeld of onbekend gastverzoek', () => {
  const cauli = check(b(doelen[1], [e(gluten)]))[0];
  assertThrows(() => gastVerzoekNotitie([{ ...cauli, lightspeed_product_id: '2084809' }]));
  assertThrows(() => gastVerzoekNotitie([{ ...cauli, gast_verzoek: 'onbekend' as Regel['gast_verzoek'] }]));
  const satay = check(echt(), echteKop)[0];
  assertThrows(() => gastVerzoekNotitie([{ ...satay, extras: [] }]));
  const betaald = prijzen([satay]); betaald[0].kassa_modifiers = [];
  assertThrows(() => orderbericht({ referentie: 'FOUT', regels: betaald, restaurant_cent: 1100, ophaaltijd: '2026-11-23T20:00:00+01:00', betaalwijzeId: '77' }));
});
Deno.test('Historische genormaliseerde regels zonder metadata krijgen geen nieuwe notitie', () => {
  const regels = check(echt(), echteKop); delete regels[0].gast_verzoek;
  assertEquals(bon(regels, 'Oude notitie').note, 'Oude notitie');
});
Deno.test('Betaald glutenvrij brood €1 wordt nooit gratis bevestiging', () => {
  const input = b(doelen[0], [e('PVK-DBE8A359-1', 1, 100)]);
  const kop: Koppeling[] = [...mappings, { soort: 'extra', externe_code: 'PV-6F37A149|2084809|PVK-DBE8A359-1', lightspeed_product_id: '1307819', naam: 'Glutenvrij brood', prijs_cent: 100, actief: true }];
  assertEquals(controleer(input, kop), { ok: false, reden: 'Betaalde of meervoudige extra PVK-DBE8A359-1: bezorg-btw en bedragopbouw niet bevestigd.' });
});
Deno.test('Onbekende keuze, aubergine Glutenvrij, andere gerechten Vegan niet omzetten', () => {
  assertEquals(controleer(b(doelen[0], [e('ONBEKEND')]), mappings).ok, false);
  assertEquals(controleer(b({ ...echteOpties[3], naam: 'Aubergine' }, [e(gluten)]), echteKop).ok, false);
  for (const code of ['PV-CE0EF3F3', 'PV-7B1071AD']) {
    const doel = { ...doelen[0], code };
    const kop: Koppeling = { ...mappings[0], externe_code: code };
    assertEquals(controleer(b(doel, [e(vegan)]), [kop]).ok, false);
  }
});