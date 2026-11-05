import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3';

const Body = z.object({
  items: z
    .array(z.object({ title: z.string().trim().min(1).max(300), description: z.string().max(2000).nullable().optional() }))
    .min(1)
    .max(40),
});

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const url = Deno.env.get('SUPABASE_URL');
    const anon = Deno.env.get('SUPABASE_ANON_KEY');
    const key = Deno.env.get('LOVABLE_API_KEY');
    if (!url || !anon || !key) return json({ error: 'config' }, 500);

    const authClient = createClient(url, anon, { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } });
    const { data: u } = await authClient.auth.getUser();
    if (!u?.user) return json({ error: 'unauthorized' }, 401);

    const parsed = Body.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
    const items = parsed.data.items;

    const resp = await fetch('https://ai.gateway.lovable.dev/v1/responses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Lovable-API-Key': key, 'X-Lovable-AIG-SDK': 'fetch' },
      body: JSON.stringify({
        model: 'openai/gpt-6-astra',
        store: false,
        reasoning: { effort: 'low' },
        instructions:
          'Translate Dutch restaurant task-list items (front of house and kitchen) into short, natural English for international staff. Keep imperative style, keep brand names, numbers and abbreviations like MEP. Return the same number of items in the same order. If description is null or empty, return null for it.',
        input: JSON.stringify(items.map((i) => ({ title: i.title, description: i.description || null }))),
        text: {
          format: {
            type: 'json_schema',
            name: 'vertalingen',
            strict: true,
            schema: {
              type: 'object',
              additionalProperties: false,
              required: ['items'],
              properties: {
                items: {
                  type: 'array',
                  items: {
                    type: 'object',
                    additionalProperties: false,
                    required: ['title_en', 'description_en'],
                    properties: { title_en: { type: 'string' }, description_en: { type: ['string', 'null'] } },
                  },
                },
              },
            },
          },
        },
      }),
    });

    if (!resp.ok) {
      const status = [402, 403, 429].includes(resp.status) ? resp.status : 502;
      console.warn('translate-task gateway', resp.status);
      return json({ error: 'gateway_error' }, status);
    }
    const data = await resp.json();
    let text = '';
    for (const o of data?.output ?? []) for (const c of o?.content ?? []) if (c?.type === 'output_text') text += c.text ?? '';
    const out = JSON.parse(text)?.items;
    if (!Array.isArray(out) || out.length !== items.length) return json({ error: 'bad_output' }, 502);
    return json({
      items: out.map((r: { title_en?: unknown; description_en?: unknown }) => ({
        title_en: String(r?.title_en ?? '').trim().slice(0, 300) || null,
        description_en: typeof r?.description_en === 'string' && r.description_en.trim() ? r.description_en.trim().slice(0, 2000) : null,
      })),
    });
  } catch (e) {
    console.error('translate-task', e);
    return json({ error: 'internal' }, 500);
  }
});
