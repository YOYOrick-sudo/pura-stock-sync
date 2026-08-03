// Eén bron van waarheid voor de West-categorievolgorde.
// Gebruikt door zowel /taken/beheer (admin) als /taken-bediening (live lijst),
// zodat de twee schermen altijd dezelfde volgorde tonen.
//
// Regels:
//  1. Start met de rijen uit `foh_category_order`, gesorteerd op sort_order.
//  2. Categorieën die wel in templates/taken voorkomen maar nog geen rij in
//     foh_category_order hebben, worden achteraan toegevoegd (zodat ze
//     zichtbaar blijven). Auto-seeding zorgt dat ze daarna een echte rij krijgen.
//  3. Case-insensitive dedupe: als een categorie tweemaal voorkomt (bv. "shop"
//     vs "Shop") tonen we alleen de eerst gevonden spelling.
//  4. Geen geforceerde positie voor "Algemeen" — die krijgt gewoon zijn DB-plek.

// West gebruikt sectie-departments (bediening/keuken/samen).
// Overige locaties gebruiken de klassieke voorkant/achterkant.
export type Department = 'voorkant' | 'achterkant' | 'bediening' | 'keuken' | 'samen';

export const WEST_SECTIONS: { key: Department; label: string }[] = [
  { key: 'bediening', label: 'Bediening' },
  { key: 'keuken', label: 'Keuken' },
  { key: 'samen', label: 'Samen / Laatste loodjes' },
];

export type OrderRow = { category: string; sort_order: number };

export type WestCategoryOrder = Partial<Record<Department, OrderRow[]>>;
export type WestSubcats = Partial<Record<Department, string[]>>;


export function getOrderedCategories(
  westCategoryOrder: WestCategoryOrder | undefined,
  westSubcats: WestSubcats | undefined,
  dept: Department,
): string[] {
  const ordered = (westCategoryOrder?.[dept] ?? [])
    .slice()
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map(r => r.category);

  const seenLower = new Set<string>();
  const result: string[] = [];
  for (const c of ordered) {
    const key = c.trim().toLowerCase();
    if (!key || seenLower.has(key)) continue;
    seenLower.add(key);
    result.push(c);
  }

  const used = westSubcats?.[dept] ?? [];
  for (const c of used) {
    const key = c.trim().toLowerCase();
    if (!key || seenLower.has(key)) continue;
    seenLower.add(key);
    result.push(c);
  }

  return result;
}

/** Bepaal welke (used) categorieën nog niet in foh_category_order staan. */
export function getMissingCategoryRows(
  westCategoryOrder: WestCategoryOrder | undefined,
  westSubcats: WestSubcats | undefined,
  dept: Department,
): string[] {
  const existing = new Set(
    (westCategoryOrder?.[dept] ?? []).map(r => r.category.trim().toLowerCase()),
  );
  const used = westSubcats?.[dept] ?? [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const c of used) {
    const key = c.trim().toLowerCase();
    if (!key || existing.has(key) || seen.has(key)) continue;
    seen.add(key);
    out.push(c);
  }
  return out;
}
