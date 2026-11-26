import { z } from 'npm:zod@3.23.8';
import { gastNaam, vasteKlantId } from './eilandbezorgerKlant.ts';
import { regelEuro, type GeprijsdeRegel } from './eilandbezorgerPrijzen.ts';

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

export type Koppeling = { soort: 'product' | 'extra' | 'formaat'; lightspeed_plu?: string | null; externe_code: string; lightspeed_product_id: string; naam: string; prijs_cent: number; actief: boolean; keuze_verplicht?: boolean; keuze_toeslag_cent?: number | null };
export type Regel = { lightspeed_product_id: string; lightspeed_plu?: string | null; naam: string; aantal: number; stukprijs_cent: number; gast_verzoek?: 'bloemkool_glutenvrij' | 'tahoe_glutenvrij'; gratis_sauzen?: string[]; extras: { lightspeed_product_id: string; naam: string; aantal: number; stukprijs_cent: number }[] };

function sorteer(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sorteer);
  if (v && typeof v === 'object') return Object.fromEntries(Object.keys(v as object).sort().map((k) => [k, sorteer((v as any)[k])]));
  return v;
}
/** JSON-inhoud: alleen objectsleutelvolgorde negeren; geen coercion of weggefilterde waarden. */
export function gelijkJson(a: unknown, b: unknown): boolean {
  const geldig = (v: unknown): boolean => {
    if (v === null || typeof v === 'string' || typeof v === 'boolean') return true;
    if (typeof v === 'number') return Number.isFinite(v);
    if (Array.isArray(v)) return Array.from(v).every(geldig);
    return typeof v === 'object' && Object.getPrototypeOf(v) === Object.prototype && Object.values(v).every(geldig);
  };
  return geldig(a) && geldig(b) && JSON.stringify(sorteer(a)) === JSON.stringify(sorteer(b));
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
/** Reguliere opties zijn altijd gerechtgebonden, eventueel aan het definitieve kassaproduct. */
export const extraSleutel = (gerecht: string, extra: string, productId?: string) => productId ? `${gerecht}|${productId}|${extra}` : `${gerecht}|${extra}`;

/** Eigenaar bevestigd standaard vegan: het gratis vinkje is alleen informatief, geen modifier of handeling. */
export const STANDAARD_VEGAN: Record<string, { keuze: string; doelen: [string, string][] }> = {
  'PV-6F37A149': { keuze: 'PVK-AD715B1F-1', doelen: [['2084809', 'V11']] },
  'PV-3AC166C3': { keuze: 'PVK-AD715B1F-1', doelen: [['4705081', 'F76']] },
  'PV-F7B26912': { keuze: 'PVK-319766B2-1', doelen: [['1071103', 'Dh16'], ['2385828', 'B140']] },
  'PV-CE0EF3F3': { keuze: 'PVK-319766B2-1', doelen: [['4499170', 'BPB4'], ['4499175', 'BPB6']] },
  'PV-7B1071AD': { keuze: 'PVK-319766B2-1', doelen: [['2843422', 'F47']] },
};
/** Eigenaarsbesluit: extra Sriracha/Sambal gratis waar aangeboden. De kassa-optie kost €0,50, dus
 *  géén catalogusmodifier meesturen; alleen een regelgebonden keukeninstructie. Alleen bij een
 *  actieve gerecht/eindproductkoppeling met prijs 0. */
export const GRATIS_SAUS: Record<string, string> = { '1625385': 'Sriracha', '1716435': 'Sambal' };
/** Keuzes zonder kassakeuze of eigenaarsbesluit krijgen een concrete reden in plaats van een gok. */
const GERICHTE_BLOKKADE: Record<string, string> = {
  'PV-CE0EF3F3|PVK-456C0BDC-1': 'Bietenburger Glutenvrij: de kassa heeft voor dit product geen glutenvrij-keuze en de friet is niet glutenvrij; alleen betaald glutenvrij brood is bewezen. Handmatige beoordeling.',
  'PV-6F37A149|PVK-AD715B1F-2': 'Loaded Hummus Glutenvrij: de kassa heeft voor dit product alleen betaald glutenvrij brood; het gratis vinkje is niet bevestigd. Handmatige beoordeling.',
  'PV-BE202ED8|PVK-DBE8A359-1': 'Glutenvrij brood is in de kassa niet beschikbaar voor Lamsburger (solo of met friet). Handmatige beoordeling.',
};

export function controleer(b: Bestelling, koppelingen: Koppeling[]): { ok: true; regels: Regel[] } | { ok: false; reden: string } {
  if (b.betaling.wijze !== 'vooraf_betaald') return { ok: false, reden: 'Betaalwijze niet ondersteund; alleen vooraf_betaald.' };
  if (b.bedragen.korting && b.bedragen.korting.korting_cent > 0) return { ok: false, reden: 'Korting nog niet ondersteund.' };
  const k = (soort: Koppeling['soort'], code: string) => koppelingen.find((x) => x.soort === soort && x.externe_code === code && x.actief);
  const regels: Regel[] = []; let som = 0;
  for (const r of b.regels) {
    if (new Set((r.extras ?? []).map(e => e.code)).size !== (r.extras ?? []).length) return { ok: false, reden: `Dubbele extra of keuze voor ${r.code}` };
    // Formaat: gerecht + keuze wordt precies 1x het afzonderlijke kassaproduct; toeslag niet nogmaals optellen.
    const formaten = (r.extras ?? []).map((e) => ({ e, f: k('formaat', formaatSleutel(r.code, e.code)) })).filter((x) => x.f);
    const gerechtHeeftFormaten = koppelingen.some((x) => x.soort === 'formaat' && x.keuze_verplicht !== false && x.externe_code.startsWith(r.code + '|'));
    if (formaten.length > 1) return { ok: false, reden: `Meer dan één formaat voor ${r.code}` };
    if (gerechtHeeftFormaten && !formaten.some(x => x.f?.keuze_verplicht !== false)) return { ok: false, reden: `Formaat ontbreekt of is onbekend voor ${r.code}` };
    let basis: Koppeling | undefined, stuk = r.stukprijs_cent, rest = r.extras ?? [];
    if (formaten.length === 1) {
      const { e, f } = formaten[0];
      if (e.aantal !== 1) return { ok: false, reden: `Formaat ${e.code} moet aantal 1 hebben` };
      if (f?.keuze_verplicht === false && (!Number.isInteger(f.keuze_toeslag_cent) || f.keuze_toeslag_cent !== e.stukprijs_cent || r.stukprijs_cent !== f.prijs_cent - e.stukprijs_cent)) return { ok: false, reden: `Basisprijs of toeslag wijkt af voor variant ${r.code} + ${e.code}` };
      basis = f; stuk = r.stukprijs_cent + e.stukprijs_cent; rest = rest.filter((x) => x !== e);
    } else basis = k('product', r.code);
    if (!basis) return { ok: false, reden: `Onbekend product: ${r.code}` };
    if (Math.abs(basis.prijs_cent - stuk) > 1) return { ok: false, reden: `Prijs wijkt af voor ${r.code}${formaten.length ? ' + ' + formaten[0].e.code : ''}: kassa ${basis.prijs_cent}, kreeg ${stuk}` };
    const extras: Regel['extras'] = [];
    let gastVerzoek: Regel['gast_verzoek'];
    const sauzen: string[] = [];
    for (const e of rest) {
      const standaardVegan = STANDAARD_VEGAN[r.code]?.keuze === e.code;
      const bloemkoolGlutenvrij = r.code === 'PV-3AC166C3' && e.code === 'PVK-AD715B1F-2';
      if (standaardVegan || bloemkoolGlutenvrij) {
        const doelen = bloemkoolGlutenvrij ? [['4705081', 'F76']] : STANDAARD_VEGAN[r.code].doelen;
        if (b.vestiging !== '36864' || !doelen.some(([id, plu]) => basis!.lightspeed_product_id === id && basis!.lightspeed_plu === plu) || e.aantal !== 1 || e.stukprijs_cent !== 0) {
          return { ok: false, reden: `Dieetkeuze ${e.code} vereist het bevestigde kassaproduct voor ${r.code} en één gratis keuze.` };
        }
        // Menukaart/eigenaar leidend; een gastverzoek is geen allergenenvrij-belofte.
        if (bloemkoolGlutenvrij) gastVerzoek = 'bloemkool_glutenvrij';
        continue;
      }
      const specifiek = koppelingen.filter(x => x.soort === 'extra' && x.externe_code === extraSleutel(r.code, e.code, basis.lightspeed_product_id));
      const kandidaten = specifiek.length ? specifiek : koppelingen.filter(x => x.soort === 'extra' && x.externe_code === extraSleutel(r.code, e.code));
      const x = kandidaten.length === 1 && kandidaten[0].actief ? kandidaten[0] : undefined;
      if (!x) return { ok: false, reden: GERICHTE_BLOKKADE[`${r.code}|${e.code}`] ?? `Onbekende of niet toepasselijke extra voor ${r.code} (kassaproduct ${basis.lightspeed_product_id}): ${e.code}` };
      if (x.prijs_cent !== e.stukprijs_cent) return { ok: false, reden: `Prijs wijkt af voor extra ${e.code} bij ${r.code}: kassa ${x.prijs_cent}, kreeg ${e.stukprijs_cent}` };
      if (GRATIS_SAUS[x.lightspeed_product_id] && x.prijs_cent === 0) {
        if (e.aantal !== 1 || b.vestiging !== '36864') return { ok: false, reden: `Gratis saus ${e.code} bij ${r.code} moet aantal 1 per portie hebben.` };
        sauzen.push(GRATIS_SAUS[x.lightspeed_product_id]);
        continue;
      }
      // Bewezen kassamodel: één keuze per portie; de toeslag telt per portie bovenop de basisprijs.
      if (e.aantal !== 1) return { ok: false, reden: `Extra ${e.code} bij ${r.code} moet aantal 1 per portie hebben.` };
      if (r.code === 'PV-51FDF8F3' && e.code === 'PVK-456C0BDC-1') {
        if (b.vestiging !== '36864' || basis.lightspeed_product_id !== '1071041' || basis.lightspeed_plu !== 'Dv11' || x.lightspeed_product_id !== '263905') {
          return { ok: false, reden: 'Saté Glutenvrij vereist de bevestigde Saté Spicy Tahoe en echte Glutenvrij-optie.' };
        }
        gastVerzoek = 'tahoe_glutenvrij';
      }
      extras.push({ lightspeed_product_id: x.lightspeed_product_id, naam: x.naam, aantal: e.aantal, stukprijs_cent: e.stukprijs_cent });
      som += e.aantal * e.stukprijs_cent * r.aantal;
    }
    som += r.aantal * stuk;
    regels.push({ lightspeed_product_id: basis.lightspeed_product_id, lightspeed_plu: basis.lightspeed_plu ?? null, naam: basis.naam, aantal: r.aantal, stukprijs_cent: stuk, extras, ...(gastVerzoek ? { gast_verzoek: gastVerzoek } : {}), ...(sauzen.length ? { gratis_sauzen: sauzen } : {}) });
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

export const centen = (euro: number) => Math.round(euro * 100);

/** Alleen gevalideerde regelgebonden verzoeken; originele gastnotitie nooit trimmen/herschrijven. */
export function gastVerzoekNotitie(regels: Regel[], opmerking?: string): string | undefined {
  const verzoeken = regels.flatMap((r, index) => {
    const saus = (r.gratis_sauzen ?? []);
    if (saus.length && (!Number.isInteger(r.aantal) || r.aantal < 1 || saus.some(x => !Object.values(GRATIS_SAUS).includes(x)) || new Set(saus).size !== saus.length)) throw new Error('Sausinstructie niet veilig aan een bestelregel gekoppeld.');
    const sausRegel = saus.length ? [`Regel ${index + 1} (${r.aantal}×) – ${r.naam} – extra saus (gratis): ${saus.join(' + ')}`] : [];
    if (r.gast_verzoek === undefined) return sausRegel;
    const bloemkool = r.gast_verzoek === 'bloemkool_glutenvrij' && r.lightspeed_product_id === '4705081' && r.lightspeed_plu === 'F76';
    const tahoe = r.gast_verzoek === 'tahoe_glutenvrij' && r.lightspeed_product_id === '1071041' && r.lightspeed_plu === 'Dv11' && r.extras.some(e => e.lightspeed_product_id === '263905' && e.aantal === 1 && e.stukprijs_cent === 0);
    if ((!bloemkool && !tahoe) || !Number.isInteger(r.aantal) || r.aantal < 1) throw new Error('Dieetverzoek niet veilig aan een bestelregel gekoppeld; handmatige keukencontrole vereist.');
    return [...sausRegel, `Regel ${index + 1} (${r.aantal}×) – ${bloemkool ? 'Geroosterde bloemkool – gast vraagt glutenvrij' : 'Saté Spicy Tahoe – glutenvrij verzocht, zonder gefruite uitjes'}`];
  });
  return verzoeken.length ? (opmerking ? opmerking + '\n\n' : '') + verzoeken.join('\n') : opmerking;
}

/** Vaste klant; gastnaam/bestelnummer in description, originele opmerking plus expliciete regelverzoeken in note. */
export function orderbericht(p: { referentie: string; bestelnummer?: string; ophaaltijd: string; opmerking?: string; regels: GeprijsdeRegel[]; restaurant_cent: number;
  betaalwijzeId: string | null; betaalwijzeTypeId?: string | null; klantId?: string | null; route?: 'customer_order' | 'establishment_order'; companyId?: string | null; klant?: unknown }) {
  const est = p.route === 'establishment_order';
  const note = gastVerzoekNotitie(p.regels, p.opmerking);
  const toeslag = (r: GeprijsdeRegel) => r.extras.reduce((s, e) => s + e.aantal * e.stukprijs_cent, 0);
  if (!p.regels.length || p.regels.some(r => !Number.isFinite(r.netto_euro) || r.netto_euro < 0 ||
    !Number.isFinite(r.bezorg_btw_pct) || !Array.isArray(r.kassa_modifiers) || r.kassa_modifiers.length !== r.extras.length ||
    (r.gast_verzoek === 'tahoe_glutenvrij' && !r.kassa_modifiers.some(m => m.modifierValueId === 263905 && m.price === 0 && m.priceWithoutVat === 0)) ||
    r.extras.some(e => e.aantal !== 1 || !r.kassa_modifiers.some(m => String(m.modifierValueId) === e.lightspeed_product_id && Math.round(m.price * 100) === e.stukprijs_cent))) ||
    p.regels.reduce((s, r) => s + r.aantal * (r.stukprijs_cent + toeslag(r)), 0) !== p.restaurant_cent) {
    throw new Error('Geen volledig geverifieerde netto-/btw-gegevens voor het kassabericht.');
  }
  // Een regel met betaalde keuze wordt per portie (amount 1) verstuurd: alleen dat patroon is in
  // oorspronkelijke onlineorders aangetoond. Totaal per regel = basis + toeslagen, zoals op de kassabon.
  const items = p.regels.flatMap((r) => {
    const t = toeslag(r);
    const regel = (amount: number) => ({
      ...(est && r.lightspeed_plu ? { productPlu: r.lightspeed_plu } : { productId: Number(r.lightspeed_product_id) }),
      amount, unitPrice: r.stukprijs_cent / 100, totalPrice: (amount * (r.stukprijs_cent + t)) / 100,
      unitPriceWithoutVat: r.netto_euro,
      totalPriceWithoutVat: t ? regelEuro(amount * (r.stukprijs_cent + t) / 100 / (1 + r.bezorg_btw_pct / 100)) : regelEuro(amount * r.netto_euro),
      modifiers: r.kassa_modifiers,
      subitems: [],
    });
    return t ? Array.from({ length: r.aantal }, () => regel(1)) : [regel(r.aantal)];
  });
  const betaling = p.betaalwijzeId ? { amount: p.restaurant_cent / 100, paymentTypeId: Number(p.betaalwijzeId), paymentTypeTypeId: p.betaalwijzeTypeId ? Number(p.betaalwijzeTypeId) : undefined, tip: 0 } : undefined;
  return {
    ...(p.klantId ? { customerId: Number(p.klantId) } : {}),
    ...(est && p.companyId ? { companyId: Number(p.companyId) } : {}),
    externalReference: p.referentie,
    type: 'takeaway',
    status: 'ACCEPTED',
    deliveryDate: p.ophaaltijd,
    description: [p.bestelnummer ?? p.referentie, gastNaam({ klant: p.klant })].filter(Boolean).join(' — '),
    ...(note ? { note } : {}),
    orderItems: items,
    orderPayments: betaling ? [betaling] : undefined,
  };
}

/** Pad volgens documentatie; beide varianten bevatten het klantgedeelte. */
export function orderPad(route: string | null | undefined, klantId: string | null | undefined) {
  if (!klantId) return null;
  return `/rest/onlineordering/customer/${encodeURIComponent(klantId)}/${route === 'establishment_order' ? 'establishmentorder' : 'order'}`;
}

/** Totaal betaald in het bericht moet exact het restaurantbedrag zijn. */
export function betaaldInBericht(bericht: { orderPayments?: { amount: number } | { amount: number }[] | null }): number {
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
