// Lightspeed omzet-sync — dagelijks (cron) | handmatig | backfill
// Auth: OF x-sync-token header (cron) OF owner-JWT (UI).
// Token-refresh: lease-pattern via sync_leases + sync_lease_acquire/release RPC
// (projectbrede standaard, zie mem://patterns/edge-function-serialization-lease).
// Één gedeelde 'lightspeed'-lease serialiseert refresh over beide vestigingen —
// refresh is <1s en cron loopt Midsland/West toch sequentieel.
//
// EERSTE LIVE CALL: STOP+ASK — response loggen en veldmapping vaststellen.
// Deze versie ondersteunt "mock_receipts" voor deterministische tests zonder API.
import { createClient } from 'npm:@supabase/supabase-js@2';
const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-sync-token' };

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const ANON = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
const CLIENT_ID = Deno.env.get('LIGHTSPEED_CLIENT_ID') ?? '';
const CLIENT_SECRET = Deno.env.get('LIGHTSPEED_CLIENT_SECRET') ?? '';
const SYNC_TOKEN = Deno.env.get('LIGHTSPEED_SYNC_TOKEN') ?? '';
// Tweede geldig cron-token: staat ook in vault (cron_sync_token) zodat
// trigger_sync_edge() de sync kan starten zonder service_role key.
const CRON_TOKEN = Deno.env.get('CRON_SYNC_TOKEN') ?? '';

const TOKEN_URL = 'https://lightspeedapis.com/resto/oauth2/v1/token';
// Receipts endpoint: nog te bevestigen bij eerste live call (paginering + veldnamen).
const RECEIPTS_URL = 'https://lightspeedapis.com/resto/rest/financial/receipt';
const RECEIPTS_PAGE_SIZE = 50;
const RECEIPTS_MAX_PAGES = 500; // safety-cap: 25k receipts/window


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
  const get = (t: string) => {
    const p = parts.find((x) => x.type === t);
    if (!p) throw new Error(`datum_onleesbaar: ${iso}`);
    return p.value;
  };
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
function gelijkeTekst(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

export function jwtRol(jwt: string): string | null {
  try {
    const [, payloadB64] = jwt.split('.');
    if (!payloadB64) return null;
    const pad = payloadB64 + '='.repeat((4 - (payloadB64.length % 4)) % 4);
    const payload = JSON.parse(atob(pad.replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload?.role === 'string' ? payload.role : null;
  } catch {
    return null;
  }
}

async function isEchteServiceRole(jwt: string): Promise<boolean> {
  if (gelijkeTekst(jwt, SERVICE_ROLE)) return true;
  if (jwtRol(jwt) !== 'service_role') return false;
  // Handtekening laten controleren: PostgREST weigert (401) een token met een ongeldige handtekening.
  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/lightspeed_connections?select=vestiging&limit=1`, {
      headers: { apikey: ANON, Authorization: `Bearer ${jwt}`, Accept: 'application/json' },
    });
    await r.body?.cancel();
    return r.ok;
  } catch {
    return false;
  }
}

async function requireAuth(req: Request): Promise<Response | null> {
  // 1) Cron header token
  const syncHeader = req.headers.get('x-sync-token');
  if (syncHeader && (syncHeader === SYNC_TOKEN || (CRON_TOKEN && syncHeader === CRON_TOKEN))) return null;

  const auth = req.headers.get('Authorization') ?? '';
  const jwt = auth.replace('Bearer ', '');
  if (!jwt) return json({ error: 'unauthorized' }, 401);

  // 2) Service-role JWT (cron via net.http_post met vault-secret).
  //    Alleen een ECHTE service-role token telt: exact gelijk aan SERVICE_ROLE, of een token met
  //    role=service_role waarvan de handtekening door PostgREST (project-JWT-secret) is goedgekeurd.
  //    Een zelfgemaakte token met alleen de claim role=service_role komt er niet meer door.
  if (await isEchteServiceRole(jwt)) return null;

  // 3) User JWT met owner-rol
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

async function readConnection(admin: any, vestiging: string): Promise<Conn | null> {
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

const LEASE_BRON = 'lightspeed';

async function tryClaimLease(admin: any): Promise<string | null> {
  const { data, error } = await admin.rpc('sync_lease_acquire', {
    _bron: LEASE_BRON,
    _holder: 'lightspeed-sync',
    _seconds: LEASE_SECONDS,
  });
  if (error) {
    console.error('[claimLease] rpc error', error.message);
    return null;
  }
  return (data as string | null) ?? null;
}

async function releaseLease(admin: any, token: string) {
  const { error } = await admin.rpc('sync_lease_release', { _bron: LEASE_BRON, _token: token });
  if (error) console.error('[releaseLease] rpc error', error.message);
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
async function getValidToken(admin: any, vestiging: string): Promise<{ token: string } | { error: string; detail: string }> {
  const conn = await readConnection(admin, vestiging);
  if (!conn) return { error: 'no_connection_row', detail: vestiging };
  if (conn.status !== 'gekoppeld' && conn.status !== 'token_verlopen') {
    return { error: 'not_connected', detail: `status=${conn.status}` };
  }
  if (!conn.refresh_token) return { error: 'no_refresh_token', detail: '' };

  if (tokenStillValid(conn) && conn.access_token) return { token: conn.access_token };

  // Probeer lease te claimen
  let leaseToken = await tryClaimLease(admin);

  if (!leaseToken) {
    // Poll tot token weer geldig
    const deadline = Date.now() + LEASE_POLL_TIMEOUT_MS;
    while (Date.now() < deadline) {
      await sleep(LEASE_POLL_MS);
      const fresh = await readConnection(admin, vestiging);
      if (fresh && tokenStillValid(fresh) && fresh.access_token) return { token: fresh.access_token };
      if (fresh && fresh.status === 'token_verlopen') {
        return { error: 'token_verlopen', detail: 'ander proces markeerde token als verlopen' };
      }
    }
    // Poll-timeout: probeer alsnog zelf de lease
    leaseToken = await tryClaimLease(admin);
    if (!leaseToken) return { error: 'lease_timeout', detail: 'kan lease niet claimen na poll-periode' };
  }

  // We hebben de lease → refresh doen
  try {
    const currentConn = await readConnection(admin, vestiging);
    if (!currentConn?.refresh_token) {
      return { error: 'no_refresh_token', detail: '' };
    }

    const refreshResult = await refreshAtLightspeed(currentConn.refresh_token);
    if ('error' in refreshResult) {
      await admin.from('lightspeed_connections').update({
        status: 'token_verlopen',
        laatste_fout: `Refresh geweigerd: ${refreshResult.detail.slice(0, 500)}`,
      }).eq('vestiging', vestiging);
      return refreshResult;
    }

    const newExpiresAt = new Date(Date.now() + refreshResult.expires_in * 1000).toISOString();

    // Nieuwe tokens opslaan (incl. geroteerde refresh_token) VOORDAT we ze gebruiken.
    const { error: upErr } = await admin.from('lightspeed_connections').update({
      access_token: refreshResult.access_token,
      refresh_token: refreshResult.refresh_token,
      token_expires_at: newExpiresAt,
      status: 'gekoppeld',
      laatste_fout: null,
    }).eq('vestiging', vestiging);

    if (upErr) {
      await admin.from('lightspeed_connections').update({
        status: 'token_verlopen',
        laatste_fout: 'Token opgeslagen faalde na refresh — opnieuw koppelen vereist',
      }).eq('vestiging', vestiging);
      return { error: 'token_persist_failed', detail: upErr.message };
    }

    return { token: refreshResult.access_token };
  } finally {
    await releaseLease(admin, leaseToken);
  }
}

// ------------------------------------------------------------------
// Receipts ophalen — Lightspeed L-Series (euc2 via lightspeedapis.com gateway)
// Endpoint: GET /resto/rest/financial/receipt?date=YYYY-MM-DD&offset=N&limit=50
// - Timestamp-keuze: modificationDate (= laatste touch = afreken/close-moment).
//   Deze tenant vult closingDate structureel NIET (altijd 1970-01-01), dus die is
//   onbruikbaar. modificationDate is dichter bij afreken-moment dan creationDate
//   (bon-openen); zie sample-analyse: bonnen lopen tot 3.5u open, ts-keuze bepaalt
//   uur-bucket. Fallback-keten: modificationDate → creationDate → closingDate →
//   printDate, met sanity-skip voor epoch/pre-2000 waardes.
// - UTC (ISO Z) → computeWerkdagUur() bucketet naar Europe/Amsterdam vóór upsert.
// - Filter: statussen uit STATUSSEN[logica]. 'oud' = alleen PAID; 'nieuw' = PAID en DONE
//   (Lightspeed geeft afgerekende bonnen beide statussen; PAID+DONE = Lightspeed-rapport op de cent);
//   'accepted' = PAID, DONE en ACCEPTED (besluit Yorick 1-11-2026; ACCEPTED komt bij Midsland in 2026 voor).
// - Werkdag ('nieuw' en 'accepted'): de opgehaalde Lightspeed-dag (date=), niet de aanpastijd. Zie plaatsBon().
// ------------------------------------------------------------------
type ReceiptItem = { product_id: string; naam: string; aantal: number; incl: number; excl: number };
type Receipt = {
  timestamp: string; total_incl: number; total_excl: number; items?: ReceiptItem[]; ophaaldag?: string;
  status?: string; creatie_ts?: string | null;
};

/**
 * Logica voor status-filter en werkdag/uur.
 *  - 'oud':   alleen PAID; werkdag+uur uit timestamp (modificationDate eerst), kanteluur 06:00.
 *  - 'nieuw': PAID en DONE; werkdag = ophaaldag (Lightspeed date=). Uur uit timestamp als die
 *             op de ophaaldag valt (kanteluur 06:00), anders uit creationDate als die op de
 *             ophaaldag valt, anders uit timestamp. Zo kan een later aangepaste bon nooit
 *             een uur van een andere dag overschrijven.
 *  - 'accepted': als 'nieuw' (zelfde werkdag/uur), maar telt ook status ACCEPTED mee.
 * Bonnen zonder ophaaldag (mock_receipts) vallen in alle logica's terug op de timestamp.
 */
export type Logica = 'oud' | 'nieuw' | 'accepted';
export const LOGICAS: readonly Logica[] = ['oud', 'nieuw', 'accepted'];
export const STATUSSEN: Record<Logica, readonly string[]> = {
  oud: ['PAID'],
  nieuw: ['PAID', 'DONE'],
  accepted: ['PAID', 'DONE', 'ACCEPTED'],
};
export const SCHRIJF_LOGICA: Logica = 'accepted';

export function plaatsBon(r: Receipt, logica: Logica): { werkdag: string; uur: number } {
  const viaTs = computeWerkdagUur(r.timestamp);
  if (logica === 'oud' || !r.ophaaldag) return viaTs;
  if (viaTs.werkdag === r.ophaaldag) return viaTs;
  if (r.creatie_ts) {
    const c = computeWerkdagUur(r.creatie_ts);
    if (c.werkdag === r.ophaaldag) return { werkdag: r.ophaaldag, uur: c.uur };
  }
  return { werkdag: r.ophaaldag, uur: viaTs.uur };
}

/** Productregels uit een L-Series receipt (items[]). Sleutel: prodId → productId → naam. */
export function extractItems(r: any): ReceiptItem[] {
  const arr: any[] = Array.isArray(r?.items) ? r.items : [];
  const out: ReceiptItem[] = [];
  for (const it of arr) {
    const id = String(it?.prodId ?? it?.productId ?? it?.productName ?? '').trim();
    if (!id) continue;
    out.push({
      product_id: id,
      naam: String(it?.productName ?? ''),
      aantal: Number(it?.amount ?? 0) || 0,
      incl: Number(it?.totalPrice ?? 0) || 0,
      excl: Number(it?.totalPriceWithoutVat ?? 0) || 0,
    });
  }
  return out;
}

/**
 * Kies het beste timestamp-veld van een Lightspeed receipt.
 * Volgorde: modificationDate → creationDate → closingDate → printDate.
 * Skipt epoch-waardes (1969/1970 of numeriek < 2000-01-01) en normaliseert
 * unix seconds/ms → ISO. Retourneert null als geen enkel veld bruikbaar is.
 */
function pickReceiptTs(r: any): string | null {
  const cands = [r?.modificationDate, r?.creationDate, r?.closingDate, r?.printDate];
  for (const c of cands) {
    if (c == null || c === '') continue;
    const s = String(c);
    if (s.startsWith('1970-') || s.startsWith('1969-')) continue;
    // Numeric (unix seconds or ms)?
    if (typeof c === 'number' || /^\d+$/.test(s)) {
      const n = typeof c === 'number' ? c : Number(s);
      if (!Number.isFinite(n) || n <= 0) continue;
      const ms = n < 1e12 ? n * 1000 : n;
      if (ms < 946684800000) continue; // < 2000-01-01
      return new Date(ms).toISOString();
    }
    // ISO string — vertrouw op formaat, computeWerkdagUur() valideert via Date().
    return s;
  }
  return null;
}

// ------------------------------------------------------------------
// Droge run (dry_run): diagnose-verzameling. Alleen gevuld als er een diag-object
// wordt meegegeven; het normale (schrijvende) pad geeft niets mee en blijft gelijk.
// ------------------------------------------------------------------
type Bedrag = { n: number; incl: number; excl: number };
export type DryDiag = {
  status: Record<string, Bedrag>;              // alle bonnen per status (PAID en de rest)
  meetellen: readonly string[];                 // statussen die de sync meetelt (STATUSSEN[logica])
  paid_zonder_tijd: Bedrag;                     // meegeteld maar geen bruikbare timestamp → sync slaat over
  paid_zonder_excl_veld: Bedrag;                // meegeteld zonder totalWithoutTax/totalExcludingTax → excl telt als 0
  ts_bron: Record<string, number>;              // welk veld pickReceiptTs koos
  per_ophaaldag: Record<string, { status: Record<string, Bedrag> }>;
  ids: Map<string, string[]>;                   // bon-id → ophaaldagen (dubbelen over dagen)
  id_veld: string | null;
  paginas: number;
};

export function nieuweDiag(meetellen: readonly string[] = STATUSSEN.oud): DryDiag {
  return {
    status: {}, meetellen, paid_zonder_tijd: { n: 0, incl: 0, excl: 0 }, paid_zonder_excl_veld: { n: 0, incl: 0, excl: 0 },
    ts_bron: {}, per_ophaaldag: {}, ids: new Map(), id_veld: null, paginas: 0,
  };
}

function telOp(b: Bedrag, incl: number, excl: number) { b.n += 1; b.incl += incl; b.excl += excl; }

/** Welk veld pickReceiptTs gebruikt (zelfde volgorde en skip-regels). Alleen voor diagnose. */
function pickReceiptTsBron(r: any): string | null {
  const namen = ['modificationDate', 'creationDate', 'closingDate', 'printDate'];
  for (const k of namen) {
    const c = r?.[k];
    if (c == null || c === '') continue;
    const s = String(c);
    if (s.startsWith('1970-') || s.startsWith('1969-')) continue;
    if (typeof c === 'number' || /^\d+$/.test(s)) {
      const n = typeof c === 'number' ? c : Number(s);
      if (!Number.isFinite(n) || n <= 0) continue;
      const ms = n < 1e12 ? n * 1000 : n;
      if (ms < 946684800000) continue;
      return k;
    }
    return k;
  }
  return null;
}

/** Leg één ruwe Lightspeed-bon vast in de diagnose (alle statussen). */
export function diagBon(diag: DryDiag, date: string, r: any) {
  const status = String(r?.status ?? '').toUpperCase() || '(leeg)';
  const incl = Number(r?.total ?? 0) || 0;
  const exclRaw = r?.totalWithoutTax ?? r?.totalExcludingTax;
  const excl = Number(exclRaw ?? 0) || 0;
  diag.status[status] ??= { n: 0, incl: 0, excl: 0 };
  telOp(diag.status[status], incl, excl);
  const dag = (diag.per_ophaaldag[date] ??= { status: {} });
  dag.status[status] ??= { n: 0, incl: 0, excl: 0 };
  telOp(dag.status[status], incl, excl);
  if (diag.meetellen.includes(status)) {
    const bron = pickReceiptTsBron(r);
    if (!bron) telOp(diag.paid_zonder_tijd, incl, excl);
    diag.ts_bron[bron ?? '(geen)'] = (diag.ts_bron[bron ?? '(geen)'] ?? 0) + 1;
    if (exclRaw == null || exclRaw === '') telOp(diag.paid_zonder_excl_veld, incl, excl);
  }
  const idVeld = ['id', 'receiptId', 'uuid', 'receiptNumber'].find((k) => r?.[k] != null && r?.[k] !== '');
  if (idVeld) {
    diag.id_veld ??= idVeld;
    const id = `${status}|${String(r[idVeld])}`;
    const l = diag.ids.get(id) ?? [];
    l.push(date);
    diag.ids.set(id, l);
  }
}

async function fetchReceiptsForDay(
  accessToken: string,
  date: string, // YYYY-MM-DD (NL-werkdag; Lightspeed interpreteert als lokale dag)
  diag?: DryDiag, // alleen bij dry_run; normaal pad geeft niets mee
  statussen: readonly string[] = STATUSSEN[SCHRIJF_LOGICA],
): Promise<{ receipts: Receipt[]; total_raw: number; paid_raw: number } | { error: string; detail: string }> {
  const kept: Receipt[] = [];
  let offset = 0;
  let totalRaw = 0;
  let paidRaw = 0;

  for (let page = 0; page < RECEIPTS_MAX_PAGES; page++) {
    const url = `${RECEIPTS_URL}?date=${encodeURIComponent(date)}&offset=${offset}&limit=${RECEIPTS_PAGE_SIZE}`;

    // Fetch met retry op 429/5xx (Retry-After respecteren, fallback exponentieel).
    let resp: Response | null = null;
    let text = '';
    const backoffs = [2000, 5000, 15000, 45000];
    let attempt = 0;
    while (true) {
      resp = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
      });
      text = await resp.text();
      if (resp.ok) break;
      const retryable = resp.status === 429 || (resp.status >= 500 && resp.status < 600);
      if (!retryable || attempt >= backoffs.length) {
        return { error: 'receipts_http_error', detail: `${resp.status} ${text.slice(0, 500)} url=${url}` };
      }
      const retryAfter = Number(resp.headers.get('Retry-After'));
      const waitMs = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : backoffs[attempt];
      console.log(`[backoff] status=${resp.status} attempt=${attempt + 1} wait=${waitMs}ms url=${url}`);
      await sleep(waitMs);
      attempt += 1;
    }
    let parsed: any;
    try { parsed = JSON.parse(text); } catch {
      return { error: 'receipts_not_json', detail: text.slice(0, 500) };
    }
    // Lightspeed shape: { results: Receipt[], amount: number, offset: number }
    // (backward-compat: sommige installaties leveren een bare array).
    const arr: any[] = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed?.results) ? parsed.results : null as any;
    if (!Array.isArray(arr)) {
      return { error: 'receipts_unexpected_shape', detail: JSON.stringify(parsed).slice(0, 500) };
    }
    totalRaw += arr.length;
    if (diag) { diag.paginas += 1; for (const r of arr) diagBon(diag, date, r); }

    // Per-pagina epoch-scan aggregaat (debug)
    let pagePaid = 0;
    let pageClosingEpoch = 0;
    let pageClosingReal = 0;
    let pageCreationReal = 0;
    let pageModReal = 0;
    let dumpedOnPage = 0;

    for (const r of arr) {
      const status = String(r?.status ?? '').toUpperCase();
      if (!statussen.includes(status)) continue;
      paidRaw += 1;
      pagePaid += 1;

      // ---- DEBUG DUMP: eerste 3 PAID-receipts per pagina ----
      if (dumpedOnPage < 3) {
        dumpedOnPage += 1;
        const tsFields = {
          creationDate: r?.creationDate,
          modificationDate: r?.modificationDate,
          closingDate: r?.closingDate,
          printDate: r?.printDate,
          receiptDate: r?.receiptDate,
          finalized: r?.finalized,
          openingDate: r?.openingDate,
          closedTime: r?.closedTime,
          finalizedTime: r?.finalizedTime,
          payments0_date: r?.payments?.[0]?.date,
          payments0_time: r?.payments?.[0]?.time,
          payments0_paidDate: r?.payments?.[0]?.paidDate,
        };
        const cd = r?.closingDate;
        const cdStr = cd == null ? '' : String(cd);
        const cdNum = typeof cd === 'number' ? cd : Number(cd);
        const closingIsEpoch =
          cdStr.startsWith('1970-') || cdStr.startsWith('1969-') ||
          (Number.isFinite(cdNum) && cdNum > 0 && cdNum < 946684800000);
        console.log(`[receipt-dump] page=${page} i=${dumpedOnPage} keys=${JSON.stringify(Object.keys(r ?? {}))} ts_fields=${JSON.stringify(tsFields)} closing_is_epoch=${closingIsEpoch}`);
        if (page === 0 && dumpedOnPage === 1) {
          console.log(`[receipt-raw] ${JSON.stringify(r).slice(0, 1200)}`);
        }
      }

      // ---- Epoch-scan telling ----
      const cdRaw = r?.closingDate;
      const cdS = cdRaw == null ? '' : String(cdRaw);
      const cdN = typeof cdRaw === 'number' ? cdRaw : Number(cdRaw);
      const cdEpoch = cdS === '' || cdS.startsWith('1970-') || cdS.startsWith('1969-') ||
        (Number.isFinite(cdN) && cdN > 0 && cdN < 946684800000);
      if (cdEpoch) pageClosingEpoch += 1; else pageClosingReal += 1;
      const crRaw = r?.creationDate;
      const crS = crRaw == null ? '' : String(crRaw);
      const crN = typeof crRaw === 'number' ? crRaw : Number(crRaw);
      const crEpoch = crS === '' || crS.startsWith('1970-') || crS.startsWith('1969-') ||
        (Number.isFinite(crN) && crN > 0 && crN < 946684800000);
      if (!crEpoch) pageCreationReal += 1;
      const mdRaw = r?.modificationDate;
      const mdS = mdRaw == null ? '' : String(mdRaw);
      const mdN = typeof mdRaw === 'number' ? mdRaw : Number(mdRaw);
      const mdEpoch = mdS === '' || mdS.startsWith('1970-') || mdS.startsWith('1969-') ||
        (Number.isFinite(mdN) && mdN > 0 && mdN < 946684800000);
      if (!mdEpoch) pageModReal += 1;

      // Kies timestamp via pickReceiptTs: modificationDate → creationDate → closingDate → printDate,
      // met epoch/pre-2000-skip. Deze tenant heeft closingDate structureel op 1970-01-01;
      // modificationDate is dichter bij afreken-moment dan creationDate (bon-openen).
      const iso = pickReceiptTs(r);
      if (paidRaw === 1) console.log(`[fetchReceipts] picked_ts=${iso} (mod=${r?.modificationDate} cre=${r?.creationDate} clo=${r?.closingDate})`);
      if (!iso) continue;
      const incl = Number(r?.total ?? 0);
      const excl = Number(r?.totalWithoutTax ?? r?.totalExcludingTax ?? 0);
      kept.push({
        timestamp: iso, total_incl: incl, total_excl: excl, items: extractItems(r),
        ophaaldag: date, status, creatie_ts: pickReceiptTs({ creationDate: r?.creationDate }),
      });
    }

    console.log(`[epoch-scan] page=${page} n_paid=${pagePaid} n_closing_epoch=${pageClosingEpoch} n_closing_real=${pageClosingReal} n_creation_real=${pageCreationReal} n_mod_real=${pageModReal}`);

    if (arr.length < RECEIPTS_PAGE_SIZE) break;
    offset += RECEIPTS_PAGE_SIZE;
  }


  return { receipts: kept, total_raw: totalRaw, paid_raw: paidRaw };
}

/** Loop van..tot inclusief (dag-granulariteit). Backfill hergebruikt dit. */
async function fetchReceipts(
  accessToken: string,
  _merchantId: string,
  van: string,
  tot: string,
  diag?: DryDiag, // alleen bij dry_run
  statussen: readonly string[] = STATUSSEN[SCHRIJF_LOGICA],
): Promise<{ receipts: Receipt[]; meta: { days: number; total_raw: number; paid_raw: number } } | { error: string; detail: string }> {
  const start = new Date(`${van}T00:00:00Z`);
  const end = new Date(`${tot}T00:00:00Z`);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
    return { error: 'invalid_date_range', detail: `${van}..${tot}` };
  }
  const all: Receipt[] = [];
  let totalRaw = 0, paidRaw = 0, days = 0;
  for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
    const day = d.toISOString().slice(0, 10);
    if (days > 0) await sleep(250); // burst-spreiding tussen dagen
    const res = await fetchReceiptsForDay(accessToken, day, diag, statussen);
    if ('error' in res) return res;
    all.push(...res.receipts);
    totalRaw += res.total_raw;
    paidRaw += res.paid_raw;
    days++;
  }
  console.log(`[fetchReceipts] ${van}..${tot} days=${days} raw=${totalRaw} paid=${paidRaw} kept=${all.length}`);
  return { receipts: all, meta: { days, total_raw: totalRaw, paid_raw: paidRaw } };
}


// ------------------------------------------------------------------
// Aggregatie + upsert
// ------------------------------------------------------------------
/** Bonnen → buckets per (werkdag, uur). Gedeeld door de echte upsert en de droge run. */
export function bucketize(receipts: Receipt[], logica: Logica = SCHRIJF_LOGICA) {
  const buckets = new Map<string, { werkdag: string; uur: number; incl: number; excl: number; count: number }>();
  for (const r of receipts) {
    const { werkdag, uur } = plaatsBon(r, logica);
    const key = `${werkdag}|${uur}`;
    const b = buckets.get(key) ?? { werkdag, uur, incl: 0, excl: 0, count: 0 };
    b.incl += Number(r.total_incl) || 0;
    b.excl += Number(r.total_excl) || 0;
    b.count += 1;
    buckets.set(key, b);
  }
  return buckets;
}

async function aggregateAndUpsert(
  admin: any,
  vestiging: string,
  receipts: Receipt[],
  logica: Logica = SCHRIJF_LOGICA,
): Promise<number> {
  const buckets = bucketize(receipts, logica);
  if (buckets.size === 0) return 0;

  // Guard: weiger te schrijven zolang er demo-data bestaat voor deze vestiging.
  const { data: demoRow, error: demoErr } = await admin
    .from('omzet_uren')
    .select('id', { head: false })
    .eq('vestiging', vestiging)
    .eq('is_demo', true)
    .limit(1)
    .maybeSingle();
  if (demoErr) throw new Error(`demo_check_failed: ${demoErr.message}`);
  if (demoRow) {
    throw new Error(
      `gestopt_demo_data_aanwezig: er staan nog demo-rijen voor ${vestiging}. ` +
      `Wis eerst de demo-data via het Cijfers-dashboard (owner) voordat de echte sync mag schrijven.`,
    );
  }

  const rows = [...buckets.values()].map((b) => ({
    vestiging,
    werkdag: b.werkdag,
    uur: b.uur,
    omzet_incl: Number(b.incl.toFixed(2)),
    omzet_excl: Number(b.excl.toFixed(2)),
    aantal_bonnen: b.count,
    is_demo: false,
    updated_at: new Date().toISOString(),
  }));
  const { error } = await admin.from('omzet_uren').upsert(rows, { onConflict: 'vestiging,werkdag,uur' });
  if (error) throw new Error(`upsert_failed: ${error.message}`);
  return receipts.length;
}


// ------------------------------------------------------------------
// Verkoop per product per werkdag (kassa_verkoop_dag)
// Idempotent: alle opgegeven werkdagen volledig herberekend; upsert + daarna
// rijen van die dagen die niet meer voorkomen (oude updated_at) verwijderen.
// ------------------------------------------------------------------
export function aggregateVerkoop(receipts: Receipt[], dagen: Set<string>, logica: Logica = SCHRIJF_LOGICA) {
  const m = new Map<string, { datum: string; pid: string; naam: string; aantal: number; incl: number; excl: number }>();
  for (const r of receipts) {
    const { werkdag } = plaatsBon(r, logica);
    if (!dagen.has(werkdag)) continue;
    for (const it of r.items ?? []) {
      const k = `${werkdag}|${it.product_id}`;
      const b = m.get(k) ?? { datum: werkdag, pid: it.product_id, naam: it.naam, aantal: 0, incl: 0, excl: 0 };
      b.aantal += it.aantal; b.incl += it.incl; b.excl += it.excl;
      if (it.naam) b.naam = it.naam;
      m.set(k, b);
    }
  }
  return [...m.values()];
}

function dagenTussen(van: string, tot: string): string[] {
  const out: string[] = [];
  const end = new Date(`${tot}T00:00:00Z`);
  for (let d = new Date(`${van}T00:00:00Z`); d <= end; d.setUTCDate(d.getUTCDate() + 1)) out.push(d.toISOString().slice(0, 10));
  return out;
}

function plusDag(day: string, n: number): string {
  const d = new Date(`${day}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10);
}

async function upsertVerkoop(
  admin: any, vestiging: string, receipts: Receipt[], dagen: string[],
  logica: Logica = SCHRIJF_LOGICA,
  opruimen = true, // false: alleen upserten, oude productregels van die dagen blijven staan (niets verwijderen)
): Promise<number> {
  if (dagen.length === 0) return 0;
  const stamp = new Date().toISOString();
  const rows = aggregateVerkoop(receipts, new Set(dagen), logica).map((b) => ({
    vestiging, datum: b.datum, lightspeed_product_id: b.pid, productnaam: b.naam,
    aantal: Number(b.aantal.toFixed(3)), omzet_incl: Number(b.incl.toFixed(2)), omzet_excl: Number(b.excl.toFixed(2)),
    updated_at: stamp,
  }));
  for (let i = 0; i < rows.length; i += 500) {
    const { error } = await admin.from('kassa_verkoop_dag').upsert(rows.slice(i, i + 500), { onConflict: 'vestiging,datum,lightspeed_product_id' });
    if (error) throw new Error(`verkoop_upsert_failed: ${error.message}`);
  }
  if (!opruimen) return rows.length;
  const { error: delErr } = await admin.from('kassa_verkoop_dag').delete()
    .eq('vestiging', vestiging).in('datum', dagen).lt('updated_at', stamp);
  if (delErr) throw new Error(`verkoop_cleanup_failed: ${delErr.message}`);
  return rows.length;
}

/**
 * Werkdagen die volledig in van..tot zitten.
 *  - 'oud':   tot zelf alleen als tot >= vandaag (NL) (nachtbonnen van tot kwamen pas met date=tot+1).
 *  - 'nieuw': elke opgehaalde dag is een complete werkdag (werkdag = ophaaldag), dus van..tot.
 */
export function volledigeWerkdagen(van: string, tot: string, logica: Logica = SCHRIJF_LOGICA): string[] {
  if (logica !== 'oud') return tot < van ? [] : dagenTussen(van, tot);
  const nlToday = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Amsterdam' }).format(new Date());
  const laatste = tot >= nlToday ? tot : plusDag(tot, -1);
  return laatste < van ? [] : dagenTussen(van, laatste);
}

// ------------------------------------------------------------------
// Sync-run wrapper
// ------------------------------------------------------------------
async function runSync(
  admin: any,
  vestiging: string,
  van: string,
  tot: string,
  type: 'dagelijks' | 'handmatig' | 'backfill' | 'auto',
  mockReceipts?: Receipt[],
  verkoopOpruimen = true,
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
      if (!conn) throw new Error(`no_connection_row: ${vestiging}`);
      const rx = await fetchReceipts(tok.token, conn.merchant_id, van, tot);
      if ('error' in rx) throw new Error(`${rx.error}: ${rx.detail}`);
      receipts = rx.receipts;
    }

    const bonnen = await aggregateAndUpsert(admin, vestiging, receipts, SCHRIJF_LOGICA);
    const verkoopRijen = mockReceipts ? 0 : await upsertVerkoop(
      admin, vestiging, receipts, volledigeWerkdagen(van, tot, SCHRIJF_LOGICA), SCHRIJF_LOGICA, verkoopOpruimen,
    );

    await admin.from('sync_runs').update({
      status: 'ok', bonnen_verwerkt: bonnen, details: { verkoop_rijen: verkoopRijen }, klaar_op: new Date().toISOString(),
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
// Backfill verkoop per product — hervatbaar, één chunk (7 dagen) per aanroep.
// Voortgang: sync_runs (type 'backfill', details.doel='verkoop'), state.cursor = volgende dag.
// Raakt omzet_uren niet aan.
// ------------------------------------------------------------------
const VERKOOP_BACKFILL_START = '2025-01-01';

async function backfillVerkoop(admin: any, body: any): Promise<Response> {
  const vestiging = body?.vestiging;
  if (!['Midsland', 'West'].includes(vestiging)) return json({ error: 'invalid_vestiging' }, 400);
  const nlToday = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Amsterdam' }).format(new Date());
  const eind = plusDag(nlToday, -1);

  const { data: last } = await admin.from('sync_runs').select('state')
    .eq('bron', 'lightspeed').eq('vestiging', vestiging).eq('type', 'backfill').eq('status', 'ok')
    .contains('details', { doel: 'verkoop' }).order('gestart_op', { ascending: false }).limit(1).maybeSingle();
  const van: string = last?.state?.cursor ?? VERKOOP_BACKFILL_START;
  if (van > eind) return json({ ok: true, klaar: true, vestiging, cursor: van });
  const tot = plusDag(van, 6) > eind ? eind : plusDag(van, 6);

  const jobKey = vestiging === 'Midsland' ? 'ls-job:midsland' : 'ls-job:west';
  const { data: lockToken } = await admin.rpc('sync_lease_acquire', { _bron: jobKey, _holder: `verkoop-backfill:${van}`, _seconds: 540 });
  if (!lockToken) return json({ ok: false, error: 'lease_busy', vestiging }, 200);

  const { data: runRow } = await admin.from('sync_runs').insert({
    bron: 'lightspeed', vestiging, type: 'backfill', periode_van: van, periode_tot: tot, status: 'bezig',
    details: { doel: 'verkoop' },
  }).select('id').single();
  try {
    const tok = await getValidToken(admin, vestiging);
    if ('error' in tok) throw new Error(`${tok.error}: ${tok.detail}`);
    const conn = await readConnection(admin, vestiging);
    if (!conn) throw new Error(`no_connection_row: ${vestiging}`);
    // Eén dag extra ophalen: na-middernacht-bonnen horen bij werkdag 'tot'.
    const rx = await fetchReceipts(tok.token, conn.merchant_id, van, plusDag(tot, 1));
    if ('error' in rx) throw new Error(`${rx.error}: ${rx.detail}`);
    const rijen = await upsertVerkoop(admin, vestiging, rx.receipts, dagenTussen(van, tot), SCHRIJF_LOGICA);
    const cursor = plusDag(tot, 1);
    await admin.from('sync_runs').update({
      status: 'ok', bonnen_verwerkt: rx.meta.paid_raw, klaar_op: new Date().toISOString(),
      details: { doel: 'verkoop', verkoop_rijen: rijen }, state: { cursor },
    }).eq('id', runRow?.id);
    return json({ ok: true, klaar: cursor > eind, vestiging, van, tot, rijen, cursor });
  } catch (e) {
    const msg = (e as Error).message;
    await admin.from('sync_runs').update({
      status: 'fout', foutmelding: msg.slice(0, 1000), klaar_op: new Date().toISOString(),
    }).eq('id', runRow?.id);
    return json({ ok: false, error: msg, vestiging, van, tot });
  } finally {
    await admin.rpc('sync_lease_release', { _bron: jobKey, _token: lockToken });
  }
}

// ------------------------------------------------------------------
// Droge run: zelfde ophalen + aggregatie als runSync, maar NIETS schrijven
// (geen omzet_uren, kassa_verkoop_dag, sync_runs, laatste_sync_op/laatste_fout, geen job-lease).
// Enige mogelijke schrijfactie: de normale token-refresh in getValidToken als het
// access-token verlopen is (nodig: Lightspeed roteert de refresh-token).
// ------------------------------------------------------------------
const DRY_RUN_MAX_DAGEN = 35;
const r2 = (n: number) => Number(n.toFixed(2));
const rb = (b: Bedrag) => ({ n: b.n, incl: r2(b.incl), excl: r2(b.excl) });

function dagVerschil(a: string, b: string): number {
  return Math.round((new Date(`${a}T00:00:00Z`).getTime() - new Date(`${b}T00:00:00Z`).getTime()) / 86400000);
}

/** Pure samenvatting van een droge run (testbaar zonder API). */
export function samenvattingDryRun(receipts: Receipt[], van: string, tot: string, diag?: DryDiag, logica: Logica = SCHRIJF_LOGICA) {
  const buckets = bucketize(receipts, logica);
  // Exact de rijen die runSync zou upserten (zelfde afronding).
  const rijen = [...buckets.values()]
    .sort((a, b) => (a.werkdag + String(a.uur).padStart(2, '0')).localeCompare(b.werkdag + String(b.uur).padStart(2, '0')))
    .map((b) => ({ werkdag: b.werkdag, uur: b.uur, omzet_excl: r2(b.excl), omzet_incl: r2(b.incl), aantal_bonnen: b.count }));
  const binnen = (w: string) => w >= van && w <= tot;
  const randrijen = rijen.filter((r) => !binnen(r.werkdag));

  const perWerkdag: Record<string, Bedrag> = {};
  const perMaand: Record<string, Bedrag & { dagen: number }> = {};
  const nacht = { totaal: { n: 0, incl: 0, excl: 0 }, werkdag_is_ophaaldag_min1: { n: 0, incl: 0, excl: 0 }, werkdag_is_ophaaldag: { n: 0, incl: 0, excl: 0 }, anders: { n: 0, incl: 0, excl: 0 } };
  const verschuiving: Record<string, Bedrag> = {}; // werkdag t.o.v. ophaaldag (dagen)
  const perOphaalMaandPaid: Record<string, Bedrag> = {};
  const perStatus: Record<string, Bedrag> = {};
  for (const r of receipts) {
    // perWerkdag volgt de gekozen logica (= wat de sync schrijft); nachtgrens en
    // werkdag_min_ophaaldag blijven op de tijd van de bon (diagnose: wat zou verschuiven).
    const plek = plaatsBon(r, logica);
    perWerkdag[plek.werkdag] ??= { n: 0, incl: 0, excl: 0 };
    telOp(perWerkdag[plek.werkdag], r.total_incl || 0, r.total_excl || 0);
    const st = r.status ?? '(onbekend)';
    perStatus[st] ??= { n: 0, incl: 0, excl: 0 };
    telOp(perStatus[st], r.total_incl || 0, r.total_excl || 0);
    const { werkdag, uur } = computeWerkdagUur(r.timestamp);
    if (uur < 6) {
      telOp(nacht.totaal, r.total_incl || 0, r.total_excl || 0);
      if (r.ophaaldag) {
        const d = dagVerschil(werkdag, r.ophaaldag);
        const k = d === -1 ? 'werkdag_is_ophaaldag_min1' : d === 0 ? 'werkdag_is_ophaaldag' : 'anders';
        telOp(nacht[k], r.total_incl || 0, r.total_excl || 0);
      }
    }
    if (r.ophaaldag) {
      const d = String(dagVerschil(werkdag, r.ophaaldag));
      verschuiving[d] ??= { n: 0, incl: 0, excl: 0 };
      telOp(verschuiving[d], r.total_incl || 0, r.total_excl || 0);
      const om = r.ophaaldag.slice(0, 7);
      perOphaalMaandPaid[om] ??= { n: 0, incl: 0, excl: 0 };
      telOp(perOphaalMaandPaid[om], r.total_incl || 0, r.total_excl || 0);
    }
  }
  for (const [w, b] of Object.entries(perWerkdag)) {
    if (!binnen(w)) continue;
    const m = w.slice(0, 7);
    perMaand[m] ??= { n: 0, incl: 0, excl: 0, dagen: 0 };
    perMaand[m].n += b.n; perMaand[m].incl += b.incl; perMaand[m].excl += b.excl;
    if (b.excl > 0) perMaand[m].dagen += 1;
  }

  const uit: any = {
    van, tot, logica,
    bonnen_meegeteld: receipts.length,
    meegeteld_per_status: Object.fromEntries(Object.entries(perStatus).sort().map(([k, b]) => [k, rb(b)])),
    totaal_alle_rijen: rb(receipts.reduce((a, r) => { telOp(a, r.total_incl || 0, r.total_excl || 0); return a; }, { n: 0, incl: 0, excl: 0 })),
    maanden_werkdag_binnen_bereik: Object.fromEntries(Object.entries(perMaand).sort().map(([m, b]) => [m, { ...rb(b), open_dagen: b.dagen }])),
    per_werkdag: Object.fromEntries(Object.entries(perWerkdag).sort().map(([w, b]) => [w, rb(b)])),
    nachtgrens: {
      uitleg: 'meegetelde bonnen met tijd 00:00-05:59 Amsterdam; die horen bij werkdag = kalenderdag - 1 (op de tijd van de bon)',
      totaal: rb(nacht.totaal),
      werkdag_is_ophaaldag_min1: rb(nacht.werkdag_is_ophaaldag_min1),
      werkdag_is_ophaaldag: rb(nacht.werkdag_is_ophaaldag),
      anders: rb(nacht.anders),
    },
    werkdag_min_ophaaldag: Object.fromEntries(Object.entries(verschuiving).sort((a, b) => Number(a[0]) - Number(b[0])).map(([d, b]) => [d, rb(b)])),
    paid_per_ophaalmaand: Object.fromEntries(Object.entries(perOphaalMaandPaid).sort().map(([m, b]) => [m, rb(b)])),
    randrijen: { uitleg: 'rijen buiten van..tot die een echte run ook zou upserten (met mogelijk maar een deel van de bonnen)', aantal: randrijen.length, rijen: randrijen },
    rijen_aantal: rijen.length,
    rijen,
  };
  if (diag) {
    const dubbel = [...diag.ids.entries()].filter(([, d]) => d.length > 1);
    const statusPerOphaalMaand: Record<string, Record<string, Bedrag>> = {};
    for (const [dag, v] of Object.entries(diag.per_ophaaldag)) {
      const m = dag.slice(0, 7);
      statusPerOphaalMaand[m] ??= {};
      for (const [st, b] of Object.entries(v.status)) {
        statusPerOphaalMaand[m][st] ??= { n: 0, incl: 0, excl: 0 };
        const t = statusPerOphaalMaand[m][st]; t.n += b.n; t.incl += b.incl; t.excl += b.excl;
      }
    }
    uit.diagnose = {
      paginas: diag.paginas,
      status: Object.fromEntries(Object.entries(diag.status).sort().map(([k, b]) => [k, rb(b)])),
      status_per_ophaalmaand: Object.fromEntries(Object.entries(statusPerOphaalMaand).sort().map(([m, v]) => [m, Object.fromEntries(Object.entries(v).sort().map(([k, b]) => [k, rb(b)]))])),
      status_per_ophaaldag: Object.fromEntries(Object.entries(diag.per_ophaaldag).sort().map(([d, v]) => [d, Object.fromEntries(Object.entries(v.status).sort().map(([k, b]) => [k, rb(b)]))])),
      paid_zonder_bruikbare_tijd: rb(diag.paid_zonder_tijd),
      paid_zonder_excl_veld: rb(diag.paid_zonder_excl_veld),
      tijdveld_gekozen: diag.ts_bron,
      id_veld: diag.id_veld,
      dubbel_over_ophaaldagen: { aantal: dubbel.length, voorbeelden: dubbel.slice(0, 10).map(([id, d]) => ({ status_id: id, ophaaldagen: d })) },
    };
  }
  return uit;
}

async function dryRun(admin: any, body: any): Promise<Response> {
  const vestiging = body?.vestiging;
  if (!['Midsland', 'West'].includes(vestiging)) return json({ error: 'invalid_vestiging' }, 400);
  const van = String(body?.van ?? '');
  const tot = String(body?.tot ?? van);
  const re = /^\d{4}-\d{2}-\d{2}$/;
  if (!re.test(van) || !re.test(tot) || tot < van || isNaN(new Date(`${van}T00:00:00Z`).getTime()) || isNaN(new Date(`${tot}T00:00:00Z`).getTime())) {
    return json({ error: 'invalid_date_range', detail: `${van}..${tot}` }, 400);
  }
  if (dagVerschil(tot, van) + 1 > DRY_RUN_MAX_DAGEN) return json({ error: 'range_too_large', max_dagen: DRY_RUN_MAX_DAGEN }, 400);
  // Logica voor de droge run: standaard SCHRIJF_LOGICA (= wat de sync schrijft); 'oud', 'nieuw' of 'accepted' om te vergelijken.
  const logica: Logica = body?.logica === undefined || body?.logica === null ? SCHRIJF_LOGICA : body.logica;
  if (!LOGICAS.includes(logica)) return json({ error: 'invalid_logica', toegestaan: LOGICAS }, 400);
  const t0 = Date.now();

  // Testpad zonder Lightspeed: mock_receipts (zelfde vorm als bij mock-sync). Schrijft ook niets.
  if (Array.isArray(body?.mock_receipts)) {
    return json({ ok: true, dry_run: true, bron: 'mock', vestiging, schrijf_logica: SCHRIJF_LOGICA, ...samenvattingDryRun(body.mock_receipts as Receipt[], van, tot, undefined, logica), duur_ms: Date.now() - t0 });
  }

  const tok = await getValidToken(admin, vestiging);
  if ('error' in tok) return json({ ok: false, dry_run: true, error: tok.error }, 200); // detail niet teruggeven
  const diag = nieuweDiag(STATUSSEN[logica]);
  const rx = await fetchReceipts(tok.token, '', van, tot, diag, STATUSSEN[logica]);
  if ('error' in rx) return json({ ok: false, dry_run: true, error: rx.error, detail: rx.detail.replace(/Bearer\s+\S+/g, 'Bearer ***').slice(0, 300) }, 200);
  return json({
    ok: true, dry_run: true, bron: 'lightspeed', vestiging, schrijf_logica: SCHRIJF_LOGICA,
    opgehaald: rx.meta,
    ...samenvattingDryRun(rx.receipts, van, tot, diag, logica),
    duur_ms: Date.now() - t0,
  });
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

  // Droge run vóór alle schrijvende paden. Elke aanwezige waarde behalve false telt
  // als droge run (ook "true" als tekst), zodat een tikfout nooit een schrijvende run wordt.
  if (body?.dry_run !== undefined && body?.dry_run !== null && body?.dry_run !== false) {
    return await dryRun(admin, body);
  }

  if (type === 'backfill_verkoop') return await backfillVerkoop(admin, body);

  if (!['dagelijks', 'handmatig', 'backfill', 'auto'].includes(type)) {
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
    // verkoop_opruimen: alleen afwezig of true ruimt oude productregels op; elke andere waarde
    // (bv. false) = alleen upserten, niets verwijderen in kassa_verkoop_dag.
    const opruimen = body.verkoop_opruimen === undefined || body.verkoop_opruimen === true;
    const r = await runSync(admin, body.vestiging, van, tot, 'handmatig', undefined, opruimen);
    return json(r);
  }

  if (type === 'backfill') {
    if (!['Midsland', 'West'].includes(body.vestiging)) return json({ error: 'invalid_vestiging' }, 400);

    // Bepaal periode: expliciete van/tot heeft voorrang; anders val terug op maanden-N (cron/legacy).
    let periodStart: Date;
    let periodEnd: Date;
    if (body.van && body.tot) {
      periodStart = new Date(`${body.van}T00:00:00Z`);
      periodEnd = new Date(`${body.tot}T00:00:00Z`);
      if (isNaN(periodStart.getTime()) || isNaN(periodEnd.getTime()) || periodEnd < periodStart) {
        return json({ error: 'invalid_date_range', detail: `${body.van}..${body.tot}` }, 400);
      }
    } else {
      const maanden = Math.max(1, Math.min(24, Number(body.maanden ?? 12)));
      periodEnd = new Date();
      periodEnd.setUTCHours(0, 0, 0, 0);
      periodEnd.setUTCDate(periodEnd.getUTCDate() - 1); // gisteren
      periodStart = new Date(periodEnd);
      periodStart.setUTCMonth(periodStart.getUTCMonth() - maanden);
    }

    // Splits in week-chunks (7 dagen) — één runSync per chunk = eigen sync_runs-rij + eigen timeout-budget.
    const results: any[] = [];
    let cursor = new Date(periodStart);
    while (cursor <= periodEnd) {
      const chunkEnd = new Date(cursor);
      chunkEnd.setUTCDate(chunkEnd.getUTCDate() + 6);
      const effectiveEnd = chunkEnd > periodEnd ? periodEnd : chunkEnd;
      const van = cursor.toISOString().slice(0, 10);
      const tot = effectiveEnd.toISOString().slice(0, 10);
      const res = await runSync(admin, body.vestiging, van, tot, 'backfill');
      console.log(`[backfill] week=${van}..${tot} vestiging=${body.vestiging} bonnen=${(res as any).bonnen ?? 0} ok=${(res as any).ok}`);
      results.push({ periode: `${van}..${tot}`, ...res });
      await sleep(2000); // rate-limit-vriendelijk tussen weken
      cursor = new Date(effectiveEnd);
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return json({ ok: true, weeks: results.length, runs: results });
  }

  if (type === 'auto') {
    // Cron-modus: per-vestiging job-overlap-lock via sync_leases (job-key, geen token-lease).
    // window: 'hot' = vandaag+gisteren; 'reconcile' = T-7..T-1 (late edits/voids).
    const vestiging = body.vestiging;
    const window = body.window ?? 'hot';
    if (!['Midsland', 'West'].includes(vestiging)) return json({ error: 'invalid_vestiging' }, 400);
    if (!['hot', 'reconcile'].includes(window)) return json({ error: 'invalid_window' }, 400);

    const jobKey = vestiging === 'Midsland' ? 'ls-job:midsland' : 'ls-job:west';
    const holder = `auto:${window}:${crypto.randomUUID().slice(0, 8)}`;
    const { data: lockToken, error: lockErr } = await admin.rpc('sync_lease_acquire', {
      _bron: jobKey, _holder: holder, _seconds: 540, // 9 min TTL, cron tick = 30 min
    });
    if (lockErr) return json({ ok: false, error: `job_lock_query_failed: ${lockErr.message}` }, 500);
    if (!lockToken) return json({ ok: false, error: 'lease_busy', vestiging, window }, 200);

    try {
      // Werkdagen in NL-tijd (kanteluur 06:00 wordt in de aggregatie afgehandeld).
      const nlToday = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Amsterdam' }).format(new Date());
      const day = (offset: number) => {
        const d = new Date(nlToday + 'T00:00:00Z');
        d.setUTCDate(d.getUTCDate() + offset);
        return d.toISOString().slice(0, 10);
      };
      const van = window === 'hot' ? day(-1) : day(-7);
      const tot = window === 'hot' ? day(0) : day(-1);
      const result = await runSync(admin, vestiging, van, tot, 'auto');
      return json({ ...result, vestiging, window, van, tot });
    } finally {
      await admin.rpc('sync_lease_release', { _bron: jobKey, _token: lockToken });
    }
  }

  return json({ error: 'unhandled' }, 500);
});
