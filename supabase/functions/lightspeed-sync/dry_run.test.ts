// Pure tests voor de droge run en de telling (geen netwerk, schrijven niets).
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  aggregateVerkoop, bucketize, diagBon, nieuweDiag, plaatsBon, samenvattingDryRun, STATUSSEN, volledigeWerkdagen, LOGICAS,
} from "./index.ts";

const bonnen = [
  { timestamp: "2025-01-01T11:15:00Z", total_incl: 12.1, total_excl: 10, ophaaldag: "2025-01-01" },
  { timestamp: "2025-01-01T11:40:00Z", total_incl: 6.05, total_excl: 5, ophaaldag: "2025-01-01" },
  { timestamp: "2025-01-01T00:30:00Z", total_incl: 6.05, total_excl: 5, ophaaldag: "2025-01-01" }, // 01:30 NL → werkdag 31-12
  { timestamp: "2025-01-02T03:30:00Z", total_incl: 2.42, total_excl: 2, ophaaldag: "2025-01-02" }, // 04:30 NL → werkdag 1-1
];

Deno.test("droge run: rijen zijn exact wat de sync zou upserten (bucketize)", () => {
  const s = samenvattingDryRun(bonnen, "2025-01-01", "2025-01-02", undefined, "oud");
  const b = [...bucketize(bonnen, "oud").values()];
  assertEquals(s.rijen_aantal, b.length);
  const r = s.rijen.find((x: any) => x.werkdag === "2025-01-01" && x.uur === 12);
  assertEquals(r, { werkdag: "2025-01-01", uur: 12, omzet_excl: 15, omzet_incl: 18.15, aantal_bonnen: 2 });
});

Deno.test("droge run: nachtgrens en randrijen", () => {
  const s = samenvattingDryRun(bonnen, "2025-01-01", "2025-01-02", undefined, "oud");
  assertEquals(s.nachtgrens.totaal.n, 2);
  assertEquals(s.nachtgrens.werkdag_is_ophaaldag_min1.n, 2);
  assertEquals(s.randrijen.aantal, 1);
  assertEquals(s.randrijen.rijen[0].werkdag, "2024-12-31");
  assertEquals(s.maanden_werkdag_binnen_bereik["2025-01"], { n: 3, incl: 20.57, excl: 17, open_dagen: 1 });
  assertEquals(s.werkdag_min_ophaaldag["-1"].n, 2);
});

Deno.test("droge run: diagnose per status, PAID zonder tijd, dubbelen", () => {
  const d = nieuweDiag();
  diagBon(d, "2025-01-01", { id: 1, status: "PAID", modificationDate: "2025-01-01T10:00:00Z", total: 12.1, totalWithoutTax: 10 });
  diagBon(d, "2025-01-01", { id: 2, status: "PAID", modificationDate: "1970-01-01T00:00:00Z", total: 6.05, totalWithoutTax: 5 });
  diagBon(d, "2025-01-01", { id: 3, status: "open", total: 3, totalWithoutTax: 2.5 });
  diagBon(d, "2025-01-02", { id: 1, status: "PAID", modificationDate: "2025-01-01T10:00:00Z", total: 12.1 });
  assertEquals(d.status["PAID"].n, 3);
  assertEquals(d.status["OPEN"].n, 1);
  assertEquals(d.paid_zonder_tijd.n, 1);
  assertEquals(d.paid_zonder_excl_veld.n, 1);
  const s = samenvattingDryRun([], "2025-01-01", "2025-01-02", d, "oud");
  assertEquals(s.diagnose.dubbel_over_ophaaldagen.aantal, 1);
  assertEquals(s.diagnose.status_per_ophaalmaand["2025-01"]["PAID"].excl, 15);
});

// ---------------- Nieuwe logica (klus 8 fase 2): PAID+DONE, werkdag = ophaaldag ----------------
// Tijden in UTC; oktober = zomertijd (+2), januari = wintertijd (+1).
const nb = (o: Record<string, unknown>) => ({ total_incl: 12.1, total_excl: 10, items: [], ...o } as any);

Deno.test("nieuw: statussen PAID en DONE, oud alleen PAID", () => {
  assertEquals([...STATUSSEN.oud], ["PAID"]);
  assertEquals([...STATUSSEN.nieuw], ["PAID", "DONE"]);
  const d = nieuweDiag(STATUSSEN.nieuw);
  diagBon(d, "2025-10-14", { id: 1, status: "DONE", modificationDate: null, total: 5, totalWithoutTax: 4 });
  diagBon(d, "2025-10-14", { id: 2, status: "OPEN", modificationDate: null, total: 5, totalWithoutTax: 4 });
  assertEquals(d.paid_zonder_tijd.n, 1); // DONE telt mee in de diagnose, OPEN niet
});

Deno.test("nieuw: gewone bon op eigen dag, uur uit aanpastijd", () => {
  assertEquals(plaatsBon(nb({ timestamp: "2025-10-14T11:15:00Z", ophaaldag: "2025-10-14" }), "nieuw"), { werkdag: "2025-10-14", uur: 13 });
});

Deno.test("nieuw: nachtbon (01:30 volgende kalenderdag) blijft op de ophaaldag, uur 1", () => {
  assertEquals(plaatsBon(nb({ timestamp: "2025-10-14T23:30:00Z", ophaaldag: "2025-10-14" }), "nieuw"), { werkdag: "2025-10-14", uur: 1 });
});

Deno.test("nieuw: later aangepaste bon blijft op de ophaaldag, uur uit creationDate", () => {
  const r = nb({ timestamp: "2026-04-09T18:05:00Z", creatie_ts: "2025-10-14T11:20:00Z", ophaaldag: "2025-10-14" });
  assertEquals(plaatsBon(r, "nieuw"), { werkdag: "2025-10-14", uur: 13 });
  assertEquals(plaatsBon(r, "oud"), { werkdag: "2026-04-09", uur: 20 }); // dit was de fout
});

Deno.test("nieuw: aangepast en creationDate ook op andere dag: werkdag ophaaldag, uur uit aanpastijd", () => {
  const r = nb({ timestamp: "2025-10-20T08:00:00Z", creatie_ts: "2025-10-19T08:00:00Z", ophaaldag: "2025-10-14" });
  assertEquals(plaatsBon(r, "nieuw"), { werkdag: "2025-10-14", uur: 10 });
});

Deno.test("nieuw: mock zonder ophaaldag valt terug op de tijd (zelfde als oud)", () => {
  const r = nb({ timestamp: "2026-07-04T02:30:00+02:00" });
  assertEquals(plaatsBon(r, "nieuw"), { werkdag: "2026-07-03", uur: 2 });
  assertEquals(plaatsBon(r, "nieuw"), plaatsBon(r, "oud"));
});

Deno.test("nieuw: geen randrijen, alles binnen van..tot, aangepaste bon overschrijft geen ander uur", () => {
  const rs = [
    nb({ timestamp: "2025-10-14T11:15:00Z", ophaaldag: "2025-10-14", status: "PAID" }),
    nb({ timestamp: "2025-10-14T11:40:00Z", ophaaldag: "2025-10-14", status: "DONE", total_incl: 6.05, total_excl: 5 }),
    nb({ timestamp: "2025-10-14T23:30:00Z", ophaaldag: "2025-10-14", status: "PAID" }),
    nb({ timestamp: "2026-04-09T18:05:00Z", creatie_ts: "2025-10-15T17:00:00Z", ophaaldag: "2025-10-15", status: "PAID" }),
  ];
  const s = samenvattingDryRun(rs, "2025-10-14", "2025-10-15", undefined, "nieuw");
  assertEquals(s.logica, "nieuw");
  assertEquals(s.randrijen.aantal, 0);
  assertEquals(s.rijen.map((r: any) => `${r.werkdag} ${r.uur}`), ["2025-10-14 1", "2025-10-14 13", "2025-10-15 19"]);
  assertEquals(s.rijen.find((r: any) => r.uur === 13), { werkdag: "2025-10-14", uur: 13, omzet_excl: 15, omzet_incl: 18.15, aantal_bonnen: 2 });
  assertEquals(s.maanden_werkdag_binnen_bereik["2025-10"], { n: 4, incl: 42.35, excl: 35, open_dagen: 2 });
  assertEquals(s.meegeteld_per_status["DONE"].n, 1);
  // oud: aangepaste bon gaat naar 2026-04-09 20u (randrij)
  const o = samenvattingDryRun(rs, "2025-10-14", "2025-10-15", undefined, "oud");
  assertEquals(o.randrijen.rijen.map((r: any) => `${r.werkdag} ${r.uur}`), ["2026-04-09 20"]);
});

Deno.test("nieuw: verkoop per ophaaldag, ook voor de laatste dag van het blok", () => {
  const it = (n: number) => [{ product_id: "1", naam: "Cappuccino", aantal: n, incl: 3.9 * n, excl: 3.58 * n }];
  const rs = [
    nb({ timestamp: "2025-10-14T09:00:00Z", ophaaldag: "2025-10-14", items: it(2) }),
    nb({ timestamp: "2026-04-09T18:05:00Z", creatie_ts: "2025-10-14T10:00:00Z", ophaaldag: "2025-10-14", items: it(1) }),
    nb({ timestamp: "2025-10-15T23:30:00Z", ophaaldag: "2025-10-15", items: it(4) }),
  ];
  const rows = aggregateVerkoop(rs, new Set(volledigeWerkdagen("2025-10-14", "2025-10-15", "nieuw")), "nieuw");
  assertEquals(rows.map((r) => `${r.datum}:${r.aantal}`).sort(), ["2025-10-14:3", "2025-10-15:4"]);
  assertEquals(volledigeWerkdagen("2025-10-14", "2025-10-15", "nieuw"), ["2025-10-14", "2025-10-15"]);
  assertEquals(volledigeWerkdagen("2025-10-14", "2025-10-15", "oud"), ["2025-10-14"]);
  assertEquals(volledigeWerkdagen("2025-10-15", "2025-10-14", "nieuw"), []);
});

Deno.test("nieuw: DST-grenzen (laatste zondag okt en mrt)", () => {
  // 26-10-2025 02:30 UTC = 03:30 wintertijd, nacht van za 25-10
  assertEquals(plaatsBon(nb({ timestamp: "2025-10-26T02:30:00Z", ophaaldag: "2025-10-25" }), "nieuw"), { werkdag: "2025-10-25", uur: 3 });
  // 30-03-2025 01:30 UTC = 03:30 zomertijd
  assertEquals(plaatsBon(nb({ timestamp: "2025-03-30T01:30:00Z", ophaaldag: "2025-03-29" }), "nieuw"), { werkdag: "2025-03-29", uur: 3 });
});

// ---------------- ACCEPTED (klus 8 vervolg, besluit Yorick 1-11-2026) ----------------
Deno.test("accepted: statussen PAID, DONE en ACCEPTED; nieuw en oud ongewijzigd", () => {
  assertEquals([...LOGICAS], ["oud", "nieuw", "accepted"]);
  assertEquals([...STATUSSEN.accepted], ["PAID", "DONE", "ACCEPTED"]);
  assertEquals([...STATUSSEN.nieuw], ["PAID", "DONE"]);
  assertEquals([...STATUSSEN.oud], ["PAID"]);
  const d = nieuweDiag(STATUSSEN.accepted);
  diagBon(d, "2026-04-14", { id: 1, status: "ACCEPTED", modificationDate: null, total: 5, totalWithoutTax: 4 });
  diagBon(d, "2026-04-14", { id: 2, status: "OPEN", modificationDate: null, total: 5, totalWithoutTax: 4 });
  assertEquals(d.paid_zonder_tijd.n, 1); // ACCEPTED telt mee, OPEN niet
  const n = nieuweDiag(STATUSSEN.nieuw);
  diagBon(n, "2026-04-14", { id: 3, status: "ACCEPTED", modificationDate: null, total: 5, totalWithoutTax: 4 });
  assertEquals(n.paid_zonder_tijd.n, 0); // in 'nieuw' telt ACCEPTED niet
});

Deno.test("accepted: zelfde werkdag/uur en volledige dagen als nieuw", () => {
  const rs = [
    nb({ timestamp: "2025-10-14T23:30:00Z", ophaaldag: "2025-10-14" }),
    nb({ timestamp: "2026-04-09T18:05:00Z", creatie_ts: "2025-10-14T11:20:00Z", ophaaldag: "2025-10-14" }),
    nb({ timestamp: "2025-10-20T08:00:00Z", creatie_ts: "2025-10-19T08:00:00Z", ophaaldag: "2025-10-14" }),
    nb({ timestamp: "2026-07-04T02:30:00+02:00" }),
  ];
  for (const r of rs) assertEquals(plaatsBon(r, "accepted"), plaatsBon(r, "nieuw"));
  assertEquals(volledigeWerkdagen("2025-10-14", "2025-10-15", "accepted"), ["2025-10-14", "2025-10-15"]);
  assertEquals(volledigeWerkdagen("2025-10-15", "2025-10-14", "accepted"), []);
  const s = samenvattingDryRun(rs.slice(0, 3), "2025-10-14", "2025-10-14", undefined, "accepted");
  assertEquals(s.logica, "accepted");
  assertEquals(s.randrijen.aantal, 0);
});
