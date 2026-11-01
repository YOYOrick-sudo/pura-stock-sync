import type { ArtikelVorm, BestelSignaal } from '@/hooks/useBestelbord';

export const telMoment = (moment: string | null) => moment === 'na_sluiting' ? 'na_sluiting' as const : 'voor_opening' as const;

export function leverancierNaam(s: BestelSignaal, leveranciers?: Map<string, string>, vormen?: Map<string, ArtikelVorm>) {
  const vorm = s.artikel_vorm_id ? vormen?.get(s.artikel_vorm_id) : undefined;
  const id = s.leverancier_id ?? vorm?.leverancier_id;
  return (id ? leveranciers?.get(id) : null) ?? vorm?.leverancier_naam ?? 'Leverancier onbekend';
}

export function perLeverancier<T>(regels: T[], naam: (regel: T) => string) {
  const groepen = new Map<string, T[]>();
  for (const regel of regels) {
    const titel = naam(regel);
    groepen.set(titel, [...(groepen.get(titel) ?? []), regel]);
  }
  return [...groepen.entries()].sort(([a], [b]) => a === b ? 0 : a === 'Leverancier onbekend' ? 1 : b === 'Leverancier onbekend' ? -1 : a.localeCompare(b, 'nl'));
}

export const euro = (n: number) => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(n);

type RestantVoorTab = { soort: string; opnieuw_besteld: boolean; bestel_signaal_id?: string | null };

/**
 * Eén getal voor de Onderweg-tab.
 * besteldIds: regels met status besteld (het losse getal vóór de zandloper).
 * Restanten met soort wordt_nageleverd zijn de zandloper (backorder); mist is het oranje mist-getal.
 * Een restant dat al aan een bestelde regel hangt telt niet nog eens mee.
 * teChecken > 0 is het oranje stipje (verwachte levering vandaag of eerder). Samen met mist maakt dat de badge een waarschuwing.
 */
export function onderwegTabTeller(input: {
  besteldIds: readonly string[];
  teChecken: number;
  restanten: readonly RestantVoorTab[];
}): { aantal: number; aandacht: string | null } {
  const ids = new Set(input.besteldIds);
  let extra = 0;
  let mist = 0;
  for (const r of input.restanten) {
    if (r.opnieuw_besteld) continue;
    const nalevering = r.soort === 'wordt_nageleverd';
    const mistRij = r.soort === 'mist';
    if (!nalevering && !mistRij) continue;
    if (mistRij) mist += 1;
    if (!(r.bestel_signaal_id && ids.has(r.bestel_signaal_id))) extra += 1;
  }
  const delen: string[] = [];
  if (input.teChecken > 0) delen.push('te checken');
  if (mist > 0) delen.push('mist');
  return { aantal: input.besteldIds.length + extra, aandacht: delen.length ? delen.join(' en ') : null };
}