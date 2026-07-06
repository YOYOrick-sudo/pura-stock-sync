// Eitje-sync — verkennen | dagelijks | handmatig | backfill
// Auth: OF x-sync-token header (cron) OF owner-JWT (UI) OF service-role JWT.
// Lease-pattern via sync_leases (bron='eitje') — één actieve run tegelijk per bron.
//
// Auth-laag naar Eitje: 4 headers
//   Api-Username, Api-Password (verplicht — per klant/organisatie)
//   Partner-Username, Partner-Password (OPTIONEEL — vraag loopt bij Eitje of
//     wij als eigen-integrator deze überhaupt krijgen. Als de secrets leeg zijn
//     sturen we alleen de Api-headers. Basic auth heeft geen token-rotatie,
//     dus geen refresh-lease binnen Eitje zelf.)
//
// VERKENNEN: doet GETs op /environments /teams /users /time_registration_shifts
// /planning_shifts /salaries /revenue_days (1 dag) en slaat de RAW response-shapes
// op in sync_runs.details. Doet géén upserts. STOP+ASK vereist voordat we
// veldnamen naar `uren_dagen` mappen.

import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-sync-token',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON = Deno.env.get('SUPABASE_ANON_KEY')!;
const SYNC_TOKEN = Deno.env.get('EITJE_SYNC_TOKEN')!;

const API_USERNAME = Deno.env.get('EITJE_API_USERNAME') ?? '';
const API_PASSWORD = Deno.env.get('EITJE_API_PASSWORD') ?? '';
const PARTNER_USERNAME = Deno.env.get('EITJE_PARTNER_USERNAME') ?? '';
const PARTNER_PASSWORD = Deno.env.get('EITJE_PARTNER_PASSWORD') ?? '';

const EITJE_BASE = Deno.env.get('EITJE_BASE_URL') ?? 'https://open-api.eitje.app/open_api';

const LEASE_SECONDS = 300; // 5 min per run — verkennen/backfill kan langer duren
const MAX_WINDOW_DAYS = 7; // Eitje resource_date default

// ------------------------------------------------------------------
// Utils
// ------------------------------------------------------------------
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }

function addDays(iso: string, n: number): string {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
function diffDays(a: string, b: string): number {
  return Math.round((new Date(b + 'T00:00:00Z').getTime() - new Date(a + 'T00:00:00Z').getTime()) / 86400000);
}
function chunkWindows(van: string, tot: string, size = MAX_WINDOW_DAYS): Array<{ van: string; tot: string }> {
  const out: Array<{ van: string; tot: string }> = [];
  let cur = van;
  while (cur <= tot) {
    const end = addDays(cur, size - 1);
    out.push({ van: cur, tot: end > tot ? tot : end });
    cur = addDays(end, 1);
  }
  return out;
}

// ------------------------------------------------------------------
// Auth gate
// ------------------------------------------------------------------
async function requireAuth(req: Request): Promise<Response | null> {
  const syncHeader = req.headers.get('x-sync-token');
  if (syncHeader && syncHeader === SYNC_TOKEN) return null;

  const auth = req.headers.get('Authorization') ?? '';
  const jwt = auth.replace('Bearer ', '');
  if (!jwt) return json({ error: 'unauthorized' }, 401);

  try {
    const [, payloadB64] = jwt.split('.');
    if (payloadB64) {
      const pad = payloadB64 + '='.repeat((4 - (payloadB64.length % 4)) % 4);
      const payload = JSON.parse(atob(pad.replace(/-/g, '+').replace(/_/g, '/')));
      if (payload?.role === 'service_role') return null;
    }
  } catch { /* val door */ }

  const userClient = createClient(SUPABASE_URL, ANON, {
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
  const { data: userRes } = await userClient.auth.getUser();
  if (!userRes?.user) return json({ error: 'unauthorized' }, 401);
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const { data: roles } = await admin
    .from('user_roles').select('role')
    .eq('user_id', userRes.user.id).eq('is_active', true);
  const isOwner = (roles ?? []).some((r: any) => ['owner', 'admin'].includes(r.role as string));
  if (!isOwner) return json({ error: 'forbidden' }, 403);
  return null;
}

// ------------------------------------------------------------------
// Lease per bron ('eitje')
// ------------------------------------------------------------------
async function acquireLease(admin: any, holder: string): Promise<{ token: string } | { error: string }> {
  const { data, error } = await admin.rpc('sync_lease_acquire', {
    _bron: 'eitje', _holder: holder, _seconds: LEASE_SECONDS,
  });
  if (error) return { error: `lease_query_failed: ${error.message}` };
  if (!data) return { error: 'lease_bezet: andere Eitje-sync draait nog' };
  return { token: data as string };
}
async function releaseLease(admin: any, token: string) {
  await admin.rpc('sync_lease_release', { _bron: 'eitje', _token: token });
}

// ------------------------------------------------------------------
// Eitje HTTP-client
// ------------------------------------------------------------------
function eitjeHeaders(): Record<string, string> {
  if (!API_USERNAME || !API_PASSWORD) {
    throw new Error('missing_api_credentials: EITJE_API_USERNAME/PASSWORD niet gezet');
  }
  const h: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Api-Username': API_USERNAME,
    'Api-Password': API_PASSWORD,
  };
  if (PARTNER_USERNAME && PARTNER_PASSWORD) {
    h['Partner-Username'] = PARTNER_USERNAME;
    h['Partner-Password'] = PARTNER_PASSWORD;
  }
  return h;
}

async function eitjeGet(path: string, params?: Record<string, string>): Promise<{ status: number; body: unknown; raw?: string }> {
  const url = new URL(`${EITJE_BASE}${path}`);
  if (params) for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const resp = await fetch(url.toString(), { method: 'GET', headers: eitjeHeaders() });
  const text = await resp.text();
  let body: unknown = null;
  try { body = JSON.parse(text); } catch { body = null; }
  return { status: resp.status, body, raw: text.slice(0, 800) };
}

// ------------------------------------------------------------------
// VERKENNEN
// ------------------------------------------------------------------
async function doVerkennen(admin: any): Promise<{ ok: boolean; details: any; error?: string }> {
  const today = new Date().toISOString().slice(0, 10);
  const van = addDays(today, -1);
  const tot = today;

  const endpoints: Array<{ name: string; path: string; params?: Record<string, string> }> = [
    { name: 'environments', path: '/environments' },
    { name: 'teams', path: '/teams' },
    { name: 'users', path: '/users' },
    { name: 'shift_types', path: '/shift_types' },
    { name: 'time_registration_shifts', path: '/time_registration_shifts', params: { 'filters[start_date]': van, 'filters[end_date]': tot, 'filters[date_filter_type]': 'resource_date' } },
    { name: 'planning_shifts', path: '/planning_shifts', params: { 'filters[start_date]': van, 'filters[end_date]': tot, 'filters[date_filter_type]': 'resource_date' } },
    { name: 'salaries', path: '/salaries' },
    { name: 'revenue_days', path: '/revenue_days', params: { 'filters[start_date]': van, 'filters[end_date]': tot, 'filters[date_filter_type]': 'resource_date' } },
  ];

  const details: Record<string, unknown> = { probed_at: new Date().toISOString(), window: { van, tot } };
  let anyOk = false;
  let firstError: string | null = null;

  for (const ep of endpoints) {
    try {
      const r = await eitjeGet(ep.path, ep.params);
      // Bewaar shape: status + keys op top-level + eerste item als sample.
      const body: any = r.body;
      const isArray = Array.isArray(body);
      const first = isArray ? body[0] : (body?.data?.[0] ?? body?.items?.[0] ?? null);
      details[ep.name] = {
        status: r.status,
        is_array: isArray,
        length: isArray ? body.length : (Array.isArray(body?.data) ? body.data.length : null),
        top_keys: body && typeof body === 'object' && !isArray ? Object.keys(body).slice(0, 20) : null,
        sample_keys: first && typeof first === 'object' ? Object.keys(first).slice(0, 40) : null,
        sample: first ?? (r.raw ?? null),
      };
      if (r.status >= 200 && r.status < 300) anyOk = true;
      else if (!firstError) firstError = `${ep.name}: HTTP ${r.status}`;
    } catch (e) {
      details[ep.name] = { error: (e as Error).message };
      if (!firstError) firstError = `${ep.name}: ${(e as Error).message}`;
    }
    await sleep(300);
  }

  return { ok: anyOk, details, error: anyOk ? undefined : (firstError ?? 'no_endpoint_succeeded') };
}

// ------------------------------------------------------------------
// SYNC (dagelijks/handmatig/backfill) — placeholder tot verkennen bevestigd
// ------------------------------------------------------------------
async function doSyncWindow(
  _admin: any,
  _van: string,
  _tot: string,
): Promise<{ ok: false; error: string }> {
  // NIET ACTIEF — wacht op verkennen-STOP+ASK met bevestigde veldnamen
  // voordat we time_registration_shifts/salaries/revenue_days mappen naar
  // uren_dagen (gewerkte_uren, geplande_uren, loonkosten, eitje_omzet_dag)
  // per (vestiging, werkdag).
  return {
    ok: false,
    error:
      'stop_ask_veldmapping: verkennen-run vereist. Draai eerst {"type":"verkennen"} ' +
      'zodra Eitje-credentials en (evt.) partner-vraag beantwoord zijn; details worden ' +
      'in sync_runs.details opgeslagen ter review.',
  };
}

// ------------------------------------------------------------------
// Runner met sync_runs + lease
// ------------------------------------------------------------------
async function withRun(
  admin: any,
  type: 'verkennen' | 'dagelijks' | 'handmatig' | 'backfill',
  periode_van: string | null,
  periode_tot: string | null,
  vestiging: string | null,
  fn: (runId: string) => Promise<{ ok: boolean; bonnen?: number; details?: any; error?: string }>,
) {
  const holder = `eitje-sync:${type}:${crypto.randomUUID().slice(0, 8)}`;
  const lease = await acquireLease(admin, holder);
  if ('error' in lease) return { ok: false, error: lease.error };

  const { data: runRow } = await admin.from('sync_runs').insert({
    bron: 'eitje', vestiging, type, periode_van, periode_tot, status: 'bezig',
  }).select('id').single();
  const runId = runRow?.id as string;

  try {
    const res = await fn(runId);
    await admin.from('sync_runs').update({
      status: res.ok ? 'ok' : 'fout',
      bonnen_verwerkt: res.bonnen ?? 0,
      details: res.details ?? null,
      foutmelding: res.error ? res.error.slice(0, 1000) : null,
      klaar_op: new Date().toISOString(),
    }).eq('id', runId);

    if (res.ok) {
      await admin.from('eitje_connection').update({
        laatste_sync_op: new Date().toISOString(),
        laatste_fout: null,
        status: 'gekoppeld',
      }).not('id', 'is', null);
    } else if (res.error) {
      await admin.from('eitje_connection').update({
        laatste_fout: res.error.slice(0, 500),
      }).not('id', 'is', null);
    }
    return res;
  } catch (e) {
    const msg = (e as Error).message;
    await admin.from('sync_runs').update({
      status: 'fout', foutmelding: msg.slice(0, 1000), klaar_op: new Date().toISOString(),
    }).eq('id', runId);
    await admin.from('eitje_connection').update({ laatste_fout: msg.slice(0, 500) }).not('id', 'is', null);
    return { ok: false, error: msg };
  } finally {
    await releaseLease(admin, lease.token);
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

  if (type === 'verkennen') {
    const res = await withRun(admin, 'verkennen', null, null, null, async () => {
      const r = await doVerkennen(admin);
      return { ok: r.ok, details: r.details, error: r.error };
    });
    return json(res);
  }

  if (type === 'dagelijks') {
    const gisteren = addDays(new Date().toISOString().slice(0, 10), -1);
    const eergisteren = addDays(gisteren, -1);
    const res = await withRun(admin, 'dagelijks', eergisteren, gisteren, null, async () => {
      return await doSyncWindow(admin, eergisteren, gisteren);
    });
    return json(res);
  }

  if (type === 'handmatig') {
    const van = body.van ?? addDays(new Date().toISOString().slice(0, 10), -1);
    const tot = body.tot ?? van;
    if (diffDays(van, tot) < 0) return json({ error: 'van_na_tot' }, 400);
    if (diffDays(van, tot) > 31) return json({ error: 'periode_te_lang_max_31_dagen' }, 400);
    const windows = chunkWindows(van, tot, MAX_WINDOW_DAYS);
    const res = await withRun(admin, 'handmatig', van, tot, body.vestiging ?? null, async () => {
      const results: any[] = [];
      let anyOk = false;
      let lastErr: string | null = null;
      for (const w of windows) {
        const r = await doSyncWindow(admin, w.van, w.tot);
        results.push({ ...w, ok: r.ok, error: r.ok ? undefined : (r as any).error });
        if (r.ok) anyOk = true; else lastErr = (r as any).error;
        await sleep(500);
      }
      return { ok: anyOk, details: { windows: results }, error: anyOk ? undefined : (lastErr ?? 'all_windows_failed') };
    });
    return json(res);
  }

  if (type === 'backfill') {
    const maanden = Math.max(1, Math.min(24, Number(body.maanden ?? 12)));
    const today = new Date().toISOString().slice(0, 10);
    const van = (() => {
      const d = new Date(today + 'T00:00:00Z');
      d.setUTCMonth(d.getUTCMonth() - maanden);
      return d.toISOString().slice(0, 10);
    })();
    const windows = chunkWindows(van, today, MAX_WINDOW_DAYS);
    const res = await withRun(admin, 'backfill', van, today, null, async () => {
      const results: any[] = [];
      let anyOk = false; let lastErr: string | null = null;
      for (const w of windows) {
        const r = await doSyncWindow(admin, w.van, w.tot);
        results.push({ ...w, ok: r.ok, error: r.ok ? undefined : (r as any).error });
        if (r.ok) anyOk = true; else lastErr = (r as any).error;
        await sleep(1000);
      }
      return { ok: anyOk, details: { windows: results, cursor: today }, error: anyOk ? undefined : (lastErr ?? 'all_windows_failed') };
    });
    return json(res);
  }

  return json({ error: 'invalid_type', allowed: ['verkennen', 'dagelijks', 'handmatig', 'backfill'] }, 400);
});
