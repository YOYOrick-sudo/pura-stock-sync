import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const ALLERGENEN = [
  'gluten',
  'schaaldieren',
  'ei',
  'vis',
  'pinda',
  'soja',
  'melk',
  'noten',
  'selderij',
  'mosterd',
  'sesam',
  'sulfiet',
  'lupine',
  'weekdieren',
];

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
    const namen: string[] = Array.isArray(body?.namen)
      ? body.namen.map((n: unknown) => String(n ?? '').trim()).filter((n: string) => n.length > 0).slice(0, 25)
      : [];

    if (namen.length === 0) {
      return new Response(JSON.stringify({ error: 'namen required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const system = `Je bent een voedselveiligheidsassistent voor een Nederlandse horecakeuken.
Voor elk opgegeven ingrediënt bepaal je welke van de 14 wettelijke EU-allergenen erin zitten.

Toegestane codes (gebruik exact deze spelling): ${ALLERGENEN.join(', ')}.

Regels:
- "allergenen" = allergenen die er vrijwel zeker in zitten volgens het typische product met die naam.
- "sporen" = allergenen die door kruisbesmetting aanwezig kunnen zijn (alleen als dat gebruikelijk is voor dat producttype).
- Verse onbewerkte producten (groente, fruit, kruiden, water, zout) hebben meestal een lege lijst.
- Merknamen: ga uit van het bekende Nederlandse horecaproduct met die naam.
- Nooit gokken op basis van niets: als je het echt niet weet, geef lege lijsten en zet "onzeker": true.
- "reden": maximaal 12 woorden, Nederlands.

Antwoord met ALLEEN geldige JSON, geen uitleg, geen markdown:
{"resultaten":[{"naam":"...","allergenen":["..."],"sporen":["..."],"onzeker":false,"reden":"..."}]}
Gebruik exact dezelfde schrijfwijze van "naam" als in de invoer.`;

    const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Lovable-API-Key': key,
      },
      body: JSON.stringify({
        model: 'openai/gpt-5.6-sol',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: `Ingrediënten:\n${namen.map((n) => `- ${n}`).join('\n')}` },
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
    if (resp.status === 403) {
      return new Response(JSON.stringify({ error: 'blocked' }), {
        status: 403,
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
    const raw: string = data?.choices?.[0]?.message?.content ?? '';
    const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();

    let parsed: any = null;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      const m = cleaned.match(/\{[\s\S]*\}/);
      if (m) {
        try {
          parsed = JSON.parse(m[0]);
        } catch {
          parsed = null;
        }
      }
    }

    const lijst = Array.isArray(parsed?.resultaten) ? parsed.resultaten : [];
    const filter = (arr: unknown) =>
      Array.isArray(arr)
        ? Array.from(
            new Set(
              arr
                .map((v) => String(v ?? '').toLowerCase().trim())
                .filter((v) => ALLERGENEN.includes(v)),
            ),
          )
        : [];

    const resultaten = lijst
      .map((r: any) => ({
        naam: String(r?.naam ?? '').trim(),
        allergenen: filter(r?.allergenen),
        sporen: filter(r?.sporen),
        onzeker: Boolean(r?.onzeker),
        reden: String(r?.reden ?? '').slice(0, 160),
      }))
      .filter((r: any) => r.naam.length > 0);

    return new Response(JSON.stringify({ resultaten }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as any)?.message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
