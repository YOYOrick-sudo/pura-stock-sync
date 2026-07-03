## Midsland categorie-beheer gelijk trekken met West

Beheer (verschuiven / hernoemen / verwijderen van categorieën) is nu op ~6 plekken hard gegate op `userLocation === 'West'`. Midsland gebruikt bovendien een **hardgecodeerde** lijst per fase (`getAvailableCategoriesForPhase`). Om dezelfde beheer-tools voor Midsland te krijgen, migreren we Midsland naar dezelfde DB-tabel als West (`foh_category_order`) en unlocken we de UI.

Model: **één gedeelde lijst voor Midsland** in alle fases (open / tussen / borrel / sluit) — zelfde als West. **Geen enkele bestaande categorie of taak verdwijnt** — alles wordt netjes overgezet zodat jij daarna zelf kunt schoonvegen.

## Wat er verandert

**1. Eenmalige data-migratie (via `insert`-tool):**
- Voor Midsland/`voorkant` worden alle unieke categorie-namen die op dit moment voorkomen in `foh_daily_templates` én `foh_tasks` (niet-gearchiveerd) samengesteld — dus **álles** wat vandaag in gebruik is (Deel 1, Deel 2, Deel 3, Binnen, Terras, Bar Prep Check, Bijvullen, Hygiëne, Overdracht, Borrel, BAR, BIJVULLEN (FIFO), BINNEN, HYGIENE, LAATSTE LOODJES, TERRAS, etc.).
- **Case blijft exact zoals in de DB** — geen samenvoeging. Je hebt na de migratie dus mogelijk zowel `BAR` als `Bar` staan; die kun je zelf hernoemen/samenvoegen via de beheer-UI. Dat is bewust: geen enkele taak-categorie verandert automatisch.
- Sort-order krijgt spreiding per 10 op alfabet als startpunt. Jij past de volgorde daarna zelf aan met de pijltjes.
- Niets wordt gedeletet of geüpdatet in `foh_tasks` / `foh_daily_templates` — alleen inserts in `foh_category_order`.

**2. Code-wijzigingen in `src/components/foh/FohTasks.tsx`:**
- `westCategoryOrder`-query (regel 1055) — `enabled` wordt `West || Midsland`.
- `westSubcatsData`-query (regel ~1051) — idem.
- `getCategoriesForContext` (regel 1080) — Midsland volgt vanaf nu dezelfde `getOrderedCategories(...)` als West. `getAvailableCategoriesForPhase` blijft alleen als vangnet bij een lege lijst.
- `ensureCategoryOrderRow` (regel 1098) — gate `if (loc !== 'West') return;` verwijderen zodat Midsland-categorieën ook geregistreerd worden bij het toevoegen van nieuwe categorieën aan een taak.
- Save-blok (regel ~1800) — registratie-blok geldt ook voor Midsland.
- Admin-paneel (regel ~3070/3285) — Midsland toont dezelfde categorie-lijst mét move/rename/delete-knoppen.
- ListManager-props (regel 4256-4285) — de vier gates op `userLocation === 'West'` worden `['West','Midsland'].includes(userLocation)`.

**3. Bewust behouden:**
- West's `voorkant` / `achterkant`-splitsing blijft. Midsland heeft alleen `voorkant`.
- Fase-splitsing (open/tussen/borrel/sluit) in de dagelijkse takenlijst blijft ongewijzigd — categorieën zijn gedeeld, taken blijven per fase gegroepeerd zoals nu.
- `foh_rename_category` RPC werkt al met `_location + _department + _old/_new` — geen wijziging nodig.

## Verificatie na uitrol

1. **Midsland-user** → `/taken` beheer → dezelfde move/hernoem/verwijder-iconen naast elke categorie als in West.
2. **Elke bestaande taak** staat na de migratie nog in dezelfde categorie — steekproef in open én sluit.
3. Categorie hernoemen in Midsland → alle bestaande taken in die categorie krijgen automatisch de nieuwe naam (via `foh_rename_category` RPC).
4. Categorie verwijderen → blokkeert als er nog taken in zitten (bestaand West-gedrag).
5. **West** onveranderd (regressie-check).
