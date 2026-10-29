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