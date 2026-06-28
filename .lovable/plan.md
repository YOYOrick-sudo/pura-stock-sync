## Doel
In West de **volgorde van subcategorieën** (bv. "Bijvullen" vóór "Bar") kunnen bepalen — zowel in de takenlijst zelf als bij het aanmaken/wijzigen via Admin → Templates Beheren. Volgorde moet persistent zijn, per afdeling (voorkant/achterkant), en consistent toegepast in álle weergaven.

## Aanpak

### 1. Nieuwe tabel `foh_category_order`
Eén bron van waarheid voor subcategorie-volgorde per (location, department, category).

```
foh_category_order
  id (uuid)
  location (text)        -- 'West' | 'Midsland'
  department (text)      -- 'voorkant' | 'achterkant'
  category (text)        -- bv. 'Bijvullen', 'Bar'
  sort_order (int)       -- 10, 20, 30, ...
  created_at, updated_at
  UNIQUE (location, department, category)
```
- RLS: read voor `authenticated`, write voor `authenticated` (zelfde patroon als `foh_daily_templates`).
- GRANT statements voor `authenticated` + `service_role`.

### 2. Render-logica in `FohTasks.tsx`
- Nieuwe query `useCategoryOrder(location, department)` die de volgorde ophaalt en cached via React Query.
- In `groupTasksByCategory` (en in de West-render) categorieën sorteren op `sort_order` uit deze tabel. Categorieën zonder entry → onderaan, alfabetisch, en krijgen automatisch een entry aangemaakt zodra ze zichtbaar zijn (zie §4).
- Midsland blijft ongewijzigd (gebruikt nog steeds de bestaande hardcoded `CATEGORY_ORDER`); alleen West leest uit `foh_category_order`.

### 3. UI in Admin → Templates Beheren (alleen West)
Per afdeling (Voorkant / Achterkant) een **"Subcategorieën beheren"** sectie boven de takenlijst:
- Lijst van categorieën in huidige volgorde, elk met:
  - **drag-handle** (@dnd-kit, zelfde als taken) om te slepen
  - **↑ / ↓ knoppen** als fallback voor touch
  - **rename** (potlood-icoon → inline input)
  - **delete** (alleen als er geen taken/templates meer onder hangen — anders disabled met tooltip)
- Knop **"+ Subcategorie toevoegen"** (zelfde combobox als in §2 van vorige plan).
- Bij sleep/knop-volgordewijziging: bulk-update `sort_order` (stappen van 10) in één Supabase-call, optimistische update op de query-cache.

### 4. Synchronisatie bij aanmaken
- Wanneer in "Nieuwe taak" of in een template een **nieuwe** subcategorie wordt aangemaakt, schrijf direct ook een rij in `foh_category_order` met `sort_order = max(sort_order)+10` voor die (location, department). Zo verschijnt elke nieuwe categorie automatisch onderaan en is direct sleepbaar in admin.
- Bij **rename** in admin: update `category` op alle `foh_tasks` (vandaag, niet-gearchiveerd) en `foh_daily_templates` voor die (location, department) + update de `foh_category_order`-rij — in één transactie via een edge function of een Supabase RPC, zodat namen overal consistent blijven.
- Bij **delete**: alleen toegestaan als 0 templates én 0 open taken → verwijder de rij uit `foh_category_order`.

### 5. Volgorde toegepast op
- Live takenlijst West (Voorkant + Achterkant secties).
- Admin → Templates Beheren (takenlijst gegroepeerd per categorie in zelfde volgorde).
- Categorie-dropdown bij "Nieuwe taak" en bij per-taak categoriekeuze (suggesties in dezelfde volgorde getoond).

### 6. Robustheid / geen bugs
- Geen wijziging aan Midsland-pad (alle wijzigingen gated op `userLocation === 'West'` of op aanwezigheid van een `foh_category_order`-rij).
- Optimistische updates rollbacken bij fout (React Query `onError` reset).
- Drag-and-drop én ↑/↓ knoppen schrijven dezelfde bulk-update functie, zodat er één codepad is.
- Seed-migratie: bij deploy alle bestaande unieke West-categorieën uit `foh_tasks` + `foh_daily_templates` invoegen met een initiële `sort_order` (alfabetisch, stappen van 10) zodat huidige gebruikers direct iets zien om te slepen.
- Cache-invalidation: na elke mutatie `['category-order', location, department]` + de templates/tasks queries invalidaten zodat lijst en admin in sync blijven.

## Technische bestanden
- **Nieuwe migratie**: tabel `foh_category_order` + GRANTs + RLS + seed.
- `src/components/foh/FohTasks.tsx`: nieuwe hook, sortering, admin-UI sectie "Subcategorieën beheren", rename/delete/reorder flows.
- (Optioneel) kleine RPC `foh_rename_category(location, department, old, new)` voor atomaire rename.

## Resultaat
- In Admin → Templates Beheren (West) kun je per afdeling subcategorieën slepen, hernoemen, toevoegen, verwijderen.
- De volgorde die je daar instelt, geldt overal: live lijst, template-editor, "nieuwe taak"-dropdown.
- Midsland blijft exact zoals het is.
