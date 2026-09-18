# Reservelade links onder: kiemen, tomaatjes en de juiste route

Lente-ui en peterselie kloppen al — die gaan naar de mise-en-place. Voor de kiemen en de tomaatjes klopt het nog niet.

## Wat er verandert

**1. Kiemen worden één bakje**

De drie losse regels (ertasperge, greenpeez, chine rose) verdwijnen uit de lade en worden samen één regel: **Kiemen — 1 bakje GN 1/6 hoog**. Geen vier reservebakjes meer; je kijkt of het bakje er staat en of het vol is.

Is het bakje leeg of onder de norm, dan komt er een taak op de mise-en-place: **"Kiemen bakje vullen"**. De pakken zelf krijgen een eigen telregel in de koelcel — **Kiemen (pakken), 2 pakken op peil, bestellen vanaf 1** — zodat een tekort daar vanzelf op het bestelbord komt.

**2. Tomaatjes gaan eerst door het mes**

Het bakje tomaatjes in de lade zegt nu "bijvullen uit de koelcel", maar in het witte emmertje liggen hele tomaatjes. Het bakje wordt dus niet bijgevuld maar gesneden. Het bakje in de lade krijgt herkomst **snijden**: onder de norm = taak "Tomaatjes snijden" op de mise-en-place (bodempje of leeg = vandaag, half = mag morgen). Het witte emmertje blijft een eigen telregel in de koelcel en gaat bij een tekort naar het bestelbord, zoals nu.

**3. Lente-ui en peterselie**

Blijven ongewijzigd — die staan al goed op de MEP.

## In de praktijk

De reservelade wordt korter: lente-ui, peterselie, tomaatjes en kiemen — vier bakjes in plaats van zes. Bij elk bakje dat leeg is zie je "op de MEP" en staat de taak morgenochtend klaar. Wat er ingekocht moet worden (pakken kiemen, emmertje tomaatjes) tel je in de koelcelronde, niet in de lade.

Let op: de drie kiemsoorten verdwijnen als losse regels. Wil je later per soort tellen, dan kunnen we ze weer splitsen; de oude regels worden gearchiveerd, niet verwijderd.

## Technisch

- Migratie/data: werkbankregels `Kiemen greenpeez` en `Kiemen chine rose` op `actief = false`; `Kiemen ertasperge` wordt hernoemd naar `Kiemen`, `reserve_doel = 0`, `doel_aantal = 1`, `vulnorm = 'vol'`, `bron = 'zelf_west'`, `batch_aantal = 1`, `product_sleutel = 'kiemen'`, GN 1/6 hoog blijft.
- Nieuwe koelcelregel `Kiemen (pakken)`, `product_sleutel` leeg (geen ketenkoppeling), `bron = 'koelcel_inkoop'`, `doel_aantal = 2`, `bestelpunt = 1`, `bestel_eenheid = 'pak'`, categorie "Groente & fruit", volgorde 504.
- Werkbankregel `Tomaatjes`: `bron = 'snijden'`, `batch_aantal = 1`, `product_sleutel` leeg zodat de keten niet meer naar het emmertje wijst; koelcelregel `Tomaatjes (wit emmertje)` krijgt `product_sleutel = 'verse-tomaatjes'` en blijft verder gelijk.
- Geen codewijziging nodig: het chipje "op de MEP" en de prioriteitsregel (half = morgen, bodempje/leeg = vandaag) werken al zo sinds de vorige wijziging.

## Testen

West → Sluiten → Keuken → Voorraadronde → Links onder: vier bakjes; kiemen op "leeg" en tomaatjes op "bodempje" geven "op de MEP" met taken voor vandaag; koelcelronde toont "Kiemen (pakken)" en "Tomaatjes (wit emmertje)" als eigen telregels.
