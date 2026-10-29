import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON = Deno.env.get('SUPABASE_ANON_KEY')!;
const FALLBACK_ORIGIN = 'https://intern.puravidafoodbar.nl';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

type AuthUser = { id: string; email?: string; email_confirmed_at?: string | null; invited_at?: string | null };

async function alleUsers(admin: ReturnType<typeof createClient>): Promise<AuthUser[]> {
  const out: AuthUser[] = [];
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    out.push(...(data.users as AuthUser[]));
    if (data.users.length < 200) break;
  }
  return out;
}

function veiligeOrigin(input: unknown): string {
  if (typeof input !== 'string') return FALLBACK_ORIGIN;
  try {
    const u = new URL(input);
    if (u.protocol !== 'https:' && u.hostname !== 'localhost') return FALLBACK_ORIGIN;
    return u.origin;
  } catch {
    return FALLBACK_ORIGIN;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader.startsWith('Bearer ')) return json({ error: 'unauthorized' }, 401);

    const userClient = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: authHeader } } });
    const { data: { user: caller }, error: callerErr } = await userClient.auth.getUser();
    if (callerErr || !caller) return json({ error: 'unauthorized' }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: rollen } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', caller.id)
      .eq('is_active', true)
      .in('role', ['owner', 'admin']);
    if (!rollen || rollen.length === 0) return json({ error: 'forbidden' }, 403);

    const body = await req.json().catch(() => ({}));

    // Statusoverzicht per actief MT-lid
    if (body?.action === 'status') {
      const { data: leden, error } = await admin.from('mt_leden').select('email, naam').eq('actief', true);
      if (error) throw error;
      const users = await alleUsers(admin);
      const perEmail = new Map(users.filter((u) => u.email).map((u) => [u.email!.toLowerCase(), u]));
      return json({
        ok: true,
        leden: (leden ?? []).map((l) => {
          const u = perEmail.get(String(l.email).toLowerCase());
          return {
            email: l.email,
            naam: l.naam,
            heeft_user: !!u,
            bevestigd: !!u?.email_confirmed_at,
            uitgenodigd_op: u?.invited_at ?? null,
          };
        }),
      });
    }

    const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (!email || email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: 'email_required' }, 400);
    }

    const { data: lid } = await admin
      .from('mt_leden')
      .select('email, naam, actief')
      .ilike('email', email)
      .eq('actief', true)
      .maybeSingle();
    if (!lid) return json({ error: 'not_mt_lid' }, 400);

    const users = await alleUsers(admin);
    const bestaand = users.find((u) => u.email?.toLowerCase() === email);
    if (bestaand?.email_confirmed_at) return json({ error: 'heeft_al_account' }, 409);

    const origin = veiligeOrigin(body?.redirect_to);
    const { error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { first_name: lid.naam ?? undefined },
      redirectTo: `${origin}/auth/set-password?next=/mt-punt`,
    });
    if (inviteErr) return json({ error: inviteErr.message }, 400);

    return json({ ok: true, status: 'invited' });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'server_error' }, 500);
  }
});
