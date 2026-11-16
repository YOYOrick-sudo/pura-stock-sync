// Pure helpers voor het doorsturen van kassaverkoop naar Tazza.
export const VESTIGINGEN = ["36864", "41121"] as const;

export function amsDag(d: Date): string {
  return new Intl.DateTimeFormat("sv-SE", { timeZone: "Europe/Amsterdam" }).format(d);
}
export function plusDag(dag: string, n: number): string {
  const d = new Date(`${dag}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10);
}

/** Vandaag + gisteren + nog openstaande dagen (max 3 terug), nieuwste eerst, max 3. */
export function kiesDagen(vandaag: string, open: string[]): { nu: string[]; later: string[] } {
  const grens = plusDag(vandaag, -3);
  const set = new Set([vandaag, plusDag(vandaag, -1), ...open.filter((d) => d >= grens && d <= vandaag)]);
  const alle = [...set].sort().reverse();
  return { nu: alle.slice(0, 3), later: alle.slice(3) };
}

const r2 = (n: unknown) => Math.round((Number(n) || 0) * 100) / 100;
const r3 = (n: unknown) => Math.round((Number(n) || 0) * 1000) / 1000;

export type UurRij = { uur: number; omzet_incl: unknown; omzet_excl: unknown; aantal_bonnen: unknown };
export type ProdRij = { lightspeed_product_id: string | null; productnaam: string | null; aantal: unknown; omzet_incl: unknown; omzet_excl: unknown };

export function bouwUren(rijen: UurRij[]) {
  const m = new Map<number, { uur: number; omzet_incl: number; omzet_excl: number | null; bonnen: number }>();
  for (const r of rijen) {
    const uur = Number(r.uur);
    if (!Number.isInteger(uur) || uur < 0 || uur > 23) continue;
    const b = m.get(uur) ?? { uur, omzet_incl: 0, omzet_excl: 0, bonnen: 0 };
    b.omzet_incl = r2(b.omzet_incl + r2(r.omzet_incl));
    b.omzet_excl = r.omzet_excl == null || b.omzet_excl == null ? null : r2(b.omzet_excl + r2(r.omzet_excl));
    b.bonnen += Math.round(Number(r.aantal_bonnen) || 0);
    m.set(uur, b);
  }
  return [...m.values()].sort((a, b) => a.uur - b.uur);
}

export function bouwProducten(rijen: ProdRij[]) {
  const m = new Map<string, { product_id?: string; naam: string; aantal: number; omzet_incl: number; omzet_excl: number }>();
  for (const r of rijen) {
    const pid = (r.lightspeed_product_id ?? "").trim();
    let naam = (r.productnaam ?? "").trim().slice(0, 120);
    if (!naam) naam = pid ? `Product ${pid}` : "Onbekend product";
    const k = pid ? `id:${pid}` : `naam:${naam}`;
    const b = m.get(k) ?? { ...(pid ? { product_id: pid } : {}), naam, aantal: 0, omzet_incl: 0, omzet_excl: 0 };
    b.aantal = r3(b.aantal + r3(r.aantal)); b.omzet_incl = r2(b.omzet_incl + r2(r.omzet_incl)); b.omzet_excl = r2(b.omzet_excl + r2(r.omzet_excl));
    m.set(k, b);
  }
  // Naamloze-id-regels: naam moet uniek zijn; met id mag een naam dubbel voorkomen.
  return [...m.values()].sort((a, b) => Math.abs(b.omzet_incl) - Math.abs(a.omzet_incl)).slice(0, 1000);
}
