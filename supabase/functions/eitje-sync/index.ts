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
async function doVerkennen(admin: any, opts?: { user_ids?: Array<number | string> }): Promise<{ ok: boolean; details: any; error?: string }> {
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
      const body: any = r.body;
      const isArray = Array.isArray(body);
      const items = isArray ? body : (body?.items ?? body?.data ?? null);
      const first = Array.isArray(items) ? items[0] : null;
      const info: any = {
        status: r.status,
        length: Array.isArray(items) ? items.length : null,
        top_keys: body && typeof body === 'object' && !isArray ? Object.keys(body).slice(0, 20) : null,
        sample_keys: first && typeof first === 'object' ? Object.keys(first).slice(0, 40) : null,
        sample: first ?? null,
      };
      if (r.status >= 400) info.error_body = r.raw;
      // Volledige environment-lijst (id+naam) dumpen voor mapping
      if (ep.name === 'environments' && Array.isArray(items)) {
        info.all = items.map((e: any) => ({ id: e.id, name: e.name, active: e.active }));
      }
      // User-lookup: dump geselecteerde profielen op naam
      if (ep.name === 'users' && Array.isArray(items) && opts?.user_ids?.length) {
        const want = new Set(opts.user_ids.map((x) => String(x)));
        info.user_lookup = items
          .filter((u: any) => want.has(String(u?.id)))
          .map((u: any) => ({
            id: u?.id,
            name: u?.name ?? u?.full_name ?? ([u?.first_name, u?.last_name].filter(Boolean).join(' ') || null),
            first_name: u?.first_name ?? null,
            last_name: u?.last_name ?? null,
            email: u?.email ?? null,
            active: u?.active ?? null,
            environment_ids: u?.environment_ids ?? u?.environments ?? null,
          }));
        info.user_lookup_missing = [...want].filter((id) => !items.some((u: any) => String(u?.id) === id));
      }
      details[ep.name] = info;
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
// SYNC (dagelijks/handmatig/backfill)
// ------------------------------------------------------------------

const ENV_TO_VESTIGING: Record<number, string> = { 404: 'West', 352: 'Midsland' };

type ShiftAgg = {
  gewerkte_uren: number;
  geplande_uren: number;
  loonkosten: number;
  loonkosten_had_fallback: boolean;
  loonkosten_had_match: boolean;
  fallback_user_ids: Set<string | number>;
  missing_uurloon_user_ids: Set<string | number>;
  eitje_omzet_dag: number | null;
};

function emptyAgg(): ShiftAgg {
  return {
    gewerkte_uren: 0, geplande_uren: 0, loonkosten: 0,
    loonkosten_had_fallback: false, loonkosten_had_match: false,
    fallback_user_ids: new Set(), missing_uurloon_user_ids: new Set(),
    eitje_omzet_dag: null,
  };
}

// Duur-afleiding: eerst kijken naar duration-velden, anders start/end + break_minutes.
// Retourneert uren (float) of 0 als niet af te leiden.
function shiftDurationHours(shift: any, dateHint?: string): { hours: number; source: string } {
  // 1. directe duration-velden
  for (const [key, factor] of [
    ['duration_minutes', 1/60], ['minutes', 1/60], ['total_minutes', 1/60],
    ['duration_hours', 1], ['hours', 1], ['total_hours', 1],
    ['duration', null], // ambigu — sla over
  ] as const) {
    const v = shift?.[key];
    if (typeof v === 'number' && factor !== null) {
      return { hours: Math.max(0, v * factor), source: `field:${key}` };
    }
  }
  // 2. start/end
  const start = shift?.start ?? shift?.start_time ?? shift?.from;
  const end = shift?.end ?? shift?.end_time ?? shift?.to;
  const brk = Number(shift?.break_minutes ?? shift?.break ?? 0) || 0;
  const date = shift?.date ?? dateHint ?? null;
  if (!start || !end) return { hours: 0, source: 'none' };

  const parse = (v: string): Date | null => {
    if (typeof v !== 'string') return null;
    // ISO datetime?
    if (v.includes('T') || v.length > 10) {
      const d = new Date(v);
      return isNaN(d.getTime()) ? null : d;
    }
    // HH:MM(:SS)?
    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(v) && date) {
      const d = new Date(`${date}T${v.length === 5 ? v + ':00' : v}Z`);
      return isNaN(d.getTime()) ? null : d;
    }
    return null;
  };
  const s = parse(start); let e = parse(end);
  if (!s || !e) return { hours: 0, source: 'unparseable' };
  if (e.getTime() <= s.getTime()) {
    // overnacht
    e = new Date(e.getTime() + 24 * 3600 * 1000);
  }
  const minutenBruto = (e.getTime() - s.getTime()) / 60000;
  const netto = Math.max(0, minutenBruto - brk);
  return { hours: netto / 60, source: 'start_end' };
}

// Fetch alle pagina's van een endpoint met bracketed filters. Eitje kan
// paginering via ?page=N ondersteunen — we lezen tot lege items of max 50 pages (10.000 records).
const EITJE_MAX_PAGES = 50;
async function eitjeFetchAll(path: string, baseParams: Record<string, string>): Promise<{ items: any[]; pages: number; truncated: boolean; non_paginated?: boolean; error?: string }> {
  const items: any[] = [];
  let pages = 0;
  let truncated = false;
  let nonPaginated = false;
  let prevFingerprint: string | null = null;
  for (let page = 1; page <= EITJE_MAX_PAGES; page++) {
    const params = { ...baseParams, page: String(page), per_page: '200' };
    const r = await eitjeGet(path, params);
    if (r.status >= 400) return { items, pages, truncated, error: `HTTP ${r.status} op ${path} p${page}: ${r.raw}` };
    const body: any = r.body;
    const chunk = Array.isArray(body) ? body : (body?.items ?? body?.data ?? []);
    if (!Array.isArray(chunk) || chunk.length === 0) break;
    // Detect non-paginated endpoints: server ignores `page` and returns the same
    // full list every request. Fingerprint = length + first/last item id. If it
    // matches the previous page's fingerprint we've already got everything.
    const first = chunk[0], last = chunk[chunk.length - 1];
    const fp = `${chunk.length}|${first?.id ?? ''}|${last?.id ?? ''}`;
    if (fp === prevFingerprint) {
      nonPaginated = true;
      break;
    }
    prevFingerprint = fp;
    items.push(...chunk);
    pages = page;
    if (chunk.length < 200) break;
    if (page === EITJE_MAX_PAGES) truncated = true;
    await sleep(200);
  }
  return { items, pages, truncated, non_paginated: nonPaginated };
}

async function doSyncWindow(
  admin: any,
  van: string,
  tot: string,
): Promise<{ ok: boolean; bonnen?: number; details?: any; error?: string }> {
  const details: any = { window: { van, tot }, endpoints: {}, skipped_env_ids: {}, skipped_types: {}, duration_source: {}, per_vestiging_stats: {}, loonkosten: { fallback_users: [], missing_uurloon: [] } };

  // 0. Instellingen (uurloon_allin + wg_lasten_factor per vestiging)
  const { data: instellingen, error: instErr } = await admin
    .from('cijfers_instellingen')
    .select('vestiging, uurloon_allin, wg_lasten_factor');
  if (instErr) return { ok: false, error: `cijfers_instellingen: ${instErr.message}` };
  const settingsByVest: Record<string, { uurloon_allin: number | null; wg_lasten_factor: number }> = {};
  for (const row of instellingen ?? []) {
    settingsByVest[row.vestiging] = {
      uurloon_allin: row.uurloon_allin == null ? null : Number(row.uurloon_allin),
      wg_lasten_factor: Number(row.wg_lasten_factor ?? 1.30),
    };
  }

  // 1. Eitje endpoints ophalen
  const dateParams = { 'filters[start_date]': van, 'filters[end_date]': tot, 'filters[date_filter_type]': 'resource_date' };
  const [trs, plans, revs, salariesRaw] = await Promise.all([
    eitjeFetchAll('/time_registration_shifts', dateParams),
    eitjeFetchAll('/planning_shifts', dateParams),
    eitjeFetchAll('/revenue_days', dateParams),
    eitjeFetchAll('/salaries', {}),
  ]);
  details.endpoints = {
    time_registration_shifts: { count: trs.items.length, pages: trs.pages, truncated: trs.truncated, error: trs.error },
    planning_shifts: { count: plans.items.length, pages: plans.pages, truncated: plans.truncated, error: plans.error },
    revenue_days: { count: revs.items.length, pages: revs.pages, truncated: revs.truncated, error: revs.error },
    salaries: { count: salariesRaw.items.length, pages: salariesRaw.pages, truncated: salariesRaw.truncated, error: salariesRaw.error },
  };
  const firstErr = trs.error || plans.error || revs.error || salariesRaw.error;
  if (firstErr && trs.items.length === 0 && plans.items.length === 0) {
    return { ok: false, details, error: firstErr };
  }

  // 2. Salaries-lookup: per user_id een gesorteerde lijst {start_date, end_date, amount, environment_id}
  const salariesByUser: Map<string, Array<{ start: string; end: string | null; amount: number; env: number | null }>> = new Map();
  for (const s of salariesRaw.items) {
    const uid = String(s?.user?.id ?? s?.user_id ?? '');
    if (!uid) continue;
    const amount = Number(s?.amount);
    if (!isFinite(amount) || amount <= 0) continue;
    const start = s?.start_date ?? null;
    if (!start) continue;
    const arr = salariesByUser.get(uid) ?? [];
    arr.push({
      start, end: s?.end_date ?? null, amount,
      env: s?.environment?.id ?? s?.environment_id ?? null,
    });
    salariesByUser.set(uid, arr);
  }

  function lookupSalary(userId: string | number, date: string, envId: number | null): number | null {
    const arr = salariesByUser.get(String(userId));
    if (!arr) return null;
    const matches = arr.filter((r) => r.start <= date && (r.end == null || r.end >= date));
    if (matches.length === 0) return null;
    // env-match wint als aanwezig
    const envMatch = matches.filter((m) => envId != null && m.env === envId);
    const pool = envMatch.length > 0 ? envMatch : matches;
    pool.sort((a, b) => (a.start < b.start ? 1 : -1));
    return pool[0].amount;
  }

  // 3. Aggregatie per (vestiging, werkdag)
  const buckets: Map<string, ShiftAgg> = new Map();
  const keyOf = (vest: string, date: string) => `${vest}|${date}`;

  // 3a. time_registration_shifts → gewerkte_uren + loonkosten
  const durSourceCounts: Record<string, number> = {};
  for (const sh of trs.items) {
    const envId = sh?.environment?.id ?? sh?.environment_id;
    const vest = ENV_TO_VESTIGING[envId as number];
    if (!vest) { details.skipped_env_ids[envId] = (details.skipped_env_ids[envId] ?? 0) + 1; continue; }
    const typeName = sh?.type?.name ?? sh?.type ?? null;
    if (typeName && typeName !== 'gewerkte_uren') {
      details.skipped_types[typeName] = (details.skipped_types[typeName] ?? 0) + 1;
      continue;
    }
    const date = sh?.date;
    if (!date) continue;
    const { hours, source } = shiftDurationHours(sh, date);
    durSourceCounts[source] = (durSourceCounts[source] ?? 0) + 1;
    if (hours <= 0) continue;

    const key = keyOf(vest, date);
    if (!buckets.has(key)) buckets.set(key, emptyAgg());
    const b = buckets.get(key)!;
    b.gewerkte_uren += hours;

    const uid = sh?.user?.id ?? sh?.user_id;
    if (uid == null) continue;
    const salary = lookupSalary(uid, date, envId ?? null);
    const settings = settingsByVest[vest];
    if (salary != null) {
      const factor = settings?.wg_lasten_factor ?? 1.30;
      b.loonkosten += hours * salary * factor;
      b.loonkosten_had_match = true;
    } else {
      const uurloon = settings?.uurloon_allin ?? null;
      if (uurloon != null && uurloon > 0) {
        b.loonkosten += hours * uurloon; // GEEN factor — is al all-in
        b.loonkosten_had_fallback = true;
        b.fallback_user_ids.add(uid);
      } else {
        b.missing_uurloon_user_ids.add(uid);
      }
    }
  }
  details.duration_source = durSourceCounts;

  // 3b. planning_shifts → geplande_uren
  for (const sh of plans.items) {
    const envId = sh?.environment?.id ?? sh?.environment_id;
    const vest = ENV_TO_VESTIGING[envId as number];
    if (!vest) { details.skipped_env_ids[envId] = (details.skipped_env_ids[envId] ?? 0) + 1; continue; }
    const date = sh?.date;
    if (!date) continue;
    const { hours } = shiftDurationHours(sh, date);
    if (hours <= 0) continue;
    const key = keyOf(vest, date);
    if (!buckets.has(key)) buckets.set(key, emptyAgg());
    buckets.get(key)!.geplande_uren += hours;
  }

  // 3c. revenue_days (Totaal) → eitje_omzet_dag
  for (const rv of revs.items) {
    const envId = rv?.environment?.id ?? rv?.environment_id;
    const vest = ENV_TO_VESTIGING[envId as number];
    if (!vest) continue;
    const groupName = rv?.revenue_group?.name ?? rv?.revenue_group_name ?? null;
    if (groupName !== 'Totaal') continue;
    const date = rv?.date;
    if (!date) continue;
    const cents = Number(rv?.amt_in_cents ?? 0);
    if (!isFinite(cents)) continue;
    const key = keyOf(vest, date);
    if (!buckets.has(key)) buckets.set(key, emptyAgg());
    const b = buckets.get(key)!;
    b.eitje_omzet_dag = (b.eitje_omzet_dag ?? 0) + cents / 100;
  }

  // 4. UPSERT naar uren_dagen
  const rows: any[] = [];
  for (const [key, b] of buckets.entries()) {
    const [vest, werkdag] = key.split('|');
    const hasLoonkosten = b.loonkosten_had_match || b.loonkosten_had_fallback;
    const loonkostenBron = hasLoonkosten
      ? (b.loonkosten_had_fallback ? 'berekend' : 'eitje')
      : null;
    rows.push({
      vestiging: vest,
      werkdag,
      is_demo: false,
      gewerkte_uren: Number(b.gewerkte_uren.toFixed(4)),
      geplande_uren: Number(b.geplande_uren.toFixed(4)),
      loonkosten: hasLoonkosten ? Number(b.loonkosten.toFixed(2)) : null,
      loonkosten_bron: loonkostenBron,
      eitje_omzet_dag: b.eitje_omzet_dag == null ? null : Number(b.eitje_omzet_dag.toFixed(2)),
    });
    details.per_vestiging_stats[key] = {
      gewerkte_uren: Number(b.gewerkte_uren.toFixed(4)),
      geplande_uren: Number(b.geplande_uren.toFixed(4)),
      loonkosten: hasLoonkosten ? Number(b.loonkosten.toFixed(2)) : null,
      loonkosten_bron: loonkostenBron,
      eitje_omzet_dag: b.eitje_omzet_dag,
    };
    if (b.fallback_user_ids.size > 0) {
      details.loonkosten.fallback_users.push({
        vestiging: vest, werkdag, count: b.fallback_user_ids.size,
        user_ids: [...b.fallback_user_ids],
      });
    }
    if (b.missing_uurloon_user_ids.size > 0) {
      details.loonkosten.missing_uurloon.push({
        vestiging: vest, werkdag, count: b.missing_uurloon_user_ids.size,
        user_ids: [...b.missing_uurloon_user_ids],
      });
    }
  }

  if (rows.length === 0) {
    return { ok: true, bonnen: 0, details };
  }

  const { error: upErr } = await admin
    .from('uren_dagen')
    .upsert(rows, { onConflict: 'vestiging,werkdag,is_demo' });
  if (upErr) return { ok: false, details, error: `upsert_uren_dagen: ${upErr.message}` };

  return { ok: true, bonnen: rows.length, details };
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
    const userIds = Array.isArray(body?.user_ids) ? body.user_ids : undefined;
    const res = await withRun(admin, 'verkennen', null, null, null, async () => {
      const r = await doVerkennen(admin, { user_ids: userIds });
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
      let totalBonnen = 0;
      for (const w of windows) {
        const r = await doSyncWindow(admin, w.van, w.tot);
        results.push({ ...w, ok: r.ok, bonnen: r.bonnen ?? 0, error: r.ok ? undefined : (r as any).error, details: (r as any).details ?? null });
        if (r.ok) { anyOk = true; totalBonnen += r.bonnen ?? 0; } else lastErr = (r as any).error;
        await sleep(500);
      }
      return { ok: anyOk, bonnen: totalBonnen, details: { windows: results }, error: anyOk ? undefined : (lastErr ?? 'all_windows_failed') };
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
      let anyOk = false; let lastErr: string | null = null; let totalBonnen = 0;
      for (const w of windows) {
        const r = await doSyncWindow(admin, w.van, w.tot);
        results.push({ ...w, ok: r.ok, bonnen: r.bonnen ?? 0, error: r.ok ? undefined : (r as any).error, details: (r as any).details ?? null });
        if (r.ok) { anyOk = true; totalBonnen += r.bonnen ?? 0; } else lastErr = (r as any).error;
        await sleep(1000);
      }
      return { ok: anyOk, bonnen: totalBonnen, details: { windows: results, cursor: today }, error: anyOk ? undefined : (lastErr ?? 'all_windows_failed') };
    });
    return json(res);
  }

  return json({ error: 'invalid_type', allowed: ['verkennen', 'dagelijks', 'handmatig', 'backfill'] }, 400);
});
