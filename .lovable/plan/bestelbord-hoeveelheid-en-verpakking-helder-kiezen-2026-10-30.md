# Bestelbord: hoeveelheid en verpakking helder kiezen

## Probleem
- In de invoerregel staat "1" los, met "doos 12×1 L" als grijze tekst erachter. Je ziet niet of "1" één doos, één fles of één liter is.
- Bij meerdere verpakkingen (koksroom: "6 × 1 L" of "1 L") krijg je twee gelijke knoppen met een technische vormtekst. Wat je echt krijgt (totaal, prijs per stuk) staat er niet.

## Ontwerp

### 1. De eenheid hoort bij het getal
De stepper krijgt de eenheid in het veld zelf: `[ − ]  1 doos  [ + ]`. Meervoud gaat vanzelf mee ("2 dozen", "3 flessen"). Er staat geen losse grijze verpakkingstekst meer naast.

### 2. Eén regel eronder: wat je krijgt
Direct onder de invoer staat één rustige regel die meeloopt met het aantal:

```text
1 doos = 12 × 1 L  ·  12 L totaal  ·  € 14,40
```
Prijs alleen als die bekend is, anders weglaten. De regel ververst als je het aantal wijzigt.

### 3. Verpakking kiezen: keuzekaarten in plaats van knoppen
Alleen bij meer dan één verpakking verschijnt "Bestellen per" met een segmentbalk van kaarten (stijl van de bestaande tabs, alleen de gekozen kaart gevuld, niets voorgeselecteerd):

```text
Bestellen per
+---------------------+  +---------------------+
| Doos                |  | Pak                 |
| 6 × 1 L  = 6 L      |  | 1 L                 |
| € 9,60 · € 1,60/L   |  | € 1,75 · € 1,75/L   |
| Kooyman             |  | Sligro              |
+---------------------+  +---------------------+
```
- Bovenaan groot: de eenheid waarin je telt (Doos, Pak, Fles).
- Daaronder: de inhoud en het totaal in liters, kilo's of stuks.
- Prijs per eenheid plus vergelijkprijs per L/kg/stuk, zodat je meteen ziet wat voordeliger is.
- Leverancier klein en grijs. Een geblokkeerde vorm is grijs, met "controleren".
- De stepper is uitgeschakeld en toont "kies verpakking" tot je een verpakking kiest. Wissel je van verpakking, dan wordt het aantal leeg (zoals nu).

### 4. Bewerk-lade
Hier komt hetzelfde blok: stepper met eenheid, de regel "wat je krijgt" en keuzekaarten.

### 5. Productregels op het bord
De aantal-chip toont "1 doos" en de inhoud ("12 × 1 L") staat in de tooltip. Dit blijft zoals het nu is, alleen met dezelfde meervoudsvorm.

## Wat niet verandert
Wat er wordt opgeslagen (aantal, vorm, eenheid), de bestellogica, prijzen, deadlines en de database blijven hetzelfde. Er wordt niets gepubliceerd.

## Technisch
- Nieuwe pure helper `verpakkingWeergave(vorm, aantal)` in `components/kitchen/bestelbord/verpakking.ts`. Die geeft terug: eenheidslabel (met meervoud), inhoudstekst, totaal in basiseenheid (`inhoud_basis` × aantal, g→kg en ml→L) en prijs per basiseenheid. Zonder `inhoud_basis` valt hij terug op `vorm`. Unit-test met de voorbeelden melk 12×1 L en koksroom 6×1 L tegenover 1 L.
- `Stepper` krijgt een optionele prop `eenheid` en een optionele uitgeschakelde staat. Bestaande aanroepen blijven werken.
- `VormKeuze` herschrijven naar keuzekaarten (`role="radiogroup"`, minimaal 56px hoog, tokens uit de bestaande segmentstijl). De `onKies`-logica blijft gelijk.
- Een nieuw component `VerpakkingRegel` voor de regel "wat je krijgt", gebruikt in de invoer en in de lade.
- Geen nieuwe kleuren of libraries. Bij 744px en breder blijft de structuur gelijk.
