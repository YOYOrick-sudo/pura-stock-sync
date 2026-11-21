import { z } from 'npm:zod@3.23.8';

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
  klant: z.object({ naam: z.string().trim().min(1).max(80), telefoon: z.string().trim().max(30).optional() }),
  opmerking: z.string().trim().max(500).optional(),
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
    }).nullish(),
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

export type Koppeling = { soort: 'product' | 'extra'; externe_code: string; lightspeed_product_id: string; naam: string; prijs_cent: number; actief: boolean };
export type Regel = { lightspeed_product_id: string; naam: string; aantal: number; stukprijs_cent: number; extras: { lightspeed_product_id: string; naam: string; aantal: number; stukprijs_cent: number }[] };

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

export function controleer(b: Bestelling, koppelingen: Koppeling[]): { ok: true; regels: Regel[] } | { ok: false; reden: string } {
  if (b.betaling.wijze !== 'vooraf_betaald') return { ok: false, reden: 'Betaalwijze niet ondersteund; alleen vooraf_betaald.' };
  if (b.bedragen.korting && b.bedragen.korting.korting_cent > 0) return { ok: false, reden: 'Korting nog niet ondersteund.' };
  const k = (soort: 'product' | 'extra', code: string) => koppelingen.find((x) => x.soort === soort && x.externe_code === code && x.actief);
  const regels: Regel[] = []; let som = 0;
  for (const r of b.regels) {
    const p = k('product', r.code);
    if (!p) return { ok: false, reden: `Onbekend product: ${r.code}` };
    if (Math.abs(p.prijs_cent - r.stukprijs_cent) > 1) return { ok: false, reden: `Prijs wijkt af voor ${r.code}: verwacht ${p.prijs_cent}, kreeg ${r.stukprijs_cent}` };
    const extras: Regel['extras'] = [];
    for (const e of r.extras ?? []) {
      const x = k('extra', e.code);
      if (!x) return { ok: false, reden: `Onbekende extra: ${e.code}` };
      if (Math.abs(x.prijs_cent - e.stukprijs_cent) > 1) return { ok: false, reden: `Prijs wijkt af voor extra ${e.code}` };
      extras.push({ lightspeed_product_id: x.lightspeed_product_id, naam: x.naam, aantal: e.aantal, stukprijs_cent: e.stukprijs_cent });
      som += e.aantal * e.stukprijs_cent * r.aantal;
    }
    som += r.aantal * r.stukprijs_cent;
    regels.push({ lightspeed_product_id: p.lightspeed_product_id, naam: p.naam, aantal: r.aantal, stukprijs_cent: r.stukprijs_cent, extras });
  }
  if (som !== b.bedragen.restaurant_cent) return { ok: false, reden: `Restaurantbedrag klopt niet: regels ${som}, opgegeven ${b.bedragen.restaurant_cent}` };
  return { ok: true, regels };
}

export type Status = 'afgekeurd' | 'test_ok' | 'geblokkeerd' | 'gepland' | 'verzenden';
export function beginStatus(p: { modus: 'test' | 'live'; liveAan: boolean; configCompleet: boolean; ophaaltijd: string; nu: number; vensterMin: number }): { status: Status; reden?: string } {
  if (p.modus === 'test') return { status: 'test_ok' };
  if (!p.liveAan) return { status: 'geblokkeerd', reden: 'Live verzending staat uit voor deze vestiging.' };
  if (!p.configCompleet) return { status: 'geblokkeerd', reden: 'Kassa-instellingen (klant/betaalwijze) ontbreken.' };
  if (new Date(p.ophaaltijd).getTime() - p.nu > p.vensterMin * 60_000) return { status: 'gepland' };
  return { status: 'verzenden' };
}

/** ONGEVERIFIEERD orderformaat (L-Series onlineordering). Pas aan na kassaproef; alleen hier. */
export function orderbericht(p: { referentie: string; ophaaltijd: string; klant: Bestelling['klant']; opmerking?: string; regels: Regel[]; restaurant_cent: number; betaalwijzeId: string | null }) {
  const notitie = [`Eilandbezorger ${p.referentie}`, `Gast: ${p.klant.naam}${p.klant.telefoon ? ' ' + p.klant.telefoon : ''}`, p.opmerking].filter(Boolean).join(' | ');
  return {
    thirdPartyReference: p.referentie,
    type: 'takeaway',
    deliveryDate: p.ophaaltijd,
    note: notitie.slice(0, 500),
    orderItems: p.regels.map((r) => ({
      productId: Number(r.lightspeed_product_id), amount: r.aantal, unitPrice: r.stukprijs_cent / 100,
      modifiers: r.extras.map((e) => ({ productId: Number(e.lightspeed_product_id), amount: e.aantal, unitPrice: e.stukprijs_cent / 100 })),
    })),
    orderPayment: p.betaalwijzeId ? { paymentTypeId: Number(p.betaalwijzeId), paymentAmount: p.restaurant_cent / 100 } : undefined,
  };
}

/** Uitkomst van een verzendpoging. Alles wat Lightspeed mogelijk verwerkt heeft is 'uitkomst_onbekend'. */
export function uitkomstVan(http: number | null, body: string): { status: 'verzonden' | 'geweigerd' | 'uitkomst_onbekend'; orderId?: string } {
  if (http === null || http >= 500 || http === 408 || http === 429) return { status: 'uitkomst_onbekend' };
  if (http >= 400) return { status: 'geweigerd' };
  try { const j = JSON.parse(body); const id = j?.id ?? j?.orderId ?? (typeof j === 'number' ? j : undefined); if (id != null) return { status: 'verzonden', orderId: String(id) }; } catch { /* leeg */ }
  return { status: 'uitkomst_onbekend' };
}
