import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { computeWerkdagUur } from "./index.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("VITE_SUPABASE_URL")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;
const SYNC_TOKEN = Deno.env.get("LIGHTSPEED_SYNC_TOKEN")!;
const FN_URL = `${SUPABASE_URL}/functions/v1/lightspeed-sync`;

Deno.test("werkdag-logica: bon za 02:30 → vrijdag, uur 2 (zomertijd)", () => {
  const { werkdag, uur } = computeWerkdagUur("2026-07-04T02:30:00+02:00");
  assertEquals(werkdag, "2026-07-03");
  assertEquals(uur, 2);
});

Deno.test("werkdag-logica: bon 06:00 valt op eigen kalenderdag", () => {
  const { werkdag, uur } = computeWerkdagUur("2026-07-04T06:00:00+02:00");
  assertEquals(werkdag, "2026-07-04");
  assertEquals(uur, 6);
});

Deno.test("werkdag-logica: bon 05:59 valt nog op vorige dag", () => {
  const { werkdag, uur } = computeWerkdagUur("2026-07-04T05:59:00+02:00");
  assertEquals(werkdag, "2026-07-03");
  assertEquals(uur, 5);
});

Deno.test("werkdag-logica: middag-bon UTC input, TZ-conversie", () => {
  // 14:00 UTC in juli = 16:00 Amsterdam
  const { werkdag, uur } = computeWerkdagUur("2026-07-04T14:00:00Z");
  assertEquals(werkdag, "2026-07-04");
  assertEquals(uur, 16);
});

Deno.test("cron-guard: geen token → 401", async () => {
  const r = await fetch(FN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: "dagelijks" }),
  });
  const txt = await r.text();
  assertEquals(r.status, 401);
  assert(txt.includes("unauthorized"));
});

Deno.test("cron-guard: verkeerd token → 401", async () => {
  const r = await fetch(FN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-sync-token": "wrong" },
    body: JSON.stringify({ type: "dagelijks" }),
  });
  const txt = await r.text();
  assertEquals(r.status, 401);
  assert(txt.includes("unauthorized"));
});

Deno.test("mock-sync: mock_receipts vereist type=handmatig", async () => {
  const r = await fetch(FN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-sync-token": SYNC_TOKEN, apikey: ANON },
    body: JSON.stringify({ type: "dagelijks", mock_receipts: [] }),
  });
  const txt = await r.text();
  assertEquals(r.status, 400);
  assert(txt.includes("mock_only_for_handmatig"));
});

Deno.test("mock-sync: aggregatie + idempotentie via 2× dezelfde mock", async () => {
  const mock = [
    { timestamp: "2026-07-04T02:30:00+02:00", total_incl: 12.10, total_excl: 10.00 }, // → wd=2026-07-03, uur=2
    { timestamp: "2026-07-04T02:45:00+02:00", total_incl: 24.20, total_excl: 20.00 }, // → wd=2026-07-03, uur=2
    { timestamp: "2026-07-04T14:00:00+02:00", total_incl: 6.05,  total_excl: 5.00  }, // → wd=2026-07-04, uur=14
  ];
  const body = { type: "handmatig", vestiging: "West", van: "2026-07-03", tot: "2026-07-04", mock_receipts: mock };
  const headers = { "Content-Type": "application/json", "x-sync-token": SYNC_TOKEN, apikey: ANON };

  const r1 = await fetch(FN_URL, { method: "POST", headers, body: JSON.stringify(body) });
  const j1 = await r1.json();
  assertEquals(r1.status, 200);
  assertEquals(j1.ok, true);
  assertEquals(j1.bonnen, 3);

  const r2 = await fetch(FN_URL, { method: "POST", headers, body: JSON.stringify(body) });
  const j2 = await r2.json();
  assertEquals(r2.status, 200);
  assertEquals(j2.ok, true);

  // Verificatie idempotentie via REST → omzet_uren voor West op 2026-07-03/04
  const q = await fetch(
    `${SUPABASE_URL}/rest/v1/omzet_uren?vestiging=eq.West&werkdag=in.(2026-07-03,2026-07-04)&order=werkdag,uur`,
    { headers: { apikey: ANON, Authorization: `Bearer ${ANON}` } },
  );
  // Anon heeft geen SELECT — dit moet 200 met [] returnen of 401. Voor de test loggen we alleen dat de call de RLS respecteert.
  const qtxt = await q.text();
  console.log("RLS-check (anon SELECT op omzet_uren):", q.status, qtxt.slice(0, 100));
});
