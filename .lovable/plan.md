# Gerechten filteren op "moet vrij zijn van"

Aan de bar vraagt een gast: "iets zonder lactose en zonder gluten". Nu moet je zelf alle rijen aflopen. Straks tik je twee chips aan en houd je alleen de gebakjes over die het niet bevatten.

## Is dit intuïtief?

Ja, mits één ding klopt: aanvinken van "Gluten" mag niet betekenen "toon gerechten mét gluten". Daarom staat het filter in een eigen blok met de kop **Moet vrij zijn van** en heten de chips actief "Zonder gluten", "Zonder zuivel". Zo lees je letterlijk wat je doet. Het zoekveld blijft daarnaast bestaan voor "waar zit noten in".

## Wat je krijgt

- Onder de zoekbalk een blok **Moet vrij zijn van** met dezelfde allergeenchips als in het bewerkscherm (Gluten, Zuivel, Ei, Pinda's, Sesam, Soja, Walnoot, Amandel, Hazelnoot, Pistache, Haver, Suiker) plus een aparte chip **Vegan** ("moet vegan zijn").
- Aangetikte chip wordt duidelijk actief en krijgt het woord "Zonder" ervoor. Grote tikdoelen (44px), werkt op tablet met natte handen.
- Zodra er één of meer chips aanstaan:
  - de lijst toont alleen gerechten die géén van die labels hebben;
  - bovenaan een regel: "3 gerechten zonder gluten en zuivel" met een knop **Wis filter**.
- **Nog te controleren**-gerechten worden nooit stilzwijgend als veilig getoond. Die vallen uit de veilige lijst en komen eronder in een apart blok "Niet te garanderen — eerst navragen in de keuken", met de oranje markering die er al is. Zo geef je nooit per ongeluk een verkeerd antwoord aan een gast.
- Op smalle schermen (telefoon) staan de chips in twee regels met horizontaal scrollen niet nodig; ze wrappen gewoon.
- De regel onderaan ("Bij twijfel is het productetiket of de keuken leidend") blijft staan en wordt bij een actief filter iets nadrukkelijker getoond.

## In de praktijk

- Wie: bediening aan de bar, midden in een gesprek, op telefoon of tablet. Twee tikken tot antwoord.
- Wat verandert er: niets aan de invoer. De keuken blijft de labels bijhouden in hetzelfde bewerkscherm; het filter leest alleen wat er al staat.
- Risico: een gerecht met onvolledige labels lijkt "vrij van". Dat vangen we af met het aparte blok voor niet-gecontroleerde gerechten en met de vaste waarschuwingszin. Labels die ontbreken blijven een keukenverantwoordelijkheid — het filter maakt zichtbaar waar dat nog niet klopt.
- Over een maand: specials wisselen; het filter werkt automatisch mee, gearchiveerde gerechten blijven buiten beeld tenzij je ze toont.

## Technisch

Alleen frontend, geen databasewijziging.

- `src/pages/kitchen/Gerechten.tsx`: state `zonder: Set<GerechtLabel>` en `alleenVegan: boolean`. Filterlogica in de bestaande `useMemo` naast de zoekterm: een gerecht valt af als `labels` een van de aangevinkte codes bevat; met `alleenVegan` moet `vegan` juist aanwezig zijn. Gefilterde resultaten worden gesplitst in `gecontroleerd === true` (veilige lijst, bestaande groepsindeling standaard/specials) en `gecontroleerd === false` (apart blok onderaan, alleen zichtbaar bij actief filter).
- Nieuwe presentational component `src/components/kitchen/AllergeenFilter.tsx` voor het chipsblok, gebruikt `GERECHT_LABEL_CODES`, `GERECHT_LABEL_NAAM` en `GERECHT_LABEL_SOORT` uit `src/lib/gerecht-labels.ts`. Bestaande design-tokens, `aria-pressed` per chip, geen nieuwe libraries.
- Geen wijziging aan `useGerechten.ts` of `GerechtDialog.tsx`.
