# Product toevoegen: altijd zichtbaar, geen zoekveld

## Wat verandert
- Het veld "Zoeken in deze lijst" verdwijnt.
- De knop "Product toevoegen" en de inklapbare invoer ("Welk product wil je bestellen?" + "Sluiten") verdwijnen.
- Bovenaan de lijst op het bord staat altijd één invoerregel: een plus-icoon, het veld "Product toevoegen…", en pas na typen het aantal (− 1 +), de verpakking en de groene knop "Toevoegen".
- Tijdens het typen komen de bekende producten eronder als keuzes (zoals nu). Enter of tikken op een keuze voegt toe.
- De snelkeuzes "eerder besteld" blijven als chips onder de invoerregel.
- De filter "Geen prijs" via de overzichtskaart blijft werken.

## Wat blijft gelijk
Toevoegen, verpakkingskeuze, aantallen, bestellen, prijzen, deadlinebadges, tabs, Onderweg en Tellen. Geen database-wijzigingen, niets publiceren.

## Praktijk
- Wie snel één product in een lange lijst wil vinden, scrolt nu per leverancier in plaats van te zoeken. Typen in het invoerveld laat wel zien of het product al op het bord staat (bestaand gedrag bij dubbele invoer blijft gelijk).

## Technisch
Alleen `src/pages/kitchen/Bestelbord.tsx`: ZoekVeld en de toevoegknop eruit, `zoek` blijft leeg (filterlogica onaangeroerd), `invoerOpen` altijd waar en de kop met Sluiten weg, placeholder "Product toevoegen…" met Plus-icoon. Mutaties en payloads ongewijzigd.
