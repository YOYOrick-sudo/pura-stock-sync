## Probleem

Categorie omhoog/omlaag verplaatsen in `/taken/beheer` werkt vaak niet zoals verwacht. Onderzoek wijst drie samenhangende oorzaken aan:

1. **Twee verschillende ordeningen**. De weergave gebruikt `availableCategories` (in `TakenBeheer.buildAvailableCategories`), de pijltjes-logica gebruikt `westCategoryRows` (de DB-volgorde). Die twee lopen uiteen omdat:
   - `Algemeen` wordt geforceerd met `result.unshift('Algemeen')` ook al staat hij in de DB op `sort_order = 60`.
   - "Used-only" categorieën zonder rij in `foh_category_order` worden alfabetisch achteraan geplakt.
   Resultaat: na een klik op ↑ wijzigt de DB wél correct, maar de UI verschuift niet (of springt onverwacht) omdat displayed-index ≠ DB-index. Voor de gebruiker oogt dit als "het slaat niet op".

2. **Geen optimistic update**. Na de upsert wordt alleen `invalidateQueries` aangeroepen. De refetch is async (paar 100ms latency); intussen ziet de gebruiker de oude volgorde → indruk van bug. Voor categorie-orde is geen "savingPing"-feedback.

3. **Geen async-guard / dubbel-klikken**. Snel twee keer op ↑ klikken vuurt twee upserts met dezelfde uitgangslijst → tweede klik overschrijft de eerste.

Daarnaast tijdens onderzoek opgemerkt:
- Used-only categorieën (zonder DB-rij) tonen géén pijltjes (catRowIdx = -1). Dat is verwarrend; het zou moeten "self-heal" door bij eerste render ontbrekende categorieën te seeden in `foh_category_order`.
- Bij hernoemen via `foh_rename_category` worden de volgorde-rijen samengevoegd maar de UI-cache niet altijd correct ververst (zelfde optimistic-issue).

## Oplossing

### 1. Eén bron van waarheid voor categorie-volgorde (`src/pages/TakenBeheer.tsx`)
- Verwijder de `unshift('Algemeen')`. Algemeen krijgt gewoon zijn DB-positie; als hij ontbreekt, seeden we hem onderaan.
- `buildAvailableCategories` exact dezelfde volgorde laten geven als `westCategoryRows`. Used-only categorieën worden eerst geseed in `foh_category_order` (met `max(sort_order)+10`) en daarna pas weergegeven.
- `buildCategoryRows` bevat altijd álle weergegeven categorieën (na seeding) zodat catRowIdx voor elke kop matcht.

### 2. Auto-seed van ontbrekende categorieën
- Nieuwe `useEffect` in `TakenBeheer`: wanneer `westSubcats` óf actieve template-categorieën ontbreken in `foh_category_order`, eenmalig upserten met oplopende `sort_order` (`max+10, max+20, …`). Pas hierna pijltjes tonen, zodat élke kop verplaatsbaar is.

### 3. Optimistic update + lock in `makeMoveHandler`
- Verander `makeMoveHandler` naar:
  - `queryClient.setQueryData(['foh-category-order', location], next)` direct na de swap → UI verspringt meteen.
  - Lokale `isMovingRef` om dubbele klikken te blokkeren totdat de upsert voltooid is.
  - Bij DB-fout: `setQueryData` terug naar `prev` + toast.
  - Na succes: subtiele bevestiging (toast.success kort of een "Opgeslagen"-ping in de header).
- Zelfde patroon voor `makeRenameHandler` en `makeDeleteHandler`.

### 4. Pijltjes-styling (UX)
- Pijltjes altijd zichtbaar (niet alleen op hover), iets groter touch-target (32×32 ipv 24×24) voor iPad.
- `disabled`-state subtieler: `opacity 0.25` ipv `0.2`, geen `cursor: not-allowed` — beter `cursor: default`.
- Tussen ↑ en ↓ een dunne vertical divider voor visuele groepering.

### 5. Bug-tolerant rename
- In `makeRenameHandler`: na succesvolle RPC ook `queryClient.setQueryData` patchen voor instant feedback, dan invalidate.
- Validatie: trim + dedupe-check tegen bestaande categorienamen voorafgaand aan RPC (i.p.v. SQL-fout afwachten).

## Verificatie (3 stappen, in build mode uit te voeren via Playwright)

**Stap 1 — Reorder werkt en is persistent**
1. Open `/taken/beheer?location=West&phase=sluit`.
2. Screenshot beginpositie van "Sanitair".
3. Klik 2× ↑ op "Sanitair".
4. Screenshot direct na elke klik → controleer dat de kop visueel verspringt zonder reload-flash.
5. Hard refresh → screenshot → "Sanitair" staat 2 plekken hoger.
6. Query DB: `SELECT category, sort_order FROM foh_category_order WHERE location='West' ORDER BY sort_order` → volgorde komt exact overeen met UI.

**Stap 2 — Used-only categorie wordt zelf-geseed**
1. Maak via "+ Nieuw onderdeel" een nieuwe categorie "Test-stap2" aan in de lijst beheer-UI.
2. Verifieer dat `foh_category_order` direct een rij krijgt (psql query).
3. Pijltjes ↑/↓ verschijnen direct en werken.
4. Verwijder categorie via prullenbak; rij verdwijnt uit DB.

**Stap 3 — Hernoemen en dubbel-klikken**
1. Hernoem "Algemeen" → "Algemeen 2" via potlood-icoon. Cancel via Esc → geen wijziging.
2. Hernoem echt → UI toont nieuwe naam direct (optimistic), DB rij heeft nieuwe naam.
3. Dubbelklik snel 2× op ↑ van een categorie → tweede klik wordt genegeerd tijdens lopende save (controle: slechts één DB-rij wisselt, geen sprongen van 2 posities).
4. Console controleren op errors.

## Risico's

- Auto-seeding kan eenmalig veel rijen aanmaken; idempotent dankzij `ON CONFLICT DO NOTHING`.
- Verwijderen van `unshift('Algemeen')` kan bij locaties zonder enige `foh_category_order` rijen tijdelijk een lege lijst geven; daarom auto-seed eerst draaien en pas dan availableCategories berekenen.

## Resultaat

Reorder, rename en delete van categorieën in `/taken/beheer` werken instantaan, betrouwbaar en zonder visuele desync. Pijltjes verschijnen voor elke categorie, dubbel-klikken corrumpeert de volgorde niet, en DB + UI lopen altijd in sync.
