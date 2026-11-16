import { assertEquals } from "jsr:@std/assert@1";
import { bouwProducten, bouwUren, kiesDagen } from "./logica.ts";
Deno.test("vandaag en gisteren, plus open dagen max 3 terug", () => {
  assertEquals(kiesDagen("2026-11-16", []).nu, ["2026-11-16", "2026-11-15"]);
  assertEquals(kiesDagen("2026-11-16", ["2026-11-12", "2026-11-14", "2026-11-17"]).nu, ["2026-11-16", "2026-11-15", "2026-11-14"]);
});
Deno.test("uren uniek, bedragen als getal", () => {
  assertEquals(bouwUren([{ uur: 9, omzet_incl: "412.5", omzet_excl: "378.44", aantal_bonnen: 31 }]), [{ uur: 9, omzet_incl: 412.5, omzet_excl: 378.44, bonnen: 31 }]);
});
Deno.test("producten samengevoegd per id, negatief mag", () => {
  const p = bouwProducten([
    { lightspeed_product_id: "1", productnaam: "Flat white", aantal: 2, omzet_incl: 9, omzet_excl: 8 },
    { lightspeed_product_id: "1", productnaam: "Flat white", aantal: -1, omzet_incl: -4.5, omzet_excl: -4 },
  ]);
  assertEquals(p, [{ product_id: "1", naam: "Flat white", aantal: 1, omzet_incl: 4.5, omzet_excl: 4 }]);
});
