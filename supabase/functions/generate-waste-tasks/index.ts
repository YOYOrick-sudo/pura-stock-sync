import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SOURCE_LABEL = { tst: 'TST (grote)', gemeente: 'Gemeente' } as const;
const FRACTION_LABEL = {
  restafval: 'Restafval',
  gft: 'GFT',
  papier: 'Papier',
  glas: 'Glas',
  klein_tuinafval: 'Klein tuinafval',
} as const;

// Per-locatie gesloten dagen (0=zon ... 6=zat) + uitzonderingen
const LOCATIONS = ['Midsland', 'West'] as const;
type Loc = typeof LOCATIONS[number];

const CLOSED_DOW: Record<Loc, Set<number>> = {
  Midsland: new Set([1, 2]), // ma + di
  West: new Set([3]),         // wo
};
const OPEN_EXCEPTIONS: Record<Loc, Set<string>> = {
  Midsland: new Set(['2026-06-15', '2026-06-16']),
  West: new Set(),
};

function fmt(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Amsterdam',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(d);
}

function nlDate(offsetDays = 0): string {
  return fmt(new Date(Date.now() + offsetDays * 86400000));
}

function isClosed(loc: Loc, dateStr: string): boolean {
  if (OPEN_EXCEPTIONS[loc].has(dateStr)) return false;
  const [y, m, d] = dateStr.split('-').map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return CLOSED_DOW[loc].has(dow);
}

// Laatste open dag vóór pickup (max 7 dagen terug)
function previousOpenDay(loc: Loc, pickupDateStr: string): string {
  const [y, m, d] = pickupDateStr.split('-').map(Number);
  for (let i = 1; i <= 7; i++) {
    const dt = new Date(Date.UTC(y, m - 1, d - i));
    const s = `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
    if (!isClosed(loc, s)) return s;
  }
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
  const result: Record<string, unknown> = { today, locations: {} as Record<string, unknown> };

  try {
    const body = await req.json().catch(() => ({}));
    const mode = body?.mode ?? 'generate';

    for (const loc of LOCATIONS) {
      const locResult: Record<string, unknown> = {};

      if (mode === 'generate') {
        // a) Sluit-taken
        const horizon = nlDate(7);
        const { data: upcomingPickups } = await supabase
          .from('waste_pickups')
          .select('*')
          .eq('location', loc)
          .gte('pickup_date', today)
          .lte('pickup_date', horizon)
          .is('sluit_task_id', null);

        const sluitInserted: { pickup: string; due: string; id: string }[] = [];
        for (const p of upcomingPickups ?? []) {
          const dueDate = previousOpenDay(loc, p.pickup_date);
          if (dueDate > today) continue;

          const title = `🗑️ ${SOURCE_LABEL[p.source as keyof typeof SOURCE_LABEL]} ${FRACTION_LABEL[p.fraction as keyof typeof FRACTION_LABEL]}-container aan de weg zetten`;
          const { data: task, error } = await supabase
            .from('foh_tasks')
            .insert({
              location: loc,
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
        locResult.sluit_inserted = sluitInserted;

        // b) Tussen-taak voor vandaag — alleen Midsland (West heeft geen tussenlijst)
        if (loc === 'Midsland' && !isClosed(loc, today)) {
          const { data: todayPickups } = await supabase
            .from('waste_pickups')
            .select('*')
            .eq('location', loc)
            .eq('pickup_date', today)
            .is('tussen_task_id', null);

          const tussenInserted: string[] = [];
          for (const p of todayPickups ?? []) {
            const title = `♻️ Lege ${SOURCE_LABEL[p.source as keyof typeof SOURCE_LABEL]} ${FRACTION_LABEL[p.fraction as keyof typeof FRACTION_LABEL]}-container ophalen`;
            const { data: task, error } = await supabase
              .from('foh_tasks')
              .insert({
                location: loc,
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
          locResult.tussen_inserted = tussenInserted;
        } else if (loc === 'Midsland') {
          locResult.tussen_inserted = [];
          locResult.tussen_skipped = `${loc} gesloten op ${today}`;
        } else {
          locResult.tussen_inserted = [];
          locResult.tussen_skipped = `${loc} heeft geen tussenlijst`;
        }
      }

      if (mode === 'escalate') {
        const tomorrow = nlDate(1);
        const { data: open } = await supabase
          .from('waste_pickups')
          .select('id, source, fraction, sluit_task_id, foh_tasks:sluit_task_id(completed)')
          .eq('location', loc)
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
            .eq('location', loc)
            .in('role', ['manager', 'owner', 'admin'])
            .eq('is_active', true);

          const label = `${SOURCE_LABEL[p.source as keyof typeof SOURCE_LABEL]} ${FRACTION_LABEL[p.fraction as keyof typeof FRACTION_LABEL]}`;
          const notifs = (roles ?? []).map((r) => ({
            user_id: r.user_id,
            location: loc,
            title: '⚠️ Container niet aan de weg gezet',
            message: `${label} wordt morgen opgehaald — controleer vóór 7:00 of de container buiten staat.`,
            link: '/taken-bediening',
          }));
          if (notifs.length) await supabase.from('notifications').insert(notifs);

          await supabase.from('waste_pickups').update({ escalation_sent_at: new Date().toISOString() }).eq('id', p.id);
          escalated.push(p.id);
        }
        locResult.escalated = escalated;
      }

      (result.locations as Record<string, unknown>)[loc] = locResult;
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
