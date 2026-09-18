# Au bain-marie rustiger + info-icoon als standaard

## Wat er nu niet klopt

- Drie regels uitleg boven de lijst, terwijl de takenlijst elders een klein info-icoon gebruikt.
- "Vandaag (nieuw)" is altijd groen gekleurd, ook als je niets hebt gekozen. Samen met de echte keuze (ma) lijkt het alsof er twee dagen aanstaan.
- Het blok voelt zwaarder dan de taken eromheen: eigen kader, dikke kop, eigen kleurvlakken.

## Wat er verandert

**Geen standaardselectie meer**
Alle dagknoppen zien er hetzelfde uit tot je er één aantikt. Alleen de aangetikte dag wordt groen gevuld. "Vandaag (nieuw)" krijgt geen voorkeurskleur meer — niets is vooraf gekozen, je moet altijd zelf tikken.

**Uitleg achter een info-icoon**
De uitleg verdwijnt uit beeld en komt achter hetzelfde info-icoon als bij taken (rond vierkantje, primair groen, 26px). Eén tik toont de korte uitleg, tik ernaast sluit hem. Geldt voor zowel het ochtendblok als het sticker-blok in de sluitlijst.

**Rustiger in de lijst**
- Kop kleiner en in dezelfde stijl als de sectiekoppen van de takenlijst, in plaats van een eigen zware kaartkop.
- Per product één regel: naam links, status rechts, dagknoppen eronder. Geen extra kleurvlak per product, alleen een dunne scheidingslijn.
- Statusregel korter: "ma · dag 5/5" met een subtiele kleur; alleen laatste dag (oranje) en te oud (rood) springen eruit.
- Sluitlijst-blok krijgt dezelfde rustigere opmaak: naam, korte status, printknop; uitleg achter het info-icoon.

**Systeemstandaard**
Vaste regel voor de hele app: losse uitlegtekst boven een blok wordt een info-icoon naast de kop. In beeld blijft alleen wat je nodig hebt om te handelen. Dit leg ik vast als projectafspraak, zodat nieuwe blokken er meteen zo uitzien.

## Praktijk

Het team ziet 's ochtends alleen de vier producten met vijf gelijke dagknoppen. Wie niets aantikt heeft die dag geen bak — er staat nooit per ongeluk een datum klaar. Wie de uitleg nodig heeft (nieuw teamlid) tikt het info-icoon. Op de iPad blijven alle knoppen 44px.

## Technisch

- `src/components/foh/BainMarie.tsx`: dagknop-styling terug naar één neutrale variant + één gekozen variant (offset-0-uitzondering weg); uitlegtekst vervangen door een `InfoKnop`; compactere rij-opmaak in `BainMarieOpen` en `BainMarieSluit`; `statusRegel` korter.
- Nieuw klein component `src/components/foh/InfoKnop.tsx`: 26px knop met `Info`-icoon, popover met korte tekst, dezelfde tokens/styling als de info-knop in `FohTasks.tsx`. Herbruikbaar voor volgende blokken.
- Geen databasewijzigingen, geen nieuwe libraries, printflow ongewijzigd.
- Projectafspraak "uitleg achter info-icoon" wordt als geheugenregel opgeslagen.
