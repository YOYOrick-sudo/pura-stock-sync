## Doel
Eén lijst-gevoel in West: geen "Voorkant / Achterkant" headers en geen aparte progress per afdeling meer. Categorieën (Bijvullen, Schoonmaak Bar, Shop, Sanitair, Keuken, etc.) blijven als lichte groepering, maar voelen als één werkstroom voor het hele team.

## Wijzigingen in `src/components/foh/FohTasks.tsx` (alleen West)

1. **Department-headers verwijderen**
   - De twee grote kaarten/koppen "Voorkant (Bediening)" en "Achterkant (Keuken)" met elk hun eigen progress-balk en teller verdwijnen.
   - In plaats daarvan: één progress-balk bovenaan met totaal (X / Y taken voltooid) voor de actieve fase (Openen / Sluiten).

2. **Eén doorlopende lijst, gegroepeerd op sub-categorie**
   - Alle taken (ongeacht `department`) komen in één lijst.
   - Groepering uitsluitend op `category` (Bijvullen, Schoonmaak Bar, Shop, Terras, Sanitair, Magazijn, Keuken, …) met dezelfde subtiele grijze categorie-header die we al gebruiken.
   - Doorlopende nummering 1, 2, 3 … over de hele lijst (niet per afdeling resetten).

3. **Volgorde-logica via Apparaat-modus**
   - De bestaande "Apparaat-modus" (Bediening eerst / Keuken eerst / Standaard) blijft bestaan, maar bepaalt nu alleen welke categorieën bovenaan staan:
     - *Bediening eerst*: categorieën met overwegend bedienings-taken sorteren bovenaan (volgens `foh_category_order`), keuken-categorie naar onder.
     - *Keuken eerst*: omgekeerd.
     - *Standaard*: pure `foh_category_order` volgorde.
   - Geen tweede sectie, geen tweede progress — alleen volgorde verandert.

4. **Admin Panel (template editor, password 2020)**
   - `department` veld blijft bestaan in de database (geen migratie), maar verdwijnt als zichtbare filter/tab in de admin UI. Bestaande taken houden hun `department`-waarde voor de sorteerlogica hierboven.
   - Categorie-beheer (volgorde, hernoemen, verwijderen) blijft zoals het is.

5. **Midsland blijft ongewijzigd.** Midsland heeft al geen afdelingen — daar verandert niets aan UI of data.

## Wat NIET verandert
- Geen databasewijzigingen, geen migraties, geen wijziging aan `foh_daily_templates` of `foh_tasks` rijen.
- Categorieën en hun volgorde blijven.
- Repeat-badges, Day Navigator, archivering, alles blijft werken.
- Apparaat-modus selector blijft op dezelfde plek in het admin paneel.

## Technische details
- In `FohTasks.tsx`: de huidige `groupBy(department)`-render-laag eruit halen; render direct `groupBy(category)` over `tasks.filter(t => t.phase === activePhase)`.
- Eén `useMemo` voor totaal-progress (`completed / total`) ter vervanging van twee aparte tellingen.
- Sorteerfunctie: `tasks.sort((a,b) => categoryOrder(a) - categoryOrder(b) || a.sort_order - b.sort_order)`, waarbij `categoryOrder` afhangt van Apparaat-modus.
- Volledig frontend-only; geen edge functions, geen SQL.

## Rollback
Pure UI-refactor. Bij problemen revert van één file (`FohTasks.tsx`) volstaat — data blijft intact.
