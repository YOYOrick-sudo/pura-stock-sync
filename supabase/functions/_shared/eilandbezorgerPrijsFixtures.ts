// Uitsluitend lokale fixtures. Geen runtime-fallback of live tariefconfiguratie.
import { prijsRegels, type KaartProduct } from './eilandbezorgerPrijzen.ts';
import type { Regel } from './eilandbezorgerLogica.ts';
export const GINGER_KAART: KaartProduct = {
  id: 4636894, visible: true, deliveryPrice: 4.9, deliveryPriceWithoutVat: 4.4954, deliveryTaxClass: 'BUILTIN-9.0',
  takeawayPrice: 4.9, takeawayPriceWithoutVat: 4.4954, takeawayTaxClass: 'BUILTIN-9.0',
};
export const TEST_KLASSEN = [{ id: 'BUILTIN-9.0', taxRate: 9 }, { id: 'BUILTIN-21.0', taxRate: 21 }, { id: 'BUILTIN-0.0', taxRate: 0 }];
export function fictiefProduct(id: number, bruto: number, tarief = 9): KaartProduct {
  const netto = Math.round(bruto / (1 + tarief / 100) * 10000) / 10000;
  return { id, visible: true, deliveryPrice: bruto, deliveryPriceWithoutVat: netto, deliveryTaxClass: `BUILTIN-${tarief}.0`, takeawayPrice: bruto, takeawayPriceWithoutVat: netto, takeawayTaxClass: `BUILTIN-${tarief}.0` };
}
export const testPrijsRegels = (regels: Regel[]) => prijsRegels(regels, regels.map(r => fictiefProduct(Number(r.lightspeed_product_id), r.stukprijs_cent / 100)), TEST_KLASSEN);
export function mockKaart(input: RequestInfo | URL, init?: RequestInit, producten: KaartProduct[] = [GINGER_KAART, fictiefProduct(4636994, 7), fictiefProduct(2842282, 7.5)]) {
  const u = new URL(String(input));
  if (u.hostname !== 'lightspeedapis.com' || (init?.method ?? 'GET') !== 'GET') return null;
  if (u.pathname === '/resto/rest/onlineordering/taxclass') return Response.json(TEST_KLASSEN);
  const m = u.pathname.match(/^\/resto\/rest\/inventory\/product\/([0-9]+)$/);
  if (m) { const p = producten.find(p => String(p.id) === m[1]); return p ? Response.json(p) : Response.json({ fout: 'niet gevonden' }, { status: 404 }); }
  throw new Error('Onbekende catalogusroute in lokale test');
}