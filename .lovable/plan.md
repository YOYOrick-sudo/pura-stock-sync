## Aanpassingen dashboard

### 1. Afvalkalender: week start op Maandag
De kalender toont nu `DAY_NAMES = ['Zon', 'Maa', 'Din', 'Woe', 'Don', 'Vri', 'Zat']` met Zondag als eerste dag. Wijzigen naar Maandag als eerste dag van de week: `['Maa', 'Din', 'Woe', 'Don', 'Vri', 'Zat', 'Zon']`.

Ook `startOfWeekMonday` functie behoudt de Monday-basis, maar de header-rij moet de dagen nu als Ma-Di-Wo-Do-Vr-Za-Zo tonen.

### 2. Onderste 3 kaarten kleiner maken
De 3 KPI-kaarten (Openstaande Taken, Idee Box, Terschelling Events) domineren nu teveel. Maak ze compacter:
- Compactere PolarKPICard variant: kleinere padding, kleinere font, minder hoogte
- Of: vervang door subtiele "info strip" / badges in plaats van volwaardige kaarten
- Het moet minder de aandacht trekken dan Overdracht + Afvalkalender

### 3. Files
- `src/components/dashboard/WasteCalendarCard.tsx` — dag-volgorde header
- `src/pages/Dashboard.tsx` — kaarten kleiner maken

## Design-keuze nodig
Wil je de 3 kaarten gewoon kleiner/compact (minder padding, kleinere tekst), of liever een subtielere vorm zoals een horizontale rij met kleine icon+label badges?
