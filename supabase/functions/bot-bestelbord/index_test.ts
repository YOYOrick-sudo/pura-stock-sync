import { assertEquals } from "jsr:@std/assert";
import { verwachteLeveringGeldig } from "./datum.ts";

Deno.test("verwachteLeveringGeldig: leeg is toegestaan (server vult zelf)", () => {
  assertEquals(verwachteLeveringGeldig(null), true);
  assertEquals(verwachteLeveringGeldig(undefined), true);
});

Deno.test("verwachteLeveringGeldig: geldige datum binnen 30 dagen", () => {
  const over10 = new Date(Date.now() + 10 * 864e5).toISOString().slice(0, 10);
  assertEquals(verwachteLeveringGeldig(over10), true);
});

Deno.test("verwachteLeveringGeldig: verleden, verre toekomst en ongeldige invoer geweigerd", () => {
  assertEquals(verwachteLeveringGeldig("2020-01-01"), false);
  const over60 = new Date(Date.now() + 60 * 864e5).toISOString().slice(0, 10);
  assertEquals(verwachteLeveringGeldig(over60), false);
  assertEquals(verwachteLeveringGeldig("31-10-2026"), false);
  assertEquals(verwachteLeveringGeldig("2026-13-01"), false);
  assertEquals(verwachteLeveringGeldig(20261030), false);
});
