// Gedeeld Lightspeed-tokenbeheer voor nieuwe functies. Dezelfde lease-bron ('lightspeed')
// en dezelfde tabel als lightspeed-sync, zodat vernieuwing nooit dubbel loopt.
// lightspeed-sync zelf blijft zijn eigen (gelijke) kopie gebruiken en is niet gewijzigd.
export const TOKEN_URL = 'https://lightspeedapis.com/resto/oauth2/v1/token';
export const LEASE_BRON = 'lightspeed';

type Conn = { vestiging: string; access_token: string | null; refresh_token: string | null; token_expires_at: string | null; status: string };
type Vernieuw = (refresh: string) => Promise<{ access_token: string; refresh_token: string; expires_in: number } | { error: string; detail: string }>;
export type TokenOpties = { pollMs?: number; pollTimeoutMs?: number; vernieuw?: Vernieuw; nu?: () => number; slaap?: (ms: number) => Promise<void> };

async function lees(admin: any, vestiging: string): Promise<Conn | null> {
  const { data } = await admin.from('lightspeed_connections')
    .select('vestiging, access_token, refresh_token, token_expires_at, status').eq('vestiging', vestiging).maybeSingle();
  return (data as Conn | null) ?? null;
}

function geldig(c: Conn, nu: number) {
  return !!c.access_token && !!c.token_expires_at && new Date(c.token_expires_at).getTime() - nu > 5 * 60 * 1000;
}

export const vernieuwBijLightspeed: Vernieuw = async (refresh) => {
  const form = new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refresh, client_id: Deno.env.get('LIGHTSPEED_CLIENT_ID') ?? '' });
  const secret = Deno.env.get('LIGHTSPEED_CLIENT_SECRET'); if (secret) form.set('client_secret', secret);
  const r = await fetch(TOKEN_URL, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' }, body: form.toString() });
  const t = await r.text();
  if (!r.ok) return { error: 'refresh_failed', detail: String(r.status) };
  try { const j = JSON.parse(t); if (!j.access_token || !j.refresh_token) return { error: 'refresh_missing_fields', detail: '' };
    return { access_token: j.access_token, refresh_token: j.refresh_token, expires_in: Number(j.expires_in ?? 3600) }; }
  catch { return { error: 'refresh_not_json', detail: '' }; }
};

export async function geldigToken(admin: any, vestiging: string, o: TokenOpties = {}): Promise<{ token: string } | { error: string }> {
  const nu = o.nu ?? Date.now, slaap = o.slaap ?? ((ms) => new Promise((r) => setTimeout(r, ms)));
  const vernieuw = o.vernieuw ?? vernieuwBijLightspeed;
  const c = await lees(admin, vestiging);
  if (!c) return { error: 'geen_koppeling' };
  if (c.status !== 'gekoppeld' && c.status !== 'token_verlopen') return { error: 'niet_gekoppeld' };
  if (geldig(c, nu()) && c.access_token) return { token: c.access_token };
  const claim = async () => { const { data } = await admin.rpc('sync_lease_acquire', { _bron: LEASE_BRON, _holder: 'eilandbezorger', _seconds: 30 }); return (data as string | null) ?? null; };
  let lease = await claim();
  if (!lease) {
    const eind = nu() + (o.pollTimeoutMs ?? 30_000);
    while (nu() < eind) {
      await slaap(o.pollMs ?? 500);
      const f = await lees(admin, vestiging);
      if (f && geldig(f, nu()) && f.access_token) return { token: f.access_token };
      if (f?.status === 'token_verlopen') return { error: 'token_verlopen' };
    }
    lease = await claim(); if (!lease) return { error: 'lease_timeout' };
  }
  try {
    // Na de lease opnieuw lezen: een ander proces kan net vernieuwd hebben.
    const actueel = await lees(admin, vestiging);
    if (actueel && geldig(actueel, nu()) && actueel.access_token) return { token: actueel.access_token };
    if (!actueel?.refresh_token) return { error: 'geen_refresh_token' };
    const r = await vernieuw(actueel.refresh_token);
    if ('error' in r) {
      await admin.from('lightspeed_connections').update({ status: 'token_verlopen', laatste_fout: 'Refresh geweigerd (eilandbezorger)' }).eq('vestiging', vestiging);
      return { error: r.error };
    }
    const { error } = await admin.from('lightspeed_connections').update({
      access_token: r.access_token, refresh_token: r.refresh_token,
      token_expires_at: new Date(nu() + r.expires_in * 1000).toISOString(), status: 'gekoppeld', laatste_fout: null,
    }).eq('vestiging', vestiging);
    if (error) return { error: 'token_opslaan_mislukt' };
    return { token: r.access_token };
  } finally {
    await admin.rpc('sync_lease_release', { _bron: LEASE_BRON, _token: lease });
  }
}
