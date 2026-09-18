# Sausflessen op het werkblad — één check bovenaan de ronde

## Wat er nu staat
In de reservelade Midden onder staat één regel "Mayonaises (flessen bijvullen)". Dat klopt niet met de praktijk: de flessen staan op het werkblad, niet in een lade.

## Wat het wordt
Bovenaan de koelwerkbank-route, vóór Links boven, komt één blokje **"Flessen op het werkblad"** met één check:

> Staat elke fles nog op minstens de helft?

- **Ja** → klaar, niets te doen.
- **Nee** → je tikt aan welke fles(sen) het zijn (chimichurri, zeewier-algen, knoflook-kurkuma; lijst is later uit te breiden). Meerdere aanvinken mag.

Wat er dan gebeurt:
- De aangetikte flessen komen als losse regels op de aanvulbon: "Chimichurrimayonaise — fles bijvullen uit de koelcel".
- Dit is werk voor **dezelfde dienst**: het staat als taak in de lijst tot iemand het afvinkt, niet als bestelling voor morgen.
- Is de bak in de koelcel op, dan rolt het door naar de MEP: West maakt zelf nieuwe mayonaise.

## In de praktijk
- Je begint de ronde bij het werkblad (je staat er toch), daarna de lades. Grote tikdoelen, twee knoppen en daarna hooguit drie vinkjes.
- Vergeet iemand het: de check blijft open staan zoals elke andere regel, er verdwijnt niets.
- De regel uit Midden onder verdwijnt daar, dus die lade klopt weer met wat er echt ligt.

## Risico
Klein. De reservelade-logica (starten op 0, "−1 voor de werkbank") raakt deze regel niet meer: het werkblad is geen reservelade. Bestaande tellingen blijven bewaard.

## Technisch
- Nieuwe rij in `voorraad_lades`: naam "Flessen op het werkblad", plek `werkbank`, vestiging West, rol `werk`, volgorde 5 (vóór Links boven op 10), buiten het 3×3-raster.
- `koelcel_check_items` regel `06a50a18-…` verhuist naar die groep als kopregel "Sausflessen (minstens halfvol?)", `doel_aantal` 1, `reserve_doel` 0.
- Per fles een eigen regel in dezelfde groep (`chimichurrimayonaise`, `zeewiermayonaise`, `knoflook-kurkumamayonaise`), formaat `fles`, `doel_aantal` 1, bron `zelf_west`, zodat tekort via de bestaande keten naar de koelcelbak en daarna naar de MEP gaat. Geen dubbele koelcelregels: de bestaande koelcel-bakregels blijven de enige voorraadregels.
- De flesregels tonen alleen wanneer de kopcheck op "nee" staat; anders blijven ze ingeklapt (bestaande overslaan/uitklap-logica in `VoorraadRonde.tsx`).
- Aanvulbonregels van deze groep krijgen het label "vanavond nog" zodat duidelijk is dat het deze dienst gebeurt.
- `VoorraadRonde.tsx` + /settings/koelwerkbank: lades buiten het 3×3-raster krijgen subtitel "op het werkblad" en worden in het rasteroverzicht overgeslagen zonder lege plek.
- Verifiëren met Playwright op West: groep staat bovenaan, "nee" → flessen aanvinkbaar → regels op de aanvulbon met ketenchip richting MEP.
