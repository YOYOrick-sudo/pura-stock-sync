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

/** Korte vraag op de regel, zelfde plek als de herkomst bij de andere producten. */
export function stapTitel(_naam: string, stap: AanvulStap): string {
  if (stap === 'koelcel') return 'Vul de lade aan uit de koelcel.';
  if (stap === 'vriezer') return 'Ontdooien of bestellen?';
  return 'Staat de lade op peil?';
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

/**
 * Producten waarbij pakken uit de koelcel meteen een vaste stap
 * "uit vriezer naar koelcel" opent. Nu alleen falafel; een volgend product
 * komt erbij als een regel in deze lijst.
 */
export type VriezerKoelcelProduct = {
  sleutel: string;
  past: (item: { naam?: string | null; product_sleutel?: string | null }) => boolean;
};

export const VRIEZER_NAAR_KOELCEL: readonly VriezerKoelcelProduct[] = [
  { sleutel: 'falafel', past: isFalafelVoorbeeld },
];

export function heeftVriezerNaarKoelcel(item: {
  naam?: string | null;
  product_sleutel?: string | null;
}): boolean {
  return VRIEZER_NAAR_KOELCEL.some((product) => product.past(item));
}

/** Vaste titel van de vervolgstap. De productnaam komt uit de sluitlijst. */
export function vriezerNaarKoelcelTitel(naam: string): string {
  const schoon = naam.trim() || 'Product';
  return `${schoon} uit vriezer naar koelcel`;
}

export type KetenRegel = {
  product_sleutel?: string | null;
  plek?: string | null;
  actief?: boolean | null;
  aanvul_tot?: number | null;
  doel_aantal?: number | null;
  batch_aantal?: number | null;
  eenheid?: string | null;
};

/** De actieve koelcelkaart van hetzelfde product, als die er is. */
export function koelcelRegelVoor<T extends KetenRegel>(item: KetenRegel, alle: readonly T[]): T | null {
  const sleutel = (item.product_sleutel ?? '').trim();
  if (!sleutel) return null;
  return (
    alle.find(
      (regel) =>
        regel !== item &&
        regel.actief !== false &&
        regel.plek === 'koelcel' &&
        (regel.product_sleutel ?? '').trim() === sleutel,
    ) ?? null
  );
}

export type HoeveelheidBron = 'peil' | 'gehaald';

function positief(waarde: number | null | undefined): number | null {
  const n = Number(waarde ?? NaN);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Hoeveel er uit de vriezer naar de koelcel gaat.
 * Heeft de koelcelkaart een peil (aanvullen-tot, anders het doel), dan tot dat peil.
 * Zonder peil: dezelfde hoeveelheid als net uit de koelcel gehaald.
 */
export function vriezerNaarKoelcelAantal(
  gehaald: { batch_aantal?: number | null; doel_aantal?: number | null },
  koelcel: { aanvul_tot?: number | null; doel_aantal?: number | null } | null,
): { aantal: number; bron: HoeveelheidBron } {
  if (koelcel) {
    const tot = positief(koelcel.aanvul_tot);
    if (tot != null) return { aantal: tot, bron: 'peil' };
    const doel = positief(koelcel.doel_aantal);
    if (doel != null) return { aantal: doel, bron: 'peil' };
  }
  return { aantal: ontdooiAantal(gehaald), bron: 'gehaald' };
}

/** Eenheid van het peil als we tot de koelcel aanvullen, anders die van de lade. */
export function vriezerNaarKoelcelEenheid(
  bron: HoeveelheidBron,
  lade: { eenheid?: string | null },
  koelcel: { eenheid?: string | null } | null,
): string | null | undefined {
  if (bron === 'peil' && (koelcel?.eenheid ?? '').trim()) return koelcel?.eenheid;
  return lade.eenheid;
}

const ONTDOOI_THT_DAGEN = 2;
const MAX_STICKERS = 50;

/** Zelfde datumregel als de bestaande ontdooisticker: "do 05-11". */
export function ontdooiStickerDatum(d: Date): string {
  return d
    .toLocaleDateString('nl-NL', { weekday: 'short', day: '2-digit', month: '2-digit' })
    .replace(/\./g, '');
}

/**
 * Opdracht voor de bestaande ontdooisticker. datum1 is de ontdooidatum
 * en komt op de sticker als "Uit vriezer". Geen printeraanroep.
 */
export type OntdooiStickerOpdracht = {
  type: 'ontdooid';
  naam: string;
  datum1: string;
  datum2: string;
  tht_dagen: number;
  aantal: number;
  bron: 'sluitlijst';
};

export function ontdooiStickerOpdracht(naam: string, aantal: number, nu = new Date()): OntdooiStickerOpdracht {
  const tm = new Date(nu.getTime());
  tm.setDate(tm.getDate() + ONTDOOI_THT_DAGEN);
  const stuks = Math.max(1, Math.min(MAX_STICKERS, Math.round(Number(aantal) || 1)));
  return {
    type: 'ontdooid',
    naam: naam.trim() || 'Product',
    datum1: ontdooiStickerDatum(nu),
    datum2: ontdooiStickerDatum(tm),
    tht_dagen: ONTDOOI_THT_DAGEN,
    aantal: stuks,
    bron: 'sluitlijst',
  };
}

export type VriezerStapStand = 'open' | 'af';

export function vriezerStapSleutel(vestiging: string, datum: string): string {
  return `sluit-vriezer-koelcel:${vestiging}:${datum}`;
}

/** Leest de open of afgevinkte vervolgstap. Kapotte opslag telt als leeg. */
export function leesVriezerStappen(ruw: string | null | undefined): Record<string, VriezerStapStand> {
  if (!ruw) return {};
  try {
    const data = JSON.parse(ruw) as unknown;
    if (!data || typeof data !== 'object' || Array.isArray(data)) return {};
    const uit: Record<string, VriezerStapStand> = {};
    for (const [id, stand] of Object.entries(data as Record<string, unknown>)) {
      if (stand === 'open' || stand === 'af') uit[id] = stand;
    }
    return uit;
  } catch {
    return {};
  }
}
