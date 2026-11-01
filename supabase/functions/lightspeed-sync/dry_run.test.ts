// Pure tests voor de droge run (geen netwerk, schrijven niets).
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { bucketize, diagBon, nieuweDiag, samenvattingDryRun } from "./index.ts";

const bonnen = [
  { timestamp: "2025-01-01T11:15:00Z", total_incl: 12.1, total_excl: 10, ophaaldag: "2025-01-01" },
  { timestamp: "2025-01-01T11:40:00Z", total_incl: 6.05, total_excl: 5, ophaaldag: "2025-01-01" },
  { timestamp: "2025-01-01T00:30:00Z", total_incl: 6.05, total_excl: 5, ophaaldag: "2025-01-01" }, // 01:30 NL → werkdag 31-12
  { timestamp: "2025-01-02T03:30:00Z", total_incl: 2.42, total_excl: 2, ophaaldag: "2025-01-02" }, // 04:30 NL → werkdag 1-1
];

Deno.test("droge run: rijen zijn exact wat de sync zou upserten (bucketize)", () => {
  const s = samenvattingDryRun(bonnen, "2025-01-01", "2025-01-02");
  const b = [...bucketize(bonnen).values()];
  assertEquals(s.rijen_aantal, b.length);
  const r = s.rijen.find((x: any) => x.werkdag === "2025-01-01" && x.uur === 12);
  assertEquals(r, { werkdag: "2025-01-01", uur: 12, omzet_excl: 15, omzet_incl: 18.15, aantal_bonnen: 2 });
});

Deno.test("droge run: nachtgrens en randrijen", () => {
  const s = samenvattingDryRun(bonnen, "2025-01-01", "2025-01-02");
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
  const s = samenvattingDryRun([], "2025-01-01", "2025-01-02", d);
  assertEquals(s.diagnose.dubbel_over_ophaaldagen.aantal, 1);
  assertEquals(s.diagnose.status_per_ophaalmaand["2025-01"]["PAID"].excl, 15);
});
