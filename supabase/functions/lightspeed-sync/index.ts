// Lightspeed omzet-sync — dagelijks (cron) | handmatig | backfill
// Auth: OF x-sync-token header (cron) OF owner-JWT (UI).
// Token-refresh: lease-pattern via lightspeed_connections.refreshing_until (zie
// mem://patterns/edge-function-serialization-lease).
//
// EERSTE LIVE CALL: STOP+ASK — response loggen en veldmapping vaststellen.
// Deze versie ondersteunt "mock_receipts" voor deterministische tests zonder API.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON = Deno.env.get('SUPABASE_ANON_KEY')!;
const CLIENT_ID = Deno.env.get('LIGHTSPEED_CLIENT_ID')!;
const CLIENT_SECRET = Deno.env.get('LIGHTSPEED_CLIENT_SECRET') ?? '';
const SYNC_TOKEN = Deno.env.get('LIGHTSPEED_SYNC_TOKEN')!;

const TOKEN_URL = 'https://lightspeedapis.com/resto/oauth2/v1/token';
// Receipts endpoint: nog te bevestigen bij eerste live call (paginering + veldnamen).
const RECEIPTS_URL = 'https://lightspeedapis.com/resto/financials/v1/receipts';

const LEASE_SECONDS = 30;
const LEASE_POLL_MS = 500;
const LEASE_POLL_TIMEOUT_MS = 30_000;

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Werkdag/uur per Europe/Amsterdam, kanteluur 06:00. */
export function computeWerkdagUur(iso: string): { werkdag: string; uur: number } {
  const fmt = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Amsterdam',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', hour12: false,
  });
  const parts = fmt.formatToParts(new Date(iso));
  const get = (t: string) => parts.find((p) => p.type === t)!.value;
  const year = +get('year');
  const month = +get('month');
  const day = +get('day');
  const uur = +get('hour');
  let wY = year, wM = month, wD = day;
  if (uur < 6) {
    const d = new Date(Date.UTC(year, month - 1, day));
    d.setUTCDate(d.getUTCDate() - 1);
    wY = d.getUTCFullYear();
    wM = d.getUTCMonth() + 1;
    wD = d.getUTCDate();
  }
  return {
    werkdag: `${wY}-${String(wM).padStart(2, '0')}-${String(wD).padStart(2, '0')}`,
    uur,
  };
}

// ------------------------------------------------------------------
// Auth gate: cron token OF owner JWT
// ------------------------------------------------------------------
async function requireAuth(req: Request): Promise<Response | null> {
  const syncHeader = req.headers.get('x-sync-token');
  if (syncHeader && syncHeader === SYNC_TOKEN) return null;

  const auth = req.headers.get('Authorization') ?? '';
  const jwt = auth.replace('Bearer ', '');
  if (!jwt) return json({ error: 'unauthorized' }, 401);
  const userClient = createClient(SUPABASE_URL, ANON, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
  const { data: userRes } = await userClient.auth.getUser();
  if (!userRes?.user) return json({ error: 'unauthorized' }, 401);
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const { data: roles } = await admin
    .from('user_roles').select('role')
    .eq('user_id', userRes.user.id).eq('is_active', true);
  const isOwner = (roles ?? []).some((r) => ['owner', 'admin'].includes(r.role as string));
  if (!isOwner) return json({ error: 'forbidden' }, 403);
  return null;
}

// ------------------------------------------------------------------
// Lease-gebaseerde token-refresh (zie memory)
// ------------------------------------------------------------------
type Conn = {
  vestiging: string;
  merchant_id: string;
  access_token: string | null;
  refresh_token: string | null;
  token_expires_at: string | null;
  status: string;
};

async function readConnection(admin: ReturnType<typeof createClient>, vestiging: string): Promise<Conn | null> {
  const { data } = await admin
    .from('lightspeed_connections')
    .select('vestiging, merchant_id, access_token, refresh_token, token_expires_at, status')
    .eq('vestiging', vestiging)
    .maybeSingle();
  return data as Conn | null;
}

function tokenStillValid(conn: Conn): boolean {
  if (!conn.access_token || !conn.token_expires_at) return false;
  const bufferMs = 5 * 60 * 1000;
  return new Date(conn.token_expires_at).getTime() - Date.now() > bufferMs;
}

async function tryClaimLease(admin: ReturnType<typeof createClient>, vestiging: string): Promise<boolean> {
  const nowIso = new Date().toISOString();
  const leaseUntil = new Date(Date.now() + LEASE_SECONDS * 1000).toISOString();
  const { data } = await admin
    .from('lightspeed_connections')
    .update({ refreshing_until: leaseUntil })
    .eq('vestiging', vestiging)
    .or(`refreshing_until.is.null,refreshing_until.lt.${nowIso}`)
    .select('vestiging');
  return (data?.length ?? 0) > 0;
}

async function releaseLease(admin: ReturnType<typeof createClient>, vestiging: string) {
  await admin.from('lightspeed_connections').update({ refreshing_until: null }).eq('vestiging', vestiging);
}

async function refreshAtLightspeed(refreshToken: string): Promise<{ access_token: string; refresh_token: string; expires_in: number } | { error: string; detail: string }> {
  const form = new URLSearchParams();
  form.set('grant_type', 'refresh_token');
  form.set('refresh_token', refreshToken);
  form.set('client_id', CLIENT_ID);
  if (CLIENT_SECRET) form.set('client_secret', CLIENT_SECRET);

  const resp = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
    body: form.toString(),
  });
  const text = await resp.text();
  if (!resp.ok) return { error: 'refresh_failed', detail: `${resp.status} ${text}` };
  try {
    const j = JSON.parse(text);
    if (!j.access_token || !j.refresh_token) return { error: 'refresh_missing_fields', detail: text };
    return { access_token: j.access_token, refresh_token: j.refresh_token, expires_in: Number(j.expires_in ?? 3600) };
  } catch {
    return { error: 'refresh_not_json', detail: text };
  }
}

/**
 * getValidToken — implementeert het lease-patroon:
 *  1) Als token nog geldig → gebruik.
 *  2) Claim lease → refresh → sla nieuwe tokens op → return.
 *  3) Als niet geclaimd → poll tot token weer geldig OF poll-timeout.
 *  4) Poll-timeout zonder resultaat → probeer ZELF één keer de lease + refresh
 *     (eerste claimer is waarschijnlijk gecrasht, lease is verlopen).
 *  5) Alles gefaald → return {error} en markeer status.
 */
async function getValidToken(admin: ReturnType<typeof createClient>, vestiging: string): Promise<{ token: string } | { error: string; detail: string }> {
  const conn = await readConnection(admin, vestiging);
  if (!conn) return { error: 'no_connection_row', detail: vestiging };
  if (conn.status !== 'gekoppeld' && conn.status !== 'token_verlopen') {
    return { error: 'not_connected', detail: `status=${conn.status}` };
  }
  if (!conn.refresh_token) return { error: 'no_refresh_token', detail: '' };

  if (tokenStillValid(conn)) return { token: conn.access_token! };

  // Probeer lease te claimen
  const claimed = await tryClaimLease(admin, vestiging);

  if (!claimed) {
    // Poll tot token weer geldig
    const deadline = Date.now() + LEASE_POLL_TIMEOUT_MS;
    while (Date.now() < deadline) {
      await sleep(LEASE_POLL_MS);
      const fresh = await readConnection(admin, vestiging);
      if (fresh && tokenStillValid(fresh)) return { token: fresh.access_token! };
      if (fresh && fresh.status === 'token_verlopen') {
        return { error: 'token_verlopen', detail: 'ander proces markeerde token als verlopen' };
      }
    }
    // Poll-timeout: probeer alsnog zelf de lease
    const secondClaim = await tryClaimLease(admin, vestiging);
    if (!secondClaim) return { error: 'lease_timeout', detail: 'kan lease niet claimen na poll-periode' };
    // valt door naar refresh hieronder met de nieuwe conn state
  }

  // We hebben de lease → refresh doen
  const currentConn = await readConnection(admin, vestiging);
  if (!currentConn?.refresh_token) {
    await releaseLease(admin, vestiging);
    return { error: 'no_refresh_token', detail: '' };
  }

  const refreshResult = await refreshAtLightspeed(currentConn.refresh_token);
  if ('error' in refreshResult) {
    // OPSLAG-FALEN randgeval: hier weten we niet zeker of Lightspeed het oude token
    // heeft verbrand of niet. Volgende refresh-poging zal ofwel slagen (als 't gelukt is
    // maar wij ‘t niet zagen — onwaarschijnlijk want fetch retourneert vóór dit pad)
    // OF invalid_grant geven → dit pad hier.
    await admin.from('lightspeed_connections').update({
      status: 'token_verlopen',
      laatste_fout: `Refresh geweigerd: ${refreshResult.detail.slice(0, 500)}`,
      refreshing_until: null,
    }).eq('vestiging', vestiging);
    return refreshResult;
  }

  const newExpiresAt = new Date(Date.now() + refreshResult.expires_in * 1000).toISOString();

  // Nieuwe tokens opslaan VOORDAT we ze gebruiken (brief-eis)
  const { error: upErr } = await admin.from('lightspeed_connections').update({
    access_token: refreshResult.access_token,
    refresh_token: refreshResult.refresh_token,
    token_expires_at: newExpiresAt,
    status: 'gekoppeld',
    laatste_fout: null,
    refreshing_until: null,
  }).eq('vestiging', vestiging);

  if (upErr) {
    // Opslag faalde na succesvolle refresh → oud refresh_token bij Lightspeed
    // is nu verbrand. Volgende poging zal invalid_grant krijgen → token_verlopen.
    // Zet meteen status defensief:
    await admin.from('lightspeed_connections').update({
      status: 'token_verlopen',
      laatste_fout: 'Token opgeslagen faalde na refresh — opnieuw koppelen vereist',
      refreshing_until: null,
    }).eq('vestiging', vestiging);
    return { error: 'token_persist_failed', detail: upErr.message };
  }

  return { token: refreshResult.access_token };
}

// ------------------------------------------------------------------
// Receipts ophalen — echte call OF mock
// STOP+ASK: eerste echte call → response-body loggen en veldmapping vaststellen.
// ------------------------------------------------------------------
type Receipt = { timestamp: string; total_incl: number; total_excl: number };

async function fetchReceipts(
  _accessToken: string,
  _merchantId: string,
  _van: string,
  _tot: string,
): Promise<{ receipts: Receipt[]; raw_sample?: unknown } | { error: string; detail: string }> {
  // NOG NIET ACTIEF — wacht op eerste live call voor veldmapping.
  return {
    error: 'stop_ask_receipts_mapping',
    detail:
      `Eerste echte receipts-call nog niet gedaan. Endpoint ${RECEIPTS_URL} met ` +
      `businessLocationId=${_merchantId}, van=${_van}, tot=${_tot}. ` +
      `Response-body moet gelogd worden en veldnamen bevestigd (timestamp, incl, excl, paginering) ` +
      `voordat we hem mappen naar Receipt{timestamp,total_incl,total_excl}.`,
  };
}

// ------------------------------------------------------------------
// Aggregatie + upsert
// ------------------------------------------------------------------
async function aggregateAndUpsert(
  admin: ReturnType<typeof createClient>,
  vestiging: string,
  receipts: Receipt[],
): Promise<number> {
  const buckets = new Map<string, { werkdag: string; uur: number; incl: number; excl: number; count: number }>();
  for (const r of receipts) {
    const { werkdag, uur } = computeWerkdagUur(r.timestamp);
    const key = `${werkdag}|${uur}`;
    const b = buckets.get(key) ?? { werkdag, uur, incl: 0, excl: 0, count: 0 };
    b.incl += Number(r.total_incl) || 0;
    b.excl += Number(r.total_excl) || 0;
    b.count += 1;
    buckets.set(key, b);
  }
  if (buckets.size === 0) return 0;

  const rows = [...buckets.values()].map((b) => ({
    vestiging,
    werkdag: b.werkdag,
    uur: b.uur,
    omzet_incl: Number(b.incl.toFixed(2)),
    omzet_excl: Number(b.excl.toFixed(2)),
    aantal_bonnen: b.count,
    updated_at: new Date().toISOString(),
  }));
  const { error } = await admin.from('omzet_uren').upsert(rows, { onConflict: 'vestiging,werkdag,uur' });
  if (error) throw new Error(`upsert_failed: ${error.message}`);
  return receipts.length;
}

// ------------------------------------------------------------------
// Sync-run wrapper
// ------------------------------------------------------------------
async function runSync(
  admin: ReturnType<typeof createClient>,
  vestiging: string,
  van: string,
  tot: string,
  type: 'dagelijks' | 'handmatig' | 'backfill',
  mockReceipts?: Receipt[],
): Promise<{ ok: true; bonnen: number } | { ok: false; error: string }> {
  const { data: runRow } = await admin.from('sync_runs').insert({
    bron: 'lightspeed', vestiging, type, periode_van: van, periode_tot: tot, status: 'bezig',
  }).select('id').single();
  const runId = runRow?.id;

  try {
    let receipts: Receipt[];
    if (mockReceipts) {
      receipts = mockReceipts;
    } else {
      const tok = await getValidToken(admin, vestiging);
      if ('error' in tok) throw new Error(`${tok.error}: ${tok.detail}`);
      const conn = await readConnection(admin, vestiging);
      const rx = await fetchReceipts(tok.token, conn!.merchant_id, van, tot);
      if ('error' in rx) throw new Error(`${rx.error}: ${rx.detail}`);
      receipts = rx.receipts;
    }

    const bonnen = await aggregateAndUpsert(admin, vestiging, receipts);

    await admin.from('sync_runs').update({
      status: 'ok', bonnen_verwerkt: bonnen, klaar_op: new Date().toISOString(),
    }).eq('id', runId);

    await admin.from('lightspeed_connections').update({
      laatste_sync_op: new Date().toISOString(),
    }).eq('vestiging', vestiging);

    return { ok: true, bonnen };
  } catch (e) {
    const msg = (e as Error).message;
    await admin.from('sync_runs').update({
      status: 'fout', foutmelding: msg.slice(0, 1000), klaar_op: new Date().toISOString(),
    }).eq('id', runId);
    await admin.from('lightspeed_connections').update({
      laatste_fout: msg.slice(0, 500),
    }).eq('vestiging', vestiging);
    return { ok: false, error: msg };
  }
}

// ------------------------------------------------------------------
// HTTP entry
// ------------------------------------------------------------------
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const gate = await requireAuth(req);
  if (gate) return gate;

  let body: any;
  try { body = await req.json(); } catch { return json({ error: 'invalid_json' }, 400); }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

  const type = body?.type;
  if (!['dagelijks', 'handmatig', 'backfill'].includes(type)) {
    return json({ error: 'invalid_type' }, 400);
  }

  // Mock-modus (owner-only handmatig pad — geen cron)
  if (Array.isArray(body?.mock_receipts)) {
    if (type !== 'handmatig') return json({ error: 'mock_only_for_handmatig' }, 400);
    if (!['Midsland', 'West'].includes(body.vestiging)) return json({ error: 'invalid_vestiging' }, 400);
    const van = body.van ?? new Date().toISOString().slice(0, 10);
    const tot = body.tot ?? van;
    const result = await runSync(admin, body.vestiging, van, tot, 'handmatig', body.mock_receipts);
    return json(result);
  }

  if (type === 'dagelijks') {
    // Alle gekoppelde vestigingen, gisteren + eergisteren als vangnet.
    const { data: conns } = await admin
      .from('lightspeed_connections').select('vestiging').eq('status', 'gekoppeld');
    const gisteren = new Date(Date.now() - 24 * 3600 * 1000).toISOString().slice(0, 10);
    const eergisteren = new Date(Date.now() - 48 * 3600 * 1000).toISOString().slice(0, 10);
    const results: any[] = [];
    for (const c of conns ?? []) {
      results.push({ vestiging: c.vestiging, ...(await runSync(admin, c.vestiging, eergisteren, gisteren, 'dagelijks')) });
    }
    return json({ ok: true, runs: results });
  }

  if (type === 'handmatig') {
    if (!['Midsland', 'West'].includes(body.vestiging)) return json({ error: 'invalid_vestiging' }, 400);
    const van = body.van ?? new Date(Date.now() - 24 * 3600 * 1000).toISOString().slice(0, 10);
    const tot = body.tot ?? van;
    const r = await runSync(admin, body.vestiging, van, tot, 'handmatig');
    return json(r);
  }

  if (type === 'backfill') {
    if (!['Midsland', 'West'].includes(body.vestiging)) return json({ error: 'invalid_vestiging' }, 400);
    const maanden = Math.max(1, Math.min(24, Number(body.maanden ?? 12)));
    const results: any[] = [];
    for (let i = 1; i <= maanden; i++) {
      const end = new Date();
      end.setUTCMonth(end.getUTCMonth() - (i - 1), 0); // laatste dag van maand i-1 terug
      const start = new Date(end);
      start.setUTCDate(1);
      const van = start.toISOString().slice(0, 10);
      const tot = end.toISOString().slice(0, 10);
      results.push({ periode: `${van}..${tot}`, ...(await runSync(admin, body.vestiging, van, tot, 'backfill')) });
      await sleep(2000); // rate-limit-vriendelijk
    }
    return json({ ok: true, runs: results });
  }

  return json({ error: 'unhandled' }, 500);
});
