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

    const system = `Je bent een keukenassistent die recepten indeelt in categorieën van een restaurantkeuken.
Antwoord met ALLEEN de categorienaam, één woord indien mogelijk, geen uitleg, geen leestekens.

BESTAANDE CATEGORIEËN VAN DEZE KEUKEN: ${existing.length ? existing.join(', ') : '(nog geen)'}

BELANGRIJKSTE REGEL — kies bijna altijd uit de bestaande categorieën:
- Kies de bestaande categorie die het dichtst in de buurt komt, ook als de match niet perfect is.
- Voorbeeld: is er "Groente" en het recept is een groenterecept → "Groente" (niet "Bijgerecht" verzinnen).
- Voorbeeld: is er "Sauzen" en het recept is een dip/smeersel/dressing → "Sauzen".
- Bij twijfel: pak de dichtstbijzijnde bestaande categorie.

NIEUWE CATEGORIE alleen als het recept over een productgroep gaat die duidelijk NIET in de lijst zit
en waar geen enkele bestaande categorie logisch bij past. Voorbeelden:
- Er is nog geen "Vlees" en het recept is duidelijk een vleesbereiding (rundvlees, kip, varkensvlees) → "Vlees".
- Er is nog geen "Vis" en het recept is een visbereiding → "Vis".
- Er is nog geen "Pasta" en het recept is een pastaschotel → "Pasta".
Verzin NOOIT een nieuwe categorie als er al een redelijke bestaande categorie is.

Hints voor als er nog niks bestaat:
- Groenterecepten → "Groente". Dips/smeersels → "Sauzen". Marinades zijn alleen vloeistoffen om in te laten trekken.
- Soep → "Soep". Zoet/nagerecht → "Dessert". Brood/cake/koek → "Bakwerk".
- Voorgerechten/hapjes → "Voorgerecht". Hoofdgerechten → "Hoofdgerecht".`;

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
