/**
 * Voorbeeld van de aanvulketen op de sluitlijst: alleen falafel, en alleen
 * als de schakelaar aan staat. Geen database, geen schrijfacties.
 *
 * De schakelaar staat uit tot iemand hem aanzet:
 * - bouwvariabele VITE_SLUIT_AANVULKETEN=1, of
 * - ?aanvulketen=1 op de Test-vestiging, of
 * - ?aanvulketen=1 op een preview-host (Lovable-preview of localhost).
 * Op de gewone productie-app voor West of Midsland doet de parameter niets.
 */

export type AanvulStap = 'lade' | 'koelcel' | 'vriezer';

export type AanvulKeuze =
  | 'op_peil'
  | 'aanvullen'
  | 'aangevuld_koelcel'
  | 'koelcel_onvoldoende'
  | 'ontdooien'
  | 'vriezer_onvoldoende';

export type AanvulGevolg =
  | { soort: 'stap'; stap: AanvulStap }
  | { soort: 'afvinken' }
  | { soort: 'ontdooien' }
  | { soort: 'bestellen' };

const MEERVOUD: Record<string, string> = {
  bak: 'bakken',
  zak: 'zakken',
  stuk: 'stuks',
  kist: 'kisten',
  doos: 'dozen',
};

/** Alleen het product falafel. Een naam die het woord alleen bevat telt niet. */
export function isFalafelVoorbeeld(item: { naam?: string | null; product_sleutel?: string | null }): boolean {
  const sleutel = (item.product_sleutel ?? '').trim().toLowerCase();
  const naam = (item.naam ?? '').trim().toLowerCase();
  return sleutel === 'falafel' || naam === 'falafel';
}

export function aanvulketenAan(input: {
  vestiging?: string | null;
  env?: string | null;
  search?: string | null;
  previewHost?: boolean;
}): boolean {
  if (input.env === '1') return true;
  const ruw = (input.search ?? '').replace(/^\?/, '');
  if (new URLSearchParams(ruw).get('aanvulketen') !== '1') return false;
  if ((input.vestiging ?? '').trim() === 'Test') return true;
  return input.previewHost === true;
}

/** Wat een tik doet. Tussenstappen schrijven niets. */
export function gevolgVanKeuze(keuze: AanvulKeuze): AanvulGevolg {
  switch (keuze) {
    case 'op_peil':
    case 'aangevuld_koelcel':
      return { soort: 'afvinken' };
    case 'aanvullen':
      return { soort: 'stap', stap: 'koelcel' };
    case 'koelcel_onvoldoende':
      return { soort: 'stap', stap: 'vriezer' };
    case 'ontdooien':
      return { soort: 'ontdooien' };
    case 'vriezer_onvoldoende':
      return { soort: 'bestellen' };
  }
}

/** Korte titel boven de knoppen van deze stap. */
export function stapTitel(naam: string, stap: AanvulStap): string {
  if (stap === 'koelcel') return `${naam}: waar komt het vandaan?`;
  if (stap === 'vriezer') return `${naam}: ontdooien of bestellen?`;
  return `${naam}: staat de lade op peil?`;
}

/** Doel van de lade, niet een gemeten voorraad. */
export function doelLadeTekst(vulnorm: string | null | undefined): string {
  if (vulnorm === 'half') return 'Doel lade: minimaal ½ bak';
  if (vulnorm === 'bodem') return 'Doel lade: bodempje';
  return 'Doel lade: vol';
}

/** Hoeveel er ontdooid wordt: de MEP-batch, anders het doel, anders 1. */
export function ontdooiAantal(item: { batch_aantal?: number | null; doel_aantal?: number | null }): number {
  const batch = Number(item.batch_aantal ?? 0);
  if (batch > 0) return batch;
  const doel = Number(item.doel_aantal ?? 0);
  if (doel > 0) return doel;
  return 1;
}

export function hoeveelheidTekst(aantal: number, eenheid: string | null | undefined): string {
  const basis = (eenheid ?? '').trim() || 'bak';
  const woord = aantal === 1 ? basis : (MEERVOUD[basis.toLowerCase()] ?? basis);
  const getal = Number.isInteger(aantal) ? String(aantal) : String(aantal).replace('.', ',');
  return `${getal} ${woord}`;
}

export function ontdooiInstructie(item: {
  batch_aantal?: number | null;
  doel_aantal?: number | null;
  eenheid?: string | null;
}): string {
  const hoeveel = hoeveelheidTekst(ontdooiAantal(item), item.eenheid);
  return `Zet ${hoeveel} uit de vriezer in de koelcel voor de volgende service.`;
}

/** Tekst nadat de regel is weggezet. */
export function aanvulUitkomst(doorgezetNaar: string | null | undefined): string {
  if (doorgezetNaar === 'mep') return 'In ontdooiing · lade later aanvullen';
  if (doorgezetNaar === 'bestelbord') return 'Bijbesteld · op het bestelbord';
  if (doorgezetNaar === 'midsland') return 'Bijbesteld · op de bestellijst Midsland';
  return 'Gemeld';
}
