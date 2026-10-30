# Bestellijst: rijen zoals in Mise-en-place

## Wat er nu misgaat
- **De kolommen staan op de verkeerde plek.** Sinds de kolomkoppen weg zijn, verdeelt de tabel de breedte gelijk: het vinkje zweeft in het midden, de naam begint ver naar rechts, het menu staat los van de rand en het rechterdeel is leeg. Dat komt door hoe ik de koppen verborg, niet door het ontwerp.
- **Leverancierskop en rijen lopen niet gelijk**: het subtotaal staat helemaal rechts, de rijprijs een stuk ervoor.
- **Twee manieren om een rij af te ronden**: een tabel op Bestelbord, maar losse rijen in Mise-en-place. Op de keuken-iPad voelt dat als twee verschillende apps.

## Wat in de app al goed werkt
Mise-en-place (MEP) gebruikt een rustige lijst: groot vinkvak links, naam ernaast, rechts één getal en een menu, dunne scheidingslijnen en een kop per groep. Teams kennen dat ritme al. Daar sluit Bestelbord op aan.

## Nieuwe rij (vaste opbouw, overal gelijk)
```text
Kooyman  (klok) vóór 20:30                              3   € 64,45
 [ ]  Guacamole Western 2 kg                 1 stuks     € 17,78   ⋯
 [ ]  Hüttenkäse 400 g                       1 doos      € 24,08   ⋯
```
- **Vinkvak 44px tegen de linkerrand**, de naam direct ernaast, die neemt alle ruimte.
- **Rechts vaste smalle kolommen**: aantal, prijs, menu, strak tegen de rechterrand, uitgelijnd met het subtotaal in de leverancierskop.
- **Afgevinkt**: rij wordt gedimd met een groene vink (zoals MEP), daarna gaat hij naar Onderweg zoals nu.
- **Leverancierskop**: naam vet, deadlinebadge, rechts aantal en subtotaal in dezelfde kolommen als de rijen.
- **Telefoon**: zelfde rij; de prijs gaat onder de naam (zoals nu), zodat aantal + menu rechts passen.
- Onderweg en Geleverd krijgen dezelfde rij-opbouw.

## Wat blijft gelijk
Afvinken, bewerken, vervallen, bedragen, deadlines, invoerregel, tabs, Advies en Tellen. Geen database, niets publiceren.

## Controle
Deze keer kijk ik op 1496px, iPad (744px) en telefoon (390px) zelf in de preview, zodat ik kan zien hoe het staat. Als inloggen weer "Geen toegang" geeft, toon ik de lijst met nepregels op een losse testpagina in /tmp (niet in de app) om de kolommen te zien.

## Technisch
- `CompacteTabel.tsx`: geen `sr-only`-kop meer; vaste breedtes via `<colgroup>` (vink 44px, product auto, aantal 6rem, prijs 6rem / 0 op telefoon, menu 44px), kop alleen tonen als het nodig is (Advies).
- `GroepRij` krijgt de bedragen in dezelfde kolom als de rijprijs (colSpan aanpassen, alleen in Bestelbord-gebruik).
- `BordTabel.tsx` / `OnderwegTabel.tsx`: celpadding links 0 voor het vinkvak, afgevinkte rij `text-muted-foreground`.
- Mutaties, payloads en berekeningen ongewijzigd; tests draaien.
