/** Pure helpers voor ontvangst v2 (achter schakelaar). Geen schrijfacties. */
import type { KeukenStandRegel, KeukenTelpoolRegel } from '@/hooks/useOntvangstV2';

export type Schakelaar = { vestiging: string; vlag: string; aan: boolean; mag_beslissen: boolean };

export type OntvangstModus = {
  test: boolean;
  ontvangstV2: boolean;
  keukenadvies: boolean;
  magBeslissen: boolean;
  /** p_vestiging voor alle nieuwe rpc's. */
  pVestiging: string;
  /** p_bron_vestiging: alleen in testmodus de actieve vestiging. */
  pBron: string | null;
};

/** Faalt de rpc of ontbreekt een rij: alles uit. Testmodus alleen met een rij voor 'Test'. */
export function bepaalModus(rijen: Schakelaar[] | null | undefined, actief: string, testGevraagd: boolean): OntvangstModus {
  const r = rijen ?? [];
  const test = testGevraagd && !!actief && r.some((x) => x.vestiging === 'Test');
  const doel = test ? 'Test' : actief;
  const vind = (vlag: string) => r.find((x) => x.vestiging === doel && x.vlag === vlag);
  const ov = vind('ontvangst_v2');
  const ka = vind('keukenadvies');
  return {
    test,
    ontvangstV2: test || !!ov?.aan,
    keukenadvies: test || !!ka?.aan,
    magBeslissen: (test || !!ov?.aan) && !!ov?.mag_beslissen,
    pVestiging: doel,
    pBron: test ? actief : null,
  };
}

/** Tekst voor personeel: nooit 'backorder'. */
export function restSoortLabel(soort: string | null | undefined): 'Mist' | 'Wordt nageleverd' {
  return soort === 'mist' ? 'Mist' : 'Wordt nageleverd';
}

/** 'do 5 nov' */
export function kortDatum(d: string | null | undefined): string {
  if (!d) return '';
  const [y, m, dag] = d.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, dag).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' }).replace(/\./g, '');
}

/** Telinvoer: decimale komma toegestaan, alleen aantallen van 0 t/m 100000. */
export function telInvoer(tekst: string): number | null {
  const invoer = tekst.trim().replace(',', '.');
  if (!invoer || !/^\d+(?:\.\d+)?$/.test(invoer)) return null;
  const aantal = Number(invoer);
  return Number.isFinite(aantal) && aantal >= 0 && aantal <= 100000 ? aantal : null;
}

/** Actief restant van hetzelfde artikel; artikel-id gaat voor een genormaliseerde naam. */
export function openRestVoorArtikel<T extends { artikel_id: string | null; naam: string; telt_als_onderweg: boolean; opnieuw_besteld: boolean }>(rijen: T[], zoek: { artikel_id?: string | null; naam?: string | null }): T | null {
  const actief = rijen.filter((r) => r.telt_als_onderweg === true && r.opnieuw_besteld === false);
  if (zoek.artikel_id) {
    const opId = actief.find((r) => r.artikel_id === zoek.artikel_id);
    if (opId) return opId;
  }
  const normaliseer = (naam: string) => naam.trim().toLowerCase().replace(/\s+/g, ' ');
  const naam = normaliseer(zoek.naam ?? '');
  return naam ? actief.find((r) => normaliseer(r.naam) === naam) ?? null : null;
}

/** Waarschuwing zonder bestelactie te blokkeren. */
export function restWaarschuwing(r: { soort: string; aantal: number; eenheid: string | null; sinds: string | null; verwacht_op: string | null }): string {
  const status = restSoortLabel(r.soort) === 'Mist' ? 'mist nog' : 'wordt nog nageleverd';
  const tekst = ['Let op:', r.aantal, r.eenheid?.trim(), status, 'sinds', kortDatum(r.sinds)].filter((deel) => deel !== null && deel !== undefined && deel !== '').join(' ');
  return r.verwacht_op ? `${tekst}, verwacht ${kortDatum(r.verwacht_op)}` : tekst;
}

export type RestBron = 'pakbon' | 'mail' | 'orderbevestiging';

export type EindcheckInvoer = {
  soort: string;
  signaal_id: string | null;
  open_regel_id: string | null;
  pakbon_regel_id: string | null;
  geleverd_vorm_id: string | null;
  besteld: number;
  binnen: number;
  kapot: number;
  ander_product: boolean;
  ander_product_tekst: string;
  nageleverd: boolean;
  rest_bron: RestBron | null;
  rest_notitie: string;
  verwacht_op: string;
  opmerking: string;
  /** Leverancier meldt nalevering zelf (API): personeel kiest niets. */
  automatisch: boolean;
};

/** Alleen automatisch als de leverancier zelf nalevering meldt: API-backorder of 'volgt' op de pakbon. Een pakbon alleen is niet genoeg. */
export function isAutomatisch(
  r: { signaal_id: string | null; pakbon_notitie: string | null },
  restanten: { bron: string | null; api_backorder_id: string | null; bestel_signaal_id: string | null }[],
): boolean {
  const api = !!r.signaal_id && restanten.some((x) => x.bron === 'api' && !!x.api_backorder_id && x.bestel_signaal_id === r.signaal_id);
  const n = (r.pakbon_notitie ?? '').toLowerCase();
  return api || n.includes('volgt') || n.includes('follows_later');
}

const OPEN_SOORTEN = new Set(['nalevering', 'mist', 'backorder']);

export function restantVan(r: Pick<EindcheckInvoer, 'besteld' | 'binnen'>): number {
  return Math.max(0, Number(r.besteld) - Number(r.binnen));
}

/** Melding als de regel nog niet af te ronden is, anders null. */
export function eindcheckFout(r: EindcheckInvoer): string | null {
  if (restantVan(r) <= 0 || !r.nageleverd || r.automatisch) return null;
  if (!r.rest_bron) return 'Kies waar staat dat het wordt nageleverd';
  if (!r.rest_notitie.trim()) return 'Notitie is verplicht bij Wordt nageleverd';
  return null;
}

/** Payload voor ontvangst_levering_afronden: alleen de toegestane sleutels. */
export function bouwRegel(r: EindcheckInvoer): Record<string, unknown> {
  const uit: Record<string, unknown> = {};
  if (OPEN_SOORTEN.has(r.soort)) uit.open_regel_id = r.open_regel_id;
  else if (r.signaal_id) uit.signaal_id = r.signaal_id;
  if (r.pakbon_regel_id) uit.pakbon_regel_id = r.pakbon_regel_id;
  if (r.geleverd_vorm_id) uit.geleverd_vorm_id = r.geleverd_vorm_id;
  uit.binnen = Number(r.binnen);
  if (r.kapot > 0) uit.kapot = Number(r.kapot);
  if (r.ander_product) {
    uit.ander_product = true;
    if (r.ander_product_tekst.trim()) uit.ander_product_tekst = r.ander_product_tekst.trim();
  }
  if (restantVan(r) > 0 && !r.automatisch) {
    if (r.nageleverd) {
      uit.rest = 'backorder';
      uit.rest_bron = r.rest_bron;
      uit.rest_notitie = r.rest_notitie.trim();
      if (r.verwacht_op) uit.verwacht_op = r.verwacht_op;
    } else {
      uit.rest = 'mist';
    }
  }
  if (r.opmerking.trim()) uit.opmerking = r.opmerking.trim();
  return uit;
}

/** Restant-regel zoals blokken en badges hem nodig hebben. */
type RestRij = { soort: string; opnieuw_besteld: boolean };

/** Blokken bovenaan Onderweg: actieve rijen eerst, opnieuw bestelde rijen apart (niet in teller). */
export function onderwegBlokken<T extends RestRij>(rijen: T[]) {
  const van = (soort: string) => ({
    actief: rijen.filter((r) => r.soort === soort && !r.opnieuw_besteld),
    opnieuw: rijen.filter((r) => r.soort === soort && r.opnieuw_besteld),
  });
  return { nageleverd: van('wordt_nageleverd'), mist: van('mist') };
}

/** Tellers op het Onderweg-tabblad: zandloper alleen voor nalevering, mist apart. */
export function onderwegTellers(rijen: RestRij[]) {
  const b = onderwegBlokken(rijen);
  return { nageleverd: b.nageleverd.actief.length, mist: b.mist.actief.length };
}

/** Badge op het bestelbord: alleen voor niet opnieuw bestelde regels. */
export function bordRestStatus(r: RestRij | null | undefined): 'nageleverd' | 'mist' | null {
  if (!r || r.opnieuw_besteld) return null;
  if (r.soort === 'wordt_nageleverd') return 'nageleverd';
  if (r.soort === 'mist') return 'mist';
  return null;
}

/** Badge per bestel_signaal_id over alle restant-regels: nageleverd wint van mist (ongevolgde volgorde); opnieuw bestelde rijen tellen niet mee. */
export function bordRestStatusPerSignaal(rijen: (RestRij & { bestel_signaal_id?: string | null })[]): Map<string, 'nageleverd' | 'mist'> {
  const uit = new Map<string, 'nageleverd' | 'mist'>();
  for (const r of rijen) {
    if (!r.bestel_signaal_id) continue;
    if (bordRestStatus(r) === 'nageleverd') uit.set(r.bestel_signaal_id, 'nageleverd');
    else if (bordRestStatus(r) === 'mist' && !uit.has(r.bestel_signaal_id)) uit.set(r.bestel_signaal_id, 'mist');
  }
  return uit;
}

/** Alleen te-checkenregels met een restbadge blijven bovenaan Onderweg zichtbaar. */
export function onderwegMetRest<T extends { id: string }>(
  teChecken: T[],
  onderweg: T[],
  status: ReadonlyMap<string, 'nageleverd' | 'mist'>,
): T[] {
  return [...teChecken.filter((r) => status.has(r.id)), ...onderweg];
}

/** Annuleren mag pas met een bron en een notitie van minstens 3 tekens. */
export function annuleerGeldig(bron: string | null | undefined, notitie: string): boolean {
  return !!bron && notitie.trim().length >= 3;
}

export function mandjeRedenLabel(reden: string | null | undefined): string {
  if (reden === 'kooyman_meldt_niet_meer') return 'Kooyman meldt hem niet meer';
  if (reden === 'controlemoment') return 'controlemoment';
  return reden ?? '';
}

/** Waarschuwingen uit ontvangst_levering_afronden die personeel moet zien: alleen 'ook opnieuw besteld'. Objecten ({naam, waarschuwing}) en strings. */
export function afrondWaarschuwingen(res: unknown): string[] {
  const w = (res as { waarschuwingen?: unknown } | null)?.waarschuwingen;
  if (!Array.isArray(w)) return [];
  return w.flatMap((x) => {
    const tekst = typeof x === 'string' ? x : typeof (x as { waarschuwing?: unknown })?.waarschuwing === 'string' ? (x as { waarschuwing: string }).waarschuwing : '';
    if (!tekst.includes('ook opnieuw besteld')) return [];
    const naam = typeof x === 'object' && x && typeof (x as { naam?: unknown }).naam === 'string' ? (x as { naam: string }).naam : '';
    return [naam ? `${naam}: ${tekst}` : tekst];
  });
}

/** Vandaag binnen: open restanten zonder pakbon (mist/backorder) staan al in de Onderweg-blokken. */
export function vandaagZonderOpenRest<T extends { soort: string }>(regels: T[]): T[] {
  return regels.filter((r) => r.soort !== 'mist' && r.soort !== 'backorder');
}

/** Telblok: regels waarvan de telpool klaar is tellen vandaag; de rest onderaan, op naam. */
export function splitsTelpool(regels: KeukenStandRegel[], pool: KeukenTelpoolRegel[] | undefined): {
  vandaag: (KeukenStandRegel & { pool?: KeukenTelpoolRegel })[];
  overig: (KeukenStandRegel & { pool?: KeukenTelpoolRegel })[];
} {
  if (!pool || !pool.length) return { vandaag: regels.map((r) => ({ ...r })), overig: [] };
  const opId = new Map(pool.map((p) => [p.telartikel_id, p]));
  const vandaag: (KeukenStandRegel & { pool?: KeukenTelpoolRegel })[] = [];
  const overig: (KeukenStandRegel & { pool?: KeukenTelpoolRegel })[] = [];
  for (const r of regels) {
    const p = opId.get(r.telartikel_id);
    const rij = p ? { ...r, pool: p } : { ...r };
    if (!p || p.klaar) vandaag.push(rij); else overig.push(rij);
  }
  vandaag.sort((a, b) => (a.pool?.volgorde ?? 0) - (b.pool?.volgorde ?? 0));
  overig.sort((a, b) => a.naam.localeCompare(b.naam));
  return { vandaag, overig };
}
