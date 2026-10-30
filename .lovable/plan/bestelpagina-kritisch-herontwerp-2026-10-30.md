# Bestelpagina: kritisch herontwerp

## Wat er nu mis is
1. **Dubbele navigatie**: de overzichtskaarten en de tabs eronder tonen hetzelfde (Op het bord 6, Advies 2, Onderweg 21). Het inklapbare "Overzicht" kost alleen een extra tik.
2. **Geen duidelijk startpunt**: tabs, invoer, kolomkoppen en groepskoppen hebben allemaal ongeveer hetzelfde gewicht, dus je oog weet niet waar te beginnen.
3. **Te veel waarschuwingen in oranje**: "Geen prijs", "Controleer verpakking" en de oranje Onderweg-kaart vechten om aandacht, dus niets valt meer echt op.
4. **Tabelkoppen zonder nut**: "Besteld / Product / Aantal / Prijs" herhalen wat je al ziet.
5. **"Leverancier onbekend" tussen de echte leveranciers**: een probleemgroep die eruitziet als een normale leverancier.
6. **Kleine vinkcirkel links, menu rechts**: het belangrijkste (besteld afvinken) is het kleinste element.

## Nieuwe opbouw (van boven naar beneden)
```text
[ Op het bord 6 | Advies 2 | Tellen | Onderweg 21 • ]     [! 5 zonder prijs]
[ +  Product toevoegen…                                              ]
---------------------------------------------------------------
Boer & Chef   vóór 21:00                          1 · € —
  ( )  Sinaasappel (pers)                    1 doos        ⋯
Kooyman       vóór 20:30                          3 · € 64,45
  ( )  Guacamole Western 2 kg                1 stuks  € 17,78  ⋯
  ...
---------------------------------------------------------------
! Leverancier kiezen (2)          ingeklapt, onderaan
  Kokosdrink jumbo, Falafel
---------------------------------------------------------------
6 producten                                         € 81,40
```

## Concreet
- **Overzichtskaarten en inklapblok weg.** De tabs zijn de enige navigatie.
- **"Geen prijs"** wordt één klein knopje rechts naast de tabs, alleen als er iets zonder prijs is (tik = filter aan/uit). Per rij geen "Geen prijs"-badge meer, alleen een rustig streepje.
- **"Te checken" bij Onderweg** wordt een oranje stip in de tab, geen aparte tekst.
- **Invoerregel** blijft altijd zichtbaar als eerste element op het bord, wit vlak, duidelijk de hoofdactie.
- **Kolomkoppen weg.** Elke rij: groot vinkvak links (44px), naam, aantal + eenheid op één regel, prijs, "⋯".
- **Leverancierskop** iets sterker (vet, lichte achtergrond), met deadline, aantal en subtotaal op één lijn.
- **"Leverancier onbekend"** heet "Leverancier kiezen", komt altijd onderaan, is ingeklapt en heeft een oranje icoon: dat is het enige echte actiepunt.
- **"Controleer verpakking"** wordt een klein oranje icoon naast de naam (uitleg in de tooltip), geen badge van twee regels meer.
- **Totaalregel** onderaan blijft de enige plek voor het totaalbedrag.

## Wat blijft gelijk
Toevoegen, bestellen, aantallen, verpakkingskeuze, bewerkweergave, prijzen, deadlinebadges, Advies, Tellen en Onderweg-logica, de bot. Geen database, niets publiceren. Desktop, iPad en telefoon krijgen dezelfde opbouw.

## Technisch
- `Bestelbord.tsx`: InklapGroep + BestelKengetallen weg (bestand verwijderen), knop "zonder prijs" naast de TabsList, warning-stip in de Onderweg-trigger, groep onbekend apart onderaan in een InklapGroep.
- `CompacteTabel.tsx`: kop optioneel (`zonderKop`), voor Bord en Onderweg gebruikt.
- `BordTabel.tsx` / `RegelInfo.tsx`: verpakkingswaarschuwing als icoon met tooltip, geen prijsbadge, aantal op één regel.
- `presentatie.ts` (perLeverancier): onbekend altijd als laatste groep.
- Mutaties, payloads en berekeningen ongewijzigd; tests en de build draaien na afloop.
