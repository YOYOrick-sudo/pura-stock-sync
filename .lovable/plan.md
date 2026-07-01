## Recepten als tabel/rij weergave

Vervang de foto-grid op `/kitchen/recipes` door een compacte tabel-lijst zoals de "Halffabricaten"-referentie.

### Wijziging in `src/pages/kitchen/Recipes.tsx`
- Foto-thumbnails en `ImageIcon` weghalen (geen `aspect-[16/9]` blok meer).
- Grid (`grid-cols-1/2/3`) vervangen door één `Card` met een tabel:
  - Kolomkoppen (uppercase, muted, klein): **NAAM · CATEGORIE · TYPE · INGREDIËNTEN**
  - Elke rij klikbaar → `navigate(/kitchen/recipes/:id)`, met hover-highlight.
  - Naam vet, categorie als subtiele badge, type ("Recept" / "Halffabricaat") als tekst of lichte badge, ingrediënten als aantal.
- Zoekbalk + "Nieuw recept" knop + categorie-chips blijven ongewijzigd bovenaan.
- Empty state en loading state blijven ongewijzigd.
- Op mobiel (< sm): rijen renderen als gestapelde compacte cards (naam + meta onder elkaar) zodat het leesbaar blijft zonder horizontale scroll.

Geen wijzigingen in datamodel, hooks, RecipeDetail of RecipeForm.
