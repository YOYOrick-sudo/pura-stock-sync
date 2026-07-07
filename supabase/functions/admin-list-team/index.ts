import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON = Deno.env.get('SUPABASE_ANON_KEY')!;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const authHeader = req.headers.get('Authorization') ?? '';
    const jwt = authHeader.replace('Bearer ', '');
    if (!jwt) return json({ error: 'unauthorized' }, 401);

    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });
    const { data: userRes } = await userClient.auth.getUser();
    if (!userRes?.user) return json({ error: 'unauthorized' }, 401);

    const { data: myRoles } = await admin
      .from('user_roles').select('role')
      .eq('user_id', userRes.user.id).eq('is_active', true);
    const isOwner = (myRoles ?? []).some(r => ['owner', 'admin'].includes(r.role as string));
    if (!isOwner) return json({ error: 'forbidden' }, 403);

    // Fetch all auth users (up to 1000)
    const { data: usersData } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const users = usersData?.users ?? [];

    // Fetch all roles
    const { data: allRoles } = await admin.from('user_roles').select('*');
    // Fetch profiles
    const { data: profiles } = await admin.from('profiles').select('user_id, first_name, last_name, mag_loonkosten_zien');

    const rolesByUser = new Map<string, any[]>();
    for (const r of allRoles ?? []) {
      const arr = rolesByUser.get(r.user_id) ?? [];
      arr.push(r);
      rolesByUser.set(r.user_id, arr);
    }
    const profileByUser = new Map<string, any>();
    for (const p of profiles ?? []) profileByUser.set(p.user_id, p);

    const team = users
      .filter(u => rolesByUser.has(u.id)) // only users with roles = team
      .map(u => {
        const roles = rolesByUser.get(u.id) ?? [];
        const activeRoles = roles.filter(r => r.is_active);
        const profile = profileByUser.get(u.id);
        const primaryRole = activeRoles[0]?.role
          ?? roles[0]?.role
          ?? null;
        const locations = [...new Set(activeRoles.map(r => r.location))];
        let status: 'active' | 'invited' | 'deactivated';
        if (activeRoles.length === 0) status = 'deactivated';
        else if (!u.email_confirmed_at && !u.last_sign_in_at) status = 'invited';
        else status = 'active';

        return {
          user_id: u.id,
          email: u.email,
          first_name: profile?.first_name ?? '',
          last_name: profile?.last_name ?? '',
          role: primaryRole,
          locations,
          status,
          last_sign_in_at: u.last_sign_in_at,
          email_confirmed_at: u.email_confirmed_at,
          mag_loonkosten_zien: !!profile?.mag_loonkosten_zien,
        };
      })
      .sort((a, b) => (a.email ?? '').localeCompare(b.email ?? ''));

    return json({ team });
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
