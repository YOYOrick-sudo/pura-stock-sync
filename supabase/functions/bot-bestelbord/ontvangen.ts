const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const UITKOMSTEN = new Set(["geleverd", "niet_geleverd", "deels"]);

export type Uitkomst = "geleverd" | "niet_geleverd" | "deels";

export type OntvangstInvoer = {
  id: string;
  uitkomst: Uitkomst;
  geleverdAantal: number | null;
  opmerking: string;
};

export type BordRegel = {
  id: string;
  vestiging: string;
  status: string;
  naam: string;
  aantal: number;
  eenheid: string;
  leverancier_id: string | null;
  artikel_id: string | null;
  artikel_vorm_id: string | null;
};

export type GeleverdUpdate = {
  status: "geleverd";
  geleverd_op: string;
  geleverd_door: null;
  levering_status: "geleverd" | "deels";
  levering_opmerking?: string;
};

export type NietGeleverdUpdate = {
  status: "open";
  verwachte_levering: null;
  levering_status: "niet_geleverd";
  levering_opmerking: string;
};

export type RestantInsert = {
  vestiging: string;
  naam: string;
  aantal: number;
  eenheid: string;
  bron: "restant";
  restant_van: string;
  leverancier_id: string | null;
  artikel_id: string | null;
  artikel_vorm_id: string | null;
  levering_opmerking: string | null;
  gemeld_door: null;
};

export type OntvangstPlan =
  | { soort: "fout"; reden: string }
  | { soort: "geleverd"; update: GeleverdUpdate }
  | { soort: "niet_geleverd"; update: NietGeleverdUpdate }
  | { soort: "deels"; update: GeleverdUpdate; restant: RestantInsert; restantAantal: number };

/** Zelfde veldovergangen als de knoppen Geleverd, Niet geleverd en Deels in de app. */
export function leesOntvangen(regels: unknown): { ok: true; regels: OntvangstInvoer[] } | { ok: false; fout: string } {
  if (!Array.isArray(regels) || regels.length < 1 || regels.length > 100) return { ok: false, fout: "regels: 1-100 items" };
  const uit: OntvangstInvoer[] = [];
  const gezien = new Set<string>();
  for (const ruw of regels) {
    if (!ruw || typeof ruw !== "object" || Array.isArray(ruw)) return { ok: false, fout: "regels: elk item is een object" };
    const r = ruw as Record<string, unknown>;
    if (!UUID.test(String(r.id ?? ""))) return { ok: false, fout: "regels: geldige id" };
    const id = String(r.id);
    if (gezien.has(id)) return { ok: false, fout: "regels: elk id één keer" };
    gezien.add(id);
    if (typeof r.uitkomst !== "string" || !UITKOMSTEN.has(r.uitkomst)) return { ok: false, fout: "uitkomst moet geleverd, niet_geleverd of deels zijn" };
    if (r.opmerking != null && (typeof r.opmerking !== "string" || r.opmerking.length > 500)) return { ok: false, fout: "opmerking: tekst tot 500 tekens" };
    const opmerking = typeof r.opmerking === "string" ? r.opmerking.trim() : "";
    let geleverdAantal: number | null = null;
    if (r.uitkomst === "deels") {
      if (typeof r.geleverd_aantal !== "number" || !Number.isInteger(r.geleverd_aantal) || r.geleverd_aantal < 1) {
        return { ok: false, fout: "deels: geleverd_aantal is een geheel getal vanaf 1" };
      }
      geleverdAantal = r.geleverd_aantal;
    }
    uit.push({ id, uitkomst: r.uitkomst as Uitkomst, geleverdAantal, opmerking });
  }
  return { ok: true, regels: uit };
}

export function planOntvangst(rij: BordRegel | null, invoer: OntvangstInvoer, nu: string, vestiging: string): OntvangstPlan {
  if (!rij || rij.vestiging !== vestiging) return { soort: "fout", reden: "niet gevonden voor deze vestiging" };
  if (rij.status !== "besteld") return { soort: "fout", reden: "status is " + rij.status };
  if (invoer.uitkomst === "geleverd") {
    return {
      soort: "geleverd",
      update: { status: "geleverd", geleverd_op: nu, geleverd_door: null, levering_status: "geleverd" },
    };
  }
  if (invoer.uitkomst === "niet_geleverd") {
    return {
      soort: "niet_geleverd",
      update: { status: "open", verwachte_levering: null, levering_status: "niet_geleverd", levering_opmerking: invoer.opmerking },
    };
  }
  const besteld = Number(rij.aantal);
  const binnen = invoer.geleverdAantal ?? 0;
  if (!(binnen >= 1) || binnen >= besteld) return { soort: "fout", reden: "geleverd_aantal moet tussen 1 en het bestelde aantal liggen" };
  const rest = besteld - binnen;
  return {
    soort: "deels",
    restantAantal: rest,
    update: {
      status: "geleverd",
      geleverd_op: nu,
      geleverd_door: null,
      levering_status: "deels",
      levering_opmerking: `${binnen} ${rij.eenheid} binnen${invoer.opmerking ? ` — ${invoer.opmerking}` : ""}`,
    },
    restant: {
      vestiging: rij.vestiging,
      naam: rij.naam,
      aantal: rest,
      eenheid: rij.eenheid,
      bron: "restant",
      restant_van: rij.id,
      leverancier_id: rij.leverancier_id,
      artikel_id: rij.artikel_id,
      artikel_vorm_id: rij.artikel_vorm_id,
      levering_opmerking: invoer.opmerking || null,
      gemeld_door: null,
    },
  };
}
