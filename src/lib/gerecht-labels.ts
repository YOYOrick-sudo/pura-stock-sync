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
  pistache: 'allergeen',
  suiker: 'info',
  vegan: 'dieet',
};

export function isGerechtLabel(v: string): v is GerechtLabel {
  return (GERECHT_LABEL_CODES as readonly string[]).includes(v);
}

export const GERECHT_CATEGORIEEN = ['Zoet'] as const;
