## Doel
In het beheerscherm (`/taken/beheer`) kun je nu wel taken slepen binnen één categorie, maar niet ertussen. Ik maak het mogelijk om een taak van bv. **Schoonmaak Bar** naar **Bijvullen** te slepen — de categorie van de taak wordt dan automatisch bijgewerkt en de positie binnen de nieuwe categorie blijft daar waar je hem loslaat.

## Wat verandert er functioneel
- **Eén grote sleepzone** voor alle categorieën in de actieve lijst i.p.v. één per categorie.
- **Slepen tussen categorieën**: laat een taak los boven een andere taak → die taak krijgt de categorie van de doeltaak en wordt op die positie ingevoegd.
- **Slepen op een lege categorie**: ondersteund via een drop-area met de categorienaam als drop-id.
- **Auto-save**: zoals nu — `category` en `sort_order` worden direct opgeslagen in `foh_daily_templates`, en de wijziging propageert via de bestaande sync naar de actieve `foh_tasks` van vandaag (zodat je het meteen in de takenlijst ziet).
- **Optimistic update**: UI verschuift direct, rollback bij fout (toast).
- De bestaande **categorie-dropdown** per taak blijft bestaan als alternatief (handig op kleine schermen waar slepen lastig is).
- Werkt zowel in de gewone variant als in de **unified West-weergave** (stacked voorkant + achterkant): elk `ListManager`-blok behoudt z'n eigen DnD-context — dus tussen voorkant en achterkant kun je niet slepen (dat zou department-wissel zijn, hier niet gevraagd).

## Technisch (kort)
- `src/components/foh/ListManager.tsx`:
  - Vervang per-categorie `DndContext` door één `DndContext` rond de hele lijst.
  - Per categorie een `SortableContext` met die category-IDs + een droppable wrapper met id `cat:<naam>` (via `useDroppable`) zodat lege categorieën ook drop-target zijn.
  - Nieuwe `handleDragEnd(event)`:
    - Bepaal `activeTask`, `overId`.
    - Als `overId` start met `cat:` → verplaats naar einde van die categorie, set nieuwe `category`.
    - Anders zoek `overTask`: zelfde categorie → reorder binnen categorie (huidig gedrag); andere categorie → set `category` van actief op die van over-task, invoegen op de index van over-task.
    - Bereken nieuwe `sort_order` waardes (stappen van 10) voor de betrokken categorie(ën) en doe één `upsert` op `foh_daily_templates`.
  - Direct daarna: `UPDATE foh_tasks SET category=…, sort_order=… WHERE template_id=… AND archived=false` zodat de live lijst van vandaag meebeweegt (consistent met bestaande sync-aanpak in dit bestand).
  - React Query invalidatie van `list-manager-templates` + `foh-daily-tasks` + `foh-west-subcategories`.

## Buiten scope
- Slepen tussen Voorkant/Achterkant (department wissel) — kan in een vervolgstap als je dat wilt.
- Slepen op de categorie-kop zelf om de categorievolgorde te veranderen (dat doe je al via de pijltjes in "Onderdelen beheren").
