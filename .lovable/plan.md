# Drie flessen toevoegen en de groep korter noemen

## Wat er verandert

Het blok **Flessen op het werkblad** heet voortaan kortweg **Flessen**.

In dat blok komen drie regels erbij, na de bestaande flessen:

1. Olijfolie
2. Zonnebloemolie
3. Japanse mayonaise

## Hoe het in de praktijk werkt

- Het West-team telt deze flessen tijdens de voorraadronde op dezelfde manier als ketchup en de andere ingekochte flessen: vol, half, bodempje of leeg.
- Minimaal halfvol is goed; bij bodempje of leeg komt de fles op de aanvulbon voor dezelfde dienst.
- Aanvullen gebeurt vanuit het magazijn. Is daar geen reserve meer, dan loopt de bestaande keten door naar het bestelbord.
- De groep blijft boven de negen koelwerkbanklades staan en wordt met één knop afgerond.

Aanname: alle drie zijn ingekochte flessen met reserve in het magazijn. Daardoor ontstaat geen onterechte MEP-taak voor Japanse mayonaise.

## Risico en controle

Het belangrijkste risico is een dubbele regel als een van deze producten al onder een andere naam bestaat. Daarom controleer ik eerst de actieve én gearchiveerde voorraadregels en voeg ik alleen ontbrekende regels toe.

Daarna controleer ik op mobiel formaat dat:

- de kop **Flessen** toont;
- alle bestaande flessen plus de drie nieuwe zichtbaar zijn;
- bodempje of leeg op de aanvulbon komt;
- de vervolgstap magazijn en daarna bestelbord blijft;
- de voortgang van de voorraadronde correct blijft tellen.

## Technisch

- Eén databasewijziging hernoemt de bestaande groep en voegt de drie items idempotent toe aan dezelfde `lade_id`.
- De nieuwe regels gebruiken formaat `fles`, doel 1, vulnorm `half`, bron `magazijn` en categorie `Sauzen & siropen`.
- Bestaande tellingen en historie blijven onaangetast; er wordt niets verwijderd.
