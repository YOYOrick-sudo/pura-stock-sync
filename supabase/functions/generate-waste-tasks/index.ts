import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SOURCE_LABEL = { tst: 'TST (grote)', gemeente: 'Gemeente' } as const;
const FRACTION_LABEL = { restafval: 'Restafval', gft: 'GFT', papier: 'Papier' } as const;

// Returns YYYY-MM-DD in Europe/Amsterdam
function nlDate(offsetDays = 0): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Amsterdam',
    year: 'numeric', month: '2-digit', day: '2-digit',
  });
  const base = new Date(Date.now() + offsetDays * 86400000);
  return fmt.format(base);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const today = nlDate(0);
  const tomorrow = nlDate(1);
  const result: Record<string, unknown> = { today, tomorrow };

  try {
    const body = await req.json().catch(() => ({}));
    const mode = body?.mode ?? 'generate'; // 'generate' or 'escalate'

    if (mode === 'generate') {
      // a) Sluit-taak voor morgen (aan de weg zetten - vandaag)
      const { data: tomorrowPickups } = await supabase
        .from('waste_pickups')
        .select('*')
        .eq('location', 'Midsland')
        .eq('pickup_date', tomorrow)
        .is('sluit_task_id', null);

      const sluitInserted: string[] = [];
      for (const p of tomorrowPickups ?? []) {
        const title = `🗑️ ${SOURCE_LABEL[p.source as keyof typeof SOURCE_LABEL]} ${FRACTION_LABEL[p.fraction as keyof typeof FRACTION_LABEL]}-container aan de weg zetten`;
        const { data: task, error } = await supabase
          .from('foh_tasks')
          .insert({
            location: 'Midsland',
            title,
            due_date: today,
            phase: 'sluit',
            category: 'Afval',
            priority: 1,
            estimated_minutes: 5,
            description: `Container morgen ophaal: ${tomorrow}`,
          })
          .select('id')
          .single();
        if (!error && task) {
          await supabase.from('waste_pickups').update({ sluit_task_id: task.id }).eq('id', p.id);
          sluitInserted.push(task.id);
        }
      }
      result.sluit_inserted = sluitInserted;

      // b) Tussen-taak voor vandaag (lege container ophalen)
      const { data: todayPickups } = await supabase
        .from('waste_pickups')
        .select('*')
        .eq('location', 'Midsland')
        .eq('pickup_date', today)
        .is('tussen_task_id', null);

      const tussenInserted: string[] = [];
      for (const p of todayPickups ?? []) {
        const title = `♻️ Lege ${SOURCE_LABEL[p.source as keyof typeof SOURCE_LABEL]} ${FRACTION_LABEL[p.fraction as keyof typeof FRACTION_LABEL]}-container ophalen`;
        const { data: task, error } = await supabase
          .from('foh_tasks')
          .insert({
            location: 'Midsland',
            title,
            due_date: today,
            phase: 'tussen',
            category: 'Algemeen',
            priority: 2,
            estimated_minutes: 5,
            description: 'Container terug van straat halen',
          })
          .select('id')
          .single();
        if (!error && task) {
          await supabase.from('waste_pickups').update({ tussen_task_id: task.id }).eq('id', p.id);
          tussenInserted.push(task.id);
        }
      }
      result.tussen_inserted = tussenInserted;
    }

    if (mode === 'escalate') {
      // Sluit-taken voor morgen die nog niet completed zijn en geen escalatie hadden
      const { data: open } = await supabase
        .from('waste_pickups')
        .select('id, source, fraction, sluit_task_id, foh_tasks:sluit_task_id(completed)')
        .eq('location', 'Midsland')
        .eq('pickup_date', tomorrow)
        .not('sluit_task_id', 'is', null)
        .is('escalation_sent_at', null);

      const escalated: string[] = [];
      for (const p of open ?? []) {
        const completed = (p as any).foh_tasks?.completed;
        if (completed) continue;

        // Vind managers/owners op Midsland
        const { data: roles } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('location', 'Midsland')
          .in('role', ['manager', 'owner', 'admin'])
          .eq('is_active', true);

        const label = `${SOURCE_LABEL[p.source as keyof typeof SOURCE_LABEL]} ${FRACTION_LABEL[p.fraction as keyof typeof FRACTION_LABEL]}`;
        const notifs = (roles ?? []).map((r) => ({
          user_id: r.user_id,
          location: 'Midsland',
          title: '⚠️ Container niet aan de weg gezet',
          message: `${label} wordt morgen opgehaald — controleer vóór 7:00 of de container buiten staat.`,
          link: '/taken-bediening',
        }));
        if (notifs.length) await supabase.from('notifications').insert(notifs);

        await supabase.from('waste_pickups').update({ escalation_sent_at: new Date().toISOString() }).eq('id', p.id);
        escalated.push(p.id);
      }
      result.escalated = escalated;
    }

    return new Response(JSON.stringify({ ok: true, ...result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
