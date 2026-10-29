export const GERECHT_LABEL_CODES = [
  'gluten',
  'zuivel',
  'ei',
  'haver',
  'pinda',
  'sesam',
  'soja',
  'walnoot',
  'amandel',
  'hazelnoot',
  'kokos',
  'pistache',
  'suiker',
  'vegan',
] as const;

export type GerechtLabel = (typeof GERECHT_LABEL_CODES)[number];

export const GERECHT_LABEL_NAAM: Record<GerechtLabel, string> = {
  gluten: 'Gluten',
  zuivel: 'Zuivel',
  ei: 'Ei',
  haver: 'Haver',
  pinda: "Pinda's",
  sesam: 'Sesam',
  soja: 'Soja',
  walnoot: 'Walnoot',
  amandel: 'Amandel',
  hazelnoot: 'Hazelnoot',
  kokos: 'Kokos',
  pistache: 'Pistache',
  suiker: 'Suiker',
  vegan: 'Vegan',
};

/** allergeen = rood, dieet = groen, info = neutraal */
export const GERECHT_LABEL_SOORT: Record<GerechtLabel, 'allergeen' | 'dieet' | 'info'> = {
  gluten: 'allergeen',
  zuivel: 'allergeen',
  ei: 'allergeen',
  haver: 'info',
  pinda: 'allergeen',
  sesam: 'allergeen',
  soja: 'allergeen',
  walnoot: 'allergeen',
  amandel: 'allergeen',
  hazelnoot: 'allergeen',
  kokos: 'allergeen',
  pistache: 'allergeen',
  suiker: 'info',
  vegan: 'dieet',
};

export function isGerechtLabel(v: string): v is GerechtLabel {
  return (GERECHT_LABEL_CODES as readonly string[]).includes(v);
}

export const GERECHT_CATEGORIEEN = [
  'Zoet', 'Ontbijt & lunch', 'Fingerfood', 'Bowls & burgers',
  'Soep', 'Nagerechten', 'Smoothies & sappen',
] as const;

export const KAART_CODE_UITLEG = {
  GL: 'Glutenvrij (sporen mogelijk)',
  GLO: 'Glutenvrij op verzoek (niet voor coeliakie)',
  VG: 'Vegan',
  VGO: 'Vegan optioneel',
  N: 'Bevat noten',
  P: "Kan pinda's bevatten",
  LV: 'Lactosevrij',
  SV: 'Suikervrij',
} as const;

export function voldoetAanGerechtFilter(
  gerecht: { labels: readonly string[]; gecontroleerd: boolean },
  zonder: readonly GerechtLabel[],
  alleenVegan: boolean,
) {
  // Ongecontroleerde gerechten blijven altijd zichtbaar voor navraag bij vrij-van.
  if (zonder.length > 0 && !gerecht.gecontroleerd) return true;
  if (alleenVegan && !gerecht.labels.includes('vegan')) return false;
  return !zonder.some((code) => gerecht.labels.includes(code));
}

export function gerechtPrijzen(prijs: number | null, varianten?: Record<string, number> | null) {
  const volgorde = ['mini', 'klein', 'middel', 'groot', 'dag', 'avond'];
  const entries = Object.entries(varianten ?? {}).filter(([, value]) => typeof value === 'number' && Number.isFinite(value));
  entries.sort(([a], [b]) => {
    const rang = (key: string) => volgorde.includes(key) ? volgorde.indexOf(key) : volgorde.length;
    return rang(a) - rang(b);
  });
  const bedrag = (value: number) => value.toFixed(2).replace('.', ',');
  return entries.length > 0
    ? { bedragen: entries.map(([, value]) => bedrag(value)).join(' / '), namen: entries.map(([key]) => key).join(' / ') }
    : { bedragen: prijs != null ? bedrag(prijs) : '', namen: '' };
}
