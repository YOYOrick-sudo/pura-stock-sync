# Au bain-marie: dag 5 = niet meer bewaren bij sluit

## Probleem
Een bak gaat maximaal 5 dagen mee. In de sluitlijst kan je nu óók op dag 5 ("laatste dag") nog een sticker printen. Die bak zou dan de koeling in gaan en morgen (dag 6) weer op tafel komen — en dat mag niet. De sluitlijst vertelt nu niet wat ermee moet gebeuren.

## Oplossing
In de sluitlijst geldt per product:

| Status van de bak | Wat de sluitlijst toont |
|---|---|
| Dag 1 t/m 4 | Knop "Sticker" (zoals nu) |
| Dag 5 (laatste dag) | Géén printknop. In plaats daarvan oranje tekst: **"vandaag opmaken of weggooien"** |
| Ouder dan 5 dagen | Géén printknop. Rode tekst: **"weggooien"** (zoals nu) |

Zo is het bij het afsluiten per product meteen duidelijk: sticker plakken en bewaren, óf de bak niet meenemen naar morgen.

## Extra: ook in de open-lijst zichtbaar
De ochtendlijst toont bij dag 5 al oranje "laatste dag" en bij ouder dan 5 dagen rood "weggooien" — dat blijft zo, dat klopt al.

## Extra: ontdooid-datum van de zak (alleen Kip)
De kip komt uit een gevacumeerde zak uit de vriezer; die zak ligt met een ontdooi-sticker in de koelcel en heeft dus zijn eigen datum. Die datum hoort ook op de bak-sticker.

Zo houden we het simpel:

- **Alleen bij "Vandaag (nieuw)"**: wie een nieuwe bak start, maakt op dat moment ook de zak open. Na het tikken op "Vandaag" verschijnt er direct één extra vraag onder de knoppen: **"Datum op de zak?"** met dezelfde dagknoppen (de datum staat op de ontdooi-sticker van de zak). Eén tik, klaar.
- **Bij gewone dagen (ma, di, …) geen extra vraag.** De bak gaat door, de zak blijft dezelfde, dus er verandert niets.
- **Nieuwe zak op een later moment?** Dan is feitelijk de inhoud van de bak ververst: tik opnieuw "Vandaag (nieuw)" en geef de nieuwe zak-datum op. De app overschrijft de oude registratie, er is nooit dubbele of verouderde data.
- Alleen voor **Kip** (en later andere producten met een vriezer-zak). Vissoep, Tomyum en Ei komen niet uit een vrieszak en krijgen de vraag dus nooit — geen ruis voor producten waar het niet geldt.
- De datum wordt mee onthouden in dezelfde registratie als de bak, dus hij kan nooit "weg" zijn bij een volgende dienst.

De houdbaarheid blijft gewoon 5 dagen vanaf de bak-start; de ontdooid-datum is informatie op de sticker, geen extra rekenregel.

## Hoe ziet de sticker eruit
Eigen stickertype op de bestaande labelprinter (57×32 mm), zelfde uiterlijk als de ontdooi- en bereid-stickers:

```text
┌──────────────────────────────┐
│ ▓▓▓▓▓  BAIN-MARIE  ▓▓▓▓▓▓▓ │  ← zwarte balk
│                              │
│ Kip                          │  ← productnaam, groot
│                              │
│ Bak van: wo 17/09            │
│ Gebruiken t/m: di 22/09      │
└──────────────────────────────┘
```

- Het is dus géén "Bereid"-sticker (die zou een verkeerde indruk geven: de bak is niet vandaag gemaakt), maar een herkenbare eigen kop "BAIN-MARIE".
- Eerste regel wordt nu nog als "Bereid: …" afgedrukt; dat wordt **"Bak van: …"** — dat is precies wat de volgende dienst moet weten.
- Tweede regel "Gebruiken t/m" is startdatum + 5 dagen, dus de datum waarop hij weg moet.

## Technisch
- `src/components/foh/BainMarie.tsx` (`BainMarieSluit`): `kanPrinten` wordt `status === 'ok'` (dus alleen dag 1–4). Bij `laatste-dag` komt de tekst "opmaken of weggooien" in oranje; bij `te-oud` blijft "weggooien" in rood.
- `src/lib/labelZpl.ts`: voor type `bain` wordt het eerste datumlabel "Bak van" in plaats van "Bereid".
- Infotekst achter het info-icoon bij de sluitlijst een zin aanpassen: op dag 5 print je geen sticker meer, dan moet de bak op of weg.
- Geen database-wijzigingen, geen nieuwe libraries.

## Verificatie
- Sluitlijst met een bak op dag 1: printknop zichtbaar en print zoals nu.
- Sluitlijst met een bak op dag 5: geen printknop, oranje "opmaken of weggooien".
- Sluitlijst met een bak ouder dan 5 dagen: geen printknop, rood "weggooien".
