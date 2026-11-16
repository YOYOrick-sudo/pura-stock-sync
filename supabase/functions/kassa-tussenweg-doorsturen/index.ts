import { createClient } from "npm:@supabase/supabase-js@2";
import { VESTIGINGEN, amsDag, plusDag, bouwProducten, bouwUren, kiesDagen } from "./logica.ts";

const DOEL = "https://nqhzgefqrohpirjabewu.supabase.co/functions/v1/kassa-tussenweg";
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json" } });
const wacht = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Dag = { dag: string; opgehaald_op: string; uren: unknown[]; producten: unknown[] };

async function post(geheim: string, body: unknown): Promise<{ status: number; fout?: string }> {
  try {
    const res = await fetch(DOEL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-tazza-tussenweg": geheim },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(25_000),
    });
    let fout: string | undefined;
    try { const j = await res.json(); fout = typeof j?.fout === "string" ? j.fout : undefined; } catch { /* geen json */ }
    return { status: res.status, fout };
  } catch { return { status: 0 }; }
}

async function bouwDag(sb: any, naam: string, dag: string, laatsteSync: string | null, recent: boolean): Promise<Dag | null> {
  const [u, p] = await Promise.all([
    sb.from("omzet_uren").select("uur,omzet_incl,omzet_excl,aantal_bonnen,updated_at").eq("vestiging", naam).eq("werkdag", dag).eq("is_demo", false),
    sb.from("kassa_verkoop_dag").select("lightspeed_product_id,productnaam,aantal,omzet_incl,omzet_excl,updated_at").eq("vestiging", naam).eq("datum", dag).limit(5000),
  ]);
  if (u.error || p.error) throw new Error("lezen_mislukt");
  const stamps = [...(u.data ?? []), ...(p.data ?? [])].map((r: any) => r.updated_at as string).filter(Boolean).sort();
  const opgehaald = stamps.at(-1) ?? (recent ? laatsteSync : null);
  if (!opgehaald) return null;
  return { dag, opgehaald_op: new Date(opgehaald).toISOString(), uren: bouwUren(u.data ?? []), producten: bouwProducten(p.data ?? []) };
}

async function verstuur(geheim: string, vest: string, dagen: Dag[]) {
  const body = (d: Dag[]) => ({ versie: 1, vestiging: vest, verstuurd_op: new Date().toISOString(), dagen: d });
  let r = await post(geheim, body(dagen));
  if (r.status === 0 || r.status >= 500 && r.status !== 503) { await wacht(60_000); r = await post(geheim, body(dagen)); }
  if (r.status !== 413) return { status: r.status, fout: r.fout, mislukt: r.status === 200 ? [] : dagen.map((d) => d.dag) };
  // Te groot: één dag per verzoek.
  const mislukt: string[] = []; let laatste = 413; let fout: string | undefined;
  for (const d of dagen) { const x = await post(geheim, body([d])); laatste = x.status; fout = x.fout ?? fout; if (x.status !== 200) mislukt.push(d.dag); }
  return { status: laatste, fout, mislukt };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ fout: "alleen POST" }, 405);
  const url = Deno.env.get("SUPABASE_URL"); const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !service) return json({ fout: "serverconfiguratie ontbreekt" }, 500);
  const cron = Deno.env.get("CRON_SYNC_TOKEN") ?? "";
  const isCron = cron.length > 0 && (req.headers.get("x-sync-token") ?? "") === cron;
  const isService = (req.headers.get("Authorization") ?? "") === `Bearer ${service}`;
  if (!isCron && !isService) return json({ fout: "niet toegestaan" }, 401);
  let herstart = false;
  try { const b = await req.json(); herstart = b?.herstart === true; } catch { /* leeg */ }

  const geheim = Deno.env.get("TAZZA_TUSSENWEG_GEHEIM");
  if (!geheim) { console.log("tussenweg: geheim ontbreekt"); return json({ resultaat: "geheim_ontbreekt" }); }

  const sb = createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } });
  if (herstart) await sb.from("tazza_tussenweg_staat").update({ gestopt: null, updated_at: new Date().toISOString() }).eq("gestopt", "geheim");
  const { data: staat } = await sb.from("tazza_tussenweg_staat").select("vestiging,gestopt,open_dagen");
  const st = new Map((staat ?? []).map((s: any) => [s.vestiging, s]));
  if (st.get("*")?.gestopt === "geheim") { console.log("tussenweg: gestopt wegens 401 geheim"); return json({ resultaat: "gestopt_geheim" }); }
  const { data: kopp } = await sb.from("lightspeed_connections").select("vestiging,merchant_id,laatste_sync_op").in("merchant_id", [...VESTIGINGEN]);
  const vandaag = amsDag(new Date());
  const uitkomst: Record<string, unknown> = {};

  await Promise.all(VESTIGINGEN.map(async (vest) => {
    const t0 = Date.now();
    const s = st.get(vest);
    if (s?.gestopt === "voorrang_eigen_koppeling") { uitkomst[vest] = "gestopt_eigen_koppeling"; return; }
    const k = (kopp ?? []).find((x: any) => x.merchant_id === vest);
    if (!k) { console.log(`tussenweg: ${vest} geen koppeling`); uitkomst[vest] = "geen_koppeling"; return; }
    const { nu, later } = kiesDagen(vandaag, (s?.open_dagen ?? []) as string[]);
    let dagen: Dag[] = [];
    try {
      for (const d of nu) { const x = await bouwDag(sb, k.vestiging, d, k.laatste_sync_op, d >= plusDag(vandaag, -1)); if (x) dagen.push(x); }
    } catch { console.log(`tussenweg: ${vest} lezen mislukt`); uitkomst[vest] = "lezen_mislukt"; return; }
    dagen = dagen.slice(0, 3);
    if (dagen.length === 0) { uitkomst[vest] = "geen_dagen"; return; }
    const r = await verstuur(geheim, vest, dagen);
    const ms = Date.now() - t0;
    console.log(`tussenweg: ${vest} dagen=${dagen.map((d) => d.dag).join(",")} status=${r.status} duur=${ms}ms`);
    if (r.status === 400) console.log(`tussenweg: vorm 400 voor ${vest}`);
    let gestopt: string | null = null;
    if (r.status === 401) gestopt = "geheim";
    if (r.status === 409) gestopt = "voorrang_eigen_koppeling";
    // 400: zelfde body niet opnieuw proberen; overige fouten: volgende ronde opnieuw.
    const open = r.status === 400 ? later : [...new Set([...later, ...r.mislukt])];
    await sb.from("tazza_tussenweg_staat").upsert({ vestiging: gestopt === "geheim" ? "*" : vest, gestopt, open_dagen: gestopt === "geheim" ? [] : open, updated_at: new Date().toISOString() });
    if (gestopt === "geheim") await sb.from("tazza_tussenweg_staat").upsert({ vestiging: vest, gestopt: null, open_dagen: open, updated_at: new Date().toISOString() });
    uitkomst[vest] = r.status;
  }));
  return json({ resultaat: uitkomst });
});
