# AI-categorie onzichtbaar op achtergrond

## Wat verandert er in de UI
- **Sparkles-knop weg** naast het categorieveld.
- **"AI zoekt…" label weg** naast "Categorie".
- Categorieveld blijft een gewone tekst-input die je altijd zelf kan overschrijven (ook op bestaande recepten).
- Geen toast, geen laadindicator — het gebeurt stil.

## Gedrag bij nieuw recept
- Zodra naam ≥ 3 tekens is en gebruiker de categorie niet heeft aangeraakt, wordt na ~1s stil een suggestie opgehaald en ingevuld.
- Als de gebruiker daarna zelf begint te typen in het categorieveld, stopt de AI met overschrijven (bestaand gedrag blijft).
- Bij bestaande recepten gebeurt er niks automatisch.

## Slimmere categoriekeuze
De edge function `suggest-recipe-category` krijgt een striktere prompt:

- **Kies vrijwel altijd één van de bestaande categorieën** van dit restaurant.
- Alleen een nieuwe categorie voorstellen wanneer het recept écht in een andere hoek valt dan alles wat er is (voorbeeld dat de gebruiker gaf: er staat "vlees" in de naam/ingrediënten maar er is nog geen vleescategorie → dan wél "Vlees").
- Als geen enkele bestaande categorie exact past maar er wel een redelijk vergelijkbare is (bv. bestaande "Groente" en het is een groenterecept), pak die.
- Bij twijfel: de dichtstbijzijnde bestaande categorie kiezen.

## Technische details
Bestand `src/pages/kitchen/RecipeForm.tsx`:
- `suggestCategory` helper en de handmatige knop verwijderen.
- `useEffect` voor auto-suggestie behouden, maar terug naar "stil falen" — geen toasts, geen zichtbare loading state.
- `suggesting` state en `Sparkles` import verwijderen.
- Placeholder van categorie-input laten staan.

Bestand `supabase/functions/suggest-recipe-category/index.ts`:
- Systeem-prompt herschrijven met sterke instructie "gebruik bestaande categorie tenzij écht ver ernaast".
- Regels voor Groente/Sauzen/Bakwerk/etc. blijven staan.
- Nieuwe regel: nieuwe categorie alleen als het recept over een ingrediëntgroep gaat die duidelijk ontbreekt in de lijst (bijv. vlees, vis, pasta).