# West Bediening: één platte lijst + heldere teksten

## Doel
Voor West-bediening (Voorkant) één rustige, doorlopende takenlijst zonder categorie-koppen, met kortere/actiegerichte taaknamen en duidelijkere fase-knoppen.

## Wijzigingen

### 1. Eén platte lijst (West, Voorkant)
- In `src/components/foh/FohTasks.tsx` de render-loop voor West aanpassen: geen categorie-headers (Bar, Zaal, etc.) en geen categorie-groepering meer voor de Voorkant-sectie.
- Taken worden gewoon op `sort_order` getoond als één doorlopende, genummerde lijst.
- Achterkant (keuken) blijft een eigen sectie eronder met eigen header — daar verandert de groepering niet, tenzij je dat ook wilt (zie open vraag onderaan).
- Midsland blijft ongewijzigd (categorieën zoals nu).
- In het admin-paneel (Templates Beheren) blijft `category` gewoon bestaan en bewerkbaar, zodat data niet verloren gaat — alleen de werknemer-view toont ze niet als koppen voor West Voorkant.

### 2. Fase-knoppen korter en duidelijker
- Huidige labels naar: **"Openen"** en **"Sluiten"** (werkwoorden, actiegericht).
- Toegepast op de fase-tabs bovenin voor West (Midsland houdt huidige labels inclusief "Tussen").

### 3. Taaknamen herschrijven (West Voorkant)
- Bestaande Voorkant-taken in de database (templates + actieve daglijst) krijgen kortere, eenduidige formuleringen.
- Principes:
  - Begin met een werkwoord ("Vul…", "Zet…", "Controleer…", "Veeg…").
  - Max ~6 woorden waar mogelijk.
  - Geen dubbele info (locatie, fase) die al uit context blijkt.
  - Consistente terminologie (bv. altijd "terras" i.p.v. afwisselend "buiten"/"terras").
- Ik lever de hernoemingen aan als één migratie/lijst zodat je ze vooraf kunt nakijken voor we ze toepassen.

### 4. Geen nieuwe bugs
- Geen schema-wijzigingen, alleen UI-rendering + tekstupdates op bestaande rijen via `UPDATE` (geen delete/insert, dus `id`s en `template_id`-koppelingen blijven intact).
- Reset/generate edge functions blijven ongewijzigd.

## Technisch (kort)
- `FohTasks.tsx`: voor `userLocation === 'West'` en `department === 'voorkant'` de `categoriesInDepartment.map(...)` vervangen door één enkele lijst-render zonder category-header. Achterkant blijft via huidige logica.
- Fase-knop labels: kleine map `{ open: 'Openen', sluit: 'Sluiten', tussen: 'Tussen' }` op de bestaande knop-render.
- Taak-rewrites: één SQL `UPDATE` per taak in `foh_daily_templates` (en optioneel matchende `foh_tasks` van vandaag) op basis van `id`.

## Open vraag voor je akkoord
Wil je dat **ook de Achterkant (keuken) in West** dezelfde behandeling krijgt (één platte lijst, hernoemde taken), of laten we die voor nu zoals hij is en pakken we 'm later apart?
