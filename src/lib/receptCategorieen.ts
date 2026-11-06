import {
  Apple,
  Bean,
  Beef,
  Cake,
  Carrot,
  Coffee,
  Cookie,
  Croissant,
  CupSoda,
  Droplets,
  Fish,
  Flame,
  IceCreamCone,
  LayoutGrid,
  Leaf,
  Milk,
  Soup,
  Sparkles,
  Tag,
  Wheat,
  type LucideIcon,
} from 'lucide-react';

/** Vaste keukenvolgorde: basis, ingrediënten, gerechten, zoet, drank. */
export const RECEPT_CATEGORIEEN: { naam: string; icoon: LucideIcon }[] = [
  { naam: 'Kruidenmixen', icoon: Leaf },
  { naam: 'Sauzen, dressings & dips', icoon: Droplets },
  { naam: 'Toppings & crunch', icoon: Sparkles },
  { naam: 'Groenten', icoon: Carrot },
  { naam: 'Fruit', icoon: Apple },
  { naam: 'Zuivel & kaas', icoon: Milk },
  { naam: 'Granen & zetmelen', icoon: Wheat },
  { naam: 'Vega & peulvruchten', icoon: Bean },
  { naam: 'Vlees', icoon: Beef },
  { naam: 'Vis & hapjes', icoon: Fish },
  { naam: 'Brood & deeg', icoon: Croissant },
  { naam: 'Soepen', icoon: Soup },
  { naam: "Curry's & stoofgerechten", icoon: Flame },
  { naam: 'Ontbijt', icoon: Coffee },
  { naam: 'Gebak & taart', icoon: Cake },
  { naam: 'Koekjes & repen', icoon: Cookie },
  { naam: 'Desserts', icoon: IceCreamCone },
  { naam: 'Dranken & siropen', icoon: CupSoda },
];

export const ALLE_ICOON = LayoutGrid;
const ONBEKEND_ICOON = Tag;

const VOLGORDE = new Map(RECEPT_CATEGORIEEN.map((c, i) => [c.naam, i]));
const ICONEN = new Map(RECEPT_CATEGORIEEN.map((c) => [c.naam, c.icoon]));

export interface CategorieKeuze {
  /** null = alle categorieën. */
  naam: string | null;
  label: string;
  aantal: number;
  icoon: LucideIcon;
}

export function icoonVoorCategorie(naam: string | null | undefined): LucideIcon {
  if (!naam) return ONBEKEND_ICOON;
  return ICONEN.get(naam) ?? ONBEKEND_ICOON;
}

/**
 * Alle bovenaan, daarna de vaste 18 (ook met aantal 0), daarna onbekende
 * categorieën alfabetisch. Een onbekende categorie met aantal 0 blijft staan
 * zolang hij gekozen is.
 */
export function categorieKeuzes(
  recepten: { category: string | null | undefined }[],
  gekozen: string | null,
): CategorieKeuze[] {
  const aantallen = new Map<string, number>();
  for (const recept of recepten) {
    const naam = (recept.category ?? '').trim();
    if (!naam) continue;
    aantallen.set(naam, (aantallen.get(naam) ?? 0) + 1);
  }

  const namen = new Set(aantallen.keys());
  if (gekozen && !VOLGORDE.has(gekozen)) namen.add(gekozen);
  const onbekend = [...namen]
    .filter((naam) => !VOLGORDE.has(naam) && ((aantallen.get(naam) ?? 0) > 0 || naam === gekozen))
    .sort((a, b) => a.localeCompare(b, 'nl', { sensitivity: 'base' }));

  return [
    { naam: null, label: 'Alle', aantal: recepten.length, icoon: ALLE_ICOON },
    ...RECEPT_CATEGORIEEN.map((c) => ({
      naam: c.naam,
      label: c.naam,
      aantal: aantallen.get(c.naam) ?? 0,
      icoon: c.icoon,
    })),
    ...onbekend.map((naam) => ({
      naam,
      label: naam,
      aantal: aantallen.get(naam) ?? 0,
      icoon: ONBEKEND_ICOON,
    })),
  ];
}

/** Naam of ingrediëntnaam. Lege zoekterm laat alles door. */
export function pastBijZoekterm(
  recept: { name: string; ingredient_namen?: string[] | null },
  term: string,
): boolean {
  const q = term.trim().toLocaleLowerCase('nl-NL');
  if (!q) return true;
  if (recept.name.toLocaleLowerCase('nl-NL').includes(q)) return true;
  return (recept.ingredient_namen ?? []).some((naam) => naam.toLocaleLowerCase('nl-NL').includes(q));
}

export function ingredientenLabel(aantal: number): string {
  return aantal === 1 ? '1 ingrediënt' : `${aantal} ingrediënten`;
}

export function sorteerOpNaam<T extends { name: string }>(recepten: T[]): T[] {
  return [...recepten].sort((a, b) => a.name.localeCompare(b.name, 'nl', { sensitivity: 'base' }));
}
