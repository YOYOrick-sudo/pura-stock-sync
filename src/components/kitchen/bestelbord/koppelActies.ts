import type { BordSuggestie, LeverancierKeuze } from '@/hooks/useBestelbord';

export function leverancierKeuzeLabel(l: Pick<LeverancierKeuze, 'naam' | 'soort'>) {
  if (l.soort === 'winkel' && !/zelf halen/i.test(l.naam)) return `${l.naam} (zelf halen)`;
  if (l.soort === 'intern' && !/\(intern\)/i.test(l.naam)) return `${l.naam} (intern)`;
  return l.naam;
}

export interface AanmaakVelden {
  naam: string;
  leverancierId: string;
  eenheid: string;
  vorm: string | null;
  inhoudBasis: number | null;
  inhoudEenheid: 'g' | 'ml' | 'stuk' | null;
  artikelnummer: string | null;
  prijs: number | null;
}

export function bouwAanmaakVelden(input: {
  naam: string;
  leverancierId: string;
  eenheid: string | null;
  vorm: string;
  inhoud: string;
  inhoudEenheid: 'g' | 'ml' | 'stuk' | null;
  artikelnummer: string;
  prijs: string;
  metPrijs: boolean;
}): { ok: true; velden: AanmaakVelden } | { ok: false; fout: string } {
  const naam = input.naam.trim();
  if (!naam) return { ok: false, fout: 'Vul een naam in' };
  if (!input.leverancierId) return { ok: false, fout: 'Kies een leverancier' };
  if (!input.eenheid) return { ok: false, fout: 'Kies een eenheid' };
  const inhoudTekst = input.inhoud.trim().replace(',', '.');
  const heeftInhoud = inhoudTekst !== '';
  const heeftEenheid = !!input.inhoudEenheid;
  if (heeftInhoud !== heeftEenheid) return { ok: false, fout: 'Vul inhoud en eenheid samen in' };
  let inhoudBasis: number | null = null;
  if (heeftInhoud) {
    const n = Number(inhoudTekst);
    if (!Number.isFinite(n) || n <= 0) return { ok: false, fout: 'Inhoud moet een getal zijn' };
    inhoudBasis = n;
  }
  let prijs: number | null = null;
  if (input.metPrijs && input.prijs.trim()) {
    const n = Number(input.prijs.trim().replace(',', '.'));
    if (!Number.isFinite(n) || n < 0) return { ok: false, fout: 'Prijs klopt niet' };
    prijs = Math.round(n * 100) / 100;
  }
  return {
    ok: true,
    velden: {
      naam,
      leverancierId: input.leverancierId,
      eenheid: input.eenheid,
      vorm: input.vorm.trim() || null,
      inhoudBasis,
      inhoudEenheid: heeftEenheid ? input.inhoudEenheid : null,
      artikelnummer: input.artikelnummer.trim() || null,
      prijs,
    },
  };
}

/** Zoeken in de lade: 150 ms debounce, leeg of al gekozen wist de lijst. */
export function planKoppelZoek(
  tekst: string,
  vestiging: string,
  gekozen: boolean,
  zoek: (vestiging: string, tekst: string) => Promise<BordSuggestie[]>,
  toon: (regels: BordSuggestie[]) => void,
): () => void {
  const q = tekst.trim();
  if (!q || !vestiging || gekozen) {
    toon([]);
    return () => {};
  }
  let geannuleerd = false;
  const timer = setTimeout(() => {
    zoek(vestiging, q).then((r) => { if (!geannuleerd) toon(r); }).catch(() => { if (!geannuleerd) toon([]); });
  }, 150);
  return () => { geannuleerd = true; clearTimeout(timer); };
}

export async function koppelAanBestaand(args: {
  test: boolean;
  koppelen: (v: { signaalId: string; artikelId: string; artikelVormId: string }) => Promise<{ eenheid_vorm: string }>;
  wijzig: (v: { id: string; aantal: number; eenheid: string }) => Promise<unknown>;
  signaalId: string;
  aantal: number;
  artikelId: string;
  artikelVormId: string;
}) {
  if (args.test) return;
  const res = await args.koppelen({
    signaalId: args.signaalId,
    artikelId: args.artikelId,
    artikelVormId: args.artikelVormId,
  });
  if (!res?.eenheid_vorm) throw new Error('Koppelen lukte niet');
  await args.wijzig({ id: args.signaalId, aantal: args.aantal, eenheid: res.eenheid_vorm });
  return res;
}

export async function koppelNieuwArtikel(args: {
  test: boolean;
  aanmaken: (velden: AanmaakVelden) => Promise<{ artikel_id: string; artikel_vorm_id: string }>;
  koppelen: (v: { signaalId: string; artikelId: string; artikelVormId: string }) => Promise<unknown>;
  wijzig: (v: { id: string; aantal: number; eenheid: string }) => Promise<unknown>;
  signaalId: string;
  aantal: number;
  velden: AanmaakVelden;
}) {
  if (args.test) return;
  const res = await args.aanmaken(args.velden);
  if (!res?.artikel_id || !res?.artikel_vorm_id) throw new Error('Aanmaken lukte niet');
  await args.koppelen({
    signaalId: args.signaalId,
    artikelId: res.artikel_id,
    artikelVormId: res.artikel_vorm_id,
  });
  await args.wijzig({ id: args.signaalId, aantal: args.aantal, eenheid: args.velden.eenheid });
}
