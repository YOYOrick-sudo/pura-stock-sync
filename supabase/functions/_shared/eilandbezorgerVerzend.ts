import { geldigToken } from './lightspeedToken.ts';
import { BestellingSchema, gelijkJson, orderbericht, kassaBlokkade, orderPad, uitkomstVan } from './eilandbezorgerLogica.ts';
import { vasteKlantId } from './eilandbezorgerKlant.ts';
import { eersteProef, exacteProef, isProef, proefControle, proefPogingen, PROEF_HERVATTING, PROEF_POGING_ID, PROEF_VRIJGAVE } from './eilandbezorgerProef.ts';

export const API = 'https://lightspeedapis.com/resto';

/** Atomaire statusovergang: slaagt alleen als status én versie nog kloppen. */
export async function overgang(admin: any, id: string, versie: number, van: string[], naar: string, extra: Record<string, unknown> = {}, reden?: string, door?: string) {
  const { data } = await admin.from('externe_bestellingen')
    .update({ status: naar, versie: versie + 1, updated_at: new Date().toISOString(), ...(reden !== undefined ? { reden } : {}), ...extra })
    .eq('id', id).eq('versie', versie).in('status', van).select('*').maybeSingle();
  if (data) await admin.from('externe_bestelling_log').insert({ bestelling_id: id, van_status: van.join('|'), naar_status: naar, reden: reden ?? null, door: door ?? null });
  return data as any | null;
}

export async function meld(admin: any, vestiging: string, titel: string, tekst: string) {
  const { data } = await admin.from('user_roles').select('user_id, role, location').eq('is_active', true).in('role', ['owner', 'admin', 'manager']);
  const ids = [...new Set((data ?? []).filter((r: any) => r.role !== 'manager' || r.location === vestiging).map((r: any) => r.user_id))];
  if (ids.length) await admin.from('notifications').insert(ids.map((u) => ({ user_id: u, location: vestiging, title: titel, message: tekst, link: '/cijfers/eilandbezorger' })));
}

type Haal = typeof fetch;
/** Eén verzendpoging. Verwacht een rij met status 'verzenden' (door de aanroeper geclaimd). */
export async function verzend(admin: any, rij: any, haal: Haal = fetch, vrijgave?: symbol) {
  // Verdediging op alle aanroeppaden, vóór tokenbeheer of een kassaverzoek.
  if (rij.modus !== 'live' || rij.vestiging !== 'Midsland' || rij.status !== 'verzenden') return rij;
  const proef = isProef(rij);
  const hervatting = vrijgave === PROEF_HERVATTING;
  if (proef && vrijgave !== PROEF_VRIJGAVE && !hervatting) return rij;
  const [{ data: cfg }, { data: vlag }] = await Promise.all([
    admin.from('externe_kassa_config').select('*').eq('vestiging', rij.vestiging).maybeSingle(),
    admin.from('fase2_vlag').select('aan').eq('vestiging', rij.vestiging).eq('vlag', 'eilandbezorger_live').maybeSingle(),
  ]);
  const controleProef = async (eigenPoging = false, uitgaand?: unknown) => {
    const c = await proefControle(admin, Date.now());
    if ('fout' in c) return c.fout;
    if (String(c.cfg.lightspeed_klant_id) !== String(cfg?.lightspeed_klant_id) || !exacteProef(rij, Date.now(), c.cfg, c.regels)) return 'Proefinhoud of vaste klantconfiguratie is gewijzigd.';
    if (hervatting && (!eersteProef(rij, c.cfg, c.regels, Date.now()) || rij.versie !== 4)) return 'Hervatting wijkt af van de bevestigde eerste proef.';
    const { data: rollen, error } = await admin.from('user_roles').select('role').eq('user_id', rij.vrijgegeven_door).eq('is_active', true).in('role', ['owner', 'admin']);
    if (error || !rollen?.length) return 'Alleen een actieve eigenaar mag de vaste proef verzenden.';
    const actueel = await admin.from('externe_bestellingen').select('*').eq('id', rij.id).maybeSingle();
    if (actueel.error || actueel.data?.status !== 'verzenden' || actueel.data?.versie !== rij.versie) return 'Proef is intussen gewijzigd; geen verzending.';
    if (hervatting && (!eersteProef(actueel.data, c.cfg, c.regels, Date.now()) || actueel.data.lightspeed_order_id !== null ||
      (uitgaand === undefined ? actueel.data.orderbericht !== null || actueel.data.lightspeed_klant_id !== null :
        !gelijkJson(actueel.data.orderbericht, uitgaand) || actueel.data.lightspeed_klant_id !== '13597022'))) return 'Verzendspoor of gewijzigde eerste proef; geen verzending.';
    if (!await proefPogingen(admin, eigenPoging)) return 'Eerdere of afwijkende proefpoging; geen verzending.';
    return null;
  };
  const redenBlokkade = proef ? await controleProef() : !vlag?.aan ? 'Live verzending staat uit voor deze vestiging.' : kassaBlokkade(cfg);
  if (redenBlokkade) return await overgang(admin, rij.id, rij.versie, ['verzenden'], 'geblokkeerd', {}, redenBlokkade) ?? rij;
  const klantId = vasteKlantId(cfg?.lightspeed_klant_id);
  if (!klantId) return rij;
  const invoer = BestellingSchema.safeParse(rij.invoer);
  if (!invoer.success || !Array.isArray(rij.regels)) return await overgang(admin, rij.id, rij.versie, ['verzenden'], 'geblokkeerd', {}, 'Opgeslagen ordergegevens ongeldig; controleer bestelling.') ?? rij;
  // Ook historische orders krijgen een schoon kassabericht; geen contactgegevens kopiëren.
  const bericht = orderbericht({ referentie: rij.referentie, bestelnummer: rij.extern_id, klant: invoer.data.klant,
    opmerking: invoer.data.opmerking, ophaaltijd: rij.ophaaltijd, regels: rij.regels, restaurant_cent: rij.restaurant_cent,
    betaalwijzeId: cfg.lightspeed_betaalwijze_id, betaalwijzeTypeId: cfg.lightspeed_betaalwijze_type_id,
    klantId, route: cfg.order_route, companyId: cfg.lightspeed_company_id });
  const pad = orderPad(cfg.order_route, klantId);
  if (!pad) return rij;
  const { data: poging, error } = await admin.from('externe_bestelling_poging').insert({ ...(proef ? { id: PROEF_POGING_ID } : {}), bestelling_id: rij.id, versie: rij.versie, soort: 'verzenden' }).select('id').maybeSingle();
  if (error || !poging) return rij; // er loopt al een poging
  let http: number | null = null, body = '';
  const tok = await geldigToken(admin, rij.vestiging);
  if ('error' in tok) {
    await admin.from('externe_bestelling_poging').update({ uitkomst: 'niet_verstuurd', antwoord: tok.error, klaar_op: new Date().toISOString() }).eq('id', poging.id);
    const r = await overgang(admin, rij.id, rij.versie, ['verzenden'], 'geweigerd', {}, `Niet verstuurd: ${tok.error}`);
    if (r) await meld(admin, rij.vestiging, 'Eilandbezorger niet verstuurd', `${rij.extern_id}: kassatoegang mislukt`);
    return r ?? rij;
  }
  const opgeslagen = await admin.from('externe_bestellingen').update({ lightspeed_klant_id: klantId, orderbericht: bericht }).eq('id', rij.id).eq('versie', rij.versie);
  if (proef) {
    const blokkade = opgeslagen.error ? 'Kassabericht kon niet worden opgeslagen.' : await controleProef(true, bericht);
    if (blokkade) {
      await admin.from('externe_bestelling_poging').update({ uitkomst: 'niet_verstuurd', antwoord: blokkade, klaar_op: new Date().toISOString() }).eq('id', poging.id);
      return await overgang(admin, rij.id, rij.versie, ['verzenden'], 'geblokkeerd', {}, blokkade) ?? rij;
    }
  }
  try {
    const res = await haal(API + pad, { method: 'POST', headers: { Authorization: `Bearer ${tok.token}`, 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(bericht), signal: AbortSignal.timeout(20_000) });
    http = res.status; body = (await res.text()).slice(0, 2000);
  } catch { http = null; }
  const u = uitkomstVan(http, body);
  await admin.from('externe_bestelling_poging').update({ uitkomst: u.status, http_status: http, antwoord: body, klaar_op: new Date().toISOString() }).eq('id', poging.id);
  const extra = { lightspeed_klant_id: klantId, ...(u.orderId ? { lightspeed_order_id: u.orderId } : {}) };
  const reden = u.status === 'geweigerd' ? `Lightspeed weigerde (${http})` : u.status === 'uitkomst_onbekend' ? 'Antwoord onzeker; eerst teruglezen' : undefined;
  let r = await overgang(admin, rij.id, rij.versie, ['verzenden'], u.status, extra, reden);
  // Laat antwoord nadat de rij al op 'uitkomst_onbekend' stond: alleen een bewezen succes wordt nog vastgelegd.
  if (!r && u.status === 'verzonden') {
    const { data: nu } = await admin.from('externe_bestellingen').select('*').eq('id', rij.id).maybeSingle();
    if (nu?.status === 'uitkomst_onbekend') r = await overgang(admin, rij.id, nu.versie, ['uitkomst_onbekend'], 'verzonden', extra, 'Laat antwoord: order bevestigd');
  }
  if (r && u.status !== 'verzonden') await meld(admin, rij.vestiging, 'Eilandbezorger vraagt aandacht', `${rij.extern_id}: ${reden}`);
  return r ?? rij;
}

/** Teruglezen via GET /rest/onlineordering/order/{orderId}. Bewijst niet dat de bon geprint/betaald is. */
export async function teruglezen(admin: any, rij: any, haal: Haal = fetch): Promise<'gevonden' | 'niet_gevonden' | 'geen_id' | 'fout'> {
  const { data: poging } = await admin.from('externe_bestelling_poging').insert({ bestelling_id: rij.id, versie: rij.versie, soort: 'teruglezen' }).select('id').maybeSingle();
  const klaar = async (uitkomst: string, http: number | null = null) => { if (poging) await admin.from('externe_bestelling_poging').update({ uitkomst, http_status: http, klaar_op: new Date().toISOString() }).eq('id', poging.id); };
  if (!rij.lightspeed_order_id) { await klaar('geen_id'); return 'geen_id'; }
  const tok = await geldigToken(admin, rij.vestiging);
  if ('error' in tok) { await klaar('fout'); return 'fout'; }
  try {
    const res = await haal(`${API}/rest/onlineordering/order/${encodeURIComponent(rij.lightspeed_order_id)}`, { headers: { Authorization: `Bearer ${tok.token}`, Accept: 'application/json' }, signal: AbortSignal.timeout(15_000) });
    await res.body?.cancel();
    const u = res.ok ? 'gevonden' : res.status === 404 ? 'niet_gevonden' : 'fout';
    await klaar(u, res.status);
    if (u === 'gevonden') await overgang(admin, rij.id, rij.versie, ['uitkomst_onbekend'], 'verzonden', {}, 'Teruggelezen: order bestaat in Lightspeed');
    return u;
  } catch { await klaar('fout'); return 'fout'; }
}
