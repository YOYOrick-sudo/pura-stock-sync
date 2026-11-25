// Begrensde alleen-lezen kassa-inspectie voor bewijs van modifierbedragen. Uitsluitend GET's,
// geen gast-/contactvelden, notities of vrije paden. Stopt direct bij 429.
import { geldigToken } from '../_shared/lightspeedToken.ts';

const API = 'https://lightspeedapis.com/resto';
type Haal = typeof fetch;
const num = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : v == null ? null : undefined);
const kies = (o: any, sleutels: string[]) => Object.fromEntries(sleutels.filter(k => o?.[k] !== undefined && typeof o[k] !== 'object').map(k => [k, o[k]]));
// Gastgegevens en vrije tekst worden altijd weggelaten, ook als Lightspeed ze ergens anders noemt.
const VERBODEN = /customer|klant|first|last|email|phone|tel|address|street|zip|postal|city|note|remark|comment|externalreference|^description$|user|employee|table|seat|card|iban/i;

export function anoniem(v: unknown, diepte = 0): unknown {
  if (diepte > 6) return undefined;
  if (Array.isArray(v)) return v.slice(0, 60).map(x => anoniem(x, diepte + 1));
  if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v as object)
    .filter(([k]) => !VERBODEN.test(k)).map(([k, x]) => [k, anoniem(x, diepte + 1)]).filter(([, x]) => x !== undefined));
  if (typeof v === 'string') return v.slice(0, 80);
  return v;
}

export function orderSamenvatting(o: any) {
  return {
    id: o?.id, receiptId: o?.receiptId ?? o?.linkReceiptId ?? null, status: o?.status, type: o?.type, creationDate: o?.creationDate,
    orderItems: (o?.orderItems ?? []).map((i: any) => ({
      ...kies(i, ['productId', 'productPlu', 'amount', 'unitPrice', 'unitPriceWithoutVat', 'totalPrice', 'totalPriceWithoutVat']),
      modifiers: (i?.modifiers ?? []).map((m: any) => kies(m, ['modifierId', 'modifierName', 'modifierValueId', 'description', 'plu', 'price', 'priceWithoutVat'])),
      subitems: (i?.subitems ?? []).map((s: any) => anoniem(s)),
    })),
    orderPayments: (o?.orderPayments ?? []).map((p: any) => kies(p, ['amount', 'paymentTypeId', 'paymentTypeTypeId', 'tip'])),
    orderTaxInfo: (o?.orderTaxInfo ?? []).map((t: any) => kies(t, ['tax', 'taxRate', 'totalWithTax', 'totalWithoutTax'])),
  };
}

const heeftBetaaldeModifier = (o: any) => (o?.orderItems ?? []).some((i: any) => (i?.modifiers ?? []).some((m: any) => (num(m?.price) ?? 0) > 0) || (i?.subitems ?? []).length > 0);

export async function kassaInspectie(admin: any, p: { soort: 'kaart' | 'orders' | 'bon' | 'order'; order_ids?: string[]; product_ids?: string[]; datum?: string; bon_id?: number; offset?: number; status?: string }, haal: Haal = fetch) {
  const t = await geldigToken(admin, 'Midsland');
  if ('error' in t) return { fout: `kassatoegang: ${t.error}` };
  let aanvragen = 0;
  const lees = async (pad: string) => {
    if (++aanvragen > 25) return { stop: 'aanvraaglimiet bereikt' };
    const r = await haal(API + pad, { method: 'GET', headers: { Authorization: `Bearer ${t.token}`, Accept: 'application/json' }, signal: AbortSignal.timeout(15_000) });
    if (r.status === 429) { await r.body?.cancel(); return { stop: 'HTTP 429; gestopt', retry_after: r.headers.get('Retry-After') }; }
    const tekst = await r.text();
    if (!r.ok) return { stop: `HTTP ${r.status}`, detail: anoniem(tekst.slice(0, 200)) };
    try { return { data: JSON.parse(tekst) }; } catch { return { stop: 'geen JSON' }; }
  };

  if (p.soort === 'kaart') {
    const uit: unknown[] = [];
    for (const id of p.product_ids ?? []) {
      const r: any = await lees(`/rest/inventory/product/${id}`);
      if (r.stop) return { merchant_id: '36864', producten: uit, gestopt: r };
      const x = r.data;
      uit.push({ ...kies(x, ['id', 'name', 'sku', 'visible', 'price', 'priceWithoutVat', 'takeawayPrice', 'takeawayPriceWithoutVat', 'deliveryPrice', 'deliveryPriceWithoutVat', 'taxClass', 'takeawayTaxClass', 'deliveryTaxClass']),
        additions: (x?.additions ?? []).map((g: any) => ({ ...anoniem(Object.fromEntries(Object.entries(g).filter(([k]) => k !== 'values'))) as object,
          values: (g?.values ?? []).map((v: any) => anoniem(v)) })) });
    }
    return { merchant_id: '36864', producten: uit, aanvragen };
  }

  if (p.soort === 'orders') {
    const gevonden: unknown[] = []; let gelezen = 0, metBon = 0, metModifiers = 0, metItems = 0; let velden: string[] = []; let stop: unknown = null; const datums: string[] = []; const lijstIds: unknown[] = [];
    const start = p.offset ?? 0;
    for (let offset = start; offset < start + 500; offset += 100) {
      const r: any = await lees(`/rest/onlineordering/order?amount=100&offset=${offset}${p.status ? `&status=${p.status}` : ''}`);
      if (r.stop) { stop = r; break; }
      const lijst = Array.isArray(r.data) ? r.data : (r.data?.results ?? []);
      gelezen += lijst.length;
      for (const o of lijst) {
        if ((o?.receiptId ?? o?.linkReceiptId) === p.bon_id) { metBon++; gevonden.unshift({ id: o.id, receiptId: o.receiptId ?? o.linkReceiptId, creationDate: o.creationDate, type: o.type, status: o.status }); }
        if (typeof o?.creationDate === 'string') datums.push(o.creationDate);
        if ((o?.orderItems ?? []).length) metItems++;
        lijstIds.push([o?.id, o?.receiptId ?? null, o?.creationDate, o?.type]);
        if (!velden.length && o && typeof o === 'object') velden = Object.keys(o).filter(k => !VERBODEN.test(k));
        if ((o?.orderItems ?? []).some((i: any) => (i?.modifiers ?? []).length)) metModifiers++;
        else if (heeftBetaaldeModifier(o)) gevonden.push(orderSamenvatting(o));
      }
      if (lijst.length < 100) break;
    }
    return { merchant_id: '36864', bron: 'GET /rest/onlineordering/order (oorspronkelijke onlineorders)', gelezen, gekoppeld_aan_bon: metBon, met_modifiers: metModifiers, met_regels: metItems, velden, eerste_datum: datums.sort()[0] ?? null, laatste_datum: datums.sort().at(-1) ?? null, voorbeelden: gevonden.slice(0, 10), recent: lijstIds.slice(0, 60), gestopt: stop, aanvragen };
  }

  if (p.soort === 'order') {
    const uit: unknown[] = [];
    for (const id of p.order_ids ?? []) {
      const r: any = await lees(`/rest/onlineordering/order/${id}`);
      if (r.stop) return { merchant_id: '36864', orders: uit, gestopt: r, aanvragen };
      uit.push(orderSamenvatting(r.data));
    }
    return { merchant_id: '36864', bron: 'GET /rest/onlineordering/order/{id} (oorspronkelijke onlineorder)', orders: uit, aanvragen };
  }
  // Financiële bon: alleen de gevraagde bon van één datum, nooit volledige gastgegevens.
  for (let offset = 0; offset < 2000; offset += 50) {
    const r: any = await lees(`/rest/financial/receipt?date=${p.datum}&offset=${offset}&amount=50`);
    if (r.stop) return { merchant_id: '36864', bon_gevonden: false, gestopt: r, aanvragen };
    const lijst = Array.isArray(r.data) ? r.data : (r.data?.results ?? []);
    const bon = lijst.find((b: any) => b?.id === p.bon_id || b?.sequentialId === p.bon_id || String(b?.uuid) === String(p.bon_id));
    if (bon) return { merchant_id: '36864', bron: 'GET /rest/financial/receipt (financiële bon)', bon: anoniem(bon), aanvragen };
    if (lijst.length < 50) break;
  }
  return { merchant_id: '36864', bon_gevonden: false, aanvragen };
}
