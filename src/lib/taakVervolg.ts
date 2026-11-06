/**
 * Eindactie na de aanvulketen. Welke stappen aan staan staat in keten.ts.
 * Zonder opgeslagen rij geldt het zaad: falafel via koelcel en vriezer,
 * tahinidressing direct naar de MEP.
 */

import type { Eindactie } from './keten';

export type { Eindactie, KetenInvoer, KetenRij } from './keten';
export {
  KETEN_ZAAD,
  VRIEZER_NAAR_KOELCEL,
  beschikbareEindacties,
  configVoorTaak,
  heeftVriezerNaarKoelcel,
  interneProductVoor,
  ketenUitleg,
  ketenVoor,
  lijstKnop,
  normTaakSleutel,
  normaliseerKeten,
  planKeten,
  rijVanDatabase,
  taakSleutelVan,
  valideerKeten,
} from './keten';

/** Oude actienaam. Alleen nog voor de uitvoerder; de keten gebruikt Eindactie. */
export type VervolgActie = 'geen' | Eindactie | 'vriezer_naar_koelcel';

/** Fout die de sluitlijst letterlijk toont, in plaats van de wifi-melding. */
export class VervolgFout extends Error {}

export type TaakVervolgRij = import('./keten').KetenRij;
export type VervolgInvoer = import('./keten').KetenInvoer;

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
