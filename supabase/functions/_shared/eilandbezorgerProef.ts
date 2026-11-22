import { BestellingSchema, controleer, gelijkJson, kassaBlokkade } from './eilandbezorgerLogica.ts';

export const PROEF_REFERENTIE = 'PV-PROEF-MID-20261122-GB01';
export const PROEF_ORDER_ID = '3c06328f-e0f1-4a10-8959-cad39ac7ab01';
export const PROEF_POGING_ID = '3c06328f-e0f1-4a10-8959-cad39ac7ab02';
// Een interne capability, nooit een berichtveld of partner-/cron-sleutel.
export const PROEF_VRIJGAVE = Symbol('owner-only-ginger-beer-20261122');
export const EERSTE_PROEF = {
  referentie: PROEF_REFERENTIE, orderId: PROEF_ORDER_ID, pogingId: PROEF_POGING_ID, vrijgave: PROEF_VRIJGAVE,
} as const;
export const TWEEDE_PROEF = {
  referentie: 'PV-PROEF-MID-20261122-GB02',
  orderId: 'e79a7a13-0867-4452-b4d4-e60116de6602',
  pogingId: 'ac393ba6-e6c0-472c-ac29-93e0d58bb502',
  vrijgave: Symbol('owner-only-ginger-beer-gb02'),
} as const;
export const DERDE_PROEF = {
  referentie: 'PV-PROEF-MID-20261122-GB03',
  orderId: 'd38cf509-71b1-491d-b288-c73e3b33ab03',
  pogingId: '92c7c738-118c-4758-89b5-7b56bb33ab03',
  vrijgave: Symbol('owner-only-ginger-beer-gb03'),
} as const;
export const VIERDE_PROEF = {
  referentie: 'PV-PROEF-MID-20261122-GB04',
  orderId: '1dce54a7-fd15-49c2-a3a4-3b574684ab04',
  pogingId: '1d936bfb-98c8-4daf-b394-b4a7f691ab04',
  vrijgave: Symbol('owner-only-ginger-beer-gb04'),
} as const;
export const VIJFDE_PROEF = {
  referentie: 'PV-PROEF-MID-20261122-GB05',
  orderId: 'f13960c5-a2b7-4df2-893b-3bb90d2aab05',
  pogingId: 'c59f42b5-f8be-4e96-b945-377d1bb2ab05',
  vrijgave: Symbol('owner-only-ginger-beer-gb05'),
} as const;
export const ZESDE_PROEF = {
  referentie: 'PV-PROEF-MID-20261122-GB06',
  orderId: '9fb64715-7e55-4aa4-b896-22b74816ab06',
  pogingId: '7b06a9c1-76de-43e8-b3ef-4115d256ab06',
  vrijgave: Symbol('owner-only-ginger-beer-gb06'),
} as const;
export type VasteProef = typeof EERSTE_PROEF | typeof TWEEDE_PROEF | typeof DERDE_PROEF | typeof VIERDE_PROEF | typeof VIJFDE_PROEF | typeof ZESDE_PROEF;

export const PROEF_HERVATTING = Symbol('eerste-ongezonden-proef-hervatten');
export const PROEF_OWNER_ID = '9b59d031-86b2-45c1-882c-ab222c6bbf66';
export const PROEF_EERSTE_TIJD = '2026-11-22T15:38:29.908Z';
export const PROEF_EERSTE_HASH = '66b58a21487145e5ab2045f71ac7f5ee4995e2df680504847cfa1f7447810fd0';
export const PROEF_BLOKKADE = 'Proefinhoud of vaste klantconfiguratie is gewijzigd.';
export const PROEF_HERVAT_REDEN = 'Eenmalige hervatting van eerste ongezonden fysieke proef; gewone liveverzending blijft uit.';
export function herkenProef(r: { extern_id?: string; referentie?: string; id?: string } | null | undefined) {
  return [EERSTE_PROEF, TWEEDE_PROEF, DERDE_PROEF, VIERDE_PROEF, VIJFDE_PROEF, ZESDE_PROEF].find(p => r?.extern_id === p.referentie || r?.referentie === p.referentie || r?.id === p.orderId);
}
export const isProef = (r: any) => herkenProef(r) !== undefined;

export function proefInvoer(nu: number, proef: VasteProef = EERSTE_PROEF) {
  return BestellingSchema.parse({ versie: 1, modus: 'live', bestelnummer: proef.referentie, vestiging: '36864',
    ophaaltijd: new Date(nu).toISOString(), klant: { naam: 'Pura Test' }, opmerking: 'TEST – niet klaarmaken',
    regels: [{ code: 'PV-0680E844', naam: 'Naturfrisk Ginger beer', aantal: 1, stukprijs_cent: 490, extras: [] }],
    bedragen: { restaurant_cent: 490, bezorgkosten_cent: 0, fooi_cent: 0, korting: null }, betaling: { wijze: 'vooraf_betaald' } });
}

export function proefDatum(nu: number) {
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(nu));
  return ['year', 'month', 'day'].map((k) => p.find((x) => x.type === k)?.value).join('-') === '2026-11-22';
}

/** Fail closed, ook als een uitlezing ontbreekt. Geen tokenbeheer of Lightspeed-verzoeken. */
export async function proefControle(admin: any, nu: number, proef: VasteProef = EERSTE_PROEF) {
  if (!proefDatum(nu)) return { fout: 'De eenmalige proef is verlopen (Amsterdam, 22 november 2026).' };
  const [c, v, k, conn] = await Promise.all([
    admin.from('externe_kassa_config').select('*').eq('vestiging', 'Midsland').maybeSingle(),
    admin.from('fase2_vlag').select('aan').eq('vestiging', 'Midsland').eq('vlag', 'eilandbezorger_live').maybeSingle(),
    admin.from('externe_product_koppeling').select('*').eq('vestiging', 'Midsland'),
    admin.from('lightspeed_connections').select('status').eq('merchant_id', '36864').maybeSingle(),
  ]);
  if ([c, v, k, conn].some((x) => x.error)) return { fout: 'Proefinstellingen konden niet veilig worden gecontroleerd.' };
  if (v.data?.aan !== false) return { fout: 'De gewone Eilandbezorger-liveverzending moet expliciet uit staan.' };
  const cfg = c.data;
  const blokkade = kassaBlokkade(cfg);
  if (blokkade) return { fout: blokkade };
  if (String(cfg.lightspeed_betaalwijze_id) !== '285794' || String(cfg.lightspeed_betaalwijze_type_id) !== '4') return { fout: 'De bevestigde betaalwijze Eilandbezorger 285794/type 4 ontbreekt.' };
  if (cfg.order_route !== 'customer_order' || !Number.isFinite(cfg.venster_minuten) || cfg.venster_minuten <= 0) return { fout: 'Proefroute of afhaalvenster ongeldig.' };
  if (!['gekoppeld', 'token_verlopen'].includes(conn.data?.status)) return { fout: 'Midsland heeft geen actieve kassakoppeling.' };
  const mapping = (k.data ?? []).filter((x: any) => x.soort === 'product' && x.externe_code === 'PV-0680E844' && x.actief);
  if (mapping.length !== 1 || mapping[0].lightspeed_product_id !== '4636894' || mapping[0].prijs_cent !== 490) return { fout: 'De actieve Ginger Beer-koppeling moet exact 4636894 en 490 cent zijn.' };
  const b = proefInvoer(nu, proef), controle = controleer(b, k.data ?? []);
  if (!controle.ok) return { fout: controle.reden };
  const r = controle.regels[0];
  if (controle.regels.length !== 1 || r.lightspeed_product_id !== '4636894' || r.stukprijs_cent !== 490 || r.naam !== 'Naturfrisk Ginger beer' || r.extras.length) return { fout: 'De actieve Ginger Beer-koppeling moet exact 4636894 en 490 cent zijn.' };
  if (proef === TWEEDE_PROEF || proef === DERDE_PROEF || proef === VIERDE_PROEF || proef === VIJFDE_PROEF || proef === ZESDE_PROEF) {
    if (cfg.merchant_id !== '36864' || cfg.lightspeed_klant_id !== '13597022' ||
      cfg.lightspeed_company_id !== null || cfg.venster_minuten !== 45 || r.lightspeed_plu !== 'Kd-a11') {
      return { fout: 'De bevestigde Midsland-configuratie voor de vaste vervolgproef is gewijzigd.' };
    }
    if (!await eersteProefGeweigerd(admin)) return { fout: 'De oorspronkelijke eenmalige parserweigering is niet bevestigd.' };
    if ((proef === DERDE_PROEF || proef === VIERDE_PROEF || proef === VIJFDE_PROEF || proef === ZESDE_PROEF) && !await tweedeProefGeweigerd(admin)) return { fout: 'De eenmalige GB02-nettoprijsweigering is niet bevestigd.' };
  }
  return { cfg, b, regels: controle.regels };
}

export function exacteProef(rij: any, nu: number, cfg: any, regels: unknown, proef: VasteProef = EERSTE_PROEF) {
  const p = BestellingSchema.safeParse(rij.invoer);
  if (!p.success || rij.id !== proef.orderId || rij.referentie !== proef.referentie || rij.extern_id !== proef.referentie ||
    rij.merchant_id !== '36864' || rij.vestiging !== 'Midsland' || rij.modus !== 'live' || !rij.vrijgegeven_door ||
    rij.restaurant_cent !== 490 || rij.bezorgkosten_cent !== 0 || rij.fooi_cent !== 0 || rij.korting !== null) return false;
  const tijd = Date.parse(rij.ophaaltijd);
  if (!Number.isFinite(tijd) || tijd > nu || nu - tijd > cfg.venster_minuten * 60_000) return false;
  return gelijkJson(rij.invoer, proefInvoer(tijd, proef)) && gelijkJson(p.data, proefInvoer(tijd, proef)) && gelijkJson(rij.regels, regels);
}

/** Hervatting: de bevestigde configuratie en eerste proef mogen nergens afwijken. */
export function eersteProef(rij: any, cfg: any, regels: unknown, nu: number) {
  return exacteProef(rij, nu, cfg, regels) && rij.bron === 'eilandbezorger' &&
    rij.bezorgtijd === null &&
    rij.vrijgegeven_door === PROEF_OWNER_ID && rij.vingerafdruk === PROEF_EERSTE_HASH &&
    Date.parse(rij.ophaaltijd) === Date.parse(PROEF_EERSTE_TIJD) &&
    gelijkJson(rij.invoer, proefInvoer(Date.parse(PROEF_EERSTE_TIJD))) &&
    cfg.lightspeed_klant_id === '13597022' && cfg.lightspeed_betaalwijze_id === '285794' &&
    cfg.lightspeed_betaalwijze_type_id === '4' && cfg.lightspeed_company_id === null && cfg.order_route === 'customer_order' && cfg.venster_minuten === 45 &&
    Array.isArray(regels) && regels.length === 1 && regels[0].lightspeed_plu === 'Kd-a11';
}

/** Vóór claim: geen enkele poging. Na claim: uitsluitend onze eigen permanente poging. */
export async function proefPogingen(admin: any, eigenPoging = false, proef: VasteProef = EERSTE_PROEF) {
  const [alle, permanent] = await Promise.all([
    admin.from('externe_bestelling_poging').select('id, bestelling_id, soort, versie, uitkomst').eq('bestelling_id', proef.orderId),
    admin.from('externe_bestelling_poging').select('id, bestelling_id, soort, versie, uitkomst').eq('id', proef.pogingId),
  ]);
  if (alle.error || permanent.error || !Array.isArray(alle.data) || !Array.isArray(permanent.data)) return false;
  if (!eigenPoging) return alle.data.length === 0 && permanent.data.length === 0;
  const past = (p: any) => p.id === proef.pogingId && p.bestelling_id === proef.orderId && p.soort === 'verzenden' && p.uitkomst === 'bezig';
  return alle.data.length === 1 && permanent.data.length === 1 && past(alle.data[0]) && past(permanent.data[0]);
}

export async function eersteProefAudit(admin: any) {
  const { data, error } = await admin.from('externe_bestelling_log').select('van_status, naar_status, reden, door').eq('bestelling_id', PROEF_ORDER_ID).order('created_at', { ascending: true });
  return !error && gelijkJson(data, [
    { van_status: null, naar_status: 'ontvangen', reden: 'Eenmalige fysieke owner-proef; gewone liveverzending blijft uit.', door: PROEF_OWNER_ID },
    { van_status: 'ontvangen', naar_status: 'verzenden', reden: 'Eenmalige fysieke owner-proef; gewone liveverzending blijft uit.', door: PROEF_OWNER_ID },
    { van_status: 'verzenden', naar_status: 'geblokkeerd', reden: PROEF_BLOKKADE, door: null },
  ]);
}

/** GB02 mag uitsluitend volgen op de deserialisatiefout van de enige GB01-POST. */
async function eersteProefGeweigerd(admin: any): Promise<boolean> {
  const [order, pogingen] = await Promise.all([
    admin.from('externe_bestellingen').select('id, extern_id, referentie, vestiging, merchant_id, modus, status, lightspeed_order_id')
      .eq('id', EERSTE_PROEF.orderId).maybeSingle(),
    admin.from('externe_bestelling_poging').select('id, bestelling_id, soort, uitkomst, http_status, antwoord')
      .eq('bestelling_id', EERSTE_PROEF.orderId),
  ]);
  const rij = order.data;
  if (order.error || pogingen.error || rij?.id !== EERSTE_PROEF.orderId || rij.extern_id !== EERSTE_PROEF.referentie ||
    rij.referentie !== EERSTE_PROEF.referentie || rij.vestiging !== 'Midsland' || rij.merchant_id !== '36864' ||
    rij.modus !== 'live' || rij.status !== 'geweigerd' || rij.lightspeed_order_id !== null || pogingen.data?.length !== 1) return false;
  const poging = pogingen.data[0];
  if (poging.id !== EERSTE_PROEF.pogingId || poging.bestelling_id !== EERSTE_PROEF.orderId || poging.soort !== 'verzenden' ||
    poging.uitkomst !== 'geweigerd' || poging.http_status !== 400) return false;
  try {
    const omschrijving = JSON.parse(poging.antwoord).description;
    return typeof omschrijving === 'string' &&
      omschrijving.startsWith('JSON parse error: Cannot deserialize value of type `java.util.ArrayList<com.xudox.pos.server.rest.shared.model.OrderPaymentDTO>` from Object value (token `JsonToken.START_OBJECT`)') &&
      omschrijving.endsWith('(through reference chain: com.xudox.pos.server.rest.shared.model.OrderDTO["orderPayments"])');
  } catch {
    return false;
  }
}

/** GB03 vereist de exacte definitieve nettoprijsweigering van één GB02-poging. */
async function tweedeProefGeweigerd(admin: any): Promise<boolean> {
  const [order, pogingen] = await Promise.all([
    admin.from('externe_bestellingen').select('id, extern_id, referentie, vestiging, merchant_id, modus, status, lightspeed_order_id')
      .eq('id', TWEEDE_PROEF.orderId).maybeSingle(),
    admin.from('externe_bestelling_poging').select('id, bestelling_id, soort, uitkomst, http_status, antwoord')
      .eq('bestelling_id', TWEEDE_PROEF.orderId),
  ]);
  const rij = order.data;
  if (order.error || pogingen.error || rij?.id !== TWEEDE_PROEF.orderId || rij.extern_id !== TWEEDE_PROEF.referentie ||
    rij.referentie !== TWEEDE_PROEF.referentie || rij.vestiging !== 'Midsland' || rij.merchant_id !== '36864' ||
    rij.modus !== 'live' || rij.status !== 'geweigerd' || rij.lightspeed_order_id !== null || pogingen.data?.length !== 1) return false;
  const poging = pogingen.data[0];
  if (poging.id !== TWEEDE_PROEF.pogingId || poging.bestelling_id !== TWEEDE_PROEF.orderId || poging.soort !== 'verzenden' ||
    poging.uitkomst !== 'geweigerd' || poging.http_status !== 400) return false;
  try {
    return gelijkJson(JSON.parse(poging.antwoord), { errors: ['orderItems[0].unitPriceWithoutVat may not be null'] });
  } catch { return false; }
}
