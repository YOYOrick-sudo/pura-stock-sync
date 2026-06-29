# Admin overzicht in lijn brengen met unified takenlijst (West)

## Probleem
De takenlijst toont alles als één geheel ("allround"), maar `/taken/admin` splitst nog op in **Bediening · Openen**, **Bediening · Sluiten** en **Keuken · Sluiten**. Ook de "Subcategorieën beheren"-sectie scheidt nog op Bediening/Keuken — en bevat oude restjes (`Deel 1`, `Bar`, `Algemeen`).

## Wat verandert er in de admin

### 1. Lijstkaarten bovenaan
Voor West nog maar **2 kaarten**, puur per fase:

```text
WEST                    WEST
Openen                  Sluiten
18 taken   Beheren →    82 taken   Beheren →
```

Klikken op "Beheren" opent dezelfde unified bewerkpagina (`/taken/beheer?location=West&phase=open` / `?phase=sluit`) — die toont al alle taken van die fase ongeacht afdeling, zoals nu.

Midsland blijft ongewijzigd: daar geldt geen Bediening/Keuken-split, dus die houdt zijn fase-kaarten zoals nu.

### 2. Subcategorieën beheren
Eén platte lijst per fase voor West (i.p.v. per Bediening/Keuken):
- "Bediening" en "Keuken" koppen weg.
- Eén volgorde voor de hele fase die de takenlijst gebruikt.

### 3. Restcategorieën opruimen
Detecteren welke categorieën **0 actieve taken én 0 template-taken** hebben en die uit `foh_category_order` verwijderen. Op je screenshot zijn dat vrijwel zeker `Deel 1`, `Bar` en `Algemeen` (legacy van vóór de unificatie). Pas écht weg als ze leeg zijn — anders een toast met aantal taken erin.

## Niet veranderen
- De takenlijst zelf (`FohTasks`) blijft exact zoals nu — één unified flow.
- Het `department`-veld in de database blijft bestaan voor backwards compat; we negeren het puur in de admin-grouping voor West.
- Midsland-admin blijft onveranderd.
- Geen taaktitels of categorienamen worden aangepast (behalve het verwijderen van lege legacy-categorieën).

## Technisch
- `src/pages/TakenAdmin.tsx`:
  - `ListCard` per West-locatie alleen op `phase` groeperen (departments samenvoegen, taaktelling sommeren).
  - "Subcategorieën beheren" sectie: één lijst per West-locatie i.p.v. twee blokken (voorkant/achterkant). Volgorde-acties (move/rename/delete) blijven werken; intern blijven we per department opslaan in `foh_category_order`, maar de UI toont ze samengevoegd op `category`-naam. Bij verplaatsen werken we beide department-rijen tegelijk bij zodat ze synchroon blijven.
  - Detectie en opruim-knop ("Lege categorieën opruimen") onderaan de subcategorie-sectie die rijen zonder taken verwijdert.
- `src/components/foh/ListManager.tsx` (alleen als variant `page` met query `?phase=sluit` zonder `dept` wordt geopend): toont alle taken van beide departments samen — controleren of dit al zo werkt; zo niet, dept-filter optioneel maken.
