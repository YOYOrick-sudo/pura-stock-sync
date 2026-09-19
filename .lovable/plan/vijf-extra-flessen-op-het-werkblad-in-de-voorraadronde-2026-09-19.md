# Vijf extra flessen op het werkblad in de voorraadronde

Het blokje **Flessen op het werkblad** bovenaan de koelwerkbank-route krijgt vijf regels erbij, naast de bestaande knoflook-kurkumamayonaise:

- Gochujangmayonaise
- Ketchup
- Tahinidressing
- Agavesiroop
- Maplesiroop

## Hoe het werkt in de ronde

Precies zoals de knoflook-kurkumafles nu werkt:

- Elke fles is een eigen regel met de bekende keuzes: vol / half / bodempje — vol is het doel, niets aantikken betekent "ligt er goed bij".
- Staat een fles op "bodempje" (of tel je lager dan het doel), dan komt precies die fles op de aanvulbon voor **dezelfde dienst**: nieuwe fles pakken en neerzetten.
- Zes flessen tellen samen als één groep; de groep rond je af met de bekende knop onderaan.

## De keten erachter

Deze flessen zijn ingekocht (niet zelfgemaakt), dus de keten is anders dan bij de mayonaises die West zelf maakt:

- Tekort → aanvullen uit de **voorraadkast (magazijn)**.
- Ligt er ook geen volle fles meer in het magazijn → rolt door naar het **bestelbord** zodat hij meegaat met de inkoop.

Aanname: ze liggen inderdaad in het magazijn als reserve. Staat een van deze flessen ergens anders (bijv. koelcel), dan pas ik die ene regel aan — zeg het even.

## In de praktijk

- Gebruikt door het team van West op de iPad tijdens de sluitronde: zes rustige regels met grote tikdoelen, niets aantikken = alles goed.
- Vergeet iemand het: de regels blijven open staan zoals elke andere, er verdwijnt niets.
- Niets ingedeeld of magazijnvoorraad loopt niet bij? Dan komt de fles gewoon op de aanvulbon en het bestelbord — geen foutmeldingen, geen dubbele regels.

## Technisch

- Geen codewijziging nodig: het blok "Flessen op het werkblad" bestaat al (lade buiten het 3×3-raster) en pakt nieuwe regels vanzelf op.
- Migratie: vijf nieuwe rijen in `koelcel_check_items` (vestiging West, plek `werkbank`, lade "Flessen op het werkblad", formaat `fles`, `doel_aantal` 1, `vulnorm` half, bron `magazijn`, categorie 'Sauzen & siropen'), met logregel in `migratie_logboek`.
- Controle achteraf: de zes flessen staan op volgorde boven de lades in de ronde; bodempje → regel op de aanvulbon met ketenchip richting magazijn/bestelbord.
- Verifiëren met Playwright op West (sluitlijst → keuken → voorraadronde): blok staat bovenaan, zes flessen zichtbaar, tekort geeft bonregel.
