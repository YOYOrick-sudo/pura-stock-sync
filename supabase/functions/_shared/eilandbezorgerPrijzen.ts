import { geldigToken } from './lightspeedToken.ts';
import type { Regel } from './eilandbezorgerLogica.ts';

export type KaartProduct = {
  id: number; visible: boolean; deliveryPrice?: number | null; deliveryPriceWithoutVat?: number | null;
  deliveryTaxClass?: string | null;
  takeawayPrice?: number | null; takeawayPriceWithoutVat?: number | null; takeawayTaxClass?: string | null;
  additions?: { id: number; name: string; values: { id: number; name: string; price: number; priceWithoutVAT: number; plu?: string }[] }[];
};
export type BtwKlasse = { id: string; taxRate: number };
export type KassaModifier = { modifierId: number; modifierValueId: number; description: string; price: number; priceWithoutVat: number; plu?: string };
export type GeprijsdeRegel = Regel & { netto_euro: number; bezorg_btw_pct: number; kassa_modifiers: KassaModifier[] };
export const KASSA_SCHEMA = 'bezorg-netto-v1';
const bedrag = (n: unknown): n is number => typeof n === 'number' && Number.isFinite(n) && n >= 0;
const afronden = (n: number, precisie: number) => Math.round((n + Number.EPSILON) * precisie) / precisie;
export const regelEuro = (n: number) => afronden(n, 100);

/** Alleen de gedocumenteerde bezorgvelden, niet stil terugvallen op een restaurantprijs. */
export function bezorgPrijs(p: KaartProduct, cent: number, klassen: BtwKlasse[]) {
  if (!p.visible || !bedrag(p.deliveryPrice) || !Number.isInteger(cent) || cent < 0 ||
    afronden(p.deliveryPrice, 100) !== p.deliveryPrice || Math.round(p.deliveryPrice * 100) !== cent) {
    throw new Error(`Actuele bezorgprijs ontbreekt of wijkt af voor product ${p.id}.`);
  }
  const matches = klassen.filter(k => k.id === p.deliveryTaxClass);
  if (matches.length !== 1 || !bedrag(matches[0].taxRate) || matches[0].taxRate > 100) {
    throw new Error(`Bezorg-btw-klasse of tarief ontbreekt voor product ${p.id}.`);
  }
  const tarief = matches[0].taxRate;
  // Het bestaande ordertype blijft takeaway. Geen stil gewijzigde keuken-/afhaalflow:
  // bij verschillende afhaal- en bezorginstellingen is eerst een expliciet besluit nodig.
  if (p.takeawayTaxClass !== p.deliveryTaxClass || p.takeawayPrice !== p.deliveryPrice) {
    throw new Error(`Afhaal- en bezorgprijs/btw verschillen voor product ${p.id}; bestaand ordertype niet veilig.`);
  }
  const berekend = p.deliveryPrice / (1 + tarief / 100);
  // Ontbrekend netto mag alleen met de daadwerkelijk uitgelezen klasse/taxRate afgeleid worden.
  const netto = p.deliveryPriceWithoutVat == null ? afronden(berekend, 10000) : p.deliveryPriceWithoutVat;
  if (!bedrag(netto) || Math.abs(netto - berekend) > 0.000051 ||
    regelEuro(netto * (1 + tarief / 100)) !== p.deliveryPrice) {
    throw new Error(`Nettobezorgprijs en btw spreken elkaar tegen voor product ${p.id}.`);
  }
  if (p.takeawayPriceWithoutVat != null && (!bedrag(p.takeawayPriceWithoutVat) || Math.abs(p.takeawayPriceWithoutVat - netto) > 0.000051)) {
    throw new Error(`Afhaal- en bezorgnettoprijs verschillen voor product ${p.id}.`);
  }
  return { netto_euro: netto, bezorg_btw_pct: tarief };
}

/** Prijssnapshot apart van historische regels; formele proefvergelijkingen blijven ongewijzigd. */
export function prijsRegels(regels: Regel[], producten: KaartProduct[], klassen: BtwKlasse[]): GeprijsdeRegel[] {
  if (!regels.length) throw new Error('Geen kassaproducten om te prijzen.');
  return regels.map(r => {
    if (!Number.isInteger(r.aantal) || r.aantal < 1 || !Array.isArray(r.extras)) throw new Error('Opgeslagen productaantal of extra’s ongeldig.');
    const matches = producten.filter(p => String(p.id) === r.lightspeed_product_id);
    if (matches.length !== 1) throw new Error(`Actueel kassaproduct ${r.lightspeed_product_id} ontbreekt of is dubbel.`);
    const p = matches[0], prijs = bezorgPrijs(p, r.stukprijs_cent, klassen);
    const modifiers = r.extras.map(e => {
      const keuzes = (p.additions ?? []).flatMap(g => g.values.filter(v => String(v.id) === e.lightspeed_product_id).map(v => ({ g, v })));
      if (keuzes.length !== 1) throw new Error(`Extra ${e.naam} is niet eenduidig aan product ${p.id} gekoppeld.`);
      const { g, v } = keuzes[0];
      // Betaalde modifiers hebben geen afzonderlijke bezorgklasse; hun optelling is niet bewezen.
      // Fail closed in plaats van productId/amount/unitPrice naar een modifier-DTO te sturen.
      if (e.aantal !== 1 || e.stukprijs_cent !== 0 || v.price !== 0 || v.priceWithoutVAT !== 0 ||
        !Number.isSafeInteger(g.id) || g.id <= 0 || !Number.isSafeInteger(v.id) || v.id <= 0) {
        throw new Error(`Betaalde of meervoudige extra ${e.naam}: bezorg-btw en bedragopbouw niet bevestigd.`);
      }
      return { modifierId: g.id, modifierValueId: v.id, description: v.name, price: 0, priceWithoutVat: 0, ...(v.plu ? { plu: v.plu } : {}) };
    });
    if (new Set(modifiers.map(m => m.modifierValueId)).size !== modifiers.length) throw new Error('Dezelfde modifier is dubbel aangeleverd.');
    if (new Set(modifiers.map(m => m.modifierId)).size !== modifiers.length) throw new Error('Tegenstrijdige keuzes binnen dezelfde modifiergroep.');
    return { ...r, ...prijs, kassa_modifiers: modifiers };
  });
}

const API = 'https://lightspeedapis.com/resto';
const TTL = 60_000;
type Entry = { tot: number; belofte: Promise<unknown> };
// Isolate-local, alleen niet-geheime kaartdata. Eén in-flight GET per vestiging/pad.
const caches = new WeakMap<typeof fetch, Map<string, Entry>>();
async function kaartGet(admin: any, vestiging: string, pad: string, haal: typeof fetch) {
  let cache = caches.get(haal);
  if (!cache) { cache = new Map(); caches.set(haal, cache); }
  const key = `${vestiging}:${pad}`, oud = cache.get(key);
  if (oud && oud.tot > Date.now()) return oud.belofte;
  for (const [k, v] of cache) if (v.tot <= Date.now()) cache.delete(k);
  if (cache.size >= 200) throw new Error('Cataloguscontrole tijdelijk vol; geen verzending.');
  const belofte = (async () => {
    const t = await geldigToken(admin, vestiging);
    if ('error' in t) throw new Error(`Catalogustoegang mislukt: ${t.error}`);
    const res = await haal(API + pad, { method: 'GET', headers: { Authorization: `Bearer ${t.token}`, Accept: 'application/json' }, signal: AbortSignal.timeout(10_000) });
    if (!res.ok) { await res.body?.cancel(); throw new Error(`Lightspeed-catalogus HTTP ${res.status}; geen verzending.`); }
    return await res.json();
  })();
  const entry = { tot: Date.now() + TTL, belofte };
  cache.set(key, entry);
  try { return await belofte; } catch (e) { entry.tot = Date.now() + 15_000; throw e; }
}

export async function actuelePrijsRegels(admin: any, vestiging: string, regels: Regel[], haal: typeof fetch = fetch): Promise<{ regels: GeprijsdeRegel[]; producten: KaartProduct[]; klassen: BtwKlasse[] } | { fout: string }> {
  if (vestiging !== 'Midsland') return { fout: 'Cataloguscontrole is alleen voor Midsland beschikbaar.' };
  try {
    const ids = [...new Set(regels.map(r => r.lightspeed_product_id))];
    if (!ids.length || ids.length > 50 || ids.some(id => !/^[1-9][0-9]*$/.test(id) || !Number.isSafeInteger(Number(id)))) throw new Error('Kassaproduct-ID ongeldig.');
    const producten: KaartProduct[] = [];
    // Serieel: maximaal één gerichte product-GET per uniek definitief product, geen volledige kaart per bestelling.
    for (const id of ids) producten.push(await kaartGet(admin, vestiging, `/rest/inventory/product/${id}`, haal) as KaartProduct);
    const klassen = await kaartGet(admin, vestiging, '/rest/onlineordering/taxclass', haal);
    if (!Array.isArray(klassen)) throw new Error('Btw-klassenrespons ongeldig.');
    return { regels: prijsRegels(regels, producten, klassen), producten, klassen };
  } catch (e) {
    return { fout: e instanceof Error ? e.message : 'Cataloguscontrole mislukt; geen verzending.' };
  }
}