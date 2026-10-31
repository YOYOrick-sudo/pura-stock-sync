import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { amsterdamWeekdagEnTijd, binnenOphaalVenster, BodySchema, handler, zonderPrijs } from "./index.ts";

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

for (const [dag, datum, binnen] of [
  ["ma", "2026-11-02", true], ["di", "2026-11-03", true], ["wo", "2026-11-04", true],
  ["do", "2026-11-05", true], ["vr", "2026-11-06", true], ["za", "2026-11-07", true],
  ["zo", "2026-11-08", false],
] as const) {
  Deno.test(`${dag}: Amsterdamse ophaaltijd en tijd buiten venster`, () => {
    const uur = dag === "za" ? "11" : "10";
    assertEquals(binnenOphaalVenster(new Date(`${datum}T${uur}:30:00Z`)), binnen);
    assertEquals(binnenOphaalVenster(new Date(`${datum}T09:30:00Z`)), false);
  });
}

for (const [datum, utcUur, lokaalUur] of [
  ["2026-11-02", "10", "11"], ["2026-11-02", "16", "17"], ["2026-11-07", "11", "12"],
] as const) {
  for (const [minuut, verwacht] of [["19", false], ["20", true], ["45", true], ["46", false]] as const) {
    Deno.test(`${datum} ${lokaalUur}:${minuut}: grens inclusief`, () => {
      assertEquals(binnenOphaalVenster(new Date(`${datum}T${utcUur}:${minuut}:00Z`)), verwacht);
    });
  }
}

for (const [instant, weekdag, hm] of [
  ["2026-07-06T09:30:00Z", "Mon", "11:30"],
  ["2026-07-06T15:30:00Z", "Mon", "17:30"],
  ["2026-07-11T10:30:00Z", "Sat", "12:30"],
  ["2026-11-02T10:30:00Z", "Mon", "11:30"],
  ["2026-11-02T16:30:00Z", "Mon", "17:30"],
] as const) {
  Deno.test(`${instant}: zomer/winteromrekening Amsterdam`, () => {
    assertEquals(amsterdamWeekdagEnTijd(new Date(instant)), { weekdag, hm });
    assertEquals(binnenOphaalVenster(new Date(instant)), true);
  });
}

for (const instant of ["2026-11-07T10:30:00Z", "2026-11-07T16:30:00Z", "2026-11-08T10:30:00Z"]) {
  Deno.test(`${instant}: zaterdag 11:30/17:30 en zondag 11:30 gesloten`, () => {
    assertEquals(binnenOphaalVenster(new Date(instant)), false);
  });
}

Deno.test("weekdag volgt Amsterdam, niet UTC, ook rond middernacht", () => {
  assertEquals(amsterdamWeekdagEnTijd(new Date("2026-11-06T23:30:00Z")), { weekdag: "Sat", hm: "00:30" });
  assertEquals(amsterdamWeekdagEnTijd(new Date("2026-07-05T22:30:00Z")), { weekdag: "Mon", hm: "00:30" });
  assertEquals(binnenOphaalVenster(new Date("2026-11-06T23:30:00Z")), false);
});