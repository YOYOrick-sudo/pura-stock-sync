/** Pure weergave van een verpakkingsvorm: in welke eenheid je telt en wat je krijgt. */
export interface VormBasis {
  vorm: string;
  eenheid: string;
  prijs?: number | null;
  inhoud_basis?: number | null;
  inhoud_eenheid?: 'g' | 'ml' | 'stuk' | null;
}

const MEERVOUD: Record<string, string> = {
  doos: 'dozen', zak: 'zakken', fles: 'flessen', pak: 'pakken', bak: 'bakken', emmer: 'emmers',
  bos: 'bossen', tray: 'trays', rol: 'rollen', fust: 'fusten', blik: 'blikken', pot: 'potten',
  kist: 'kisten', krat: 'kratten', stuk: 'stuks', stuks: 'stuks', kg: 'kg', liter: 'liter', l: 'L',
};

export function eenheidLabel(eenheid: string, aantal: number | null): string {
  const e = eenheid.trim();
  if (aantal == null || aantal === 1) return e === 'stuks' ? 'stuk' : e;
  return MEERVOUD[e.toLowerCase()] ?? e;
}

/** Inhoudstekst zonder herhaalde eenheid: "doos 12×1 L" → "12 × 1 L". */
export function inhoudTekst(v: VormBasis): string {
  let t = v.vorm.trim();
  const e = v.eenheid.trim();
  if (e && t.toLowerCase().startsWith(e.toLowerCase() + ' ')) t = t.slice(e.length).trim();
  else if (t.toLowerCase() === e.toLowerCase()) t = '';
  return t.replace(/\s*[×x]\s*/g, ' × ');
}

const fmt = (n: number) => new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 2 }).format(n);
const euro = (n: number) => new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(n);

/** Basishoeveelheid naar leesbare eenheid (g→kg, ml→L). */
export function basisTekst(hoeveel: number, eenheid: 'g' | 'ml' | 'stuk'): { waarde: number; eenheid: string } {
  if (eenheid === 'g') return hoeveel >= 1000 ? { waarde: hoeveel / 1000, eenheid: 'kg' } : { waarde: hoeveel, eenheid: 'g' };
  if (eenheid === 'ml') return hoeveel >= 1000 ? { waarde: hoeveel / 1000, eenheid: 'L' } : { waarde: hoeveel, eenheid: 'ml' };
  return { waarde: hoeveel, eenheid: 'stuks' };
}

export interface VerpakkingWeergave {
  eenheid: string;
  inhoud: string;
  totaal: string | null;
  prijs: string | null;
  perBasis: string | null;
}

export function verpakkingWeergave(v: VormBasis, aantal: number | null): VerpakkingWeergave {
  const n = aantal ?? 1;
  const inhoud = inhoudTekst(v);
  let totaal: string | null = null;
  let perBasis: string | null = null;
  if (v.inhoud_basis && v.inhoud_eenheid) {
    const t = basisTekst(Number(v.inhoud_basis) * n, v.inhoud_eenheid);
    totaal = `${fmt(t.waarde)} ${t.eenheid}`;
    if (v.prijs != null) {
      const groot = v.inhoud_eenheid === 'stuk' ? 1 : 1000;
      const per = (Number(v.prijs) / Number(v.inhoud_basis)) * groot;
      perBasis = `${euro(per)}/${v.inhoud_eenheid === 'g' ? 'kg' : v.inhoud_eenheid === 'ml' ? 'L' : 'st'}`;
    }
  }
  return {
    eenheid: eenheidLabel(v.eenheid, aantal),
    inhoud,
    totaal,
    prijs: v.prijs != null ? euro(Number(v.prijs) * n) : null,
    perBasis,
  };
}
