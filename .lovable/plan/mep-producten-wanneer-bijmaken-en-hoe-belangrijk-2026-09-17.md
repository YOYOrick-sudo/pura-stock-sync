# MEP-producten: wanneer bijmaken, en hoe belangrijk

## Het probleem

Nu geldt voor élk product in de ronde dezelfde regel: ligt er minder dan de norm, dan gaat het tekort direct door. Bij een ingekocht product klopt dat. Bij een product dat je zelf maakt (aubergine, mayonaises, spreads) niet: een bakje dat nog halfvol is levert een opdracht op om een klein beetje bij te maken. Dat doet niemand — je maakt een hele batch, of je maakt niks.

Andersom wil je ook niet misgrijpen: als je pas bij "leeg" begint, sta je middenin de dienst zonder.

## De regel die we invoeren

Voor producten die je zélf maakt (bron: zelf maken, roosteren, ontdooien uit de vriescel) gaat de telstand bepalen wát er gebeurt:

| Wat ligt er | Wat gebeurt er |
|---|---|
| Vol (norm gehaald) | Niets |
| Half | Gaat op de MEP-lijst, **normale** prioriteit — mag vandaag, mag morgen |
| Bodempje of leeg | Gaat op de MEP-lijst, **belangrijk** (oranje) — vandaag maken |

Voor ingekochte producten en producten van Midsland verandert er niets: die blijven werken zoals nu (bestellen op tekort, met onderweg eraf).

## Altijd een hele batch

Een MEP-taak die uit de ronde komt krijgt niet meer het rekenkundige tekort ("0,5 bakje"), maar de normale batchgrootte van dat product: één volle bak. Op de MEP-lijst staat dan "Aubergine grillen — 1 bak" in plaats van "0,5".

Staat er al een open MEP-taak voor hetzelfde product, dan komt er geen tweede bij; wel wordt die opgewaardeerd naar belangrijk als de stand inmiddels bodempje of leeg is.

## In de praktijk

- Sluitdienst tikt "half" bij aubergine: rustige regel op de bon ("morgen bijmaken"), taak staat open op de MEP-lijst zonder oranje streep.
- Tikt "bodempje": zelfde taak, maar oranje — de kok van morgenochtend ziet meteen dat dit eerst moet.
- Overslaan blijft veilig: geen telling = geen taak.
- Als niemand de half-taken oppakt, stapelen ze niet op: dezelfde taak blijft één regel en wordt vanzelf belangrijk zodra het bakje verder leeg raakt.

## Technisch

- `src/hooks/useKoelcelCheck.ts`: `mepTaakVoorItem` krijgt een prioriteit-argument (1 = belangrijk, 2 = normaal) en een batch-aantal in plaats van het losse tekort; bij een bestaande open taak wordt de prioriteit verhoogd als de nieuwe melding zwaarder is. `meldOp` geeft de gemeten stand door.
- `src/components/foh/VoorraadRonde.tsx`: voor items met bestemming MEP wordt het tekort omgezet naar "bijmaken ja/nee + prioriteit" op basis van de vulstand (half = normaal, bodempje/leeg = belangrijk); halfvolle bakjes van ingekochte producten blijven zoals ze zijn. Bonregel toont "bijmaken (vandaag)" of "bijmaken (mag morgen)".
- Geen databasewijziging nodig: `mep_taken.prioriteit` bestaat al met 1/2.
