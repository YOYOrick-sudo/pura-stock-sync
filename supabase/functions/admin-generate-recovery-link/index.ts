import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON = Deno.env.get('SUPABASE_ANON_KEY')!;
const BOOTSTRAP_EMAIL = Deno.env.get('BOOTSTRAP_OWNER_EMAIL')?.toLowerCase() ?? '';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { email, redirect_to } = await req.json().catch(() => ({}));
    if (!email || typeof email !== 'string') return json({ error: 'email_required' }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Auth: privileged caller OR bootstrap-owner email
    const jwt = (req.headers.get('Authorization') ?? '').replace('Bearer ', '');
    let ok = false;
    if (jwt) {
      const uc = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: `Bearer ${jwt}` } } });
      const { data: userRes } = await uc.auth.getUser();
      if (userRes?.user) {
        const { data: roles } = await admin
          .from('user_roles').select('role').eq('user_id', userRes.user.id).eq('is_active', true);
        ok = (roles ?? []).some(r => ['owner', 'admin'].includes(r.role as string));
      }
    }
    if (!ok && BOOTSTRAP_EMAIL && email.toLowerCase() === BOOTSTRAP_EMAIL) ok = true;
    if (!ok) return json({ error: 'forbidden' }, 403);

    const { data, error } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo: redirect_to ?? 'https://intern.puravidafoodbar.nl/auth/set-password' },
    });
    if (error) return json({ error: error.message }, 400);
    return json({ ok: true, action_link: data.properties?.action_link, expires_at: data.properties?.email_otp });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
