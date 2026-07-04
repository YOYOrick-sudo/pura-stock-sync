// Lightspeed OAuth (PKCE) — start + callback
// Owner-only. Slaat state+verifier op in lightspeed_oauth_states (TTL 10 min).
import { createClient } from 'npm:@supabase/supabase-js@2';
const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-sync-token' };

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON = Deno.env.get('SUPABASE_ANON_KEY')!;
const CLIENT_ID = Deno.env.get('LIGHTSPEED_CLIENT_ID')!;
const CLIENT_SECRET = Deno.env.get('LIGHTSPEED_CLIENT_SECRET') ?? '';

const AUTHORIZE_URL = 'https://lightspeedapis.com/resto/oauth2/v1/authorize';
const TOKEN_URL = 'https://lightspeedapis.com/resto/oauth2/v1/token';
const REDIRECT_URI = 'https://intern.puravidafoodbar.nl/lightspeed/callback';

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function b64url(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function randomB64Url(n: number): string {
  const bytes = new Uint8Array(n);
  crypto.getRandomValues(bytes);
  return b64url(bytes);
}

async function s256(verifier: string): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return b64url(new Uint8Array(hash));
}

async function requireOwner(req: Request): Promise<{ userId: string } | Response> {
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
  return { userId: userRes.user.id };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  const gate = await requireOwner(req);
  if (gate instanceof Response) return gate;

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'invalid_json' }, 400);
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

  // ------------- action: start -------------
  if (body?.action === 'start') {
    const vestiging = body.vestiging;
    if (!['Midsland', 'West'].includes(vestiging)) {
      return json({ error: 'invalid_vestiging' }, 400);
    }

    // Opruimen verlopen states (housekeeping)
    await admin.from('lightspeed_oauth_states').delete().lt('expires_at', new Date().toISOString());

    const verifier = randomB64Url(48); // 64 chars base64url
    const challenge = await s256(verifier);
    const state = randomB64Url(24);

    const { error: insErr } = await admin.from('lightspeed_oauth_states').insert({
      state,
      vestiging,
      code_verifier: verifier,
    });
    if (insErr) return json({ error: 'state_persist_failed', detail: insErr.message }, 500);

    const url = new URL(AUTHORIZE_URL);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', CLIENT_ID);
    url.searchParams.set('redirect_uri', REDIRECT_URI);
    url.searchParams.set('state', state);
    url.searchParams.set('code_challenge', challenge);
    url.searchParams.set('code_challenge_method', 'S256');
    // Scope: leeg laten — Lightspeed docs bevestigen; toevoegen als eerste live poging faalt.

    return json({ authorize_url: url.toString() });
  }

  // ------------- action: callback -------------
  if (body?.action === 'callback') {
    const code = body.code;
    const state = body.state;
    if (typeof code !== 'string' || typeof state !== 'string' || !code || !state) {
      return json({ error: 'missing_code_or_state' }, 400);
    }

    // State-lookup + single-use delete
    const { data: stateRow, error: stErr } = await admin
      .from('lightspeed_oauth_states')
      .select('vestiging, code_verifier, expires_at')
      .eq('state', state)
      .maybeSingle();

    if (stErr) return json({ error: 'state_lookup_failed', detail: stErr.message }, 500);
    if (!stateRow) return json({ error: 'invalid_state' }, 400);
    if (new Date(stateRow.expires_at) < new Date()) {
      await admin.from('lightspeed_oauth_states').delete().eq('state', state);
      return json({ error: 'state_expired' }, 400);
    }

    // Single-use: delete VOOR de token exchange
    await admin.from('lightspeed_oauth_states').delete().eq('state', state);

    // Token exchange
    const form = new URLSearchParams();
    form.set('grant_type', 'authorization_code');
    form.set('code', code);
    form.set('client_id', CLIENT_ID);
    form.set('redirect_uri', REDIRECT_URI);
    form.set('code_verifier', stateRow.code_verifier);
    if (CLIENT_SECRET) form.set('client_secret', CLIENT_SECRET);

    let tokenResp: Response;
    try {
      tokenResp = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
        body: form.toString(),
      });
    } catch (e) {
      return json({ error: 'token_exchange_network', detail: String(e) }, 502);
    }

    const tokenText = await tokenResp.text();
    if (!tokenResp.ok) {
      return json({ error: 'token_exchange_failed', status: tokenResp.status, body: tokenText }, 400);
    }

    let tokens: any;
    try {
      tokens = JSON.parse(tokenText);
    } catch {
      return json({ error: 'token_response_not_json', body: tokenText }, 502);
    }

    const accessToken = tokens.access_token;
    const refreshToken = tokens.refresh_token;
    const expiresIn = Number(tokens.expires_in ?? 3600);
    if (!accessToken || !refreshToken) {
      return json({ error: 'token_response_missing_fields', body: tokens }, 502);
    }

    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    const { error: upErr } = await admin
      .from('lightspeed_connections')
      .update({
        access_token: accessToken,
        refresh_token: refreshToken,
        token_expires_at: expiresAt,
        status: 'gekoppeld',
        laatste_fout: null,
        refreshing_until: null,
      })
      .eq('vestiging', stateRow.vestiging);

    if (upErr) return json({ error: 'connection_update_failed', detail: upErr.message }, 500);

    return json({ ok: true, vestiging: stateRow.vestiging });
  }

  return json({ error: 'unknown_action' }, 400);
});
