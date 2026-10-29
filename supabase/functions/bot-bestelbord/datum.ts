const DATUM = /^\d{4}-\d{2}-\d{2}$/;

function nlVandaag(): Date {
  const s = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Amsterdam" });
  return new Date(s + "T00:00:00Z");
}

/** Verwachte leverdatum van de bot: leeg mag (server vult zelf), anders YYYY-MM-DD, vandaag t/m +30 dagen. */
export function verwachteLeveringGeldig(v: unknown): boolean {
  if (v == null) return true;
  if (typeof v !== "string" || !DATUM.test(v)) return false;
  const d = new Date(v + "T00:00:00Z");
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== v) return false;
  const min = nlVandaag();
  const max = new Date(min);
  max.setUTCDate(max.getUTCDate() + 30);
  return d >= min && d <= max;
}
