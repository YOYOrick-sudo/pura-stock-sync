/**
 * Wat er na een taak op de sluitlijst gebeurt.
 * De vaste lijst VRIEZER_NAAR_KOELCEL is vervangen door deze instelling.
 * Zonder opgeslagen rij geldt het zaad: falafel gaat uit de vriezer naar de koelcel.
 */

export type VervolgActie = 'geen' | 'mep' | 'bestelbord' | 'vriezer_naar_koelcel' | 'intern_midsland';

/** Fout die de sluitlijst letterlijk toont, in plaats van de wifi-melding. */
export class VervolgFout extends Error {}

export type TaakVervolgRij = {
  taakSleutel: string;
  vestiging: string | null;
  instructie: string;
  vervolgactie: VervolgActie;
  vervolgAlsOp: VervolgActie | null;
};

export type TaakSleutelBron = {
  id?: string | null;
  naam?: string | null;
  product_sleutel?: string | null;
};

export const VERVOLG_OPTIES: readonly { id: VervolgActie; label: string }[] = [
  { id: 'geen', label: 'Geen' },
  { id: 'mep', label: 'Op de MEP' },
  { id: 'bestelbord', label: 'Op het bestelbord' },
  { id: 'vriezer_naar_koelcel', label: 'Uit vriezer naar koelcel' },
  { id: 'intern_midsland', label: 'Intern bij Midsland bestellen' },
];

const ACTIES = new Set<VervolgActie>(VERVOLG_OPTIES.map((optie) => optie.id));

/** Zelfde gedrag als de oude lijst, tot de eigenaar iets anders bewaart. */
export const VERVOLG_ZAAD: readonly TaakVervolgRij[] = [
  {
    taakSleutel: 'falafel',
    vestiging: null,
    instructie: '',
    vervolgactie: 'vriezer_naar_koelcel',
    vervolgAlsOp: null,
  },
];

/** Sleutels uit het zaad. Bestaande tests lezen hier nog de productnaam. */
export const VRIEZER_NAAR_KOELCEL: readonly { sleutel: string }[] = VERVOLG_ZAAD
  .filter((rij) => rij.vervolgactie === 'vriezer_naar_koelcel')
  .map((rij) => ({ sleutel: rij.taakSleutel }));

export function normTaakSleutel(waarde: string | null | undefined): string {
  return (waarde ?? '').trim().toLowerCase();
}

export function leesVervolgActie(waarde: unknown): VervolgActie {
  return typeof waarde === 'string' && ACTIES.has(waarde as VervolgActie) ? (waarde as VervolgActie) : 'geen';
}

export function vervolgLabel(actie: VervolgActie | null | undefined): string {
  return VERVOLG_OPTIES.find((optie) => optie.id === actie)?.label ?? 'Geen';
}

/** Productsleutel gaat voor de naam, de naam voor het id. */
export function taakSleutelVan(item: TaakSleutelBron): string {
  return normTaakSleutel(item.product_sleutel) || normTaakSleutel(item.naam) || normTaakSleutel(item.id);
}

export function rijVanDatabase(row: {
  taak_sleutel?: unknown;
  vestiging?: unknown;
  instructie?: unknown;
  vervolgactie?: unknown;
  vervolg_als_op?: unknown;
}): TaakVervolgRij | null {
  const taakSleutel = normTaakSleutel(typeof row.taak_sleutel === 'string' ? row.taak_sleutel : '');
  if (!taakSleutel) return null;
  const vestiging = typeof row.vestiging === 'string' && row.vestiging.trim() ? row.vestiging.trim() : null;
  const alsOp = row.vervolg_als_op == null || row.vervolg_als_op === '' ? null : leesVervolgActie(row.vervolg_als_op);
  return {
    taakSleutel,
    vestiging,
    instructie: typeof row.instructie === 'string' ? row.instructie.trim() : '',
    vervolgactie: leesVervolgActie(row.vervolgactie),
    vervolgAlsOp: alsOp === 'geen' ? null : alsOp,
  };
}

function kies(sleutel: string, vestiging: string | null | undefined, pool: readonly TaakVervolgRij[]): TaakVervolgRij | null {
  if (!sleutel) return null;
  const matches = pool.filter((rij) => rij.taakSleutel === sleutel);
  if (vestiging) {
    const lokaal = matches.find((rij) => rij.vestiging === vestiging);
    if (lokaal) return lokaal;
  }
  return matches.find((rij) => rij.vestiging == null) ?? null;
}

/**
 * Vestiging-rij wint van een rij zonder vestiging, de productsleutel van de naam.
 * Ontbreekt er een rij, dan geldt het zaad.
 */
export function configVoorTaak(
  item: TaakSleutelBron,
  vestiging: string | null | undefined,
  rijen: readonly TaakVervolgRij[] | null | undefined,
): TaakVervolgRij | null {
  const pool = rijen ?? [];
  const primair = normTaakSleutel(item.product_sleutel);
  const naam = normTaakSleutel(item.naam);
  return kies(primair, vestiging, pool)
    ?? kies(naam, vestiging, pool)
    ?? kies(primair, vestiging, VERVOLG_ZAAD)
    ?? kies(naam, vestiging, VERVOLG_ZAAD);
}

export function heeftVriezerNaarKoelcel(
  item: TaakSleutelBron,
  rijen?: readonly TaakVervolgRij[] | null,
  vestiging?: string | null,
): boolean {
  return configVoorTaak(item, vestiging, rijen)?.vervolgactie === 'vriezer_naar_koelcel';
}

export function interneProductVoor<T extends { product_id: string; naam: string }>(
  item: TaakSleutelBron,
  producten: readonly T[] | null | undefined,
): T | null {
  if (!producten?.length) return null;
  const sleutels = new Set([normTaakSleutel(item.product_sleutel), normTaakSleutel(item.naam)].filter(Boolean));
  return producten.find((product) => sleutels.has(normTaakSleutel(product.naam))) ?? null;
}

export type VervolgInvoer = {
  instructie: string;
  vervolgactie: VervolgActie;
  vervolgAlsOp: VervolgActie | null;
};

/** Lege tweede stap en een stap die dezelfde is als de eerste vallen weg. */
export function normaliseerVervolg(invoer: VervolgInvoer): VervolgInvoer {
  const instructie = invoer.instructie.trim();
  const vervolgactie = leesVervolgActie(invoer.vervolgactie);
  let vervolgAlsOp = invoer.vervolgAlsOp == null ? null : leesVervolgActie(invoer.vervolgAlsOp);
  if (vervolgAlsOp === 'geen' || vervolgactie === 'geen' || vervolgAlsOp === vervolgactie) vervolgAlsOp = null;
  return { instructie, vervolgactie, vervolgAlsOp };
}

export function valideerVervolg(
  invoer: VervolgInvoer,
  ctx: { internBeschikbaar: boolean },
): string | null {
  const schoon = normaliseerVervolg(invoer);
  if (schoon.instructie.length > 280) return 'Houd de instructie kort, hooguit een paar regels.';
  const intern = schoon.vervolgactie === 'intern_midsland' || schoon.vervolgAlsOp === 'intern_midsland';
  if (intern && !ctx.internBeschikbaar) {
    return 'Intern bij Midsland kan alleen voor een product uit de interne producten.';
  }
  return null;
}

export type BordStap =
  | {
      rpc: 'bord_regel_koppelen';
      args: { p_signaal_id: string; p_artikel_id: string; p_artikel_vorm_id: string };
    }
  | {
      rpc: 'bord_artikel_aanmaken';
      args: { p_vestiging: string; p_naam: string; p_leverancier_id: string; p_eenheid: string };
    }
  | { rpc: 'geen'; reden: string };

/**
 * Welke bestaande bord-RPC een vervolg nodig heeft.
 * Zonder open regel schrijft dit niets: er is geen RPC die een nieuwe bordregel aanmaakt.
 */
export function planBordVervolg(input: {
  vestiging: string;
  naam: string;
  eenheid: string;
  openSignaalId?: string | null;
  artikelId?: string | null;
  artikelVormId?: string | null;
  leverancierId?: string | null;
}): BordStap[] {
  const signaal = (input.openSignaalId ?? '').trim();
  const artikel = (input.artikelId ?? '').trim();
  const vorm = (input.artikelVormId ?? '').trim();
  const leverancier = (input.leverancierId ?? '').trim();
  if (signaal && artikel && vorm) {
    return [{
      rpc: 'bord_regel_koppelen',
      args: { p_signaal_id: signaal, p_artikel_id: artikel, p_artikel_vorm_id: vorm },
    }];
  }
  if (signaal && !artikel && leverancier) {
    return [{
      rpc: 'bord_artikel_aanmaken',
      args: {
        p_vestiging: input.vestiging,
        p_naam: input.naam.trim() || 'Product',
        p_leverancier_id: leverancier,
        p_eenheid: input.eenheid.trim() || 'stuk',
      },
    }];
  }
  if (!signaal) {
    return [{
      rpc: 'geen',
      reden: 'Er is nog geen open bordregel om te koppelen. Er wordt niets in het bord geschreven.',
    }];
  }
  return [{
    rpc: 'geen',
    reden: 'Geen artikelvorm om aan de bordregel te koppelen.',
  }];
}

export type VervolgIo = {
  mep: () => Promise<{ dubbel?: boolean }>;
  bestelbord: () => Promise<{ gekoppeld: boolean; reden?: string }>;
  intern: (productId: string) => Promise<unknown>;
};

export type VervolgResultaat =
  | { soort: 'geen' | 'vriezer_naar_koelcel' }
  | { soort: 'mep'; dubbel: boolean }
  | { soort: 'bestelbord'; gekoppeld: boolean; reden?: string }
  | { soort: 'intern_midsland' }
  | { soort: 'geblokkeerd'; reden: string };

export async function voerVervolgUit(
  actie: VervolgActie,
  ctx: { internProductId?: string | null },
  io: VervolgIo,
): Promise<VervolgResultaat> {
  if (actie === 'geen' || actie === 'vriezer_naar_koelcel') return { soort: actie };
  if (actie === 'mep') {
    const uit = await io.mep();
    return { soort: 'mep', dubbel: !!uit.dubbel };
  }
  if (actie === 'intern_midsland') {
    if (!ctx.internProductId) {
      return { soort: 'geblokkeerd', reden: 'Dit product staat niet in de interne producten.' };
    }
    await io.intern(ctx.internProductId);
    return { soort: 'intern_midsland' };
  }
  const bord = await io.bestelbord();
  return { soort: 'bestelbord', gekoppeld: bord.gekoppeld, reden: bord.reden };
}
