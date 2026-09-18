# Koelwerkbank: eieren naar Rechts onder + lade als visueel patroon

## Huidige stand (gecontroleerd)
- **Gekookte eieren (bio)** ligt nu in lade **Links boven** (volgorde 200) → moet naar **Rechts onder**.
- Lade **Links boven** bevat al exact de juiste 7 producten in de juiste volgorde (401–407): oesterzwam, gesneden paprika, avocado, blauwe bes, granaatappelpitjes, rode peper, zoetzure gember. Geen datawijziging nodig.
- De beheerpagina `/settings/koelwerkbank` (LadeGrid) toont producten nu als gestapelde rijen op volle breedte — er is geen visueel ladepatroon.

## Wat we doen

### 1. Data: eieren verhuizen
- `koelcel_check_items`: "Gekookte eieren (bio)" → `lade_id` = Rechts onder (`c32af5d9-a6c5-4c71-adf8-4d669c0d485d`), volgorde 215 (naast eimengsel, waar het hoort).
- Via bestaande migratie-flow. Niets wordt verwijderd.

### 2. Weergave: lade als echt indelingspatroon
In `src/components/voorraad/LadeGrid.tsx` (LadeVak):
- Producten binnen een lade komen in een mini-raster van **6 kolommen**.
- De eerste 4 producten krijgen elk 3 kolommen → **2 naast elkaar per rij**.
- Vanaf het 5e product krijgt elk 2 kolommen → **3 kleinere cards naast elkaar**, die precies uitlijnen met de twee rijen erboven.
- Resultaat voor Links boven:
```text
┌─────────────┬─────────────┐
│ oesterzwam  │ gsnd paprika│
├─────────────┼─────────────┤
│ avocado     │ blauwe bes  │
├────────┬────────┬─────────┤
│gran.app│rode pep│ gember  │
└────────┴────────┴─────────┘
```
- Slepen (drag & drop) naar een lade blijft zoals nu; alleen de weergave binnen het vak verandert.

## Praktijkcheck
- Wie: degene die de werkbank indeelt of controleert, op de iPad in de keuken.
- Risico: laag. Alleen volgorde/weergave; tellingen, MEP-logica en aanvulbonnen volgen `lade_id` en blijven werken.
- Andere lades krijgen hetzelfde patroon (2 per rij, rest vanaf 5e als 3 per rij) — dat leest overal hetzelfde.

## Technische details
- Migratie: één `UPDATE` op `koelcel_check_items` (id `ee69c05b-368b-43af-b39f-1d108f840c7c`).
- `LadeGrid.tsx`: in `LadeVak` de `space-y-1.5`-lijst vervangen door `grid grid-cols-6 gap-1.5`; per item `col-span-3` (index 0–3) of `col-span-2` (index ≥ 4). SleepbaarProduct blijft ongewijzigd.
- Verificatie: typecheck + in de preview controleren dat Links boven het patroon toont en Gekookte eieren onder Rechts onder staat.
