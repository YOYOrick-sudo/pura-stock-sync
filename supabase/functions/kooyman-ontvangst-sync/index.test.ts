import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { BodySchema, handler, zonderPrijs } from "./index.ts";

Deno.test("invoer uitsluitend voor doel Test", () => {
  assertEquals(BodySchema.safeParse({ invoer: { backorders: [], leveringen: [] } }).success, false);
  assertEquals(BodySchema.safeParse({ doel: "Test", invoer: { backorders: [], leveringen: [] } }).success, true);
});
Deno.test("ongeldige bronnen, modus, dagen en regels worden geweigerd", () => {
  for (const body of [{ bronnen: ["Test"] }, { modus: "anders" }, { dagen: -1 }, { dagen: 1.5 },
    { doel: "West" }, { doel: "Test", invoer: { backorders: [{ lines: "fout" }], leveringen: [] } }]) {
    assertEquals(BodySchema.safeParse(body).success, false);
  }
});
Deno.test("prijsvelden verdwijnen ook uit backorders en regels", () => {
  assertEquals(zonderPrijs({ price: 4, backorders: [{ total: 9, lines: [{ quantity: 1,
    unit_price_excl_vat: 3, line_total_excl_vat: 3, vat_rate: 9 }] }] }),
  { backorders: [{ lines: [{ quantity: 1 }] }] });
});
Deno.test("OPTIONS en methodefouten bevatten CORS", async () => {
  const options = await handler(new Request("http://localhost", { method: "OPTIONS" }));
  assertEquals(options.status, 200);
  assertEquals(options.headers.get("Access-Control-Allow-Origin"), "*");
  await options.text();
  const get = await handler(new Request("http://localhost"));
  assertEquals(get.status, 405);
  assertEquals(get.headers.get("Access-Control-Allow-Origin"), "*");
  assertEquals(await get.json(), { fout: "alleen POST" });
});