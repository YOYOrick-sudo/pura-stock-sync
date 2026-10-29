import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const VESTIGINGEN = new Set(["West", "Midsland"]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

async function tokenKlopt(header: string | null): Promise<boolean> {
  const verwacht = Deno.env.get("BOT_BESTELBORD_TOKEN");
  if (!verwacht || !header?.startsWith("Bearer ")) return false;
  const enc = new TextEncoder();
  const [a, b] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(header.slice(7))),
    crypto.subtle.digest("SHA-256", enc.encode(verwacht)),
  ]);
  const x = new Uint8Array(a), y = new Uint8Array(b);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || null;
  const url = new URL(req.url);

  let body: Record<string, unknown> = {};
  if (req.method === "POST") {
    try { body = await req.json(); } catch { body = {}; }
  }
  const actie = req.method === "GET" ? "lees" : req.method === "POST" ? String(body.actie ?? "bestellen") : "ongeldig";
  const vestiging = req.method === "GET" ? url.searchParams.get("vestiging") : (body.vestiging as string | undefined) ?? null;

  const geldigToken = await tokenKlopt(req.headers.get("Authorization"));
  const { data: start, error: startErr } = await db.rpc("bestelbot_aanroep_start", {
    p_actie: geldigToken ? actie : "geweigerd_token", p_vestiging: vestiging, p_ip: ip,
  });
  if (startErr || !start?.[0]) return json(500, { error: "Audit mislukt" });
  const { audit_id, toegestaan, http_status } = start[0];
  const sluit = (succes: boolean, resultaat: Record<string, unknown>, ids: string[] = []) =>
    db.rpc("bestelbot_aanroep_afsluiten", { p_audit_id: audit_id, p_succes: succes, p_resultaat: resultaat, p_ids: ids });
  const fout = async (status: number, error: string) => {
    await sluit(false, { http_status: status, fout: error });
    return json(status, { error });
  };

  if (!geldigToken) return fout(401, "Unauthorized");
  if (!toegestaan) return fout(http_status, http_status === 503 ? "Bot staat uit" : "Te veel aanroepen");
  if (!vestiging || !VESTIGINGEN.has(vestiging)) return fout(400, "vestiging moet West of Midsland zijn");

  try {
    if (req.method === "GET") {
      const { data, error } = await db.rpc("bestelbot_lees_open", { p_vestiging: vestiging });
      if (error) return fout(500, "Lezen mislukt");
      await sluit(true, { http_status: 200, aantal: data.length });
      return json(200, { vestiging, regels: data });
    }
    if (req.method !== "POST") return fout(405, "Methode niet toegestaan");

    if (actie === "bestellen") {
      const regels = body.regels;
      if (!Array.isArray(regels) || regels.length < 1 || regels.length > 100 ||
        !regels.every((r) => r && typeof r === "object" && UUID.test(String(r.id)) &&
          (r.bestelreferentie == null || (typeof r.bestelreferentie === "string" && r.bestelreferentie.length <= 200)))) {
        return fout(400, "regels: 1-100 items met geldige id en optionele bestelreferentie");
      }
      const schoon = regels.map((r) => ({ id: r.id, bestelreferentie: r.bestelreferentie ?? null }));
      const { data, error } = await db.rpc("bestelbot_markeer_besteld", { p_vestiging: vestiging, p_regels: schoon });
      if (error) return fout(400, error.message);
      await sluit(true, { http_status: 200, resultaat: data }, schoon.map((r) => r.id));
      return json(200, { vestiging, resultaat: data });
    }

    if (actie === "koppel") {
      const { id, leverancier_id, artikel_id, match_zekerheid } = body as Record<string, unknown>;
      const okUuid = (v: unknown) => v == null || UUID.test(String(v));
      if (!UUID.test(String(id)) || !okUuid(leverancier_id) || !okUuid(artikel_id) ||
        (match_zekerheid != null && (typeof match_zekerheid !== "number" || match_zekerheid < 0 || match_zekerheid > 1))) {
        return fout(400, "Ongeldige koppeling");
      }
      const { data, error } = await db.rpc("bestelbot_koppel", {
        p_vestiging: vestiging, p_id: id, p_leverancier_id: leverancier_id ?? null,
        p_artikel_id: artikel_id ?? null, p_match: match_zekerheid ?? null,
      });
      if (error) return fout(400, error.message);
      await sluit(data?.status === "ok", { http_status: 200, resultaat: data }, [String(id)]);
      return json(200, data);
    }

    if (actie === "import_historie") {
      const rijen = body.rijen;
      if (!Array.isArray(rijen) || rijen.length < 1 || rijen.length > 500) return fout(400, "rijen: 1-500 items");
      const { data, error } = await db.rpc("bestelbot_import_historie", {
        p_vestiging: vestiging, p_rijen: rijen, p_audit_id: audit_id,
      });
      if (error) return fout(400, error.message);
      return json(200, data);
    }

    return fout(400, "Onbekende actie");
  } catch (_e) {
    return fout(500, "Onverwachte fout");
  }
});
