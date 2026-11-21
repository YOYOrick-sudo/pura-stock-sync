import { geldigToken } from './lightspeedToken.ts';
import { orderPad, uitkomstVan } from './eilandbezorgerLogica.ts';
import { gastVan, kiesKlant, klantIdUit, toetsKoppeling, type Gast, type KlantKoppeling, type Treffer } from './eilandbezorgerKlant.ts';

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
export type Opties = { pollMs?: number; pollKeer?: number; maxPaginas?: number };

/** Zoek Lightspeed-klanten op exact e-mailadres. null = zoeken mislukt of te veel pagina's (dan niet aanmaken). */
async function zoekKlanten(token: string, email: string, haal: Haal, maxPaginas: number): Promise<Treffer[] | null> {
  const uit: Treffer[] = [];
  for (let p = 0; p < maxPaginas; p++) {
    let res: Response;
    try { res = await haal(`${API}/rest/core/customer?amount=100&offset=${p * 100}&email=${encodeURIComponent(email)}`, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' }, signal: AbortSignal.timeout(15_000) }); }
    catch { return null; }
    if (!res.ok) { await res.body?.cancel(); return null; }
    const j: any = await res.json().catch(() => null);
    const l: any[] = Array.isArray(j) ? j : j?.results ?? [];
    uit.push(...l.filter((k) => String(k?.email ?? '').trim().toLowerCase() === email).map((k) => ({ id: String(k.id), voornaam: k.firstName ?? '', achternaam: k.lastName ?? '', email: k.email })));
    if (l.length < 100) return uit;
  }
  return null;
}

/** Zorgt voor precies één Lightspeed-klant per gast. Nooit een tweede aanmaak bij een onzekere uitkomst. */
export async function zorgKlant(admin: any, vestiging: string, gast: Gast, token: string, haal: Haal, o: Opties = {}): Promise<{ id: string } | { beoordelen: string }> {
  const lees = async () => {
    const { data: e } = await admin.from('externe_klant_koppeling').select('*').eq('vestiging', vestiging).eq('email', gast.email).maybeSingle();
    const c = gast.klantcode ? (await admin.from('externe_klant_koppeling').select('*').eq('vestiging', vestiging).eq('klantcode', gast.klantcode).maybeSingle()).data : null;
    return { e: e as KlantKoppeling | null, c: c as KlantKoppeling | null };
  };
  const zet = (id: string, patch: Record<string, unknown>) => admin.from('externe_klant_koppeling').update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id).select('*').maybeSingle();

  let { e, c } = await lees();
  let t = toetsKoppeling(gast, c, e);
  if (!t.ok) return { beoordelen: t.reden };
  let k = t.koppeling;
  if (k?.status === 'gekoppeld' && k.lightspeed_klant_id) return { id: k.lightspeed_klant_id };

  // Claim deze gast: alleen wie de rij op 'bezig' zet, mag zoeken en aanmaken.
  let mijn = false;
  if (!k) {
    const { data, error } = await admin.from('externe_klant_koppeling').insert({ vestiging, email: gast.email, klantcode: gast.klantcode, voornaam: gast.voornaam, achternaam: gast.achternaam, status: 'bezig' }).select('*').maybeSingle();
    if (data) { k = data; mijn = true; } else if (error?.code !== '23505') return { beoordelen: 'Klantkoppeling opslaan mislukt' };
  } else if (k.status === 'nieuw' || k.status === 'onzeker') {
    const { data } = await admin.from('externe_klant_koppeling').update({ status: 'bezig', vorige_status: k.status, updated_at: new Date().toISOString() }).eq('id', k.id).eq('status', k.status).select('*').maybeSingle();
    if (data) { mijn = true; k = { ...data, status: k.status }; }
  }
  if (!mijn) {
    // Een andere aanlevering is bezig met deze gast: wacht op haar uitkomst.
    for (let i = 0; i < (o.pollKeer ?? 10); i++) {
      await new Promise((r) => setTimeout(r, o.pollMs ?? 1000));
      ({ e, c } = await lees()); t = toetsKoppeling(gast, c, e);
      if (!t.ok) return { beoordelen: t.reden };
      if (t.koppeling?.status === 'gekoppeld' && t.koppeling.lightspeed_klant_id) return { id: t.koppeling.lightspeed_klant_id };
      const kk: any = t.koppeling;
      const loopt = kk && (kk.status === 'bezig' || (kk.status === 'onzeker' && kk.aanmaak_op && Date.now() - Date.parse(kk.aanmaak_op) < 60_000));
      if (kk && !loopt) return { beoordelen: 'Gast kon niet betrouwbaar worden gekoppeld' };
    }
    return { beoordelen: 'Gast wordt nog gekoppeld door een andere bestelling' };
  }
  const id = k!.id, wasOnzeker = k!.status === 'onzeker';

  const treffers = await zoekKlanten(token, gast.email, haal, o.maxPaginas ?? 50);
  if (!treffers) { await zet(id, { status: wasOnzeker ? 'onzeker' : 'nieuw' }); return { beoordelen: 'Klant zoeken in Lightspeed mislukt' }; }
  const keuze = kiesKlant(gast, treffers);
  if (keuze.actie === 'gebruik') { await zet(id, { status: 'gekoppeld', lightspeed_klant_id: keuze.id }); return { id: keuze.id }; }
  if (keuze.actie === 'beoordelen') { await zet(id, { status: wasOnzeker ? 'onzeker' : 'nieuw' }); return { beoordelen: keuze.reden }; }
  if (wasOnzeker) { await zet(id, { status: 'onzeker' }); return { beoordelen: 'Eerdere klantaanmaak onzeker en klant niet teruggevonden' }; }

  // Aanmaken: eerst de onzekerheid vastleggen, dan pas versturen.
  await zet(id, { status: 'onzeker', aanmaak_op: new Date().toISOString() });
  let http: number | null = null, body = '';
  try {
    const res = await haal(`${API}/rest/core/customer`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ firstName: gast.voornaam, lastName: gast.achternaam, email: gast.email }), signal: AbortSignal.timeout(15_000) });
    http = res.status; body = (await res.text()).slice(0, 500);
  } catch { http = null; }
  const nieuwId = http !== null && http >= 200 && http < 300 ? klantIdUit(body) : null;
  if (nieuwId) { await zet(id, { status: 'gekoppeld', lightspeed_klant_id: nieuwId }); return { id: nieuwId }; }
  if (http !== null && http >= 400 && http < 500 && http !== 408 && http !== 429) { await zet(id, { status: 'nieuw' }); return { beoordelen: `Lightspeed weigerde klant aanmaken (${http})` }; }
  // Onzeker: zoek terug. Alleen bij precies één passende klant gaan we door.
  const terug = await zoekKlanten(token, gast.email, haal, o.maxPaginas ?? 50);
  const k2 = terug ? kiesKlant(gast, terug) : null;
  if (k2?.actie === 'gebruik') { await zet(id, { status: 'gekoppeld', lightspeed_klant_id: k2.id }); return { id: k2.id }; }
  return { beoordelen: 'Klantaanmaak onzeker; niet teruggevonden in Lightspeed' };
}

/** Eén verzendpoging. Verwacht een rij met status 'verzenden' (door de aanroeper geclaimd). */
export async function verzend(admin: any, rij: any, haal: Haal = fetch, opties: Opties = {}) {
  const { data: poging, error } = await admin.from('externe_bestelling_poging').insert({ bestelling_id: rij.id, versie: rij.versie, soort: 'verzenden' }).select('id').maybeSingle();
  if (error || !poging) return rij; // er loopt al een poging
  const { data: cfg } = await admin.from('externe_kassa_config').select('*').eq('vestiging', rij.vestiging).maybeSingle();
  let http: number | null = null, body = '';
  const tok = await geldigToken(admin, rij.vestiging);
  if ('error' in tok) {
    await admin.from('externe_bestelling_poging').update({ uitkomst: 'niet_verstuurd', antwoord: tok.error, klaar_op: new Date().toISOString() }).eq('id', poging.id);
    const r = await overgang(admin, rij.id, rij.versie, ['verzenden'], 'geweigerd', {}, `Niet verstuurd: ${tok.error}`);
    if (r) await meld(admin, rij.vestiging, 'Eilandbezorger niet verstuurd', `${rij.extern_id}: kassatoegang mislukt`);
    return r ?? rij;
  }
  const beoordeel = async (reden: string) => {
    await admin.from('externe_bestelling_poging').update({ uitkomst: 'niet_verstuurd', antwoord: reden, klaar_op: new Date().toISOString() }).eq('id', poging.id);
    const r = await overgang(admin, rij.id, rij.versie, ['verzenden'], 'ter_beoordeling', {}, reden);
    if (r) await meld(admin, rij.vestiging, 'Eilandbezorger ter beoordeling', `${rij.extern_id}: ${reden}`);
    return r ?? rij;
  };
  const gast = gastVan(rij.invoer);
  if (!gast) return beoordeel('Gastgegevens (voornaam, achternaam, e-mail) ontbreken');
  const klant = await zorgKlant(admin, rij.vestiging, gast, tok.token, haal, opties);
  if ('beoordelen' in klant) return beoordeel(klant.beoordelen);
  const pad = orderPad(cfg?.order_route, klant.id);
  const bericht = { ...rij.orderbericht, customerId: Number(klant.id) };
  await admin.from('externe_bestellingen').update({ lightspeed_klant_id: klant.id, orderbericht: bericht }).eq('id', rij.id).eq('versie', rij.versie);
  try {
    const res = await haal(API + pad, { method: 'POST', headers: { Authorization: `Bearer ${tok.token}`, 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(bericht), signal: AbortSignal.timeout(20_000) });
    http = res.status; body = (await res.text()).slice(0, 2000);
  } catch { http = null; }
  const u = uitkomstVan(http, body);
  await admin.from('externe_bestelling_poging').update({ uitkomst: u.status, http_status: http, antwoord: body, klaar_op: new Date().toISOString() }).eq('id', poging.id);
  const extra = { lightspeed_klant_id: klant.id, ...(u.orderId ? { lightspeed_order_id: u.orderId } : {}) };
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
