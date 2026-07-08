// Tijdelijk debug-endpoint: roept de nieuwe K2-RPCs aan met de JWT van de aanroeper
// en rapporteert rijen-tellingen + foutmeldingen. Kan weg zodra debug klaar is.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  const url = Deno.env.get('SUPABASE_URL')!;
  const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
  const auth = req.headers.get('Authorization') ?? '';
  const client = createClient(url, anon, { global: { headers: { Authorization: auth } } });

  const q = new URL(req.url).searchParams;
  const p_van = q.get('van') ?? '2026-07-06';
  const p_tot = q.get('tot') ?? '2026-07-08';
  const p_vestigingen = (q.get('vest') ?? 'Midsland,West').split(',');

  const out: any = { p_van, p_tot, p_vestigingen };

  const { data: heat, error: e1 } = await client.rpc('rpc_cijfers_heatmap_bezet', {
    p_vestigingen, p_van, p_tot,
  });
  out.heatmap = e1 ? { error: e1.message, code: (e1 as any).code } : {
    n_rows: heat?.length ?? 0,
    n_with_oms: (heat ?? []).filter((r: any) => Number(r.gem_omzet) > 0).length,
    n_with_hc:  (heat ?? []).filter((r: any) => Number(r.gem_headcount) > 0).length,
    max_oms: Math.max(0, ...((heat ?? []).map((r: any) => Number(r.gem_omzet)))),
    sample: (heat ?? []).slice(0, 5),
  };

  const { data: loze, error: e2 } = await client.rpc('rpc_cijfers_loze_uren', {
    p_vestigingen, p_van, p_tot, p_top: 12,
  });
  out.loze_uren = e2 ? { error: e2.message, code: (e2 as any).code } : {
    n_rows: loze?.length ?? 0,
    sample: (loze ?? []).slice(0, 3),
  };

  const { data: whoami } = await client.auth.getUser();
  out.user = whoami?.user?.id ?? null;

  return new Response(JSON.stringify(out, null, 2), {
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
});
