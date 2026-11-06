/**
 * Vaste aanvulketen op de sluitlijst.
 * De volgorde is altijd dezelfde. Per product staan alleen de stappen aan
 * die voor dat product gelden, plus één eindactie.
 *
 * werkbank → koelcel? → vriezer? → magazijn? → MEP | bestelbord | intern Midsland
 *
 * "Komt uit Midsland" is geen tweede lijst. Een match op interne_producten
 * zet de eindactie vast op intern bestellen. Zonder match bewaart de eigenaar
 * die keuze als eindactie in dezelfde rij.
 */

export type Eindactie = 'mep' | 'bestelbord' | 'intern_midsland';
export type VoorraadStap = 'koelcel' | 'vriezer' | 'magazijn';

export const STAP_VOLGORDE: readonly VoorraadStap[] = ['koelcel', 'vriezer', 'magazijn'];

export type KetenRij = {
  taakSleutel: string;
  vestiging: string | null;
  instructie: string;
  stapKoelcel: boolean;
  stapVriezer: boolean;
  stapMagazijn: boolean;
  /** null = de rij zegt nog niets over de keten. Zaad of afleiding vult hem. */
  eindactie: Eindactie | null;
};

export type KetenItem = {
  id?: string | null;
  naam?: string | null;
  product_sleutel?: string | null;
  plek?: string | null;
  bron?: string | null;
  categorie?: string | null;
  actief?: boolean | null;
};

export type InternNaam = { product_id: string; naam: string };

export type AanvulKeten = {
  stappen: VoorraadStap[];
  eindactie: Eindactie;
  komtUitMidsland: boolean;
  /** Vast omdat het product in interne_producten staat. */
  midslandVast: boolean;
  instructie: string;
  herkomst: 'config' | 'zaad' | 'afgeleid';
};

/** Voorbeelden die niet uit de kaarten te halen zijn. De rest wordt afgeleid. */
export const KETEN_ZAAD: readonly KetenRij[] = [
  {
    taakSleutel: 'falafel',
    vestiging: null,
    instructie: '',
    stapKoelcel: true,
    stapVriezer: true,
    stapMagazijn: false,
    eindactie: 'bestelbord',
  },
  {
    taakSleutel: 'tahinidressing',
    vestiging: null,
    instructie: '',
    stapKoelcel: false,
    stapVriezer: false,
    stapMagazijn: false,
    eindactie: 'mep',
  },
];

/** Producten uit het zaad met een vriezerstap. Bestaande tests lezen de naam. */
export const VRIEZER_NAAR_KOELCEL: readonly { sleutel: string }[] = KETEN_ZAAD
  .filter((rij) => rij.stapVriezer)
  .map((rij) => ({ sleutel: rij.taakSleutel }));

export function normTaakSleutel(waarde: string | null | undefined): string {
  return (waarde ?? '').trim().toLowerCase();
}

const EIND = new Set<Eindactie>(['mep', 'bestelbord', 'intern_midsland']);

export function leesEindactie(waarde: unknown): Eindactie | null {
  return typeof waarde === 'string' && EIND.has(waarde as Eindactie) ? (waarde as Eindactie) : null;
}

export function eindLabel(actie: Eindactie): string {
  if (actie === 'mep') return 'Naar MEP';
  if (actie === 'intern_midsland') return 'Intern bestellen';
  return 'Bijbestellen';
}

/** Tekst onder de productregel, in de stijl van de huidige sluitlijst. */
export function ketenUitleg(keten: AanvulKeten): string {
  const eerste = keten.stappen[0];
  if (eerste === 'koelcel') return 'Aanvullen uit koelcel';
  if (eerste === 'vriezer') return 'Aanvullen uit vriezer';
  if (eerste === 'magazijn') return 'Aanvullen uit magazijn';
  if (keten.eindactie === 'mep') return 'Naar MEP (maken)';
  if (keten.eindactie === 'intern_midsland') return 'Intern bestellen bij Midsland';
  return 'Bijbestellen';
}

export function ketenSamenvatting(stappen: readonly VoorraadStap[], eind: Eindactie): string {
  const slot = eind === 'mep' ? 'MEP' : eind === 'intern_midsland' ? 'intern Midsland' : 'bestelbord';
  return ['werkbank', ...stappen, slot].join(' → ');
}

/** Op de lijst en in het potlood: Midsland verbergt MEP en het bestelbord. */
export function beschikbareEindacties(komtUitMidsland: boolean): readonly Eindactie[] {
  return komtUitMidsland ? ['intern_midsland'] : ['mep', 'bestelbord'];
}

function namenPassen(a: string, b: string): boolean {
  if (!a || !b) return false;
  if (a === b) return true;
  return a.startsWith(`${b} `) || b.startsWith(`${a} `);
}

/**
 * Zelfde product als een interne naam. "Granola" past op "Granola huisgemaakt".
 * "Falafelwrap" past niet op "Falafel".
 */
export function interneProductVoor<T extends InternNaam>(
  item: { naam?: string | null; product_sleutel?: string | null },
  producten: readonly T[] | null | undefined,
): T | null {
  if (!producten?.length) return null;
  const sleutels = [normTaakSleutel(item.product_sleutel), normTaakSleutel(item.naam)].filter(Boolean);
  return producten.find((product) => {
    const naam = normTaakSleutel(product.naam);
    return sleutels.some((sleutel) => namenPassen(sleutel, naam));
  }) ?? null;
}

export function taakSleutelVan(item: { id?: string | null; naam?: string | null; product_sleutel?: string | null }): string {
  return normTaakSleutel(item.product_sleutel) || normTaakSleutel(item.naam) || normTaakSleutel(item.id);
}

function mapOudeActie(actie: string, als: string | null): Pick<KetenRij, 'stapKoelcel' | 'stapVriezer' | 'stapMagazijn' | 'eindactie'> {
  if (actie === 'vriezer_naar_koelcel') {
    return {
      stapKoelcel: true,
      stapVriezer: true,
      stapMagazijn: false,
      eindactie: leesEindactie(als) ?? 'bestelbord',
    };
  }
  const direct = leesEindactie(actie);
  if (direct) return { stapKoelcel: false, stapVriezer: false, stapMagazijn: false, eindactie: direct };
  const tweede = leesEindactie(als);
  if (tweede) return { stapKoelcel: false, stapVriezer: false, stapMagazijn: false, eindactie: tweede };
  return { stapKoelcel: false, stapVriezer: false, stapMagazijn: false, eindactie: null };
}

/** Leest een nieuwe rij, of een rij van vóór migratie 0070. */
export function rijVanDatabase(row: {
  taak_sleutel?: unknown;
  vestiging?: unknown;
  instructie?: unknown;
  vervolgactie?: unknown;
  vervolg_als_op?: unknown;
  stap_koelcel?: unknown;
  stap_vriezer?: unknown;
  stap_magazijn?: unknown;
  eindactie?: unknown;
}): KetenRij | null {
  const taakSleutel = normTaakSleutel(typeof row.taak_sleutel === 'string' ? row.taak_sleutel : '');
  if (!taakSleutel) return null;
  const vestiging = typeof row.vestiging === 'string' && row.vestiging.trim() ? row.vestiging.trim() : null;
  const instructie = typeof row.instructie === 'string' ? row.instructie.trim() : '';
  const nieuw = row.eindactie != null || row.stap_koelcel != null || row.stap_vriezer != null || row.stap_magazijn != null;
  if (nieuw) {
    return {
      taakSleutel,
      vestiging,
      instructie,
      stapKoelcel: row.stap_koelcel === true,
      stapVriezer: row.stap_vriezer === true,
      stapMagazijn: row.stap_magazijn === true,
      eindactie: leesEindactie(row.eindactie),
    };
  }
  const actie = typeof row.vervolgactie === 'string' ? row.vervolgactie : '';
  const als = typeof row.vervolg_als_op === 'string' && row.vervolg_als_op && row.vervolg_als_op !== 'geen'
    ? row.vervolg_als_op
    : null;
  return { taakSleutel, vestiging, instructie, ...mapOudeActie(actie, als) };
}

function kies(sleutel: string, vestiging: string | null | undefined, pool: readonly KetenRij[]): KetenRij | null {
  if (!sleutel) return null;
  const matches = pool.filter((rij) => rij.taakSleutel === sleutel);
  if (vestiging) {
    const lokaal = matches.find((rij) => rij.vestiging === vestiging);
    if (lokaal) return lokaal;
  }
  return matches.find((rij) => rij.vestiging == null) ?? null;
}

/** Vestiging-rij wint van een rij zonder vestiging, de productsleutel van de naam. */
export function configVoorTaak(
  item: { naam?: string | null; product_sleutel?: string | null },
  vestiging: string | null | undefined,
  rijen: readonly KetenRij[] | null | undefined,
): KetenRij | null {
  const pool = rijen ?? [];
  const primair = normTaakSleutel(item.product_sleutel);
  const naam = normTaakSleutel(item.naam);
  return kies(primair, vestiging, pool)
    ?? kies(naam, vestiging, pool)
    ?? kies(primair, vestiging, KETEN_ZAAD)
    ?? kies(naam, vestiging, KETEN_ZAAD);
}

function stappenVanRij(rij: KetenRij): VoorraadStap[] {
  const uit: VoorraadStap[] = [];
  if (rij.stapKoelcel) uit.push('koelcel');
  if (rij.stapVriezer) uit.push('vriezer');
  if (rij.stapMagazijn) uit.push('magazijn');
  return uit;
}

function groente(item: KetenItem): boolean {
  return (item.categorie ?? '').toLowerCase().includes('groente');
}

function zelfdeProduct(a: KetenItem, b: KetenItem): boolean {
  const sleutel = normTaakSleutel(a.product_sleutel);
  if (!sleutel) return false;
  return normTaakSleutel(b.product_sleutel) === sleutel;
}

function stapUitBron(bron: string | null | undefined): VoorraadStap | null {
  if (bron === 'koelcel_inkoop') return 'koelcel';
  if (bron === 'vriezer') return 'vriezer';
  if (bron === 'magazijn') return 'magazijn';
  return null;
}

/** Stappen uit de kaarten van hetzelfde product, altijd in de vaste volgorde. */
export function afgeleideStappen(item: KetenItem, alle: readonly KetenItem[]): VoorraadStap[] {
  const plekken = new Set<string>();
  for (const ander of alle) {
    if (ander === item || ander.actief === false) continue;
    if (!zelfdeProduct(item, ander) || !ander.plek) continue;
    plekken.add(ander.plek);
  }
  const uitBron = stapUitBron(item.bron);
  if (uitBron) plekken.add(uitBron);
  const fruit = groente(item) || alle.some((ander) => ander !== item && zelfdeProduct(item, ander) && groente(ander));
  return STAP_VOLGORDE.filter((stap) => plekken.has(stap) && !(fruit && stap === 'vriezer'));
}

function kaartOp(item: KetenItem, alle: readonly KetenItem[], stap: VoorraadStap): KetenItem | null {
  return alle.find((ander) => ander !== item && ander.actief !== false && ander.plek === stap && zelfdeProduct(item, ander)) ?? null;
}

function eindUitBron(bron: string | null | undefined): Eindactie {
  if (bron === 'midsland') return 'intern_midsland';
  if (bron === 'zelf_west' || bron === 'snijden') return 'mep';
  return 'bestelbord';
}

export function afgeleideEindactie(item: KetenItem, alle: readonly KetenItem[], stappen: readonly VoorraadStap[]): Eindactie {
  if (item.bron === 'midsland') return 'intern_midsland';
  if (stappen.length === 0) return eindUitBron(item.bron);
  const laatste = stappen[stappen.length - 1];
  const kaart = kaartOp(item, alle, laatste);
  return eindUitBron(kaart?.bron ?? item.bron);
}

function afronden(rij: KetenRij, internMatch: boolean, herkomst: 'config' | 'zaad'): AanvulKeten {
  const eindactie: Eindactie = internMatch ? 'intern_midsland' : (rij.eindactie ?? 'bestelbord');
  return {
    stappen: stappenVanRij(rij),
    eindactie,
    komtUitMidsland: internMatch || eindactie === 'intern_midsland',
    midslandVast: internMatch,
    instructie: rij.instructie,
    herkomst,
  };
}

/**
 * Opgeslagen rij wint van het zaad, het zaad van de kaarten.
 * Een match op interne_producten zet de eindactie daarna vast op Midsland.
 * Een rij zonder eindactie telt alleen voor de instructie.
 */
export function ketenVoor(
  item: KetenItem,
  alle: readonly KetenItem[],
  vestiging: string | null | undefined,
  rijen: readonly KetenRij[] | null | undefined,
  intern: readonly InternNaam[] | null | undefined,
): AanvulKeten {
  const match = !!interneProductVoor(item, intern);
  const pool = rijen ?? [];
  const primair = normTaakSleutel(item.product_sleutel);
  const naam = normTaakSleutel(item.naam);
  const opgeslagen = kies(primair, vestiging, pool) ?? kies(naam, vestiging, pool);
  const zaad = kies(primair, vestiging, KETEN_ZAAD) ?? kies(naam, vestiging, KETEN_ZAAD);
  if (opgeslagen?.eindactie) return afronden(opgeslagen, match, 'config');
  if (zaad?.eindactie) {
    return afronden({ ...zaad, instructie: opgeslagen?.instructie || zaad.instructie }, match, 'zaad');
  }
  const stappen = afgeleideStappen(item, alle);
  const eindactie: Eindactie = match ? 'intern_midsland' : afgeleideEindactie(item, alle, stappen);
  return {
    stappen,
    eindactie,
    komtUitMidsland: match || eindactie === 'intern_midsland',
    midslandVast: match,
    instructie: opgeslagen?.instructie ?? '',
    herkomst: 'afgeleid',
  };
}

export function heeftVriezerNaarKoelcel(
  item: KetenItem,
  rijen?: readonly KetenRij[] | null,
  vestiging?: string | null,
): boolean {
  return ketenVoor(item, [], vestiging, rijen, []).stappen.includes('vriezer');
}

export type KetenInvoer = {
  instructie: string;
  stapKoelcel: boolean;
  stapVriezer: boolean;
  stapMagazijn: boolean;
  eindactie: Eindactie;
  komtUitMidsland: boolean;
};

/** Midsland dwingt de eindactie. MEP en bestelbord vallen dan weg. */
export function normaliseerKeten(invoer: KetenInvoer, opt: { midslandVast: boolean }): KetenInvoer {
  const komtUitMidsland = opt.midslandVast || invoer.komtUitMidsland;
  let eindactie = leesEindactie(invoer.eindactie) ?? 'bestelbord';
  if (komtUitMidsland) eindactie = 'intern_midsland';
  else if (eindactie === 'intern_midsland') eindactie = 'bestelbord';
  return {
    instructie: invoer.instructie.trim(),
    stapKoelcel: !!invoer.stapKoelcel,
    stapVriezer: !!invoer.stapVriezer,
    stapMagazijn: !!invoer.stapMagazijn,
    eindactie,
    komtUitMidsland,
  };
}

export function valideerKeten(invoer: KetenInvoer): string | null {
  if (invoer.instructie.trim().length > 280) return 'Houd de instructie kort, hooguit een paar regels.';
  return null;
}

export type KetenPlan =
  | { soort: 'open-stap'; index: number; stap: VoorraadStap; titel: string }
  | { soort: 'transfer'; stap: VoorraadStap; sticker: boolean }
  | { soort: 'eind'; actie: Eindactie }
  | { soort: 'niets' };

export function stapTitel(naam: string, stap: VoorraadStap, bestemming: 'werkbank' | 'werkblad' = 'werkbank'): string {
  const schoon = naam.trim() || 'Product';
  const naar = bestemming === 'werkblad' ? 'werkblad' : 'werkbank';
  if (stap === 'koelcel') return `${schoon} uit koelcel naar ${naar}`;
  if (stap === 'vriezer') return `${schoon} uit vriezer naar koelcel`;
  return `${schoon} uit magazijn naar ${naar}`;
}

function eindVan(keten: AanvulKeten): Eindactie {
  return keten.komtUitMidsland ? 'intern_midsland' : keten.eindactie;
}

/**
 * Eén tik, één plan. Een transfer print hooguit de ontdooisticker.
 * De eindactie is een ander plan en maakt nooit óók een transfer.
 */
export function planKeten(
  keten: AanvulKeten,
  gebeurtenis: 'op' | 'stap-af' | 'ook-op',
  openIndex: number | null,
  naam: string,
  bestemming: 'werkbank' | 'werkblad' = 'werkbank',
  /** Na een transfer of eindactie blijft een tweede tik leeg. */
  alKlaar = false,
): KetenPlan {
  if (alKlaar) return { soort: 'niets' };
  if (gebeurtenis === 'op') {
    if (openIndex != null) return { soort: 'niets' };
    if (keten.stappen.length === 0) return { soort: 'eind', actie: eindVan(keten) };
    const stap = keten.stappen[0];
    return { soort: 'open-stap', index: 0, stap, titel: stapTitel(naam, stap, bestemming) };
  }
  if (openIndex == null || openIndex < 0 || openIndex >= keten.stappen.length) return { soort: 'niets' };
  const stap = keten.stappen[openIndex];
  if (gebeurtenis === 'stap-af') return { soort: 'transfer', stap, sticker: stap === 'vriezer' };
  const next = openIndex + 1;
  if (next < keten.stappen.length) {
    const volgende = keten.stappen[next];
    return { soort: 'open-stap', index: next, stap: volgende, titel: stapTitel(naam, volgende, bestemming) };
  }
  return { soort: 'eind', actie: eindVan(keten) };
}

/** Hooguit één schrijfactie per plan. */
export function schrijfSoort(plan: KetenPlan): 'transfer' | 'eind' | null {
  if (plan.soort === 'transfer' || plan.soort === 'eind') return plan.soort;
  return null;
}

export function lijstKnop(keten: AanvulKeten, stapOpen: boolean): { id: 'op' | Eindactie; label: string } | null {
  if (stapOpen) return null;
  if (keten.stappen.length > 0) return { id: 'op', label: 'Op' };
  if (keten.komtUitMidsland) return { id: 'intern_midsland', label: eindLabel('intern_midsland') };
  return { id: keten.eindactie, label: eindLabel(keten.eindactie) };
}

export type KetenSessie = { index: number; af: boolean; voorbeeldEind?: Eindactie };

export function ketenSessieSleutel(vestiging: string, datum: string): string {
  return `sluit-keten:${vestiging}:${datum}`;
}

export function leesKetenSessie(ruw: string | null | undefined): Record<string, KetenSessie> {
  if (!ruw) return {};
  try {
    const data = JSON.parse(ruw) as unknown;
    if (!data || typeof data !== 'object' || Array.isArray(data)) return {};
    const uit: Record<string, KetenSessie> = {};
    for (const [id, waarde] of Object.entries(data as Record<string, unknown>)) {
      if (!waarde || typeof waarde !== 'object' || Array.isArray(waarde)) continue;
      const rij = waarde as { index?: unknown; af?: unknown; voorbeeldEind?: unknown };
      const index = typeof rij.index === 'number' && rij.index >= 0 && rij.index <= 2 ? Math.floor(rij.index) : null;
      if (index == null) continue;
      uit[id] = { index, af: rij.af === true, voorbeeldEind: leesEindactie(rij.voorbeeldEind) ?? undefined };
    }
    return uit;
  } catch {
    return {};
  }
}
