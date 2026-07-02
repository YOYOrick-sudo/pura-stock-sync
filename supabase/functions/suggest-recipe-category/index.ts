import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const key = Deno.env.get('LOVABLE_API_KEY');
    if (!key) {
      return new Response(JSON.stringify({ error: 'Missing LOVABLE_API_KEY' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({}));
    const name = String(body?.name ?? '').trim();
    const ingredients: string[] = Array.isArray(body?.ingredients) ? body.ingredients.slice(0, 20) : [];
    const existing: string[] = Array.isArray(body?.existingCategories) ? body.existingCategories.slice(0, 30) : [];

    if (!name) {
      return new Response(JSON.stringify({ error: 'name required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const system = `Je bent een keukenassistent die recepten indeelt in categorieën.
Antwoord met ALLEEN de categorienaam, één of twee woorden, geen uitleg, geen leestekens.
Gebruik bij voorkeur één van deze bestaande categorieën: ${existing.length ? existing.join(', ') : '(nog geen)'}.
Alleen als geen van die past, mag je een nieuwe korte Nederlandse categorie voorstellen (bijv. "Saus", "Voorgerecht", "Bijgerecht", "Hoofdgerecht", "Dessert", "Bakwerk", "Soep", "Marinade", "Dressing").`;

    const user = `Recept: ${name}${ingredients.length ? `\nIngrediënten: ${ingredients.join(', ')}` : ''}`;

    const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Lovable-API-Key': key,
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    });

    if (resp.status === 429) {
      return new Response(JSON.stringify({ error: 'rate_limited' }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (resp.status === 402) {
      return new Response(JSON.stringify({ error: 'credits_exhausted' }), {
        status: 402,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (!resp.ok) {
      const t = await resp.text();
      return new Response(JSON.stringify({ error: 'gateway_error', detail: t }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await resp.json();
    let category: string = data?.choices?.[0]?.message?.content ?? '';
    category = category.trim().replace(/^["'`]+|["'`.!?]+$/g, '').split('\n')[0].trim();
    // capitalize first letter
    if (category.length > 0) category = category[0].toUpperCase() + category.slice(1);

    return new Response(JSON.stringify({ category }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
