## Wat er verandert (alleen West)

1. **Hernoemen naar "Taken"**
   - Sidebar-label voor West: "Taken" (Midsland blijft "Taken Bediening").
   - Pagina-titel op `/taken-bediening` wordt voor West "Taken", voor Midsland blijft "Taken Bediening".
   - Route URL blijft `/taken-bediening` (geen broken links, geen redirect nodig).

2. **Nieuwe afdeling-tabs Voorkant / Achterkant**
   - Boven de Open/Sluit fase-knoppen komt voor West een tweede rij tabs: **Voorkant** (bediening) | **Achterkant** (keuken).
   - Selectie wordt onthouden in `localStorage` per gebruiker, default = Voorkant.
   - Open/Sluit fasen blijven gewoon werken; periodiek blijft 1 gedeelde lijst.
   - Midsland ziet deze schakelaar niet (alles werkt zoals nu).

3. **Datamodel — minimale aanpassing**
   - Nieuwe kolom `department` op `foh_task_templates` en `foh_daily_tasks` (`voorkant` | `achterkant`, default `voorkant`).
   - Alle bestaande West-templates en -taken worden `voorkant` (zoals afgesproken).
   - Midsland-rijen krijgen `voorkant` als waarde maar de UI gebruikt dit veld daar niet.

4. **Achterkant-lijst begint leeg**
   - Geen automatische taken; jij bouwt hem op via "Templates Beheren" of "Lijst opslaan als template" terwijl je in de Achterkant-tab staat.
   - Bij toevoegen/opslaan van templates en taken in West wordt automatisch de huidige `department` meegegeven.

5. **Admin & dagelijkse generatie**
   - Templates-beheer-popup toont in West een Voorkant/Achterkant-selector per template.
   - Edge function `generate-waste-tasks` en de bestaande dagelijkse FOH-generatie nemen `department` mee over van template → daily task.
   - Single-active-template trigger blijft werken, maar wordt per (location, phase, department) uniek — zo kan Voorkant én Achterkant elk hun eigen actieve lijst hebben in dezelfde fase.

## Technische details

- `src/components/AppSidebar.tsx`: label voor West dynamisch.
- `src/components/SidebarLayout.tsx`: paginatitel-mapping locatie-afhankelijk.
- `src/components/foh/FohTasks.tsx`:
  - Nieuwe state `activeDepartment` (West only).
  - Filter daily tasks op `department` wanneer West.
  - Tabs renderen alleen voor West, boven fase-knoppen.
  - Insert/save-paden vullen `department` in.
- DB-migratie: kolom toevoegen, default `'voorkant'`, backfill, en de bestaande "single active per (location, phase)" trigger updaten naar (location, phase, department).
- Geen wijziging aan periodieke taken (department blijft `voorkant`, UI toont ze ongeacht tab).