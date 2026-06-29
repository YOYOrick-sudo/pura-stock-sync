## Probleem

In `/taken/beheer` voor West worden twee aparte kaarten gerenderd: één met de "voorkant"-categorieën (Bijvullen, Schoonmaak Bar, Laatste Loodjes …) en één met de "achterkant"-categorieën (Algemeen, Keuken). Dat komt omdat de templates van West nog in twee `department`-waarden in de database staan (`voorkant` en `achterkant`). `TakenBeheer` stapelt per department één `ListManager` → categorieën kunnen niet over de grens heen geordend of versleept worden, en Keuken kan dus niet boven Laatste Loodjes.

## Oplossing: écht één lijst

Alles van West samenvoegen onder één department (`voorkant`) zodat er nog maar één template-set, één categorie-ordening en één `ListManager` per fase bestaat. Daarna is slepen + her­ordenen volledig vrij.

### 1. Database-migratie (West)

- `foh_daily_templates`: `UPDATE … SET department='voorkant' WHERE location='West' AND department='achterkant'`.
- `foh_tasks`: idem voor alle niet-gearchiveerde taken van West.
- `foh_category_order`:
  - Pak bestaande `voorkant`-rijen voor West en bepaal de hoogste `sort_order`.
  - Verplaats elke `achterkant`-rij naar `voorkant`, met `sort_order = max + (n*10)` zodat Keuken-categorieën onderaan landen (gebruiker kan ze daarna vrij omhoog slepen — bv. Keuken boven Laatste Loodjes).
  - Bij naam-conflict (zelfde category-naam bestaat al in voorkant): bewaar de bestaande voorkant-rij en gooi de achterkant-duplicaat weg, en hernoem evt. de Keuken-categorie zo nodig (in praktijk speelt dit alleen bij "Algemeen" — die rij gewoon weggooien aan de achterkant-zijde).

Eén SQL-migratie, idempotent (alles in een transactie + `ON CONFLICT DO NOTHING` waar nodig).

### 2. Frontend — `src/pages/TakenBeheer.tsx`

- Verwijder de "unified West"-stacked render. West gebruikt voortaan dezelfde single-`ListManager` flow als Midsland.
- `department` voor West is altijd `'voorkant'`.
- Verwijder `deptsWithTemplates`-query en het `activeDepts`-mechanisme.
- `westCategoryOrder` en `westSubcats` queries leveren nu alleen `voorkant`-data — vereenvoudigen tot één array i.p.v. record per dept.

### 3. Frontend — `src/pages/TakenAdmin.tsx`

- Geen `?dept=` meer in de West-cards. De twee kaarten (Openen / Sluiten) blijven; ze linken naar `/taken/beheer?location=West&phase=…` zonder `dept`.
- Telling van taken: één query per fase (geen splitsing per department meer).

### 4. Edge function `generate-foh-tasks-v2` (en eventueel `generate-waste-tasks`)

- Forceer `department = 'voorkant'` bij iedere insert voor West, ongeacht wat in het template staat (extra vangnet).
- `generate-waste-tasks` schrijft al "Extra Maandag" voor West — checken dat ook daar `department='voorkant'` wordt gebruikt en zo nodig aanpassen.

### 5. `FohTasks.tsx` (het dagelijkse takenscherm)

- West rendert al alles in één flow (recent samengevoegd), maar het laadt nog wel beide departments. Filter blijft werken; geen functionele wijziging nodig — wel verifiëren dat sortering nu volledig door `foh_category_order` (voorkant) wordt bepaald, en eventueel resterende achterkant-fallbacks verwijderen.

### 6. Validatie

- Na migratie: open `/taken/beheer?location=West&phase=sluit` → één kaart, alle categorieën (Bijvullen, Schoonmaak Bar, Terras, Sanitair, Shop, Extra Maandag, Laatste Loodjes, Keuken, Ontdooien …) zichtbaar in één lijst.
- Categorie-volgorde-pijltjes verplaatsen Keuken vrij omhoog/omlaag.
- Taken slepen tussen Keuken ↔ Laatste Loodjes werkt zonder grens.
- `/taken` (dagelijks scherm) toont taken in de nieuwe volgorde.

## Risico's

- Eenmalige data-migratie, niet terug te draaien zonder backup van de oude `department`-waarden. Effect is puur cosmetisch (lijst-positie); taken zelf, completion-status, repeat-instellingen en template-id's blijven intact.
- Bestaande "Achterkant"-toggle/UI-resten in West moeten weg, anders ontstaan dode knoppen.

## Resultaat

Eén lijst per fase voor West. Categorie-volgorde volledig vrij te bepalen (Keuken kan boven Laatste Loodjes). Slepen tussen alle categorieën werkt zonder split.