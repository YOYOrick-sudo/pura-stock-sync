import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

// Verstuurt een inkoopbestelling via het API-kanaal (§2.10a, o.a. Kooyman).
// Nooit stil falen: elke fout landt in inkoop_orders.laatste_fout + status verzenden_mislukt.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  const url = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  // Identiteit controleren
  const authHeader = req.headers.get('Authorization') ?? '';
  const authClient = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData } = await authClient.auth.getUser();
  if (!userData?.user) return json({ error: 'Niet ingelogd' }, 401);

  const admin = createClient(url, serviceKey);

  let orderId: string;
  try {
    const body = await req.json();
    orderId = String(body.order_id ?? '');
    if (!orderId) return json({ error: 'order_id ontbreekt' }, 400);
  } catch {
    return json({ error: 'Ongeldige body' }, 400);
  }

  const { data: order, error: orderErr } = await admin
    .from('inkoop_orders')
    .select('*, leveranciers:leverancier_id(naam, kanaal, api_basis_url)')
    .eq('id', orderId)
    .maybeSingle();
  if (orderErr || !order) return json({ error: 'Bestelling niet gevonden' }, 404);
  if (order.kanaal !== 'api') return json({ error: 'Deze leverancier gebruikt geen API-kanaal' }, 400);

  const faal = async (melding: string, status = 400) => {
    await admin
      .from('inkoop_orders')
      .update({ status: 'verzenden_mislukt', laatste_fout: melding })
      .eq('id', orderId);
    return json({ error: melding }, status);
  };

  const { data: config } = await admin
    .from('leverancier_vestiging_config')
    .select('*')
    .eq('leverancier_id', order.leverancier_id)
    .eq('vestiging', order.vestiging)
    .eq('actief', true)
    .maybeSingle();

  if (!config?.api_sleutel_referentie) {
    return await faal(
      `Geen API-configuratie voor ${order.vestiging}. Zonder sleutel kan deze bestelling niet op "besteld" komen.`,
      412,
    );
  }
  const apiKey = Deno.env.get(config.api_sleutel_referentie);
  if (!apiKey) {
    return await faal(`De sleutel "${config.api_sleutel_referentie}" ontbreekt in de secrets.`, 412);
  }
  const basisUrl = (order as any).leveranciers?.api_basis_url;
  if (!basisUrl) return await faal('Geen API-basis-URL bij deze leverancier ingevuld.', 412);

  const { data: regels } = await admin.from('inkoop_order_regels').select('*').eq('order_id', orderId);
  if (!regels?.length) return await faal('Bestelling heeft geen regels.', 400);

  const payload = {
    customer_number: config.klantnummer,
    idempotency_key: order.bestelnummer,
    delivery_date: order.leverdatum,
    lines: regels.map((r: any) => ({
      product_code: r.artikelnummer,
      description: r.omschrijving,
      quantity: Number(r.aantal),
      unit: r.besteleenheid_code,
    })),
  };

  let resp: Response;
  try {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 20000);
    resp = await fetch(`${basisUrl.replace(/\/$/, '')}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'Idempotency-Key': order.bestelnummer,
      },
      body: JSON.stringify(payload),
      signal: ac.signal,
    });
    clearTimeout(timer);
  } catch (e) {
    return await faal(`Leverancier niet bereikbaar: ${(e as Error).message}`, 502);
  }

  const tekst = await resp.text();
  if (!resp.ok) {
    return await faal(`Leverancier gaf ${resp.status}: ${tekst.slice(0, 500)}`, 502);
  }

  let extern: any = {};
  try {
    extern = JSON.parse(tekst);
  } catch {
    extern = {};
  }

  await admin
    .from('inkoop_orders')
    .update({
      status: 'besteld',
      besteld_op: new Date().toISOString(),
      verzonden_op: new Date().toISOString(),
      laatste_fout: null,
      extern_ordernummer: extern.order_number ?? extern.id ?? null,
      extern_status: extern.status ?? null,
      extern_totaal: extern.total ?? null,
    })
    .eq('id', orderId);

  // Backorderregels vastleggen
  const backorders: any[] = extern.backorder_lines ?? [];
  for (const bo of backorders) {
    const match = regels.find((r: any) => r.artikelnummer && r.artikelnummer === bo.product_code);
    if (match) {
      await admin.from('inkoop_order_regels').update({ is_backorder: true }).eq('id', match.id);
    }
  }

  return json({ ok: true, bestelnummer: order.bestelnummer, backorders: backorders.length });
});
