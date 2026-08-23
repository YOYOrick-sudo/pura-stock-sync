export const ALLERGEEN_CODES = [
  'gluten',
  'schaaldieren',
  'ei',
  'vis',
  'pinda',
  'soja',
  'melk',
  'noten',
  'selderij',
  'mosterd',
  'sesam',
  'sulfiet',
  'lupine',
  'weekdieren',
] as const;

export type AllergeenCode = (typeof ALLERGEEN_CODES)[number];

export const ALLERGEEN_LABEL: Record<AllergeenCode, string> = {
  gluten: 'Gluten',
  schaaldieren: 'Schaaldieren',
  ei: 'Ei',
  vis: 'Vis',
  pinda: 'Pinda',
  soja: 'Soja',
  melk: 'Melk',
  noten: 'Noten',
  selderij: 'Selderij',
  mosterd: 'Mosterd',
  sesam: 'Sesam',
  sulfiet: 'Sulfiet',
  lupine: 'Lupine',
  weekdieren: 'Weekdieren',
};

export type AllergeenStatus = 'onbekend' | 'ai_voorstel' | 'bevestigd';

export const STATUS_LABEL: Record<AllergeenStatus, string> = {
  onbekend: 'Niet gecontroleerd',
  ai_voorstel: 'Voorstel',
  bevestigd: 'Gecontroleerd',
};

export function isAllergeen(v: string): v is AllergeenCode {
  return (ALLERGEEN_CODES as readonly string[]).includes(v);
}

export function labelList(codes: string[]): string {
  return codes
    .filter(isAllergeen)
    .map((c) => ALLERGEEN_LABEL[c])
    .join(', ');
}
