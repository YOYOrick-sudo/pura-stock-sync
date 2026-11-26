// Normale testontvangst (modus=test) tegen de uitgerolde functie; draait alleen met de server-side sleutel.
const KEY = Deno.env.get('EILANDBEZORGER_SLEUTEL');
const URL_ = `${Deno.env.get('SUPABASE_URL') ?? 'https://ajtqzzzpawqcoaphdkaz.supabase.co'}/functions/v1/eilandbezorger-bestelling`;
const T = new Date().toISOString().replace(/\D/g, '').slice(0, 14);
const post = (b: unknown) => fetch(URL_, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-eilandbezorger-sleutel': KEY! }, body: JSON.stringify(b) });
const m = (n: number, c = n === 1 ? 0 : n === 2 ? 170 : 420) => ({ code: `PVK-6DE6849B-${n}`, aantal: 1, stukprijs_cent: c });
const brood = { code: 'PVK-DBE8A359-1', aantal: 1, stukprijs_cent: 100 };
const r = (code: string, stukprijs_cent: number, extras: { code: string; aantal: number; stukprijs_cent: number }[] = []) => ({ code, aantal: 1, stukprijs_cent, extras });
const o = (g: string, regels: { stukprijs_cent: number; extras: { stukprijs_cent: number }[] }[]) => ({ versie: 1, modus: 'test', bestelnummer: `TEST-EB-ZES-${g}-${T}`, vestiging: '36864',
  ophaaltijd: '2026-11-27T18:00:00+01:00', klant: { naam: 'Fictieve Gast' }, regels,
  bedragen: { restaurant_cent: regels.reduce((s, x) => s + x.stukprijs_cent + x.extras.reduce((a, e) => a + e.stukprijs_cent, 0), 0), bezorgkosten_cent: 0, fooi_cent: 0, korting: null }, betaling: { wijze: 'vooraf_betaald' } });
const ZES = [r('PV-128F2537', 800), r('PV-2DEE5665', 1100), r('PV-0EB4E84F', 1150), r('PV-6593C2EE', 550), r('PV-AC462190', 550, [m(1)]), r('PV-6208BFEF', 550, [m(1)])];
const gevallen: [string, ReturnType<typeof o>][] = [
  ['SIX', o('SIX', ZES)],
  ['KOKOSKLEIN', o('KOKOSKLEIN', [r('PV-AC462190', 550, [m(1)])])], ['KOKOSMIDDEL', o('KOKOSMIDDEL', [r('PV-AC462190', 550, [m(2)])])], ['KOKOSGROOT', o('KOKOSGROOT', [r('PV-AC462190', 550, [m(3)])])],
  ['VISKLEIN', o('VISKLEIN', [r('PV-6208BFEF', 550, [m(1)])])], ['VISMIDDEL', o('VISMIDDEL', [r('PV-6208BFEF', 550, [m(2)])])], ['VISGROOT', o('VISGROOT', [r('PV-6208BFEF', 550, [m(3)])])],
  ['VISBROOD', o('VISBROOD', [r('PV-6208BFEF', 550, [m(1), brood])])], ['KOKOSBROOD', o('KOKOSBROOD', [r('PV-AC462190', 550, [m(1), brood])])],
  ['NEG-KLEIN470', o('NEG-KLEIN470', [r('PV-AC462190', 470, [m(1)])])], ['NEG-GEENMAAT', o('NEG-GEENMAAT', [r('PV-6208BFEF', 550)])],
  ['NEG-VERVALSTMAAT', o('NEG-VERVALSTMAAT', [r('PV-AC462190', 550, [m(2, 0)])])], ['NEG-OLIJFOUD', o('NEG-OLIJFOUD', [r('PV-128F2537', 750)])],
  ['NEG-ANDERGERECHT', o('NEG-ANDERGERECHT', [r('PV-85B02FF8', 550)])], ['BIERREGRESSIE', o('BIERREGRESSIE', [r('PV-5021B6B2', 850)])],
  ['BOTER', o('BOTER', [r('PV-586BEAF0', 900, [brood])])], ['THAIGV', o('THAIGV', [r('PV-DDB41ADC', 970, [{ code: 'PVK-456C0BDC-1', aantal: 1, stukprijs_cent: 0 }])])],
  ['SOEPMIDDELBROOD', o('SOEPMIDDELBROOD', [r('PV-AC462190', 550, [m(2), brood])])], ['SOEPGROOTBROOD', o('SOEPGROOTBROOD', [r('PV-AC462190', 550, [m(3), brood])])],
];
Deno.test({ name: 'zes kanaalprijzen live testontvangst', ignore: !KEY, fn: async () => {
  for (const [g, b] of gevallen) {
    const p = await post(b); const j = await p.json();
    console.log(`${b.bestelnummer} POST ${p.status} ${j.status ?? ''} €${(b.bedragen.restaurant_cent / 100).toFixed(2)} ${j.reden ?? ''}`);
    if (g === 'SIX') {
      const h = await post(b); console.log('herhaling', h.status, (await h.json()).status);
      const a = await post({ ...b, regels: b.regels.slice(1), bedragen: { ...b.bedragen, restaurant_cent: 3900 } }); console.log('afwijkend', a.status); await a.body?.cancel();
      const s = await fetch(`${URL_}?vestiging=36864&bestelnummer=${b.bestelnummer}&modus=test`, { headers: { 'x-eilandbezorger-sleutel': KEY! } }); console.log('status GET', s.status, (await s.json()).status);
    }
  }
} });
