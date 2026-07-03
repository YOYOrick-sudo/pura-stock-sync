# Recept-sticker gelijktrekken met snel-print

## 1. Database
Migration: `ALTER TABLE public.recipes ADD COLUMN tht_dagen integer NOT NULL DEFAULT 3;`

## 2. `src/lib/labelZpl.ts`
Vervang `buildRecipeLabelZpl` door een dunne wrapper die `buildStickerZpl` hergebruikt:

```ts
export interface RecipeForLabel {
  name: string;
  tht_dagen?: number | null;
}

export function buildRecipeLabelZpl(recept: RecipeForLabel): string {
  const dagen = recept.tht_dagen ?? 3;
  const today = new Date();
  const later = new Date(today);
  later.setDate(later.getDate() + dagen);
  const fmt = (d: Date) => d.toLocaleDateString('nl-NL', { weekday: 'short', day: '2-digit', month: '2-digit' });
  return buildStickerZpl({
    type: 'bereid',
    naam: recept.name,
    datum1: fmt(today),
    datum2: fmt(later),
  });
}
```

`buildLabelOmschrijving` blijft bestaan (voor bestaande call sites), maar de wrapper voor recepten kan gewoon `buildStickerOmschrijving` gebruiken via een kleine aanpassing in de hook (zie stap 3). Verwijder de `TYPE_LABEL`, `LOGO_32_HEX`, `fontForName` en oude layout — niet meer gebruikt. `sanitizeZpl` en `vandaagNL` blijven.

## 3. `src/hooks/usePrintJobs.ts`
- `PrintableRecipe` verliest `type`, krijgt `tht_dagen?: number | null`.
- `label_omschrijving` → `buildStickerOmschrijving({ type: 'bereid', naam: recipe.name, datum1, datum2 })`.

## 4. `src/pages/kitchen/RecipeDetail.tsx`
- Verwijder `recipeType`-berekening bij de printknop.
- Call wordt: `createPrintJob.mutate({ id: recipe.id, name: recipe.name, tht_dagen: recipe.tht_dagen })`.

## 5. `src/pages/kitchen/RecipeForm.tsx`
Klein "Houdbaarheid (dagen)" number-input toevoegen (min 1, max 30, default 3), meesturen in de save-payload. Ik lees het bestand eerst om het invoerveld in de bestaande layout te plaatsen (zelfde stijl als andere velden in het formulier).

## 6. `src/hooks/useRecipes.ts` / types
`tht_dagen` toevoegen aan de fetch/insert/update-payload zodat de nieuwe kolom wordt opgehaald en opgeslagen. Types worden automatisch geregenereerd na de migration.

## Verificatie
Render via Labelary in sandbox: recept-sticker "Hummus" met `tht_dagen=3` vs. snel-print "bereid" "Hummus" — verwacht: byte-voor-byte identieke ZPL (behalve de datums als vandaag), en visueel identiek. Screenshot beide PNG's.

## Bestanden
- migration (add column)
- `src/lib/labelZpl.ts` — wrapper i.p.v. eigen layout
- `src/hooks/usePrintJobs.ts` — `tht_dagen` doorgeven, omschrijving via sticker-helper
- `src/pages/kitchen/RecipeDetail.tsx` — printknop
- `src/pages/kitchen/RecipeForm.tsx` — nieuw veld
- `src/hooks/useRecipes.ts` — `tht_dagen` in payload
