// Cijfers demo-data generator (owner-only).
// Vult omzet_uren met 365 dagen × 2 vestigingen × uur 10..23, is_demo=true.
// Idempotent: upsert op (vestiging, werkdag, uur).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const VESTIGINGEN = ['Midsland', 'West'] as const;
const UREN = Array.from({ length: 14 }, (_, i) => 10 + i); // 10..23

// Uurloon (all-in, incl. WG-lasten) per vestiging voor demo-loonkosten
const UURLOON = { Midsland: 18.5, West: 17.5 } as const;

function seededRandom(seed: number) {
  return () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

function generate(): Array<{
  vestiging: string; werkdag: string; uur: number;
  omzet_incl: number; omzet_excl: number; aantal_bonnen: number; is_demo: boolean;
}> {
  const rows: any[] = [];
  const rnd = seededRandom(42);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  for (let d = 365; d >= 1; d--) {
    const date = new Date(today);
    date.setUTCDate(date.getUTCDate() - d);
    const iso = date.toISOString().slice(0, 10);
    const dow = date.getUTCDay(); // 0=zo..6=za
    const doy = Math.floor((date.getTime() - Date.UTC(date.getUTCFullYear(), 0, 0)) / 86400000);

    // Seizoensfactor: piek dag 196 (~15 juli), dal dag 15 (~15 jan).
    const seizoen = 1 + 1.5 * Math.max(0, Math.sin(((doy - 105) / 365) * 2 * Math.PI));

    // Weekdag: 0=zo,1=ma..6=za
    const weekdagFactor = [1.2, 0.8, 0.8, 0.9, 1.0, 1.6, 1.7][dow];

    for (const vestiging of VESTIGINGEN) {
      const basis = vestiging === 'Midsland' ? 220 : 150; // gem. €/uur baseline

      // Winter-maandag soms dicht
      const isWinter = seizoen < 1.4;
      const isDichtDag = isWinter && dow === 1 && rnd() < 0.35;
      if (isDichtDag) {
        for (const uur of UREN) {
          rows.push({
            vestiging, werkdag: iso, uur,
            omzet_incl: 0, omzet_excl: 0, aantal_bonnen: 0, is_demo: true,
          });
        }
        continue;
      }

      for (const uur of UREN) {
        let dagcurve = 0.4;
        if (uur >= 12 && uur <= 14) dagcurve = 1.4;
        else if (uur >= 17 && uur <= 21) dagcurve = 2.0;
        else if (uur === 22 || uur === 23) dagcurve = 0.8;
        else if (uur === 10 || uur === 11) dagcurve = 0.5;

        const ruis = 0.9 + rnd() * 0.2;
        const inclNum = basis * seizoen * weekdagFactor * dagcurve * ruis;
        const incl = Math.round(inclNum * 100) / 100;
        const excl = Math.round((incl / 1.09) * 100) / 100;
        const bonnen = Math.max(0, Math.round(incl / 32 * (0.85 + rnd() * 0.3)));

        rows.push({
          vestiging, werkdag: iso, uur,
          omzet_incl: incl, omzet_excl: excl, aantal_bonnen: bonnen, is_demo: true,
        });
      }
    }
  }
  return rows;
}

function generateUrenDagen(omzetRows: Array<{ vestiging: string; werkdag: string; omzet_incl: number }>): Array<{
  vestiging: string; werkdag: string; gewerkte_uren: number; geplande_uren: number;
  loonkosten: number; loonkosten_bron: string; eitje_omzet_dag: number; is_demo: boolean;
}> {
  const rnd = seededRandom(1337);
  const perDag = new Map<string, number>(); // key = vestiging|werkdag → omzet
  for (const r of omzetRows) {
    const k = `${r.vestiging}|${r.werkdag}`;
    perDag.set(k, (perDag.get(k) ?? 0) + r.omzet_incl);
  }
  const out: any[] = [];
  for (const [k, omzet] of perDag) {
    const [vestiging, werkdag] = k.split('|');
    const uurloon = UURLOON[vestiging as keyof typeof UURLOON];
    if (omzet === 0) {
      // Gesloten dag: 0 uren, 0 loonkosten.
      out.push({
        vestiging, werkdag, gewerkte_uren: 0, geplande_uren: 0,
        loonkosten: 0, loonkosten_bron: 'eitje', eitje_omzet_dag: 0, is_demo: true,
      });
      continue;
    }
    // Target productiviteit ~ €75 omzet/gewerkt uur → uren = omzet/75
    const targetUren = omzet / 75;
    const geplande = Math.round(targetUren * (0.95 + rnd() * 0.15) * 4) / 4; // afgerond op 0.25
    const gewerkte = Math.round((geplande * (0.95 + rnd() * 0.20)) * 4) / 4; // ±10% t.o.v. planning
    const loonkosten = Math.round(gewerkte * uurloon * 100) / 100;
    out.push({
      vestiging, werkdag,
      gewerkte_uren: gewerkte,
      geplande_uren: geplande,
      loonkosten,
      loonkosten_bron: 'eitje',
      eitje_omzet_dag: Math.round(omzet * 100) / 100,
      is_demo: true,
    });
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const auth = req.headers.get('Authorization') ?? '';
    if (!auth.toLowerCase().startsWith('bearer ')) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(supabaseUrl, anon, {
      global: { headers: { Authorization: auth } },
    });
    const { data: userRes, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userRes.user) {
      return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const uid = userRes.user.id;

    const admin = createClient(supabaseUrl, service);
    const { data: isOwner } = await admin.rpc('has_role', { _user_id: uid, _role: 'owner' });
    const { data: isAdmin } = await admin.rpc('has_role', { _user_id: uid, _role: 'admin' });
    if (!isOwner && !isAdmin) {
      return new Response(JSON.stringify({ error: 'forbidden_owner_only' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Guard: mag niet mengen met echte data
    const { count: echtCount } = await admin
      .from('omzet_uren')
      .select('id', { count: 'exact', head: true })
      .eq('is_demo', false);
    if ((echtCount ?? 0) > 0) {
      return new Response(JSON.stringify({
        error: 'echte_data_aanwezig',
        detail: `Er staan ${echtCount} echte rijen. Demo-data zou echte data verdringen — geweigerd.`,
      }), { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const { count: urenEcht } = await admin
      .from('uren_dagen')
      .select('id', { count: 'exact', head: true })
      .eq('is_demo', false);
    if ((urenEcht ?? 0) > 0) {
      return new Response(JSON.stringify({
        error: 'echte_uren_data_aanwezig',
        detail: `Er staan ${urenEcht} echte uren-rijen. Demo-data geweigerd.`,
      }), { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }


    const rows = generate();

    // Chunk upsert
    const chunk = 1000;
    let done = 0;
    for (let i = 0; i < rows.length; i += chunk) {
      const slice = rows.slice(i, i + chunk);
      const { error } = await admin
        .from('omzet_uren')
        .upsert(slice, { onConflict: 'vestiging,werkdag,uur' });
      if (error) {
        return new Response(JSON.stringify({ error: 'upsert_failed', detail: error.message, done }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      done += slice.length;
    }

    // Uren_dagen demo (afgeleid van omzet, met loonkosten & eitje_omzet_dag)
    const urenRows = generateUrenDagen(rows);
    let urenDone = 0;
    for (let i = 0; i < urenRows.length; i += chunk) {
      const slice = urenRows.slice(i, i + chunk);
      const { error } = await admin
        .from('uren_dagen')
        .upsert(slice, { onConflict: 'vestiging,werkdag,is_demo' });
      if (error) {
        return new Response(JSON.stringify({ error: 'uren_upsert_failed', detail: error.message, uren_done: urenDone }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      urenDone += slice.length;
    }

    await admin.from('sync_runs').insert({
      bron: 'lightspeed', type: 'demo_seed', status: 'ok',
      bonnen_verwerkt: done, klaar_op: new Date().toISOString(),
      foutmelding: `Demo-data gegenereerd (omzet: ${done}, uren: ${urenDone})`,
    });

    return new Response(JSON.stringify({ ok: true, rijen: done, uren_rijen: urenDone }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'server_error', detail: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
