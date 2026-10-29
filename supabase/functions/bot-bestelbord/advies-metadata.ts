const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const datum = (v: unknown) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v) && new Date(v + 'T00:00:00Z').toISOString().slice(0, 10) === v;

export function adviesMetadataGeldig(methode: unknown, gegevens: unknown): boolean {
  try {
    if (methode != null && (typeof methode !== 'string' || !methode.trim() || methode.length > 100)) return false;
    if (gegevens === undefined) return true;
    if (!object(gegevens) || JSON.stringify(gegevens).length > 50_000) return false;
    if ('voorraad_artikel_id' in gegevens && (typeof gegevens.voorraad_artikel_id !== 'string' || !uuid.test(gegevens.voorraad_artikel_id))) return false;
    if ('verwacht_verbruik' in gegevens && (typeof gegevens.verwacht_verbruik !== 'number' || !Number.isFinite(gegevens.verwacht_verbruik))) return false;
    if ('periode_van' in gegevens || 'periode_tot' in gegevens) {
      if (!datum(gegevens.periode_van) || !datum(gegevens.periode_tot) || String(gegevens.periode_van) > String(gegevens.periode_tot)) return false;
    }
    for (const veld of ['verwacht_kassa', 'opslag_pct']) {
      if (veld in gegevens && (typeof gegevens[veld] !== 'number' || !Number.isFinite(gegevens[veld] as number) || (gegevens[veld] as number) < 0)) return false;
    }
    if ('opslag_pct' in gegevens && (gegevens.opslag_pct as number) >= 100) return false;
    if ('opslag_groep' in gegevens && (typeof gegevens.opslag_groep !== 'string' || gegevens.opslag_groep.length > 40)) return false;
    if ('kassa_ids' in gegevens) {
      if (!Array.isArray(gegevens.kassa_ids) || gegevens.kassa_ids.length > 500 || !gegevens.kassa_ids.every((k) => object(k) && typeof k.id === 'string' && !!k.id.trim() && typeof k.per_eenheid === 'number' && Number.isFinite(k.per_eenheid) && k.per_eenheid > 0)) return false;
      if (new Set(gegevens.kassa_ids.map((k) => k.id)).size !== gegevens.kassa_ids.length) return false;
    }
    return true;
  } catch { return false; }
}