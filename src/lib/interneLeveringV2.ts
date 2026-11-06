import { getal } from '@/lib/hoeveelheid';

/** Schakelaar in fase2_vlag. Uit voor West en Midsland, aan voor Test, tot iemand hem omzet. */
export const INTERNE_LEVERING_V2 = 'interne_levering_v2';

export const GROEP_TITEL = 'Midsland (intern)';
export const MEP_TITEL = 'Voor West';
export const VAN_VESTIGING = 'Midsland';
export const NAAR_VESTIGING = 'West';

/** Zelfde zin als interne_v2_inplannen wanneer de aanvraag een proef op Test is. */
export const GEEN_MEP_OP_TEST = 'Op Test is er geen MEP. Gebruik Uit voorraad klaarzetten.';

/** Op Test bestaat geen MEP-taak. De knop Inplannen hoort dan deze zin te tonen. */
export function meldingInplannenOpTest(vestiging: string | null | undefined): string | null {
  return vestiging === 'Test' ? GEEN_MEP_OP_TEST : null;
}

/** Haalt die zin uit een rpc-fout, ook als Postgres er context omheen zet. */
export function meldingUitInplanFout(fout: unknown): string | null {
  const tekst = fout instanceof Error
    ? fout.message
    : typeof fout === 'string'
      ? fout
      : (typeof fout === 'object' && fout && 'message' in fout && typeof fout.message === 'string' ? fout.message : '');
  return tekst.includes(GEEN_MEP_OP_TEST) ? GEEN_MEP_OP_TEST : null;
}

export const EENHEDEN = ['stuks', 'bak', 'kg', 'g', 'pak', 'zak', 'doos', 'emmer', 'tray', 'fust'] as const;

export type StatusLabel =
  | 'Artikel controleren'
  | 'Besteld'
  | 'Bevestigd'
  | 'Klaar'
  | 'Onderweg'
  | 'Ontvangen'
  | 'Geannuleerd';

export type StatusToon = 'info' | 'success' | 'warning' | 'neutral';

/** Aantallen blijven los: besteld, klaar, meegegeven, ontvangen, plus wat bewust is geannuleerd. */
export type Aanvraag = {
  id: string;
  naam: string;
  vrije_naam: string | null;
  product_id: string | null;
  eenheid: string;
  besteld_aantal: number;
  gewenste_leverdag: string | null;
  verwachte_leverdag: string | null;
  mep_datum: string | null;
  mep_taak_id: string | null;
  mep_aantal: number;
  mep_klaar_aantal: number;
  voorraad_aantal: number;
  klaar_aantal: number;
  meegegeven_aantal: number;
  ontvangen_aantal: number;
  geannuleerd_aantal: number;
  bevestigd: boolean;
  notitie: string | null;
  besteld_op: string;
};

export type StatusWeergave = {
  label: StatusLabel;
  toon: StatusToon;
  nieuw: boolean;
  verstreken: boolean;
  openRestant: number;
  ontvangstVerschil: number | null;
};

export function rond(n: number): number {
  return Math.round(n * 1000) / 1000;
}

export function vandaagAmsterdam(nu = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam' }).format(nu);
}

export function v2BordZichtbaar(vestiging: string | null | undefined, vlagAan: boolean) {
  return vlagAan === true && (vestiging === 'West' || vestiging === 'Test');
}

export function v2MepZichtbaar(vestiging: string | null | undefined, vlagAan: boolean) {
  return vlagAan === true && (vestiging === 'Midsland' || vestiging === 'Test');
}

/** Met de v2-schakelaar uit blijft de huidige interne kaart staan. */
export function v1InternZichtbaar(v2Bord: boolean, v1Zichtbaar: boolean) {
  return v2Bord ? false : v1Zichtbaar;
}

/**
 * Plaatsen kiest geen MEP-dag. De verschuiving na 17:00 hoort niet bij deze route;
 * Midsland kiest de dag pas bij inplannen.
 */
export function mepDatumBijPlaatsen(): null {
  return null;
}

export function openRestant(a: Pick<Aanvraag, 'besteld_aantal' | 'ontvangen_aantal' | 'geannuleerd_aantal'>) {
  return rond(Math.max(0, a.besteld_aantal - a.ontvangen_aantal - a.geannuleerd_aantal));
}

/** Negatief: minder ontvangen dan meegegeven. Null zolang er nog niets is meegegeven of de aantallen gelijk zijn. */
export function ontvangstVerschil(a: Pick<Aanvraag, 'meegegeven_aantal' | 'ontvangen_aantal'>) {
  if (a.meegegeven_aantal <= 0) return null;
  if (a.ontvangen_aantal === a.meegegeven_aantal) return null;
  return rond(a.ontvangen_aantal - a.meegegeven_aantal);
}

export function gekoppeld(a: Pick<Aanvraag, 'product_id'>) {
  return !!a.product_id;
}

/** Uitvoeren (inplannen, klaarzetten, meegeven) mag pas nadat een bestaand artikel is gekoppeld. */
export function uitvoeringGeblokkeerd(a: Pick<Aanvraag, 'product_id'>) {
  return !gekoppeld(a);
}

export function nogTeVerdelen(a: Aanvraag) {
  return rond(Math.max(0, a.besteld_aantal - a.geannuleerd_aantal - a.mep_aantal - a.voorraad_aantal));
}

export function nogMeeTeGeven(a: Aanvraag) {
  return rond(Math.max(0, a.klaar_aantal - a.meegegeven_aantal));
}

export function nogTeOntvangen(a: Aanvraag) {
  return rond(Math.max(0, a.meegegeven_aantal - a.ontvangen_aantal));
}

export function nogTeAnnuleren(a: Aanvraag) {
  return openRestant(a);
}

function eisAantal(aantal: number, max: number, leeg: string) {
  if (!Number.isFinite(aantal) || aantal <= 0) throw new Error(leeg);
  if (aantal > max + 0.0001) throw new Error(`Hooguit ${getal(max)}`);
}

export function statusWeergave(a: Aanvraag, vandaag: string): StatusWeergave {
  const open = openRestant(a);
  const verschil = ontvangstVerschil(a);
  let label: StatusLabel = 'Besteld';
  let toon: StatusToon = 'info';
  if (!gekoppeld(a)) {
    label = 'Artikel controleren';
    toon = 'warning';
  } else if (open <= 0 && a.ontvangen_aantal <= 0) {
    label = 'Geannuleerd';
    toon = 'neutral';
  } else if (open <= 0) {
    label = 'Ontvangen';
    toon = 'success';
  } else if (a.meegegeven_aantal > a.ontvangen_aantal) {
    label = 'Onderweg';
    toon = 'info';
  } else if (a.klaar_aantal > a.meegegeven_aantal) {
    label = 'Klaar';
    toon = 'success';
  } else if (a.bevestigd) {
    label = 'Bevestigd';
    toon = 'info';
  }
  const verstreken = !!a.verwachte_leverdag
    && a.verwachte_leverdag < vandaag
    && open > 0
    && label !== 'Artikel controleren'
    && label !== 'Geannuleerd'
    && label !== 'Ontvangen';
  return {
    label,
    toon,
    nieuw: label === 'Besteld' || label === 'Artikel controleren',
    verstreken,
    openRestant: open,
    ontvangstVerschil: verschil,
  };
}

export function aantalRegel(a: Aanvraag) {
  const delen = [`${getal(a.besteld_aantal)} ${a.eenheid} besteld`];
  if (a.klaar_aantal > 0) delen.push(`${getal(a.klaar_aantal)} klaar`);
  if (a.meegegeven_aantal > 0) delen.push(`${getal(a.meegegeven_aantal)} meegegeven`);
  if (a.ontvangen_aantal > 0) delen.push(`${getal(a.ontvangen_aantal)} ontvangen`);
  if (a.geannuleerd_aantal > 0) delen.push(`${getal(a.geannuleerd_aantal)} geannuleerd`);
  const verschil = ontvangstVerschil(a);
  if (verschil != null) delen.push(`verschil ${getal(Math.abs(verschil))}`);
  const open = openRestant(a);
  if (open > 0 && (a.klaar_aantal > 0 || a.meegegeven_aantal > 0 || a.ontvangen_aantal > 0 || a.bevestigd)) {
    delen.push(`nog ${getal(open)} open`);
  }
  return delen.join(' · ');
}

/** Open aanvragen blijven zichtbaar, los van de gekozen MEP-dag. */
export function mepRegels<T extends Aanvraag>(regels: T[], _gekozenDag: string | null) {
  return regels.filter((r) => {
    const open = openRestant(r);
    return open > 0 && r.ontvangen_aantal + r.geannuleerd_aantal < r.besteld_aantal;
  });
}

export function telOpenAanvragen(regels: Aanvraag[] | null | undefined) {
  if (!regels) return 0;
  return regels.filter((r) => openRestant(r) > 0).length;
}

export function leverdagTekst(iso: string | null | undefined) {
  if (!iso) return '';
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return '';
  return new Date(y, m - 1, d).toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' }).replace(/\./g, '');
}

function basis(deel: Partial<Aanvraag> & Pick<Aanvraag, 'id' | 'naam' | 'eenheid' | 'besteld_aantal'>): Aanvraag {
  return {
    vrije_naam: null,
    product_id: null,
    gewenste_leverdag: null,
    verwachte_leverdag: null,
    mep_datum: mepDatumBijPlaatsen(),
    mep_taak_id: null,
    mep_aantal: 0,
    mep_klaar_aantal: 0,
    voorraad_aantal: 0,
    klaar_aantal: 0,
    meegegeven_aantal: 0,
    ontvangen_aantal: 0,
    geannuleerd_aantal: 0,
    bevestigd: false,
    notitie: null,
    besteld_op: new Date(0).toISOString(),
    ...deel,
  };
}

export function plaatsProduct(input: {
  id: string;
  productId: string;
  naam: string;
  eenheid: string;
  aantal: number;
  maxPerBestelling: number | null;
  gewensteLeverdag?: string | null;
  notitie?: string | null;
  besteldOp?: string;
}): Aanvraag {
  const max = input.maxPerBestelling != null && input.maxPerBestelling >= 1 ? input.maxPerBestelling : 100000;
  eisAantal(input.aantal, max, 'Vul een aantal groter dan 0 in');
  return basis({
    id: input.id,
    naam: input.naam,
    product_id: input.productId,
    eenheid: input.eenheid,
    besteld_aantal: rond(input.aantal),
    gewenste_leverdag: input.gewensteLeverdag ?? null,
    notitie: input.notitie ?? null,
    besteld_op: input.besteldOp ?? new Date(0).toISOString(),
  });
}

export function plaatsVrijeNaam(input: {
  id: string;
  naam: string;
  eenheid: string;
  aantal: number;
  gewensteLeverdag?: string | null;
  besteldOp?: string;
}): Aanvraag {
  const naam = input.naam.trim();
  if (naam.length < 2) throw new Error('Vul een naam in');
  eisAantal(input.aantal, 100000, 'Vul een aantal groter dan 0 in');
  if (!input.eenheid.trim()) throw new Error('Kies een eenheid');
  return basis({
    id: input.id,
    naam,
    vrije_naam: naam,
    product_id: null,
    eenheid: input.eenheid.trim(),
    besteld_aantal: rond(input.aantal),
    gewenste_leverdag: input.gewensteLeverdag ?? null,
    besteld_op: input.besteldOp ?? new Date(0).toISOString(),
  });
}

export function koppelArtikel(a: Aanvraag, product: { id: string; naam: string }) {
  if (gekoppeld(a)) throw new Error('Dit artikel is al gekoppeld');
  if (!product.id) throw new Error('Kies een bestaand artikel');
  return { ...a, product_id: product.id, naam: product.naam };
}

export function planOpMep(a: Aanvraag, input: { aantal: number; mepDatum: string; verwachteLeverdag: string; taakId: string }): Aanvraag {
  if (uitvoeringGeblokkeerd(a)) throw new Error('Koppel eerst een bestaand artikel');
  if (!input.mepDatum) throw new Error('Kies een MEP-dag');
  if (!input.verwachteLeverdag) throw new Error('Kies de verwachte leverdag');
  if (a.mep_datum && a.mep_datum !== input.mepDatum) throw new Error('Deze aanvraag staat al op een andere MEP-dag');
  const ruimte = nogTeVerdelen(a);
  eisAantal(input.aantal, ruimte, 'Er is niets meer in te plannen');
  return {
    ...a,
    mep_datum: input.mepDatum,
    mep_taak_id: a.mep_taak_id ?? input.taakId,
    mep_aantal: rond(a.mep_aantal + input.aantal),
    verwachte_leverdag: input.verwachteLeverdag,
    bevestigd: true,
  };
}

/** Doel van de gedeelde MEP-taak gaat omhoog met alleen het ingeplande deel van deze aanvraag. */
export function doelNaPlan(huidigDoel: number | null, extra: number) {
  return rond((huidigDoel ?? 0) + extra);
}

export function doelNaMinder(huidigDoel: number | null, minder: number) {
  const doel = rond(Math.max(0, (huidigDoel ?? 0) - minder));
  return { doel, annuleren: doel <= 0 };
}

export function klaarUitVoorraad(a: Aanvraag, input: { aantal: number; verwachteLeverdag: string; meegeven: boolean }): Aanvraag {
  if (uitvoeringGeblokkeerd(a)) throw new Error('Koppel eerst een bestaand artikel');
  if (!input.verwachteLeverdag) throw new Error('Kies de verwachte leverdag');
  const ruimte = nogTeVerdelen(a);
  eisAantal(input.aantal, ruimte, 'Er is niets meer uit voorraad klaar te zetten');
  const aantal = rond(input.aantal);
  return {
    ...a,
    voorraad_aantal: rond(a.voorraad_aantal + aantal),
    klaar_aantal: rond(a.klaar_aantal + aantal),
    meegegeven_aantal: input.meegeven ? rond(a.meegegeven_aantal + aantal) : a.meegegeven_aantal,
    verwachte_leverdag: input.verwachteLeverdag,
    bevestigd: true,
  };
}

export function geefMee(a: Aanvraag, aantal: number): Aanvraag {
  if (uitvoeringGeblokkeerd(a)) throw new Error('Koppel eerst een bestaand artikel');
  const ruimte = nogMeeTeGeven(a);
  if (ruimte <= 0 || aantal > ruimte + 0.0001) throw new Error('Je kunt niet meer meegeven dan er klaarstaat');
  if (!Number.isFinite(aantal) || aantal <= 0) throw new Error('Vul een aantal groter dan 0 in');
  return { ...a, meegegeven_aantal: rond(a.meegegeven_aantal + aantal) };
}

/**
 * MEP-afronding zet alleen klaar, met de werkelijke hoeveelheid.
 * Te weinig gemaakt rondt niet alle gekoppelde aanvragen af. Meegeven gebeurt hier niet.
 */
export function verdeelMepKlaar(aanvragen: Aanvraag[], taakId: string, gemaakt: number): Aanvraag[] {
  if (!Number.isFinite(gemaakt) || gemaakt <= 0) throw new Error('Aantal moet groter dan 0 zijn');
  const volgorde = [...aanvragen].sort((x, y) => x.besteld_op.localeCompare(y.besteld_op) || x.id.localeCompare(y.id));
  let rest = rond(gemaakt);
  const extraPerId = new Map<string, number>();
  for (const a of volgorde) {
    if (a.mep_taak_id !== taakId || rest <= 0) continue;
    const ruimte = rond(Math.max(0, a.mep_aantal - a.mep_klaar_aantal));
    const extra = rond(Math.min(rest, ruimte));
    if (extra <= 0) continue;
    extraPerId.set(a.id, extra);
    rest = rond(rest - extra);
  }
  return aanvragen.map((a) => {
    const extra = extraPerId.get(a.id) ?? 0;
    if (extra <= 0) return a;
    return {
      ...a,
      mep_klaar_aantal: rond(a.mep_klaar_aantal + extra),
      klaar_aantal: rond(a.klaar_aantal + extra),
    };
  });
}

export function ontvang(a: Aanvraag, aantal: number): Aanvraag {
  const ruimte = nogTeOntvangen(a);
  if (ruimte <= 0) throw new Error('Er is nog niets onderweg');
  if (!Number.isFinite(aantal) || aantal < 0) throw new Error('Vul een aantal van 0 of meer in');
  if (aantal > ruimte + 0.0001) throw new Error(`Hooguit ${getal(ruimte)} onderweg`);
  return { ...a, ontvangen_aantal: rond(a.ontvangen_aantal + aantal) };
}

export function annuleerRest(a: Aanvraag, aantal: number): Aanvraag {
  const ruimte = nogTeAnnuleren(a);
  eisAantal(aantal, ruimte, 'Er is niets meer te annuleren');
  const minderMep = rond(Math.min(aantal, Math.max(0, a.mep_aantal - a.mep_klaar_aantal)));
  return {
    ...a,
    geannuleerd_aantal: rond(a.geannuleerd_aantal + aantal),
    mep_aantal: rond(a.mep_aantal - minderMep),
  };
}

export function taakMinderBijAnnuleren(a: Aanvraag, aantal: number) {
  return rond(Math.min(aantal, Math.max(0, a.mep_aantal - a.mep_klaar_aantal)));
}

/** Velden die de schermen mogen tonen. Geen prijzen en geen verrekening. */
export const ZICHTBARE_VELDEN = [
  'naam', 'eenheid', 'besteld_aantal', 'klaar_aantal', 'meegegeven_aantal', 'ontvangen_aantal',
  'geannuleerd_aantal', 'verwachte_leverdag', 'gewenste_leverdag', 'status',
] as const;

export function zonderPrijzen(velden: readonly string[]) {
  return velden.every((veld) => !/prijs|bedrag|verreken/i.test(veld));
}
