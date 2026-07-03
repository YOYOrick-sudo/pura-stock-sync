import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON = Deno.env.get('SUPABASE_ANON_KEY')!;
const BOOTSTRAP_EMAIL = Deno.env.get('BOOTSTRAP_OWNER_EMAIL')?.toLowerCase() ?? '';

const ALLOWED_ROLES = new Set(['staff', 'manager', 'owner']);
const ALLOWED_LOCATIONS = new Set(['West', 'Midsland']);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const {
      email,
      first_name,
      last_name,
      redirect_to,
      role: roleInput,
      locations: locsInput,
      mode, // 'invite' | 'resend'
    } = body ?? {};

    if (!email || typeof email !== 'string') return json({ error: 'email_required' }, 400);

    const role = (roleInput ?? 'staff') as string;
    const locations: string[] = Array.isArray(locsInput) && locsInput.length > 0
      ? locsInput
      : ['West', 'Midsland'];

    if (!ALLOWED_ROLES.has(role)) return json({ error: 'invalid_role' }, 400);
    for (const l of locations) {
      if (!ALLOWED_LOCATIONS.has(l)) return json({ error: 'invalid_location' }, 400);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Privilege check: owner/admin OR bootstrap
    const authHeader = req.headers.get('Authorization') ?? '';
    const jwt = authHeader.replace('Bearer ', '');
    let isPrivileged = false;
    let callerId: string | null = null;

    if (jwt) {
      const userClient = createClient(SUPABASE_URL, ANON, {
        global: { headers: { Authorization: `Bearer ${jwt}` } },
      });
      const { data: userRes } = await userClient.auth.getUser();
      if (userRes?.user) {
        callerId = userRes.user.id;
        const { data: roles } = await admin
          .from('user_roles')
          .select('role')
          .eq('user_id', userRes.user.id)
          .eq('is_active', true);
        isPrivileged = (roles ?? []).some(r => ['owner', 'admin'].includes(r.role as string));
      }
    }

    const { data: existing } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const existingUser = existing?.users?.find(u => (u.email ?? '').toLowerCase() === email.toLowerCase());

    let isBootstrap = false;
    if (!isPrivileged && BOOTSTRAP_EMAIL && email.toLowerCase() === BOOTSTRAP_EMAIL) {
      isBootstrap = !existingUser || !existingUser.email_confirmed_at;
    }

    if (!isPrivileged && !isBootstrap) return json({ error: 'forbidden' }, 403);

    // RESEND mode: re-invite existing unconfirmed user, keep roles
    if (mode === 'resend') {
      if (!existingUser) return json({ error: 'user_not_found' }, 404);
      if (existingUser.email_confirmed_at) return json({ error: 'user_already_confirmed' }, 409);

      // Recreate to fire fresh invite email
      await admin.auth.admin.deleteUser(existingUser.id);
      const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
        data: { first_name: first_name ?? '', last_name: last_name ?? '' },
        redirectTo: redirect_to ?? 'https://intern.puravidafoodbar.nl/auth/set-password',
      });
      if (error) return json({ error: error.message }, 400);

      // Re-attach roles to new user id
      const newId = data.user?.id;
      if (newId) {
        await admin.from('user_roles')
          .insert(locations.map(loc => ({
            user_id: newId, role, location: loc, is_active: true,
          })));
      }
      return json({ ok: true, user_id: newId, status: 'reinvited' });
    }

    // Clean up any prior unconfirmed invite for the same email
    if (existingUser && !existingUser.email_confirmed_at) {
      await admin.from('user_roles').delete().eq('user_id', existingUser.id);
      const { error: delErr } = await admin.auth.admin.deleteUser(existingUser.id);
      if (delErr) return json({ error: `cleanup_failed: ${delErr.message}` }, 400);
    } else if (existingUser && existingUser.email_confirmed_at) {
      return json({ error: 'user_already_confirmed' }, 409);
    }

    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
      data: { first_name: first_name ?? '', last_name: last_name ?? '' },
      redirectTo: redirect_to ?? 'https://intern.puravidafoodbar.nl/auth/set-password',
    });
    if (error) return json({ error: error.message }, 400);

    const newId = data.user?.id;
    if (newId) {
      const { error: roleErr } = await admin.from('user_roles').insert(
        locations.map(loc => ({
          user_id: newId, role, location: loc, is_active: true,
        }))
      );
      if (roleErr) return json({ error: `role_insert_failed: ${roleErr.message}` }, 500);
    }

    return json({ ok: true, user_id: newId, bootstrap: isBootstrap, status: 'invited', invited_by: callerId });
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
