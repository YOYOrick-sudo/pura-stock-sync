// Stap 78: alleen GET bij Kooyman; vergelijken schrijft uitsluitend het sync-log.
import { createClient } from "npm:@supabase/supabase-js@2.118.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2.118.0/cors";
import { z } from "npm:zod@3";

const KOOYMAN_URL = "https://v2.kooyman-grootverbruik.nl/api/public/v1";
const KOOYMAN_ID = "42fb7e67-42ca-4c2e-80f4-9d947b2ea825";
const KEY_ENV = { West: "KOOYMAN_API_KEY_DAILY", Midsland: "KOOYMAN_API_KEY_FOODBAR" } as const;
const PRIJSVELDEN = new Set(["unit_price_excl_vat", "line_total_excl_vat", "vat_rate", "price", "total"]);
const object = z.object({}).passthrough();
const documentSchema = object.extend({ lines: z.array(object).optional() });
export const BodySchema = z.object({
  bronnen: z.array(z.enum(["West", "Midsland"])).min(1).max(2).default(["West", "Midsland"]),
  doel: z.literal("Test").optional(),
  modus: z.enum(["schrijf", "vergelijk"]).default("schrijf"),
  dagen: z.number().int().nonnegative().max(365).default(3),
  geen_pakbon: z.boolean().default(false),
  alleen_op_tijd: z.boolean().default(false),
  invoer: z.object({ backorders: z.array(documentSchema), leveringen: z.array(documentSchema) }).optional(),
}).strict().refine((b) => !b.invoer || b.doel === "Test", { message: "invoer alleen met doel Test" });
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...corsHeaders, "Content-Type": "application/json" },
});

export function zonderPrijs(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(zonderPrijs);
  if (value && typeof value === "object") return Object.fromEntries(
    Object.entries(value).filter(([key]) => !PRIJSVELDEN.has(key)).map(([key, item]) => [key, zonderPrijs(item)]),
  );
  return value;
}
const amsterdam = (d = new Date()) => new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Europe/Amsterdam", year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", hour12: false,
}).format(d);

async function kooyman(bron: keyof typeof KEY_ENV, path: string): Promise<[number, unknown]> {
  const key = Deno.env.get(KEY_ENV[bron]);
  if (!key) throw new Error(`secret ${KEY_ENV[bron]} ontbreekt`);
  let response: Response;
  try {
    response = await fetch(KOOYMAN_URL + path, {
      method: "GET", redirect: "error", signal: AbortSignal.timeout(30000),
      headers: { "X-API-Key": key, Accept: "application/json" },
    });
  } catch { throw new Error(`Kooyman ${bron}: ophalen mislukt`); }
  const text = await response.text();
  let data: unknown = null;
  try { data = JSON.parse(text); } catch { /* Geen JSON: status wordt door de aanroeper afgehandeld. */ }
  return [response.status, data];
}

async function ophalen(bron: keyof typeof KEY_ENV, dagen: number, pakbon: boolean) {
  const [status, data] = await kooyman(bron, "/backorders");
  if (status !== 200) throw new Error(`/backorders ${bron}: HTTP ${status}`);
  const parsed = z.object({ backorders: z.array(documentSchema).default([]) }).safeParse(data);
  if (!parsed.success) throw new Error(`Kooyman ${bron}: ongeldige backorders`);
  const leveringen: z.infer<typeof documentSchema>[] = [];
  if (pakbon) {
    const [s2, d2] = await kooyman(bron, "/deliveries?limit=50");
    if (s2 !== 200) throw new Error(`/deliveries ${bron}: HTTP ${s2}`);
    const lijst = z.object({ deliveries: z.array(z.object({
      order_number: z.union([z.string().min(1), z.number().finite()]),
      delivery_date: z.string().nullish(), delivered_at: z.string().nullish(),
    })).default([]) }).safeParse(d2);
    if (!lijst.success) throw new Error(`Kooyman ${bron}: ongeldige leveringen`);
    const vandaag = new Date(amsterdam().slice(0, 10) + "T12:00:00Z");
    const grens = new Date(vandaag.getTime() - dagen * 86400000).toISOString().slice(0, 10);
    for (const levering of lijst.data.deliveries) {
      const dag = levering.delivery_date || (levering.delivered_at || "").slice(0, 10) || "";
      if (dag < grens) continue;
      const [s3, detail] = await kooyman(bron, "/deliveries/" + encodeURIComponent(levering.order_number));
      if (s3 === 409) continue;
      if (s3 !== 200) throw new Error(`/deliveries ${bron}: HTTP ${s3}`);
      const lev = documentSchema.safeParse(zonderPrijs(detail));
      if (!lev.success) throw new Error(`Kooyman ${bron}: ongeldige pakbon`);
      if (lev.data.lines?.length) leveringen.push(lev.data);
    }
  }
  return { backorders: parsed.data.backorders, leveringen };
}

export async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ fout: "alleen POST" }, 405);
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !service) return json({ fout: "serverconfiguratie ontbreekt" }, 500);
    const auth = req.headers.get("Authorization") ?? "";
    const sb = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
    const isService = auth === `Bearer ${service}`;
    let uid: string | undefined;
    if (!isService) {
      if (!auth.startsWith("Bearer ")) return json({ fout: "niet toegestaan" }, 401);
      const { data, error } = await sb.auth.getUser(auth.slice(7));
      uid = data?.user?.id;
      if (error || !uid) return json({ fout: "niet toegestaan" }, 401);
      const { data: mag, error: magError } = await sb.rpc("fase2_mag_vestiging", { _uid: uid, _vestiging: "Test" });
      if (magError || mag !== true) return json({ fout: "niet toegestaan" }, 403);
    }
    let raw: unknown;
    try { raw = await req.json(); } catch { return json({ fout: "ongeldige JSON" }, 400); }
    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) return json({ fout: "ongeldige invoer", details: parsed.error.issues.map((i) => ({ veld: i.path.join("."), melding: i.message })) }, 400);
    const body = parsed.data;
    if (!isService && body.doel !== "Test" && body.modus !== "vergelijk") {
      return json({ fout: "handmatig alleen doel Test of modus vergelijk" }, 403);
    }
    if (body.alleen_op_tijd) {
      const hm = amsterdam().slice(11, 16);
      if (!(hm >= "07:20" && hm <= "07:45") && !(hm >= "14:20" && hm <= "14:45")) return json({ overgeslagen: hm });
    }
    const { data: inst, error: instError } = await sb.from("ontvangst_instelling").select("waarde").eq("sleutel", "kooyman_sync_live").maybeSingle();
    if (instError) return json({ fout: "kooyman_sync_live kon niet worden gelezen" }, 500);
    const live = inst?.waarde === true || inst?.waarde === "true";
    const uit: Record<string, unknown>[] = [];
    for (const bron of body.bronnen) {
      const doel = body.doel === "Test" ? "Test" : bron;
      const log: Record<string, unknown> = { bron, doel, modus: body.modus };
      try {
        if (body.modus === "schrijf" && doel !== "Test" && !live) throw new Error("kooyman_sync_live staat uit: alleen doel Test of modus vergelijk");
        const gegevens = body.invoer ?? await ophalen(bron, body.dagen, !body.geen_pakbon);
        const schoon = z.object({ backorders: z.array(documentSchema), leveringen: z.array(documentSchema) }).parse(zonderPrijs(gegevens));
        const { backorders, leveringen } = schoon;
        Object.assign(log, { backorders, leveringen, n_backorders: backorders.length,
          n_backorder_regels: backorders.reduce((n, b) => n + (b.lines?.length ?? 0), 0),
          n_pakbonnen: leveringen.length, n_pakbon_regels: leveringen.reduce((n, l) => n + (l.lines?.length ?? 0), 0) });
        if (body.modus === "schrijf") {
          const res: Record<string, unknown> = {};
          const r1 = await sb.rpc("bestel_backorder_melden", { p_vestiging: doel, p_leverancier_id: KOOYMAN_ID,
            p_regels: backorders, p_volledig: true, p_bron_vestiging: doel === "Test" ? bron : null });
          if (r1.error) throw new Error("backorders: " + r1.error.message);
          res.backorders = r1.data;
          for (const lev of leveringen) {
            const r2 = await sb.rpc("ontvangst_pakbon_kooyman", { p_vestiging: doel, p_leverancier_id: KOOYMAN_ID, p_levering: lev });
            if (r2.error) throw new Error("pakbon: " + r2.error.message);
            res[`pakbon_${lev.order_number}`] = r2.data;
          }
          log.uitkomst = zonderPrijs(res);
        }
      } catch (error) {
        // Nooit externe responsebodies, headers of API-sleutels in foutlogs.
        let melding = error instanceof Error ? error.message : "onverwachte fout";
        for (const naam of Object.values(KEY_ENV)) {
          const secret = Deno.env.get(naam);
          if (secret) melding = melding.replaceAll(secret, "[afgeschermd]");
        }
        log.fout = melding;
      }
      const { error: logError } = await sb.from("kooyman_sync_log").insert(log);
      if (logError) return json({ fout: "sync-log opslaan mislukt", runs: uit }, 500);
      uit.push({ bron, doel, modus: body.modus, n_backorder_regels: log.n_backorder_regels ?? null,
        n_pakbonnen: log.n_pakbonnen ?? null, fout: log.fout ?? null });
    }
    return json({ runs: uit });
  } catch { return json({ fout: "onverwachte serverfout" }, 500); }
}

if (import.meta.main) Deno.serve(handler);