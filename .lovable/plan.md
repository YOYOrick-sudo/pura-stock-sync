## Probleem
1. Op `/taken/admin` zie je voor Midsland alleen Openen / Tussen / Sluiten. De **Borrel**-kaart ontbreekt, waardoor je geen taken kunt toevoegen/beheren voor die lijst.
2. In de app heet die fase overal "Borrel-prep", maar dat moet gewoon **"Borrel"** zijn.

## Oorzaak
- `TakenAdmin.tsx` bouwt kaarten alleen voor fasen waar al een actieve template bestaat (`byPhase.has(p)`). Voor Borrel bestaat er nog geen template → geen kaart → je kunt hem niet openen.
- Label "Borrel-prep" staat hard-coded op meerdere plekken.

## Aanpak

### 1. Borrel-kaart altijd tonen voor Midsland
In `src/pages/TakenAdmin.tsx`: voor Midsland alle 4 fasen altijd renderen (open/tussen/borrel/sluit), ook als `taskCount = 0`. De kaart opent gewoon `/taken/beheer?phase=borrel` waar de gebruiker taken kan toevoegen (de bestaande "nieuwe lijst" flow in `ListManager` maakt de template aan bij eerste taak).

### 2. Overal "Borrel-prep" → "Borrel"
Label-only wijziging (de DB-waarde blijft `'borrel'`). Aanpassen in:
- `src/pages/TakenAdmin.tsx` — `PHASE_LABEL.borrel`
- `src/components/foh/FohTasks.tsx` — 3 plekken (labels record, template-naam fallback, dialog-teksten)
- `src/components/foh/ListManager.tsx` — `getPhaseLabel`

Geen DB-migratie nodig, geen typewijzigingen.

## Verificatie
- `/taken/admin` als Midsland toont nu 4 kaarten incl. "Borrel".
- Klikken op Borrel opent beheer-scherm; taak toevoegen werkt en verschijnt in de dagelijkse lijst.
- Overal in UI staat "Borrel" i.p.v. "Borrel-prep".
