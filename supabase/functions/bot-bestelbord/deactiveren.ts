const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type DeactiverenInvoer =
  | { ok: true; ids: string[]; reden: string | null }
  | { ok: false; fout: string };

/** regels: 1-100 uuid's. reden optioneel, hooguit 500 tekens. */
export function leesDeactiveren(regels: unknown, reden: unknown): DeactiverenInvoer {
  if (!Array.isArray(regels) || regels.length < 1 || regels.length > 100 || !regels.every((r) => typeof r === "string" && UUID.test(r))) {
    return { ok: false, fout: "regels: 1-100 ids" };
  }
  if (reden != null && (typeof reden !== "string" || reden.length > 500)) {
    return { ok: false, fout: "reden: tekst tot 500 tekens" };
  }
  const ids = [...new Set(regels)];
  const tekst = typeof reden === "string" ? reden.trim() : "";
  return { ok: true, ids, reden: tekst ? tekst : null };
}

/** Alleen als de functie zelf nog niet in de database staat. Een inhoudelijke fout valt hier niet onder. */
export function rpcOntbreekt(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  if (error.code === "PGRST202") return true;
  const m = error.message ?? "";
  return /schema cache/i.test(m) || /could not find the function/i.test(m) || /function .* does not exist/i.test(m);
}
