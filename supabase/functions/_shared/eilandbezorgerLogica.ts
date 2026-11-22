import { z } from 'npm:zod@3.23.8';
import { gastNaam, vasteKlantId } from './eilandbezorgerKlant.ts';

// Voorlopig alleen Midsland (besluit Yorick 20-11-2026).
export const VESTIGING_PER_MERCHANT: Record<string, string> = { '36864': 'Midsland' };
export const Modus = z.enum(['test', 'live']);

const iso = z.string().datetime({ offset: true });
const cent = z.number().int().min(0).max(1_000_000);
export const BestellingSchema = z.object({
  versie: z.literal(1),
  modus: Modus,
  bestelnummer: z.string().trim().min(1).max(64).regex(/^[A-Za-z0-9._-]+$/),
  vestiging: z.enum(['36864']),
  ophaaltijd: iso,
  bezorgtijd: iso.optional(),
  // Onbekende velden (ook contactgegevens) worden gestript, niet gevalideerd of bewaard.
  klant: z.object({
    naam: z.string().trim().min(1).max(121).optional(),
    voornaam: z.string().trim().min(1).max(60).optional(),
    achternaam: z.string().trim().min(1).max(60).optional(),
  }).refine((k) => !!k.naam || (!!k.voornaam && !!k.achternaam), { message: 'naam of voornaam+achternaam verplicht' })
    .transform((k) => ({ naam: gastNaam({ klant: k }) })),
  // Ongewijzigd naar het Lightspeed-veld note; niet trimmen.
  opmerking: z.string().max(500).optional(),
  regels: z.array(z.object({
    code: z.string().trim().min(1).max(64),
    naam: z.string().trim().max(120).optional(),
    aantal: z.number().int().min(1).max(50),
    stukprijs_cent: cent,
    extras: z.array(z.object({ code: z.string().trim().min(1).max(64), aantal: z.number().int().min(1).max(10), stukprijs_cent: cent })).max(20).optional(),
  })).min(1).max(50),
  bedragen: z.object({
    restaurant_cent: cent,
    bezorgkosten_cent: cent.default(0),
    fooi_cent: cent.default(0),
    korting: z.object({
      actiecode: z.string().trim().min(1).max(40),
      oorspronkelijk_cent: cent,
      korting_cent: cent,
      betaald_door: z.enum(['eilandbezorger', 'restaurant']),
    }).nullish().transform((korting) => korting ?? null),
  }),
  betaling: z.object({ wijze: z.string().min(1).max(40), referentie: z.string().trim().max(80).optional() }),
});
export type Bestelling = z.infer<typeof BestellingSchema>;

export const OphaaltijdSchema = z.object({
  actie: z.literal('ophaaltijd'),
  modus: Modus,
  vestiging: z.enum(['36864']),
  bestelnummer: z.string().trim().min(1).max(64),
  ophaaltijd: iso,
  bezorgtijd: iso.optional(),
});

export type Koppeling = { soort: 'product' | 'extra' | 'formaat'; lightspeed_plu?: string | null; externe_code: string; lightspeed_product_id: string; naam: string; prijs_cent: number; actief: boolean };
export type Regel = { lightspeed_product_id: string; lightspeed_plu?: string | null; naam: string; aantal: number; stukprijs_cent: number; extras: { lightspeed_product_id: string; naam: string; aantal: number; stukprijs_cent: number }[] };

function sorteer(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sorteer);
  if (v && typeof v === 'object') return Object.fromEntries(Object.keys(v as object).sort().map((k) => [k, sorteer((v as any)[k])]));
  return v;
}
/** Inhoud zonder tijden: tijdswijziging loopt via de aparte ophaaltijd-actie. */
export async function vingerafdruk(b: Bestelling): Promise<string> {
  const { ophaaltijd: _o, bezorgtijd: _b, ...rest } = b;
  const data = new TextEncoder().encode(JSON.stringify(sorteer(rest)));
  const h = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(h)].map((x) => x.toString(16).padStart(2, '0')).join('');
}

export function gelijkeSleutel(a: string, b: string): boolean {
  const x = new TextEncoder().encode(a), y = new TextEncoder().encode(b);
  let d = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) d |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return d === 0 && a.length > 0;
}

/** Sleutel voor formaatkoppeling: gerechtcode + formaatkeuze. */
export const formaatSleutel = (product: string, keuze: string) => `${product}|${keuze}`;

export function controleer(b: Bestelling, koppelingen: Koppeling[]): { ok: true; regels: Regel[] } | { ok: false; reden: string } {
  if (b.betaling.wijze !== 'vooraf_betaald') return { ok: false, reden: 'Betaalwijze niet ondersteund; alleen vooraf_betaald.' };
  if (b.bedragen.korting && b.bedragen.korting.korting_cent > 0) return { ok: false, reden: 'Korting nog niet ondersteund.' };
  const k = (soort: Koppeling['soort'], code: string) => koppelingen.find((x) => x.soort === soort && x.externe_code === code && x.actief);
  const regels: Regel[] = []; let som = 0;
  for (const r of b.regels) {
    // Formaat: gerecht + keuze wordt precies 1x het afzonderlijke kassaproduct; toeslag niet nogmaals optellen.
    const formaten = (r.extras ?? []).map((e) => ({ e, f: k('formaat', formaatSleutel(r.code, e.code)) })).filter((x) => x.f);
    const gerechtHeeftFormaten = koppelingen.some((x) => x.soort === 'formaat' && x.externe_code.startsWith(r.code + '|'));
    if (formaten.length > 1) return { ok: false, reden: `Meer dan één formaat voor ${r.code}` };
    if (gerechtHeeftFormaten && formaten.length === 0) return { ok: false, reden: `Formaat ontbreekt of is onbekend voor ${r.code}` };
    let basis: Koppeling | undefined, stuk = r.stukprijs_cent, rest = r.extras ?? [];
    if (formaten.length === 1) {
      const { e, f } = formaten[0];
      if (e.aantal !== 1) return { ok: false, reden: `Formaat ${e.code} moet aantal 1 hebben` };
      basis = f; stuk = r.stukprijs_cent + e.stukprijs_cent; rest = rest.filter((x) => x !== e);
    } else basis = k('product', r.code);
    if (!basis) return { ok: false, reden: `Onbekend product: ${r.code}` };
    if (Math.abs(basis.prijs_cent - stuk) > 1) return { ok: false, reden: `Prijs wijkt af voor ${r.code}${formaten.length ? ' + ' + formaten[0].e.code : ''}: kassa ${basis.prijs_cent}, kreeg ${stuk}` };
    const extras: Regel['extras'] = [];
    for (const e of rest) {
      const x = k('extra', e.code);
      if (!x) return { ok: false, reden: `Onbekende extra: ${e.code}` };
      if (Math.abs(x.prijs_cent - e.stukprijs_cent) > 1) return { ok: false, reden: `Prijs wijkt af voor extra ${e.code}` };
      extras.push({ lightspeed_product_id: x.lightspeed_product_id, naam: x.naam, aantal: e.aantal, stukprijs_cent: e.stukprijs_cent });
      som += e.aantal * e.stukprijs_cent * r.aantal;
    }
    som += r.aantal * stuk;
    regels.push({ lightspeed_product_id: basis.lightspeed_product_id, lightspeed_plu: basis.lightspeed_plu ?? null, naam: basis.naam, aantal: r.aantal, stukprijs_cent: stuk, extras });
  }
  if (som !== b.bedragen.restaurant_cent) return { ok: false, reden: `Restaurantbedrag klopt niet: regels ${som}, opgegeven ${b.bedragen.restaurant_cent}` };
  return { ok: true, regels };
}

export type Status = 'afgekeurd' | 'test_ok' | 'geblokkeerd' | 'gepland' | 'verzenden' | 'ter_beoordeling';
export function kassaBlokkade(cfg: any): string | null {
  if (!vasteKlantId(cfg?.lightspeed_klant_id)) return 'Vaste Lightspeed-klant Eilandbezorger voor Midsland ontbreekt.';
  if (!vasteKlantId(cfg?.lightspeed_betaalwijze_id) || !vasteKlantId(cfg?.lightspeed_betaalwijze_type_id)) return 'Kassa-instellingen (betaalwijze) ontbreken.';
  if (cfg?.order_route === 'establishment_order' && !vasteKlantId(cfg?.lightspeed_company_id)) return 'Kassa-instellingen (company-ID) ontbreken.';
  return null;
}

export function beginStatus(p: { modus: 'test' | 'live'; liveAan: boolean; configCompleet: boolean; configReden?: string | null; ophaaltijd: string; nu: number; vensterMin: number }): { status: Status; reden?: string } {
  if (p.modus === 'test') return { status: 'test_ok' };
  if (!p.liveAan) return { status: 'geblokkeerd', reden: 'Live verzending staat uit voor deze vestiging.' };
  if (!p.configCompleet) return { status: 'geblokkeerd', reden: p.configReden ?? 'Kassa-instellingen ontbreken.' };
  if (new Date(p.ophaaltijd).getTime() - p.nu > p.vensterMin * 60_000) return { status: 'gepland' };
  return { status: 'verzenden' };
}

/** Historische vingerafdrukken blijven staan; hervergelijk oude invoer zonder contactgegevens. */
export async function zelfdeBestelling(r: any, b: Bestelling, vinger: string): Promise<boolean> {
  if (r.modus !== b.modus || r.merchant_id !== b.vestiging || r.extern_id !== b.bestelnummer ||
      new Date(r.ophaaltijd).getTime() !== new Date(b.ophaaltijd).getTime()) return false;
  if (r.vingerafdruk === vinger) return true;
  const oud = BestellingSchema.safeParse(r.invoer);
  return oud.success && await vingerafdruk(oud.data) === vinger;
}

/** Besluit Yorick 21-11-2026: eerste kassaproef met orderPayments als object, zoals in het officiële POST-voorbeeld.
 * Nooit automatisch een tweede order met een ander formaat proberen. */
export const BETALINGEN_ALS_LIJST = false;
export const centen = (euro: number) => Math.round(euro * 100);

/** Vaste klant; orderspecifieke gastnaam en bestelnummer in description, opmerking exact in note. */
export function orderbericht(p: { referentie: string; bestelnummer?: string; ophaaltijd: string; opmerking?: string; regels: Regel[]; restaurant_cent: number;
  betaalwijzeId: string | null; betaalwijzeTypeId?: string | null; klantId?: string | null; route?: 'customer_order' | 'establishment_order'; companyId?: string | null; klant?: unknown }) {
  const est = p.route === 'establishment_order';
  const betaling = p.betaalwijzeId ? { amount: p.restaurant_cent / 100, paymentTypeId: Number(p.betaalwijzeId), paymentTypeTypeId: p.betaalwijzeTypeId ? Number(p.betaalwijzeTypeId) : undefined, tip: 0 } : undefined;
  return {
    ...(p.klantId ? { customerId: Number(p.klantId) } : {}),
    ...(est && p.companyId ? { companyId: Number(p.companyId) } : {}),
    externalReference: p.referentie,
    type: 'takeaway',
    status: 'ACCEPTED',
    deliveryDate: p.ophaaltijd,
    description: [p.bestelnummer ?? p.referentie, gastNaam({ klant: p.klant })].filter(Boolean).join(' — '),
    ...(p.opmerking ? { note: p.opmerking } : {}),
    orderItems: p.regels.map((r) => ({
      ...(est && r.lightspeed_plu ? { productPlu: r.lightspeed_plu } : { productId: Number(r.lightspeed_product_id) }),
      amount: r.aantal, unitPrice: r.stukprijs_cent / 100, totalPrice: (r.aantal * r.stukprijs_cent) / 100,
      modifiers: r.extras.map((e) => ({ productId: Number(e.lightspeed_product_id), amount: e.aantal, unitPrice: e.stukprijs_cent / 100 })),
      subitems: [],
    })),
    orderPayments: betaling ? (BETALINGEN_ALS_LIJST ? [betaling] : betaling) : undefined,
  };
}

/** Pad volgens documentatie; beide varianten bevatten het klantgedeelte. */
export function orderPad(route: string | null | undefined, klantId: string | null | undefined) {
  if (!klantId) return null;
  return `/rest/onlineordering/customer/${encodeURIComponent(klantId)}/${route === 'establishment_order' ? 'establishmentorder' : 'order'}`;
}

/** Totaal betaald in het bericht moet exact het restaurantbedrag zijn. */
export function betaaldInBericht(bericht: ReturnType<typeof orderbericht>): number {
  const b = bericht.orderPayments; const lijst = Array.isArray(b) ? b : b ? [b] : [];
  return lijst.reduce((s, x) => s + centen(x.amount), 0);
}

/** Uitkomst van een verzendpoging. Alles wat Lightspeed mogelijk verwerkt heeft is 'uitkomst_onbekend'. */
export function uitkomstVan(http: number | null, body: string): { status: 'verzonden' | 'geweigerd' | 'uitkomst_onbekend'; orderId?: string } {
  if (http === null || http >= 500 || http === 408 || http === 429) return { status: 'uitkomst_onbekend' };
  if (http >= 400) return { status: 'geweigerd' };
  try { const j = JSON.parse(body); const id = j?.id ?? j?.orderId ?? (typeof j === 'number' ? j : undefined); if (id != null) return { status: 'verzonden', orderId: String(id) }; } catch { /* leeg */ }
  return { status: 'uitkomst_onbekend' };
}
