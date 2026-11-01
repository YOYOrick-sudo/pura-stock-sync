/** Omzet uit omzet_uren, excl. btw.

 * Een kassaregel hoort bij een werkdag. Die werkdag is al de Amsterdamse
 * bedrijfsdag: de Lightspeed-sync zet de grens op 06:00 Europe/Amsterdam.
 * Het scherm groepeert op die werkdag en rekent "vandaag" in dezelfde tijdzone.
 */

export const AMSTERDAM = 'Europe/Amsterdam';
/** Eerste jaar met Lightspeed-sync in omzet_uren. */
export const EERSTE_OMZET_JAAR = 2025;

export type Vestiging = 'Midsland' | 'West';
export type VestigingKeuze = Vestiging | 'Totaal';

export type OmzetRegel = {
  vestiging: string;
  werkdag: string;
  omzetExcl: number;
  aantalBonnen: number;
  isDemo?: boolean;
};

export type PeriodeSom = {
  omzet: number;
  bonnen: number;
  openDagen: number;
  /** Geen kassadata. Een vergelijking hiermee is "dicht", nooit −100%. */
  dicht: boolean;
};

export type Verschil = {
  euro: number | null;
  procent: number | null;
};

export type MaandPunt = {
  maand: number;
  label: string;
  ditJaar: number | null;
  vorigJaar: number | null;
  procent: number | null;
};

export type GelijkJaar = {
  maanden: number[];
  label: string;
  nu: number;
  toen: number;
  verschil: Verschil;
};

export type OmzetBeeld = {
  maand: {
    jaar: number;
    maand: number;
    naam: string;
    nu: PeriodeSom;
    toen: PeriodeSom;
    verschil: Verschil;
    perDagNu: number | null;
    perDagToen: number | null;
    perDagVerschil: Verschil;
    gemBonNu: number | null;
    gemBonToen: number | null;
  };
  ytd: {
    van: string;
    tot: string;
    toenVan: string;
    toenTot: string;
    nu: PeriodeSom;
    toen: PeriodeSom;
    verschil: Verschil;
    perDagNu: number | null;
    perDagToen: number | null;
    perDagVerschil: Verschil;
    gemBonNu: number | null;
    gemBonToen: number | null;
  };
  gelijk: GelijkJaar;
  maanden: MaandPunt[];
  dichtMaanden: number[];
};

export const MAAND_KORT = ['jan', 'feb', 'mrt', 'apr', 'mei', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'] as const;
export const MAAND_LANG = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'] as const;

const VESTIGINGEN: Vestiging[] = ['Midsland', 'West'];

export function amsterdamDatum(nu: Date = new Date()): string {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: AMSTERDAM,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(nu);
}

/** Zelfde kanteluur als de Lightspeed-sync: vóór 06:00 hoort de bon bij de vorige werkdag. */
export function werkdagVanIso(iso: string): { werkdag: string; uur: number } {
  const fmt = new Intl.DateTimeFormat('sv-SE', {
    timeZone: AMSTERDAM,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hour12: false,
  });
  const parts = fmt.formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  let uur = Number(get('hour'));
  if (uur === 24) uur = 0;
  const year = Number(get('year'));
  const month = Number(get('month'));
  const day = Number(get('day'));
  let wY = year;
  let wM = month;
  let wD = day;
  if (uur < 6) {
    const d = new Date(Date.UTC(year, month - 1, day));
    d.setUTCDate(d.getUTCDate() - 1);
    wY = d.getUTCFullYear();
    wM = d.getUTCMonth() + 1;
    wD = d.getUTCDate();
  }
  return {
    werkdag: `${wY}-${pad(wM)}-${pad(wD)}`,
    uur,
  };
}

export function jarenUit(vandaag: string): number[] {
  const huidig = Number(vandaag.slice(0, 4));
  const uit: number[] = [];
  for (let jaar = huidig; jaar >= EERSTE_OMZET_JAAR; jaar -= 1) uit.push(jaar);
  return uit.length > 0 ? uit : [huidig];
}

export function procent1(procent: number): number {
  return Math.round(procent * 10) / 10;
}

export function formatEuro(bedrag: number, centen = false): string {
  const afgerond = centen ? Math.round(bedrag * 100) / 100 : Math.round(bedrag);
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: centen ? 2 : 0,
    maximumFractionDigits: centen ? 2 : 0,
  }).format(afgerond);
}

export function formatEuroVerschil(bedrag: number | null): string {
  if (bedrag == null) return 'dicht';
  const afgerond = Math.round(bedrag);
  if (afgerond === 0) return formatEuro(0);
  return `${afgerond > 0 ? '+' : '−'} ${formatEuro(Math.abs(afgerond))}`;
}

export function formatProcent(procent: number | null): string {
  if (procent == null) return 'dicht';
  const afgerond = procent1(procent);
  if (afgerond === 0) return '0,0%';
  return `${afgerond > 0 ? '+' : '−'}${Math.abs(afgerond).toFixed(1).replace('.', ',')}%`;
}

export function formatAantal(aantal: number): string {
  return new Intl.NumberFormat('nl-NL').format(aantal);
}

export function maandenLabel(maanden: number[]): string {
  if (maanden.length === 0) return '';
  const gesorteerd = [...maanden].sort((a, b) => a - b);
  const stukken: string[] = [];
  let start = gesorteerd[0];
  let vorige = gesorteerd[0];
  for (let i = 1; i <= gesorteerd.length; i += 1) {
    const maand = gesorteerd[i];
    if (maand === vorige + 1) {
      vorige = maand;
      continue;
    }
    stukken.push(start === vorige ? MAAND_KORT[start - 1] : `${MAAND_KORT[start - 1]}–${MAAND_KORT[vorige - 1]}`);
    start = maand;
    vorige = maand;
  }
  return stukken.join(', ');
}

/**
 * Een vestiging was die maand open als minstens de helft van de kalenderdagen
 * een open dag was. Een staart van de winterstop (West, januari 2026: 4 dagen)
 * telt niet mee; de heropening (West, april 2026: 17 van 30) wel.
 * Een maand telt in de gelijke vergelijking als beide vestigingen in beide jaren open waren.
 */
export function maandOpen(openDagen: number, jaar: number, maand: number): boolean {
  return openDagen * 2 >= dagenInMaand(jaar, maand);
}

export function bouwOmzetBeeld(regels: OmzetRegel[], keuze: VestigingKeuze, jaar: number, vandaag: string): OmzetBeeld {
  const dagen = dagenVan(regels);
  const eind = ytdEind(jaar, vandaag);
  const toenEind = verschuifJaar(eind, -1);
  const maand = maandVoorScherm(jaar, vandaag);

  const nuMaand = som(dagen, (d) => inKeuze(d, keuze) && inMaand(d, maand.jaar, maand.maand));
  const toenMaand = som(dagen, (d) => inKeuze(d, keuze) && inMaand(d, maand.jaar - 1, maand.maand));
  const nuYtd = som(dagen, (d) => inKeuze(d, keuze) && inBereik(d, `${jaar}-01-01`, eind));
  const toenYtd = som(dagen, (d) => inKeuze(d, keuze) && inBereik(d, `${jaar - 1}-01-01`, toenEind));
  const gelijkMaanden = vergelijkbareMaanden(dagen, jaar, eind);
  const nuGelijk = somMaanden(dagen, keuze, jaar, gelijkMaanden);
  const toenGelijk = somMaanden(dagen, keuze, jaar - 1, gelijkMaanden);

  const maanden: MaandPunt[] = [];
  const dichtMaanden: number[] = [];
  for (let m = 1; m <= 12; m += 1) {
    const dit = som(dagen, (d) => inKeuze(d, keuze) && inMaand(d, jaar, m));
    const vorig = som(dagen, (d) => inKeuze(d, keuze) && inMaand(d, jaar - 1, m));
    if (dit.dicht) dichtMaanden.push(m);
    const verschil = verschilOmzet(dit, vorig);
    maanden.push({
      maand: m,
      label: MAAND_KORT[m - 1],
      ditJaar: dit.dicht ? null : dit.omzet,
      vorigJaar: vorig.dicht ? null : vorig.omzet,
      procent: verschil.procent,
    });
  }

  const perDagNu = perOpenDag(nuMaand);
  const perDagToen = perOpenDag(toenMaand);
  const ytdPerDagNu = perOpenDag(nuYtd);
  const ytdPerDagToen = perOpenDag(toenYtd);

  return {
    maand: {
      jaar: maand.jaar,
      maand: maand.maand,
      naam: MAAND_LANG[maand.maand - 1],
      nu: nuMaand,
      toen: toenMaand,
      verschil: verschilOmzet(nuMaand, toenMaand),
      perDagNu,
      perDagToen,
      perDagVerschil: verschilGetal(perDagNu, perDagToen),
      gemBonNu: gemiddeldeBon(nuMaand),
      gemBonToen: gemiddeldeBon(toenMaand),
    },
    ytd: {
      van: `${jaar}-01-01`,
      tot: eind,
      toenVan: `${jaar - 1}-01-01`,
      toenTot: toenEind,
      nu: nuYtd,
      toen: toenYtd,
      verschil: verschilOmzet(nuYtd, toenYtd),
      perDagNu: ytdPerDagNu,
      perDagToen: ytdPerDagToen,
      perDagVerschil: verschilGetal(ytdPerDagNu, ytdPerDagToen),
      gemBonNu: gemiddeldeBon(nuYtd),
      gemBonToen: gemiddeldeBon(toenYtd),
    },
    gelijk: {
      maanden: gelijkMaanden,
      label: maandenLabel(gelijkMaanden),
      nu: nuGelijk,
      toen: toenGelijk,
      verschil: verschilEuro(nuGelijk, toenGelijk, gelijkMaanden.length === 0),
    },
    maanden,
    dichtMaanden,
  };
}

function verschilEuro(nu: number, toen: number, dicht: boolean): Verschil {
  if (dicht || toen === 0) return { euro: null, procent: null };
  const euro = rondEuro(nu - toen);
  return { euro, procent: (euro / toen) * 100 };
}

export function verschilOmzet(nu: PeriodeSom, toen: PeriodeSom): Verschil {
  if (nu.dicht || toen.dicht) return { euro: null, procent: null };
  return verschilEuro(nu.omzet, toen.omzet, false);
}

function verschilGetal(nu: number | null, toen: number | null): Verschil {
  if (nu == null || toen == null || toen === 0) return { euro: null, procent: null };
  const euro = nu - toen;
  return { euro, procent: (euro / toen) * 100 };
}

function perOpenDag(som: PeriodeSom): number | null {
  if (som.dicht || som.openDagen <= 0) return null;
  return som.omzet / som.openDagen;
}

function gemiddeldeBon(som: PeriodeSom): number | null {
  if (som.bonnen <= 0) return null;
  return som.omzet / som.bonnen;
}

type Dag = { vestiging: Vestiging; werkdag: string; cent: number; bonnen: number };

function dagenVan(regels: OmzetRegel[]): Dag[] {
  const map = new Map<string, Dag>();
  for (const regel of regels) {
    if (regel.isDemo) continue;
    if (regel.vestiging !== 'Midsland' && regel.vestiging !== 'West') continue;
    const sleutel = `${regel.vestiging}|${regel.werkdag}`;
    const dag = map.get(sleutel) ?? { vestiging: regel.vestiging, werkdag: regel.werkdag, cent: 0, bonnen: 0 };
    dag.cent += Math.round(regel.omzetExcl * 100);
    dag.bonnen += regel.aantalBonnen;
    map.set(sleutel, dag);
  }
  return [...map.values()];
}

function som(dagen: Dag[], past: (dag: Dag) => boolean): PeriodeSom {
  let cent = 0;
  let bonnen = 0;
  let openDagen = 0;
  let heeft = false;
  for (const dag of dagen) {
    if (!past(dag)) continue;
    heeft = true;
    cent += dag.cent;
    bonnen += dag.bonnen;
    if (dag.cent > 0) openDagen += 1;
  }
  return {
    omzet: cent / 100,
    bonnen,
    openDagen,
    dicht: !heeft || (openDagen === 0 && cent === 0),
  };
}

function somMaanden(dagen: Dag[], keuze: VestigingKeuze, jaar: number, maanden: number[]): number {
  return som(dagen, (d) => inKeuze(d, keuze) && maanden.some((m) => inMaand(d, jaar, m))).omzet;
}

function vergelijkbareMaanden(dagen: Dag[], jaar: number, eind: string): number[] {
  const toenEind = verschuifJaar(eind, -1);
  const uit: number[] = [];
  for (let maand = 1; maand <= 12; maand += 1) {
    if (!maandVolledig(jaar, maand, eind) || !maandVolledig(jaar - 1, maand, toenEind)) continue;
    if (bedrijfOpen(dagen, jaar, maand) && bedrijfOpen(dagen, jaar - 1, maand)) uit.push(maand);
  }
  return uit;
}

function bedrijfOpen(dagen: Dag[], jaar: number, maand: number): boolean {
  return VESTIGINGEN.every((vestiging) => {
    const openDagen = som(dagen, (d) => d.vestiging === vestiging && inMaand(d, jaar, maand)).openDagen;
    return maandOpen(openDagen, jaar, maand);
  });
}

function maandVoorScherm(jaar: number, vandaag: string): { jaar: number; maand: number } {
  const [y, m] = vandaag.split('-').map(Number);
  if (jaar < y) return { jaar, maand: 12 };
  if (jaar > y) return { jaar, maand: 1 };
  if (m === 1) return { jaar: y - 1, maand: 12 };
  return { jaar: y, maand: m - 1 };
}

function ytdEind(jaar: number, vandaag: string): string {
  const [y] = vandaag.split('-').map(Number);
  if (jaar < y) return `${jaar}-12-31`;
  if (jaar > y) return `${jaar}-01-01`;
  return vandaag < `${jaar}-12-31` ? vandaag : `${jaar}-12-31`;
}

function maandVolledig(jaar: number, maand: number, eind: string): boolean {
  return `${jaar}-${pad(maand)}-${pad(dagenInMaand(jaar, maand))}` <= eind;
}

function verschuifJaar(iso: string, delta: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  const jaar = y + delta;
  const dag = Math.min(d, dagenInMaand(jaar, m));
  return `${jaar}-${pad(m)}-${pad(dag)}`;
}

function dagenInMaand(jaar: number, maand: number): number {
  return new Date(Date.UTC(jaar, maand, 0)).getUTCDate();
}

function inKeuze(dag: Dag, keuze: VestigingKeuze): boolean {
  return keuze === 'Totaal' || dag.vestiging === keuze;
}

function inMaand(dag: Dag, jaar: number, maand: number): boolean {
  return dag.werkdag.startsWith(`${jaar}-${pad(maand)}`);
}

function inBereik(dag: Dag, van: string, tot: string): boolean {
  return dag.werkdag >= van && dag.werkdag <= tot;
}

function rondEuro(n: number): number {
  return Math.round(n * 100) / 100;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}
