## Afvalkalender beschikbaar maken voor West (Klein tuinafval)

### 1. Database — nieuwe fractie toevoegen
Migratie:
- `waste_pickups_fraction_check` constraint uitbreiden met `'klein_tuinafval'` (naast restafval/gft/papier/glas).
- (Bron `source` blijft `tst` of `gemeente` — voor klein tuinafval gebruik ik `'gemeente'`).

### 2. Database — West 2026 data inserten
Twee bulk-inserts in `waste_pickups` (location = `'West'`, fraction = `'klein_tuinafval'`, source = `'gemeente'`):

**Klein tuinafval (regulier, hele jaar):**
2026-01-06, 01-20, 02-03, 02-17, 03-03, 03-17, 03-31, 04-14, 04-28, 05-12, 05-26, 06-09, 06-23, 07-07, 07-21, 08-04, 08-18, 09-01, 09-15, 09-29, 10-13, 10-27, 11-10, 11-24, 12-08

**Klein tuinafval zomer (extra rondes apr-okt):**
2026-04-07, 04-21, 05-05, 05-19, 06-02, 06-16, 06-30, 07-14, 07-28, 08-11, 08-25, 09-08, 09-22, 10-06, 10-20

Beide gaan in dezelfde rij met fraction `klein_tuinafval` (zomer-data zijn gewoon extra pickup-dagen).

### 3. Frontend — Midsland-hardcoding wegnemen
- `src/components/dashboard/WasteCalendarCard.tsx`: regel 85 `if (userLocation !== 'Midsland') return null;` → wijzigen naar `if (!['Midsland','West'].includes(userLocation)) return null;`. Kaarttitel dynamisch ("Afvalkalender West" / "Afvalkalender Midsland").
- `src/components/dashboard/WasteAlertBanner.tsx`: idem.
- `src/hooks/useWastePickups.ts`: hardcoded `'Midsland'` filter weghalen → gebruik gewoon de meegegeven `location` parameter. `enabled` wordt `location === 'Midsland' || location === 'West'`. Realtime + query gebruiken de location uit props.

### 4. Edge function `generate-waste-tasks`
Kort controleren of die `location` correct meeneemt. Als hij hardcoded op Midsland staat: location-agnostisch maken zodat hij ook West-pickups omzet naar FOH-taken (sluit-taak op maandagavond vóór dinsdag-pickup).

### 5. Label & icoon
"Klein tuinafval" krijgt een eigen label + groen-bruin tuin-icoon (Leaf) in de fraction-mapping van `WasteCalendarCard`.

### Niet gedaan / later
- 2027 data: voor West toevoegen wanneer gemeente die publiceert (zelfde flow als Midsland 2027-sync memory).
- Andere fracties voor West (restafval/papier/glas) — niet van toepassing volgens jou.

### Verificatie
Na uitvoering: SQL count per location/fraction tonen + screenshot van dashboard met West-login.
