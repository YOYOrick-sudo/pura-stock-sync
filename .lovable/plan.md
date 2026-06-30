## Wat er nu fout gaat (2 echte bugs)

Na onderzoek in `src/pages/TakenBeheer.tsx`, `src/components/foh/FohTasks.tsx`, `src/components/foh/ListManager.tsx` en de DB-tabel `foh_category_order`:

### Bug 1 — "Opslaan voelt onzeker / lijkt niet te gebeuren"
Bij het klikken op de pijltjes ↑/↓ van een categorie in `/taken/beheer` gebeurt er **geen zichtbare feedback**. De optimistic update wisselt de rijen in de cache, maar:
- Geen toast, geen "Opgeslagen"-indicator naast de header.
- `flashSaved` (gebruikt in `ListManager`) is niet aangesloten op categorie-reorder in `TakenBeheer`.
- Bij meerdere snelle klikken werkt het lock (`movingRef.current = true`) wel, maar zonder visuele bevestiging blijft het voelen alsof er niets opgeslagen wordt.

### Bug 2 — Volgorde op de takenlijst (`/taken-bediening`) wijkt af van de beheerlijst
Twee verschillende plekken berekenen de categorievolgorde, met subtiel andere logica:

**`TakenBeheer.buildAvailableCategories`** (admin) → strikt de DB-volgorde uit `foh_category_order`.

**`FohTasks.getCategoriesForContext`** (live lijst) → DB-volgorde + alfabetisch aangevulde "used-only" + **`result.unshift('Algemeen')`** als Algemeen niet in result staat. Resultaat:
- Een categorie die je in beheer naar plek 1 verplaatst kan in de live lijst alsnog onder Algemeen belanden (Algemeen wordt geforceerd vooraan als hij ontbreekt).
- Used-only categorieën worden in de live lijst alfabetisch achteraan geplakt; in de admin verschijnen ze pas na auto-seed op DB-positie. Tijdens dat seed-window klopt de volgorde tijdelijk niet.
- Hoofdletterverschillen (bijvoorbeeld `shop` in templates vs `Shop` als nieuwe categorienaam) worden niet genormaliseerd → kan dubbel in de lijst verschijnen op verschillende plekken.

Daarnaast gebruikt `makeMoveHandler` in `TakenBeheer` alleen `buildCategoryRows(dept)` (puur DB-rijen). Als er nog een ongesynced used-only categorie tussen zit, doet de volgordeknop een rebase die deze categorie eruit laat → na refetch valt deze categorie weer alfabetisch achteraan.

## Oplossing

### A. Eén bron van waarheid voor categorievolgorde
Nieuwe helper `getOrderedCategories(westCategoryOrder, westSubcats, dept)` in een gedeeld bestand (`src/lib/foh-category-order.ts`):
1. Start met DB-rijen op `sort_order`.
2. Normaliseer namen (case-insensitive dedupe; behoud de DB-spelling).
3. Voeg gebruikte categorieën die nog niet in DB staan toe op `max(sort)+10`-positie (consistent met seeding, niet alfabetisch).
4. Geen `unshift('Algemeen')` meer — Algemeen krijgt gewoon zijn DB-positie, of wordt geseed op de juiste plek.

Zowel `TakenBeheer.buildAvailableCategories` als `FohTasks.getCategoriesForContext` roepen deze helper aan. Hierna is admin = live lijst.

### B. Reorder werkt op de daadwerkelijk weergegeven lijst
`makeMoveHandler` in `TakenBeheer` baseert de swap niet op `buildCategoryRows` maar op het resultaat van bovenstaande helper. Bij upsert worden alle weergegeven categorieën (inclusief ge-seede used-only) meegenomen, zodat DB en UI 1-op-1 lopen.

### C. Zichtbare opslag-feedback
- Kleine "Opgeslagen ✓"-pill (fade in/out 800ms) rechtsboven naast "Lijst beheren"-titel in `TakenBeheer`, getriggerd na elke succesvolle reorder/rename/delete (`setSavingPing` patroon van `ListManager` hergebruiken).
- Bij fout: toast.error blijft + rollback van optimistic state (al aanwezig).

### D. Auto-seed deterministisch maken
- `seededRef` vervangen door een `useEffect` die direct draait wanneer er missing categorieën zijn (idempotent dankzij `ignoreDuplicates`), zonder per-seedKey-gate. Dit voorkomt dat de gate verkeerd vastloopt na meerdere edits.
- Na seed direct `setQueryData` voor `['foh-category-order', location]` zodat de UI niet hoeft te wachten op refetch.

### E. Cleanup
- `getCategoriesForContext` voor West: alleen via de gedeelde helper.
- `groupTasksByCategory` ongewijzigd; krijgt de juiste `orderedCats` mee.
- `ListManager.tasksByCategory` blijft `availableCategories` respecteren (die is nu identiek aan live).

## Verificatie (3 stappen, in build mode via Playwright)

**Stap 1 — Reorder = direct opgeslagen + zichtbare feedback**
1. Open `/taken/beheer?location=West&phase=sluit`.
2. Screenshot beginvolgorde.
3. Klik ↑ op "Sanitair" → "Opgeslagen ✓" pill verschijnt; categorie verspringt zonder flicker.
4. Hard refresh → volgorde blijft identiek aan UI.
5. Query `foh_category_order` → DB-orde matcht UI exact.

**Stap 2 — Beheerorde = live lijst orde**
1. Verplaats in beheer "Keuken" naar plek 2.
2. Open `/taken-bediening` → screenshot.
3. Beheer-volgorde en live-volgorde zijn identiek (incl. positie van Algemeen en used-only categorieën).

**Stap 3 — Auto-seed + dubbelklik**
1. Maak via "+ Nieuw onderdeel" categorie `Test-seed` aan.
2. Voeg er een taak aan toe; ververs admin → `Test-seed` heeft pijltjes en zit op een gedefinieerde positie (geen alfabetisch staartje).
3. Dubbelklik snel ↑ op een categorie → tweede klik genegeerd tijdens save (één DB-swap, geen positie-sprong van 2).
4. Console clean.

## Risico's
- Verwijderen van `unshift('Algemeen')` kan voor heel oude locaties zonder enige `foh_category_order` rij tijdelijk lege state geven; gemitigeerd doordat de helper de used-only categorieën altijd toevoegt.
- Case-insensitive dedupe houdt de eerst gevonden spelling aan; bestaande dubbele entries (zoals `shop` vs `Shop`) worden naar één categorie samengevoegd in de weergave, maar DB-rijen blijven onaangetast tot de gebruiker hernoemt.
