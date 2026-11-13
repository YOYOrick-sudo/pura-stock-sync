import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const VESTIGINGEN = new Set(["West", "Midsland"]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
import { verwachteLeveringGeldig } from "./datum.ts";
import { adviesMetadataGeldig } from "./advies-metadata.ts";
import { leesDeactiveren, rpcOntbreekt } from "./deactiveren.ts";
import { leesOntvangen, planOntvangst, type BordRegel, type OntvangstPlan } from "./ontvangen.ts";

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

/** Zelfde uitkomst als de RPC, zolang de migratie nog niet draait: alleen status vervallen. */
async function deactiveerZonderFunctie(db: { from: (tabel: string) => any }, vestiging: string, ids: string[]) {
  const { data, error } = await db.from("bestel_signalen").select("id,status,vestiging").in("id", ids);
  if (error) throw new Error(error.message);
  const gevonden = new Map((data ?? []).map((r) => [r.id, r]));
  const openIds = ids.filter((id) => {
    const r = gevonden.get(id);
    return !!r && r.vestiging === vestiging && r.status === "open";
  });
  const gezet = new Set<string>();
  if (openIds.length) {
    const schrijf = await db.from("bestel_signalen").update({ status: "vervallen" }).in("id", openIds).eq("vestiging", vestiging).eq("status", "open").select("id");
    if (schrijf.error) throw new Error(schrijf.error.message);
    for (const rij of schrijf.data ?? []) gezet.add(rij.id);
  }
  return ids.map((id) => {
    const r = gevonden.get(id);
    if (!r || r.vestiging !== vestiging) return { id, status: "overgeslagen", reden: "niet gevonden voor deze vestiging" };
    if (r.status === "vervallen") return { id, status: "ok", reden: "al weg" };
    if (r.status === "open" && gezet.has(id)) return { id, status: "ok" };
    if (r.status === "open") return { id, status: "overgeslagen", reden: "status is intussen gewijzigd" };
    return { id, status: "overgeslagen", reden: "status is " + r.status };
  });
}

async function pasOntvangstToe(db: { from: (tabel: string) => any }, plan: Exclude<OntvangstPlan, { soort: "fout" }>, id: string, vestiging: string) {
  const schrijf = await db.from("bestel_signalen").update(plan.update).eq("id", id).eq("vestiging", vestiging).eq("status", "besteld").select("id");
  if (schrijf.error) throw new Error(schrijf.error.message);
  if (!schrijf.data?.length) throw new Error("status is niet besteld");
  if (plan.soort === "deels") {
    const nieuw = await db.from("bestel_signalen").insert(plan.restant);
    if (nieuw.error) throw new Error(nieuw.error.message);
  }
}

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
  // Prijzen gelden per rij (vestiging leeg = beide); de andere acties vragen één vestiging.
  if (actie === "prijzen" && req.method === "POST") {
    const rijen = body.rijen;
    if (!Array.isArray(rijen) || rijen.length < 1 || rijen.length > 1000 || !rijen.every((r) => r && typeof r === "object" && !Array.isArray(r))) {
      return fout(400, "rijen: 1-1000 objecten");
    }
    try {
      const { data, error } = await db.rpc("bestelbot_prijzen_opslaan", { p_rijen: rijen });
      if (error) return fout(400, error.message);
      await sluit(true, { http_status: 200, resultaat: data });
      return json(200, data);
    } catch (_e) {
      return fout(500, "Onverwachte fout");
    }
  }
  if (!vestiging || !VESTIGINGEN.has(vestiging)) return fout(400, "vestiging moet West of Midsland zijn");

  try {
    if (req.method === "GET") {
      const status = url.searchParams.get("status") ?? "open";
      if (status !== "open" && status !== "besteld") return fout(400, "status moet open of besteld zijn");
      if (url.searchParams.get("versie") === "2" && status === "open") {
        const { data: data2, error: error2 } = await db.rpc("bestelbot_lees_open_v2", { p_vestiging: vestiging });
        if (error2) return fout(500, "Lezen mislukt");
        await sluit(true, { http_status: 200, aantal: data2.length, versie: 2 });
        return json(200, { vestiging, status, versie: 2, regels: data2 });
      }
      const { data, error } = status === "besteld"
        ? await db.rpc("bestelbot_lees_besteld", { p_vestiging: vestiging })
        : await db.rpc("bestelbot_lees_open", { p_vestiging: vestiging });
      if (error) return fout(500, "Lezen mislukt");
      await sluit(true, { http_status: 200, aantal: data.length });
      return json(200, { vestiging, status, regels: data });
    }
    if (req.method !== "POST") return fout(405, "Methode niet toegestaan");

    if (actie === "bestellen") {
      const regels = body.regels;
      if (!Array.isArray(regels) || regels.length < 1 || regels.length > 100 ||
        !regels.every((r) => r && typeof r === "object" && UUID.test(String(r.id)) &&
          (r.bestelreferentie == null || (typeof r.bestelreferentie === "string" && r.bestelreferentie.length <= 200)) &&
          verwachteLeveringGeldig(r.verwachte_levering))) {
        return fout(400, "regels: 1-100 items met geldige id, optionele bestelreferentie en optionele verwachte_levering (YYYY-MM-DD, vandaag t/m +30 dagen)");
      }
      const schoon = regels.map((r) => ({ id: r.id, bestelreferentie: r.bestelreferentie ?? null, verwachte_levering: r.verwachte_levering ?? null }));
      if (body.versie === 2 || body.versie === "2") {
        const schoon2 = regels.map((r) => ({ id: r.id, bestelreferentie: r.bestelreferentie ?? null, verwachte_levering: r.verwachte_levering ?? null,
          ...(r.artikel_vorm_id != null && UUID.test(String(r.artikel_vorm_id)) ? { artikel_vorm_id: String(r.artikel_vorm_id) } : {}) }));
        const { data: data2, error: error2 } = await db.rpc("bestelbot_markeer_besteld_v2", { p_vestiging: vestiging, p_regels: schoon2 });
        if (error2) return fout(400, error2.message);
        await sluit(true, { http_status: 200, resultaat: data2, versie: 2 }, schoon2.map((r) => r.id));
        return json(200, { vestiging, versie: 2, resultaat: data2 });
      }
      const { data, error } = await db.rpc("bestelbot_markeer_besteld", { p_vestiging: vestiging, p_regels: schoon });
      if (error) return fout(400, error.message);
      await sluit(true, { http_status: 200, resultaat: data }, schoon.map((r) => r.id));
      return json(200, { vestiging, resultaat: data });
    }

    if (actie === "koppel") {
      const { id, leverancier_id, artikel_id, match_zekerheid, artikel_vorm_id } = body as Record<string, unknown>;
      const okUuid = (v: unknown) => v == null || UUID.test(String(v));
      if (!UUID.test(String(id)) || !okUuid(leverancier_id) || !okUuid(artikel_id) || !okUuid(artikel_vorm_id) ||
        (match_zekerheid != null && (typeof match_zekerheid !== "number" || match_zekerheid < 0 || match_zekerheid > 1))) {
        return fout(400, "Ongeldige koppeling");
      }
      const { data, error } = await db.rpc("bestelbot_koppel", {
        p_vestiging: vestiging, p_id: id, p_leverancier_id: leverancier_id ?? null,
        p_artikel_id: artikel_id ?? null, p_match: match_zekerheid ?? null,
        ...(artikel_vorm_id != null ? { p_artikel_vorm_id: artikel_vorm_id } : {}),
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

    if (actie === "advies") {
      const { datum, leverdag, regels } = body as Record<string, unknown>;
      const okDatum = (v: unknown) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(new Date(v + "T00:00:00Z").getTime());
      const okUuid = (v: unknown) => v == null || UUID.test(String(v));
      const okTekst = (v: unknown, max: number) => v == null || (typeof v === "string" && v.length <= max);
      if (!okDatum(datum) || !okDatum(leverdag)) return fout(400, "datum en leverdag moeten YYYY-MM-DD zijn");
      if (!Array.isArray(regels) || regels.length > 500 ||
        !regels.every((r) => r && typeof r === "object" &&
          typeof r.artikel === "string" && r.artikel.trim().length > 0 && r.artikel.length <= 200 &&
          typeof r.hoeveelheid === "number" && Number.isFinite(r.hoeveelheid) && r.hoeveelheid >= 0 &&
          okTekst(r.leverancier, 200) && okTekst(r.eenheid, 40) && okTekst(r.reden, 500) &&
          (r.verwacht_verbruik == null || (typeof r.verwacht_verbruik === "number" && Number.isFinite(r.verwacht_verbruik))) &&
          (r.onzeker == null || typeof r.onzeker === "boolean") &&
          okUuid(r.artikel_id) && okUuid(r.artikel_vorm_id))) {
        return fout(400, "regels: 0-500 items met artikel (tekst) en hoeveelheid (>= 0); overige velden optioneel");
      }
      if (!regels.every((r) => adviesMetadataGeldig(body.methode_versie, r.gegevens))) {
        return fout(400, "Ongeldige adviesmetadata: methode_versie, gegevens, periode of kassafactor");
      }
      const schoon = regels.map((r) => ({
        artikel: r.artikel.trim(), leverancier: r.leverancier ?? null, hoeveelheid: r.hoeveelheid,
        eenheid: r.eenheid ?? null, verwacht_verbruik: r.verwacht_verbruik ?? null, onzeker: r.onzeker ?? false,
        reden: r.reden ?? null, artikel_id: r.artikel_id ?? null, artikel_vorm_id: r.artikel_vorm_id ?? null,
        gegevens: r.gegevens ?? {},
      }));
      const { data, error } = await db.rpc("bestelbot_advies_loggen", {
        p_vestiging: vestiging, p_datum: datum, p_leverdag: leverdag, p_regels: schoon,
        p_methode_versie: body.methode_versie ?? null,
      });
      if (error) return fout(400, error.message);
      await sluit(true, { http_status: 200, resultaat: data });
      return json(200, { ok: true, aantal: data?.aantal ?? 0, gekoppeld: data?.gekoppeld ?? 0, gelogd: data?.gelogd ?? 0 });
    }

    if (actie === "deactiveren") {
      const invoer = leesDeactiveren(body.regels, body.reden);
      if (!invoer.ok) return fout(400, invoer.fout);
      const { ids, reden } = invoer;
      const { data, error } = await db.rpc("bestelbot_deactiveer", {
        p_vestiging: vestiging, p_ids: ids, p_reden: reden,
      });
      if (rpcOntbreekt(error)) {
        const uit = await deactiveerZonderFunctie(db, vestiging, ids);
        await sluit(true, { http_status: 200, resultaat: uit, fallback: true }, ids);
        return json(200, { vestiging, resultaat: uit });
      }
      if (error) return fout(400, error.message);
      await sluit(true, { http_status: 200, resultaat: data }, ids);
      return json(200, { vestiging, resultaat: data });
    }

    if (actie === "ontvangen") {
      const invoer = leesOntvangen(body.regels);
      if (!invoer.ok) return fout(400, invoer.fout);
      const ids = invoer.regels.map((r) => r.id);
      const { data, error } = await db.from("bestel_signalen")
        .select("id,vestiging,status,naam,aantal,eenheid,leverancier_id,artikel_id,artikel_vorm_id")
        .in("id", ids);
      if (error) return fout(400, error.message);
      const gevonden = new Map(((data ?? []) as BordRegel[]).map((r) => [r.id, r]));
      const nu = new Date().toISOString();
      const resultaat: { id: string; status: string; reden?: string; restant_aantal?: number }[] = [];
      for (const regel of invoer.regels) {
        const plan = planOntvangst(gevonden.get(regel.id) ?? null, regel, nu, vestiging);
        if (plan.soort === "fout") {
          resultaat.push({ id: regel.id, status: "error", reden: plan.reden });
          continue;
        }
        try {
          await pasOntvangstToe(db, plan, regel.id, vestiging);
          resultaat.push(plan.soort === "deels"
            ? { id: regel.id, status: "ok", restant_aantal: plan.restantAantal }
            : { id: regel.id, status: "ok" });
        } catch (e) {
          resultaat.push({ id: regel.id, status: "error", reden: e instanceof Error ? e.message : "niet opgeslagen" });
        }
      }
      await sluit(resultaat.every((r) => r.status === "ok"), { http_status: 200, resultaat }, ids);
      return json(200, { vestiging, resultaat });
    }

    return fout(400, "Onbekende actie");
  } catch (_e) {
    return fout(500, "Onverwachte fout");
  }
});
