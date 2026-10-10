export type FohListLanguage = 'nl' | 'en';

const PHRASES: Array<[RegExp, string]> = [
  [/\baanzetten\b/gi, 'switch on'],
  [/\buitzetten\b/gi, 'switch off'],
  [/\baanvullen\b/gi, 'restock'],
  [/\bbijvullen\b/gi, 'restock'],
  [/\bschoonmaken\b/gi, 'clean'],
  [/\bschoon\b/gi, 'clean'],
  [/\bcontroleren\b/gi, 'check'],
  [/\bchecken\b/gi, 'check'],
  [/\bopruimen\b/gi, 'put away'],
  [/\bafbakken\b/gi, 'bake'],
  [/\bvullen\b/gi, 'fill'],
  [/\blegen\b/gi, 'empty'],
  [/\bafwassen\b/gi, 'wash'],
  [/\bafwas\b/gi, 'dishwasher'],
  [/\bkoelcel\b/gi, 'cold room'],
  [/\bdiepvries\b/gi, 'freezer'],
  [/\bkoeling\b/gi, 'fridge'],
  [/\bkeuken\b/gi, 'kitchen'],
  [/\bterras\b/gi, 'terrace'],
  [/\btafels\b/gi, 'tables'],
  [/\bstoelen\b/gi, 'chairs'],
  [/\bkussens\b/gi, 'cushions'],
  [/\bglazen\b/gi, 'glasses'],
  [/\blichten\b/gi, 'lights'],
  [/\bkaarsen\b/gi, 'candles'],
  [/\bbrood\b/gi, 'bread'],
  [/\bfruit\b/gi, 'fruit'],
  [/\bwater\b/gi, 'water'],
];

/** Curated English fields win; this keeps older tasks readable until translated. */
export function englishTaskFallback(value: string): string {
  let translated = value;
  for (const [pattern, replacement] of PHRASES) translated = translated.replace(pattern, replacement);
  return translated;
}