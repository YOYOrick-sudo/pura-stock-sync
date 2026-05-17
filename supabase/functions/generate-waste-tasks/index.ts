import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SOURCE_LABEL = { tst: 'TST (grote)', gemeente: 'Gemeente' } as const;
const FRACTION_LABEL = { restafval: 'Restafval', gft: 'GFT', papier: 'Papier', glas: 'Glas' } as const;

// Midsland gesloten dagen: maandag (1), dinsdag (2) — met uitzonderingen
const CLOSED_DOW_MIDSLAND = new Set([1, 2]);
const OPEN_EXCEPTIONS_MIDSLAND = new Set(['2026-06-15', '2026-06-16']);

function fmt(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Amsterdam',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(d);
}

function nlDate(offsetDays = 0): string {
  return fmt(new Date(Date.now() + offsetDays * 86400000));
}

function isMidslandClosed(dateStr: string): boolean {
  if (OPEN_EXCEPTIONS_MIDSLAND.has(dateStr)) return false;
  // parse YYYY-MM-DD as local — getUTCDay gives consistent dow
  const [y, m, d] = dateStr.split('-').map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return CLOSED_DOW_MIDSLAND.has(dow);
}

// Laatste open dag vóór pickup (max 7 dagen terug)
function previousOpenDayMidsland(pickupDateStr: string): string {
  const [y, m, d] = pickupDateStr.split('-').map(Number);
  for (let i = 1; i <= 7; i++) {
    const dt = new Date(Date.UTC(y, m - 1, d - i));
    const s = `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
    if (!isMidslandClosed(s)) return s;
  }
  // fallback: avond ervoor
  const dt = new Date(Date.UTC(y, m - 1, d - 1));
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const today = nlDate(0);
  const result: Record<string, unknown> = { today };

  try {
    const body = await req.json().catch(() => ({}));
    const mode = body?.mode ?? 'generate'; // 'generate' or 'escalate'

    if (mode === 'generate') {
      // a) Sluit-taak: kijk vooruit 7 dagen naar pickups zonder sluit_task_id.
      //    Plaats sluit-taak op laatste open dag vóór pickup, mits die dag <= today.
      const horizon = nlDate(7);
      const { data: upcomingPickups } = await supabase
        .from('waste_pickups')
        .select('*')
        .eq('location', 'Midsland')
        .gte('pickup_date', today)
        .lte('pickup_date', horizon)
        .is('sluit_task_id', null);

      const sluitInserted: { pickup: string; due: string; id: string }[] = [];
      for (const p of upcomingPickups ?? []) {
        const dueDate = previousOpenDayMidsland(p.pickup_date);
        // Alleen aanmaken als de due_date vandaag of in verleden is
        // (anders te vroeg — wachten tot juiste dag)
        if (dueDate > today) continue;

        const title = `🗑️ ${SOURCE_LABEL[p.source as keyof typeof SOURCE_LABEL]} ${FRACTION_LABEL[p.fraction as keyof typeof FRACTION_LABEL]}-container aan de weg zetten`;
        const { data: task, error } = await supabase
          .from('foh_tasks')
          .insert({
            location: 'Midsland',
            title,
            due_date: dueDate,
            phase: 'sluit',
            category: 'Afval',
            priority: 1,
            estimated_minutes: 5,
            description: `Container wordt opgehaald op ${p.pickup_date}`,
          })
          .select('id')
          .single();
        if (!error && task) {
          await supabase.from('waste_pickups').update({ sluit_task_id: task.id }).eq('id', p.id);
          sluitInserted.push({ pickup: p.pickup_date, due: dueDate, id: task.id });
        }
      }
      result.sluit_inserted = sluitInserted;

      // b) Tussen-taak voor vandaag (lege container ophalen).
      //    Alleen als vandaag een open dag is — anders is er niemand.
      if (!isMidslandClosed(today)) {
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
              category: 'Afval',
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
      } else {
        result.tussen_inserted = [];
        result.tussen_skipped = `Midsland gesloten op ${today}`;
      }
    }

    if (mode === 'escalate') {
      const tomorrow = nlDate(1);
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
