import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON = Deno.env.get('SUPABASE_ANON_KEY')!;
const BOOTSTRAP_EMAIL = Deno.env.get('BOOTSTRAP_OWNER_EMAIL')?.toLowerCase() ?? '';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const { email, first_name, last_name, redirect_to } = body ?? {};
    if (!email || typeof email !== 'string') return json({ error: 'email_required' }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Bootstrap: allow unauthenticated invite for exactly BOOTSTRAP_OWNER_EMAIL,
    // and only while no owner/admin exists yet in user_roles.
    const authHeader = req.headers.get('Authorization') ?? '';
    const jwt = authHeader.replace('Bearer ', '');
    let isPrivileged = false;

    if (jwt) {
      const userClient = createClient(SUPABASE_URL, ANON, {
        global: { headers: { Authorization: `Bearer ${jwt}` } },
      });
      const { data: userRes } = await userClient.auth.getUser();
      if (userRes?.user) {
        const { data: roles } = await admin
          .from('user_roles')
          .select('role')
          .eq('user_id', userRes.user.id)
          .eq('is_active', true);
        isPrivileged = (roles ?? []).some(r => ['owner', 'admin'].includes(r.role as string));
      }
    }

    let isBootstrap = false;
    if (!isPrivileged && BOOTSTRAP_EMAIL && email.toLowerCase() === BOOTSTRAP_EMAIL) {
      // Bootstrap allowed only if this email doesn't have an account yet.
      const { data: existing } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
      const already = existing?.users?.some(u => (u.email ?? '').toLowerCase() === BOOTSTRAP_EMAIL);
      isBootstrap = !already;
    }

    if (!isPrivileged && !isBootstrap) {
      return json({ error: 'forbidden' }, 403);
    }

    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { first_name: first_name ?? '', last_name: last_name ?? '' },
      redirectTo: redirect_to ?? 'https://intern.puravidafoodbar.nl/auth/set-password',
    });
    if (error) return json({ error: error.message }, 400);

    return json({ ok: true, user_id: data.user?.id, bootstrap: isBootstrap });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
