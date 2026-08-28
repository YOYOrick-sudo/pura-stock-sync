// TIJDELIJKE TESTFUNCTIE — mock van een leverancier-API voor de verificatieronde van stap 1b.
// Verwijderen zodra het verslag is geaccepteerd.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const body = await req.json().catch(() => ({}));
  const lines = (body as any).lines ?? [];

  return new Response(
    JSON.stringify({
      order_number: 'LEV-TEST-9001',
      status: 'accepted',
      total: 123.45,
      backorder_lines: lines.slice(0, 1).map((l: any) => ({ product_code: l.product_code })),
    }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  );
});
