# Hüttenkäse naar Midden onder, brood aanvullen met FIFO-herinnering

Drie dingetjes in de voorraadronde van West die nu niet kloppen met de keuken.

## 1. Hüttenkäse: reservelade Midden onder, bijvullen uit de koelcel

Nu staat hüttenkäse als werkbakje in Rechts onder en is er geen koelcel-voorraadregel — een tekort zou daarom richting het bestelbord wijzen.

- Het hüttenkäse-bakje verhuist naar de reservelade **Midden onder**, naast de kokosyoghurt (die al goed staat: bijvullen uit de koelcel).
- Er komt een telregel **Hüttenkäse (pakken)** in de koelcel-ronde, zodat de keten klopt: bakje op → bijvullen uit de koelcel → is de koelcelvoorraad te laag, dan rolt het door naar het bestelbord.
- In de ronde toont hij daardoor voortaan **"bijvullen"** en start hij op 0, zoals elke reservelade.

## 2. Broodbakken: aanvullen, met de broodmand als eerste stap

Nu wijst een tekort bij de broodbakken (pita, brioche, deugniet) meteen naar het bestelbord, terwijl je in de praktijk eerst de broodmand in de zaak leegt en daarna pas de vriescel pakt.

- Er komt een telregel **Broodbakken** in de vriescel-ronde (daar ligt de echte reserve; de broodmand in de zaak is geen telplek).
- De keten wordt: werkbak leeg → **bijvullen** (eerst broodmand, anders vriescel) → vriescel onder norm → bestelbord.
- De vriescelregel telt gewoon mee in de bestaande vriescel-ronde; niets dubbels.

## 3. FIFO-herinnering op de aanvulbon

Brood gaat over datum, dus bij brood staat op de aanvulbon voortaan een vaste herinnering:

> **Broodbakken — aanvullen (oudste bakken eerst gebruiken, FIFO)**

- Dit wordt een algemene mogelijkheid: per product kun je een korte bon-opmerking instellen. Nu alleen gebruikt voor brood; later ook bruikbaar voor bijvoorbeeld "even doorroeren" of "op kamertemperatuur laten komen".

## In de praktijk

- Keuken West, iPad, sluitronde. Hüttenkäse staat logisch bij de kokosyoghurt in Midden onder; de teller van de koelcel-ronde gaat één regel omhoog (hüttenkäse-pakken).
- De vriescel-ronde krijgt er één regel bij (broodbakken).
- Bestaande tellingen, lades en ketens blijven bewaard; de verhuizing van hüttenkäse is een lade-wijziging, geen nieuwe regel.

## Technisch

- `koelcel_check_items` hüttenkäse (id `bb4a29e3-…`): `lade_id` → Midden onder (`0bf27550-…`), `reserve_doel` 1.
- Nieuwe koelcel-regel `Hüttenkäse` (West, plek koelcel, type koelcel, bron `koelcel_inkoop`, formaat pak, doel 2, bestelpunt 1, zelfde `product_sleutel` als het werkbank-bakje).
- Nieuwe vriescel-regel `Broodbakken (pita, brioche, deugniet)` (West, plek vriezer, type vriezer, bron `koelcel_inkoop`, doel 1, zelfde `product_sleutel` als de werkbank-regel `broodbakken-pita-brioche-deugniet-`).
- Migratie: kolom `bon_notitie text null` op `koelcel_check_items`; bij brood: "Oudste bakken eerst gebruiken (FIFO)". Aanvulbon in `VoorraadRonde.tsx` toont `bon_notitie` als kleine grijze regel onder de productregel.
- Logregel in `migratie_logboek` voor de verhuizing en de nieuwe regels.

## Risico's

Klein. De koelcel- en vriescel-ronde krijgen elk één regel erbij — het team ziet dat de eerste avond. De werkbank-keten bevat de vriescel al, dus er is geen codewijziging aan de ketenlogica nodig.

## Testen

West → Sluiten → Voorraadronde: hüttenkäse staat in Midden onder met chip "bijvullen"; hüttenkäse op bodempje → bonregel "bijvullen uit de koelcel"; broodbakken op bodempje → bonregel met FIFO-herinnering en ketenchip richting vriescel.
