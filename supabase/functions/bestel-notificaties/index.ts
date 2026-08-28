import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

// Twee signalen, idempotent per dag:
// 1. Besteldeadline vandaag per leverancier per vestiging zonder verzonden bestelling.
// 2. Interne order die op afhandeling wacht -> naar de LEVERENDE/producerende vestiging (to_location).
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const json = (b: unknown, s = 200) =>
    new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

  const nu = new Date();
  const dag = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam' }).format(nu);
  const weekdag = Number(
    new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Amsterdam', weekday: 'short' })
      .format(nu)
      .replace(/Sun|Mon|Tue|Wed|Thu|Fri|Sat/, (m) => String(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(m))),
  );

  const gemaakt: string[] = [];

  const ontvangers = async (vestiging: string) => {
    const { data } = await admin
      .from('user_roles')
      .select('user_id, role')
      .eq('is_active', true)
      .eq('location', vestiging)
      .in('role', ['manager', 'owner', 'admin']);
    return Array.from(new Set((data ?? []).map((r: any) => r.user_id)));
  };

  const stuur = async (userIds: string[], titel: string, bericht: string, sleutel: string) => {
    for (const uid of userIds) {
      const { data: bestaand } = await admin
        .from('notifications')
        .select('id')
        .eq('user_id', uid)
        .eq('link', sleutel)
        .gte('created_at', `${dag}T00:00:00Z`)
        .maybeSingle();
      if (bestaand) continue;
      await admin.from('notifications').insert({ user_id: uid, title: titel, message: bericht, link: sleutel });
      gemaakt.push(`${titel} -> ${uid}`);
    }
  };

  // 1. besteldeadlines
  const { data: besteldagen } = await admin
    .from('leverancier_besteldagen')
    .select('leverancier_id, vestiging, deadline_tijd, leveranciers:leverancier_id(naam)')
    .eq('actief', true)
    .is('deleted_at', null)
    .eq('weekdag', weekdag);

  for (const bd of besteldagen ?? []) {
    const vestigingen = bd.vestiging ? [bd.vestiging] : ['West', 'Midsland'];
    for (const v of vestigingen) {
      const { data: orders } = await admin
        .from('inkoop_orders')
        .select('id')
        .eq('vestiging', v)
        .eq('leverancier_id', bd.leverancier_id)
        .is('deleted_at', null)
        .in('status', ['verzonden', 'besteld', 'deels_ontvangen', 'ontvangen'])
        .gte('created_at', `${dag}T00:00:00Z`);
      if (orders?.length) continue;
      const naam = (bd as any).leveranciers?.naam ?? 'leverancier';
      await stuur(
        await ontvangers(v),
        `Besteldeadline vandaag: ${naam}`,
        `Er is vandaag nog geen bestelling verstuurd naar ${naam} voor ${v}${bd.deadline_tijd ? ` (deadline ${bd.deadline_tijd})` : ''}.`,
        `/inkooporders?deadline=${bd.leverancier_id}-${v}-${dag}`,
      );
    }
  }

  // 2. interne orders die wachten op de leverende vestiging
  const { data: wachtend } = await admin
    .from('internal_orders')
    .select('id, from_location, to_location, order_number, status')
    .eq('status', 'pending');

  for (const o of wachtend ?? []) {
    await stuur(
      await ontvangers(o.to_location),
      'Interne bestelling wacht op afhandeling',
      `${o.from_location} vraagt bestelling ${o.order_number ?? ''} aan bij ${o.to_location}.`,
      `/midsland-bestellingen?order=${o.id}`,
    );
  }

  return json({ ok: true, dag, weekdag, aangemaakt: gemaakt.length });
});
