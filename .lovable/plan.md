# Sausflessen op het werkblad — één check bovenaan de ronde

## Wat er nu staat
In de reservelade Midden onder staat één regel "Mayonaises (flessen bijvullen)". Dat klopt niet met de praktijk: de flessen staan op het werkblad, niet in een lade.

## Wat het wordt
Bovenaan de koelwerkbank-route, vóór Links boven, komt één blokje **"Flessen op het werkblad"** met één check:

> Staat elke fles nog op minstens de helft?

- **Ja** → klaar, niets te doen.
- **Nee, eentje moet bijgevuld** → komt op de aanvulbon als "Sausflessen bijvullen". Is de bak in de koelcel op, dan rolt het zoals afgesproken door naar de MEP: West maakt zelf nieuwe mayonaise.

Per fles apart tellen doen we nu bewust nog niet — eerst één simpele check. Zodra je merkt dat je wil weten wélke fles, splitsen we hem later per soort; de regel is daar al op voorbereid.

## In de praktijk
- Je begint de ronde bij het werkblad (je staat er toch), daarna pas de lades. Eén tik, twee knoppen, grote tikdoelen.
- Vergeet iemand het: de check blijft gewoon open staan zoals elke andere regel, er verdwijnt niets.
- De regel uit Midden onder verdwijnt daar, dus die lade wordt korter en klopt weer met wat er echt ligt.

## Risico
Klein. De reservelade-logica (starten op 0, "−1 voor de werkbank") raakt deze regel niet meer, want het werkblad is geen reservelade. Bestaande tellingen blijven bewaard.

## Technisch
- Nieuwe rij in `voorraad_lades`: naam "Flessen op het werkblad", plek `werkbank`, vestiging West, rol `werk`, volgorde 5 (vóór Links boven op 10), buiten het 3×3-raster.
- `koelcel_check_items` regel `06a50a18-…` (Mayonaises (flessen bijvullen)) verhuist naar die groep: `lade_id` naar de nieuwe rij, naam → "Sausflessen (minstens halfvol?)", `doel_aantal` 1, `reserve_doel` 0, bron blijft `zelf_west` (tekort → MEP). Geen nieuwe of dubbele koelcelregels.
- `VoorraadRonde.tsx`: lades zonder rij/kolom in het raster krijgen als subtitel "op het werkblad" in plaats van een positielabel; `positieLabel` en de 3×3-weergave op /settings/koelwerkbank moeten deze groep overslaan zonder lege plek in het raster.
- Verifiëren met Playwright op West: de groep staat bovenaan, tik "nee" → regel komt op de aanvulbon, ketenchip wijst naar de MEP.
