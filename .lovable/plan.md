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

## Technisch
- `src/components/foh/BainMarie.tsx` (`BainMarieSluit`): `kanPrinten` wordt `status === 'ok'` (dus alleen dag 1–4). Bij `laatste-dag` komt de tekst "opmaken of weggooien" in oranje; bij `te-oud` blijft "weggooien" in rood.
- Infotekst achter het info-icoon bij de sluitlijst een zin aanpassen: op dag 5 print je geen sticker meer, dan moet de bak op of weg.
- Geen database-wijzigingen, geen nieuwe libraries.

## Verificatie
- Sluitlijst met een bak op dag 1: printknop zichtbaar en print zoals nu.
- Sluitlijst met een bak op dag 5: geen printknop, oranje "opmaken of weggooien".
- Sluitlijst met een bak ouder dan 5 dagen: geen printknop, rood "weggooien".
