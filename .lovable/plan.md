## Doel
In West onder **Voorkant** en **Achterkant** subcategorieën kunnen aanmaken (bijv. "Bar", "Zaal", "Koeling", "Werkbank") en taken daaronder kunnen plaatsen. Beheer gebeurt vanuit het Admin → Templates Beheren scherm én bij het aanmaken/wijzigen van een taak.

## Aanpak in het kort
We hergebruiken het bestaande `category`-veld op `foh_tasks` en `foh_daily_templates` als "subcategorie binnen een afdeling". Geen schemawijziging nodig — alleen UI + render-logica aanpassen, en West omzetten van platte lijst naar gegroepeerd-per-categorie (net als Midsland), met behoud van Voorkant/Achterkant secties erboven.

## Wijzigingen

### 1. West: van platte lijst naar gegroepeerd
In `src/components/foh/FohTasks.tsx`:
- `renderFlatList` voor West vervangen door dezelfde categorie-gegroepeerde render die Midsland gebruikt (`groupTasksByCategory`), maar genest binnen elke afdelingssectie (Voorkant / Achterkant).
- Lege categorie-headers verbergen.
- Voltooide taken blijven naar onderen sorteren (zoals afgesproken).
- Sticky afdelings-header blijft, categorieën komen daar als sub-header onder.

### 2. Vrij invoerbare subcategorie bij taak toevoegen
- Het categorie-veld in "Nieuwe taak"-dialoog wordt een **combobox**: bestaande subcategorieën voor de actieve afdeling als suggesties + optie "Nieuwe subcategorie aanmaken…" met tekstinvoer.
- Bestaande lijst wordt gevuld uit de unieke `category`-waarden van templates + taken voor (location, department).
- Voor Midsland blijft het huidige vaste lijstje (Bar, Zaal, etc.) gewoon werken.

### 3. Subcategoriebeheer in Admin → Templates Beheren
In het Template Editor scherm (West):
- Per afdeling een sectie met de huidige subcategorieën als chips.
- Knop **"+ Subcategorie toevoegen"** → invoer → categorie wordt direct beschikbaar als optie bij het toevoegen van template-taken.
- Bij elke template-taakrij komt naast titel/tijd een **categorie-keuzeveld** (zelfde combobox als bij "nieuwe taak"), zodat je in admin per taak de subcategorie kiest.
- Hernoemen van subcategorie: update alle templates + open taken van vandaag in één query.
- Verwijderen van subcategorie alleen toegestaan als er geen template-taken meer aan hangen (anders waarschuwing).

### 4. Generatie en opslaan
- `handleSaveAsTemplate` en de dagelijkse generator gebruiken al `category` → geen aanpassing nodig, behalve dat we de waarde nu daadwerkelijk respecteren in West (i.p.v. forceren op 'Algemeen').
- Bestaande West-taken met `category = 'Algemeen'` blijven werken; ze verschijnen onder een "Algemeen" header die je vanuit admin kunt hernoemen.

### 5. Veiligheid / bugs voorkomen
- Geen DB-migratie → geen schema-risico.
- Midsland-logica blijft 100% ongewijzigd (gated op `userLocation === 'West'`).
- Optimistische updates en sort_order-gedrag blijven intact.
- Categorie-suggestielijst is per (location, department) gefilterd, zodat Voorkant-categorieën niet in Achterkant verschijnen en omgekeerd.

## Technische notities
- Bestand: `src/components/foh/FohTasks.tsx` (render + dialogen + template editor)
- Type `FohTask.category` is al `string` → vrij invoerbaar.
- Hook voor unieke categorieën: kleine `useMemo` over `tasks` + `templates` per departement.

## Resultaat voor gebruiker
- In West zie je onder Voorkant en Achterkant nette sub-koppen (Bar, Zaal, Koeling, …) met hun taken eronder.
- Bij "Taak toevoegen" kies je de subcategorie of typ je een nieuwe.
- In Admin → Templates Beheren kun je subcategorieën aanmaken, hernoemen en taken eraan koppelen.