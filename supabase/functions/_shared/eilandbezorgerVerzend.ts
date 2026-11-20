import { geldigToken } from './lightspeedToken.ts';
import { uitkomstVan } from './eilandbezorgerLogica.ts';

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
export async function verzend(admin: any, rij: any, haal: Haal = fetch) {
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
  const pad = cfg?.order_route === 'establishment_order' ? `/rest/onlineordering/establishmentorder` : `/rest/onlineordering/customer/${cfg?.lightspeed_klant_id}/order`;
  try {
    const res = await haal(API + pad, { method: 'POST', headers: { Authorization: `Bearer ${tok.token}`, 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(rij.orderbericht), signal: AbortSignal.timeout(20_000) });
    http = res.status; body = (await res.text()).slice(0, 2000);
  } catch { http = null; }
  const u = uitkomstVan(http, body);
  await admin.from('externe_bestelling_poging').update({ uitkomst: u.status, http_status: http, antwoord: body, klaar_op: new Date().toISOString() }).eq('id', poging.id);
  const extra = u.orderId ? { lightspeed_order_id: u.orderId } : {};
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
