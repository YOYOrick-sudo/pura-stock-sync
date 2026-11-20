// Rooktest tegen de gedeployde functie. Draait alleen als de sleutel in de omgeving staat.
// Maakt uitsluitend modus=test-regels met bestelnummer TEST-...; die gaan nooit naar Lightspeed.
const KEY = Deno.env.get('EILANDBEZORGER_SLEUTEL');
const URL_ = `${Deno.env.get('SUPABASE_URL') ?? 'https://ajtqzzzpawqcoaphdkaz.supabase.co'}/functions/v1/eilandbezorger-bestelling`;
const nr = `TEST-${Date.now()}`;
const order = { versie: 1, modus: 'test', bestelnummer: nr, vestiging: '36864', ophaaltijd: '2026-11-21T17:30:00+01:00', klant: { naam: 'TEST' },
  regels: [{ code: 'TEST-ONBEKEND', aantal: 1, stukprijs_cent: 700 }], bedragen: { restaurant_cent: 700 }, betaling: { wijze: 'vooraf_betaald' } };
const post = (b: unknown, k = KEY!) => fetch(URL_, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-eilandbezorger-sleutel': k }, body: JSON.stringify(b) });
const eq = (a: unknown, b: unknown, m: string) => { if (a !== b) throw new Error(`${m}: ${a} != ${b}`); };

Deno.test({ name: 'rooktest ontvangfunctie', ignore: !KEY, fn: async () => {
  let r = await post(order, 'fout'); eq(r.status, 401, 'foute sleutel'); await r.body?.cancel();
  const { modus: _m, ...zonder } = order;
  r = await post(zonder); eq(r.status, 400, 'zonder modus'); await r.body?.cancel();
  r = await post({ ...order, vestiging: '41121' }); eq(r.status, 400, 'West'); await r.body?.cancel();
  const [a, b] = await Promise.all([post(order), post(order)]);
  const sa = [a.status, b.status].sort().join(','); const ja = await a.json(); await b.json();
  console.log('gelijktijdig:', sa, ja.status, ja.modus, ja.reden);
  if (!['200,422', '422,422'].includes(sa)) throw new Error('gelijktijdig ' + sa);
  r = await post(order); eq(r.status, 200, 'identieke herhaling'); await r.body?.cancel();
  r = await post({ ...order, regels: [{ ...order.regels[0], aantal: 2 }], bedragen: { restaurant_cent: 1400 } }); eq(r.status, 409, 'andere inhoud'); await r.body?.cancel();
  r = await fetch(`${URL_}?vestiging=36864&bestelnummer=${nr}&modus=test`, { headers: { 'x-eilandbezorger-sleutel': KEY! } });
  const g = await r.json(); eq(r.status, 200, 'status'); eq(g.modus, 'test', 'modus in status'); console.log('status:', g.status);
  r = await fetch(`${URL_}?vestiging=36864&bestelnummer=${nr}&modus=live`, { headers: { 'x-eilandbezorger-sleutel': KEY! } }); eq(r.status, 404, 'live apart'); await r.body?.cancel();
  r = await fetch(`${URL_}?vestiging=36864&bestelnummer=${nr}`, { headers: { 'x-eilandbezorger-sleutel': KEY! } }); eq(r.status, 400, 'status zonder modus'); await r.body?.cancel();
  console.log('bestelnummer:', nr);
} });
