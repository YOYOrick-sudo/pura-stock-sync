
Drie kleine verbeteringen aan de Receptenmodule.

## 1. Automatische categorie bij nieuw recept (AI, low-cost)

- Nieuwe edge function `suggest-recipe-category` op basis van Lovable AI Gateway met `google/gemini-3-flash-preview` (goedkoopste chat-model, ~instant).
- Input: `name` + eventueel `ingredients`. Output: één woord/korte string met de categorie.
- Prompt geeft de AI de bestaande categorieën als voorkeurslijst mee (uit `recipes.category`) zodat we niet elke keer een nieuwe variant krijgen ("Saus" vs "Sauzen"). Alleen nieuwe categorie als niks past.
- In `RecipeForm.tsx`: zodra de naam is ingevuld (of bij blur) en het categorie-veld nog leeg is, roept 'ie de function aan en vult het veld in. Gebruiker kan overschrijven.
- Debounced + alleen bij leeg veld → minimale calls, minimale kosten.

## 2. Recept verwijderen

- Knop "Verwijderen" op `RecipeDetail.tsx` (naast Bewerken/Print), met `AlertDialog` bevestiging.
- Nieuwe hook `useDeleteRecipe()` in `useRecipes.ts` die soft-delete doet (`is_gearchiveerd = true`) — zo blijven eventuele historische print_jobs/verwijzingen intact en verdwijnt het recept uit alle lijsten (die filteren al op `is_gearchiveerd = false`).
- Na verwijderen: toast + navigate terug naar `/kitchen/recipes`.
- RLS: bestaande update-policy staat authenticated toe → werkt direct.

## 3. Voorbeeld sticker weghalen

- De hele "Voorbeeld sticker"-kaart in `RecipeDetail.tsx` verwijderen (inclusief Labelary-preview, `previewSrc`/`previewError` state, en unused imports `useMemo`, `buildRecipeLabelZpl`, `labelaryPreviewUrl`).
- "Print sticker"-knop blijft gewoon staan.

## Technisch

- Files: `supabase/functions/suggest-recipe-category/index.ts` (nieuw), `src/hooks/useRecipes.ts` (delete-hook + eventueel categorie-suggest hook), `src/pages/kitchen/RecipeForm.tsx` (auto-fill), `src/pages/kitchen/RecipeDetail.tsx` (delete-knop + preview weg).
- Geen schema-wijzigingen nodig.
