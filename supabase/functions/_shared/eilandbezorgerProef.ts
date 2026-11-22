import { BestellingSchema, controleer, kassaBlokkade } from './eilandbezorgerLogica.ts';

export const PROEF_REFERENTIE = 'PV-PROEF-MID-20261122-GB01';
export const PROEF_ORDER_ID = '3c06328f-e0f1-4a10-8959-cad39ac7ab01';
export const PROEF_POGING_ID = '3c06328f-e0f1-4a10-8959-cad39ac7ab02';
// Een interne capability, nooit een berichtveld of partner-/cron-sleutel.
export const PROEF_VRIJGAVE = Symbol('owner-only-ginger-beer-20261122');
export const isProef = (r: any) => r?.extern_id === PROEF_REFERENTIE || r?.referentie === PROEF_REFERENTIE || r?.id === PROEF_ORDER_ID;

export function proefInvoer(nu: number) {
  return BestellingSchema.parse({ versie: 1, modus: 'live', bestelnummer: PROEF_REFERENTIE, vestiging: '36864',
    ophaaltijd: new Date(nu).toISOString(), klant: { naam: 'Pura Test' }, opmerking: 'TEST – niet klaarmaken',
    regels: [{ code: 'PV-0680E844', naam: 'Naturfrisk Ginger beer', aantal: 1, stukprijs_cent: 490, extras: [] }],
    bedragen: { restaurant_cent: 490, bezorgkosten_cent: 0, fooi_cent: 0, korting: null }, betaling: { wijze: 'vooraf_betaald' } });
}

export function proefDatum(nu: number) {
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date(nu));
  return ['year', 'month', 'day'].map((k) => p.find((x) => x.type === k)?.value).join('-') === '2026-11-22';
}

/** Fail closed, ook als een uitlezing ontbreekt. Geen tokenbeheer of Lightspeed-verzoeken. */
export async function proefControle(admin: any, nu: number) {
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
  const b = proefInvoer(nu), controle = controleer(b, k.data ?? []);
  if (!controle.ok) return { fout: controle.reden };
  const r = controle.regels[0];
  if (controle.regels.length !== 1 || r.lightspeed_product_id !== '4636894' || r.stukprijs_cent !== 490 || r.naam !== 'Naturfrisk Ginger beer' || r.extras.length) return { fout: 'De actieve Ginger Beer-koppeling moet exact 4636894 en 490 cent zijn.' };
  return { cfg, b, regels: controle.regels };
}

export function exacteProef(rij: any, nu: number, cfg: any, regels: unknown) {
  const p = BestellingSchema.safeParse(rij.invoer);
  if (!p.success || rij.id !== PROEF_ORDER_ID || rij.referentie !== PROEF_REFERENTIE || rij.extern_id !== PROEF_REFERENTIE ||
    rij.merchant_id !== '36864' || rij.vestiging !== 'Midsland' || rij.modus !== 'live' || !rij.vrijgegeven_door ||
    rij.restaurant_cent !== 490 || rij.bezorgkosten_cent !== 0 || rij.fooi_cent !== 0 || rij.korting !== null) return false;
  const tijd = Date.parse(rij.ophaaltijd);
  if (!Number.isFinite(tijd) || tijd > nu || nu - tijd > cfg.venster_minuten * 60_000) return false;
  return JSON.stringify(p.data) === JSON.stringify(proefInvoer(tijd)) && JSON.stringify(rij.regels) === JSON.stringify(regels);
}