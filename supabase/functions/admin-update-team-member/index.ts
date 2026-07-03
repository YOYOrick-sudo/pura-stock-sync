import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON = Deno.env.get('SUPABASE_ANON_KEY')!;

const ALLOWED_ROLES = new Set(['staff', 'manager', 'owner']);
const ALLOWED_LOCATIONS = new Set(['West', 'Midsland']);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const { action, user_id, role, locations, is_active } = body ?? {};

    if (!action || !user_id) return json({ error: 'action_and_user_id_required' }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Auth check: caller must be owner/admin
    const authHeader = req.headers.get('Authorization') ?? '';
    const jwt = authHeader.replace('Bearer ', '');
    if (!jwt) return json({ error: 'unauthorized' }, 401);

    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });
    const { data: userRes } = await userClient.auth.getUser();
    if (!userRes?.user) return json({ error: 'unauthorized' }, 401);

    const callerId = userRes.user.id;
    const { data: callerRoles } = await admin
      .from('user_roles').select('role')
      .eq('user_id', callerId).eq('is_active', true);
    const callerIsOwner = (callerRoles ?? []).some(r => ['owner', 'admin'].includes(r.role as string));
    if (!callerIsOwner) return json({ error: 'forbidden' }, 403);

    // Helper: assert not last owner if we're removing owner status
    async function assertNotLastOwner(targetId: string, willKeepOwner: boolean) {
      if (willKeepOwner) return;
      const { data: owners } = await admin
        .from('user_roles')
        .select('user_id, role, is_active')
        .in('role', ['owner', 'admin'])
        .eq('is_active', true);
      const activeOwnerIds = new Set((owners ?? []).map(o => o.user_id));
      activeOwnerIds.delete(targetId);
      if (activeOwnerIds.size === 0) {
        throw new Error('last_owner_protection');
      }
    }

    if (action === 'update_role') {
      if (!ALLOWED_ROLES.has(role)) return json({ error: 'invalid_role' }, 400);

      // Get current locations of target
      const { data: currentRows } = await admin
        .from('user_roles').select('*').eq('user_id', user_id);
      const currentLocs = [...new Set((currentRows ?? []).map(r => r.location))];
      const targetLocs = currentLocs.length > 0 ? currentLocs : ['West', 'Midsland'];

      const willKeepOwner = role === 'owner';
      try {
        await assertNotLastOwner(user_id, willKeepOwner);
      } catch (e) {
        return json({ error: (e as Error).message }, 409);
      }

      // Delete existing, insert new
      await admin.from('user_roles').delete().eq('user_id', user_id);
      const { error: insErr } = await admin.from('user_roles').insert(
        targetLocs.map(loc => ({ user_id, role, location: loc, is_active: true }))
      );
      if (insErr) return json({ error: insErr.message }, 500);
      return json({ ok: true });
    }

    if (action === 'update_locations') {
      if (!Array.isArray(locations) || locations.length === 0)
        return json({ error: 'locations_required' }, 400);
      for (const l of locations) {
        if (!ALLOWED_LOCATIONS.has(l)) return json({ error: 'invalid_location' }, 400);
      }

      const { data: currentRows } = await admin
        .from('user_roles').select('*').eq('user_id', user_id);
      const currentRole = currentRows?.[0]?.role ?? 'staff';
      const currentActive = currentRows?.[0]?.is_active ?? true;

      await admin.from('user_roles').delete().eq('user_id', user_id);
      const { error: insErr } = await admin.from('user_roles').insert(
        locations.map(loc => ({ user_id, role: currentRole, location: loc, is_active: currentActive }))
      );
      if (insErr) return json({ error: insErr.message }, 500);
      return json({ ok: true });
    }

    if (action === 'set_active') {
      if (typeof is_active !== 'boolean') return json({ error: 'is_active_required' }, 400);

      if (!is_active) {
        // Deactivating: check owner protection
        const { data: targetRoles } = await admin
          .from('user_roles').select('role, is_active').eq('user_id', user_id);
        const isTargetOwner = (targetRoles ?? []).some(
          r => ['owner', 'admin'].includes(r.role as string) && r.is_active
        );
        if (isTargetOwner) {
          try {
            await assertNotLastOwner(user_id, false);
          } catch {
            return json({ error: 'last_owner_protection' }, 409);
          }
        }
        // Prevent self-deactivation
        if (user_id === callerId) return json({ error: 'cannot_deactivate_self' }, 409);
      }

      const { error } = await admin
        .from('user_roles').update({ is_active }).eq('user_id', user_id);
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true });
    }

    return json({ error: 'unknown_action' }, 400);
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
