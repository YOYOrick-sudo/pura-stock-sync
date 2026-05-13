// Edge function: scrapet vvvterschelling.nl/evenementen, parsed met Lovable AI
// (gemini-2.5-flash) en upsert in `terschelling_events`.
// Wordt 2x per week getriggerd via pg_cron, of handmatig.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VVV_URL = "https://www.vvvterschelling.nl/evenementen/";
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface ParsedEvent {
  name: string;
  start_date: string; // YYYY-MM-DD
  end_date?: string | null;
  description?: string | null;
  category?: string | null;
  location?: string | null;
  source_url?: string | null;
}

async function fetchVvvHtml(): Promise<string> {
  const res = await fetch(VVV_URL, {
    headers: { "User-Agent": "Mozilla/5.0 (PuraVida-Sync/1.0)" },
  });
  if (!res.ok) throw new Error(`VVV fetch failed: ${res.status}`);
  return await res.text();
}

/** Reduceer HTML tot tekst die in AI-context past */
function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 60000);
}

async function parseWithAI(text: string): Promise<ParsedEvent[]> {
  const today = new Date().toISOString().slice(0, 10);
  const prompt = `Je krijgt de tekst van de evenementenpagina van VVV Terschelling. 
Extracteer ALLE evenementen die je ziet en geef ze terug als JSON-array.

Vandaag is ${today}. Bepaal het juiste jaar op basis van context.
Datums in formaat YYYY-MM-DD. Als een event meerdere dagen duurt, vul end_date in.
Categorieën: cultuur, muziek, sport, markt, tradition, natuur, overig.

Voorbeeld: "9 t/m 17 mei 2026" → start_date 2026-05-09, end_date 2026-05-17.
Voorbeeld: "15 mei" zonder jaar → gebruik komend jaar.

Skip duplicaten. Skip alles dat geen specifiek evenement is (bv. "Lees meer" knoppen).

TEKST:
${text}`;

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: "Je extraheert evenementen uit tekst. Output ALLEEN geldige JSON via de tool." },
        { role: "user", content: prompt },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "save_events",
            description: "Sla geëxtraheerde evenementen op",
            parameters: {
              type: "object",
              properties: {
                events: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      start_date: { type: "string", description: "YYYY-MM-DD" },
                      end_date: { type: "string", description: "YYYY-MM-DD of leeg" },
                      description: { type: "string" },
                      category: {
                        type: "string",
                        enum: ["cultuur", "muziek", "sport", "markt", "tradition", "natuur", "overig"],
                      },
                      location: { type: "string", description: "Bijv. Midsland, West-Terschelling, Hoorn, Oosterend" },
                    },
                    required: ["name", "start_date"],
                  },
                },
              },
              required: ["events"],
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "save_events" } },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`AI gateway error ${res.status}: ${body}`);
  }

  const data = await res.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) throw new Error("AI returned no tool call");

  const args = JSON.parse(toolCall.function.arguments);
  return (args.events ?? []) as ParsedEvent[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    console.log("Fetching VVV page...");
    const html = await fetchVvvHtml();
    const text = htmlToText(html);
    console.log(`Reduced to ${text.length} chars, sending to AI...`);

    const events = await parseWithAI(text);
    console.log(`AI returned ${events.length} events`);

    if (events.length === 0) {
      return new Response(JSON.stringify({ ok: true, count: 0, message: "No events parsed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const now = new Date().toISOString();

    const rows = events
      .filter((e) => e.name && e.start_date && /^\d{4}-\d{2}-\d{2}$/.test(e.start_date))
      .map((e) => ({
        name: e.name.trim().slice(0, 200),
        start_date: e.start_date,
        end_date: e.end_date && /^\d{4}-\d{2}-\d{2}$/.test(e.end_date) ? e.end_date : null,
        description: e.description?.slice(0, 500) ?? null,
        category: e.category ?? "overig",
        location: e.location ?? null,
        source_url: VVV_URL,
        last_seen_at: now,
      }));

    const { error } = await supabase
      .from("terschelling_events")
      .upsert(rows, { onConflict: "name,start_date" });

    if (error) throw error;

    console.log(`Upserted ${rows.length} events`);
    return new Response(
      JSON.stringify({ ok: true, count: rows.length, events: rows.map((r) => `${r.start_date} ${r.name}`) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("Sync failed:", err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
