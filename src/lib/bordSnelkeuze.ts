/** Snelkeuze-chips onder het bestelbord-invoerveld: eerder vrij getypte regels. */
export type SnelkeuzeRegel = { naam: string; artikel_id: string | null; status: string };

const norm = (s: string) => s.trim().toLowerCase();
const TOEGESTAAN = new Set(['open', 'besteld', 'geleverd']);

/** Vrije regels (zonder artikel), alleen open/besteld/geleverd, geen TEST-namen, ontdubbeld. Volgorde van invoer (nieuwste eerst) blijft. */
export function eerderVrijeRegels<T extends SnelkeuzeRegel>(signalen: T[]): T[] {
  const m = new Map<string, T>();
  for (const s of signalen) {
    if (s.artikel_id || !TOEGESTAAN.has(s.status) || norm(s.naam).startsWith('test')) continue;
    if (!m.has(norm(s.naam))) m.set(norm(s.naam), s);
  }
  return [...m.values()];
}

/** Chips voor de huidige invoer: deelmatch, geen exacte match, niet al in productsuggesties, max 8. */
export function filterEerderSuggesties<T extends SnelkeuzeRegel>(vrij: T[], invoer: string, productNamen: string[]): T[] {
  const q = norm(invoer);
  if (!q) return [];
  const inLijst = new Set(productNamen.map(norm));
  return vrij.filter((s) => norm(s.naam).includes(q) && norm(s.naam) !== q && !inLijst.has(norm(s.naam))).slice(0, 8);
}
