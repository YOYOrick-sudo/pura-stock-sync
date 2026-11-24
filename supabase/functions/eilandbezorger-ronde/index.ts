// Aparte cron-ingang: er zijn hier geen eigenaar-, beheer- of partneracties.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { gelijkeSleutel } from '../_shared/eilandbezorgerLogica.ts';
import { ronde } from '../_shared/eilandbezorgerRonde.ts';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response(null, { status: 405 });
  if (!gelijkeSleutel(req.headers.get('x-sync-token') ?? '', Deno.env.get('CRON_SYNC_TOKEN') ?? '')) {
    return new Response(null, { status: 401 });
  }
  const bericht = await req.json().catch(() => null);
  // Controleer de echte gateway en Vault-koppeling zonder een bestelling te claimen.
  if (bericht?.actie === 'controle') return Response.json({ gereed: true });
  if (bericht?.actie !== 'ronde') return Response.json({ fout: 'ongeldige actie' }, { status: 400 });

  try {
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false, autoRefreshToken: false } });
    return Response.json(await ronde(admin));
  } catch {
    return Response.json({ fout: 'Eilandbezorger-ronde mislukt' }, { status: 500 });
  }
});
