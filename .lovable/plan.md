# "Te weinig" moet eindigen in een opdracht, niet in een melding

## Wat er nu gebeurt
Gerookte zalm staat op twee plekken: 2 pakjes in de koelcel en 1 in de vriescel. Meld je in de koelcel "te weinig, er ligt er nog 1", dan zet de app de regel op *doorgezet* en verplaatst de vraag naar de vriescelregel. Maar die vriescelregel is alleen op maandag zichtbaar. Dus je ziet een melding, en daarna gebeurt er niets. Dat klopt inderdaad niet.

## Wat er zou moeten gebeuren
Een tekort in de koelcel is geen bestelling, het is een handeling: er ligt nog iets in de vriescel, dus dat haal je eruit. Pas als de vriescel ook leeg is, wordt het een bestelling.

Dus na "er ligt er nog 1" van de 2:

1. De app zegt meteen: **Pak 1 pakje gerookte zalm uit de vriescel en leg het in de koelcel.** Dat is hetzelfde venster, één stap verder — geen nieuwe melding die je moet gaan zoeken.
2. **Gedaan** → de koelcelregel is op peil, de Ontdooid-sticker wordt geprint, en de vriescel staat nu één pakje lager. Dat ene pakje wordt automatisch bijbesteld (bestelbord of Midsland, afhankelijk van het product) zodat de vriescelvoorraad weer klopt.
3. **De vriescel is ook leeg** → pas dan gaat het tekort naar het bestelbord of de bestellijst voor Midsland, en blijft de koelcelregel als "doorgezet" staan.

Belangrijk detail: het gaat om het tekort, niet om de volle doelhoeveelheid. Ligt er nog 1 van de 2, dan pak je er 1 uit de vriescel — niet 2.

## Wat je op het scherm ziet
- Geen enkele regel eindigt meer op alleen "doorgezet" zonder dat duidelijk is wie wat doet.
- In het afgehandeld-lijstje staat per product wat het geworden is: *bijgevuld uit de vriescel*, *naar het bestelbord* of *naar Midsland*.
- De vriescel blijft één keer per week (maandag) tellen; wat je doordeweeks uit de vriescel pakt, wordt automatisch van die voorraad afgehaald en bijbesteld, zodat je maandag niet voor verrassingen staat.

## Technisch
- `ActieDialog` in `src/components/foh/KoelcelCheckBlok.tsx` krijgt na "Er ligt nog een deel" een derde stap: is er een actief item met hetzelfde `product_sleutel` op een lager niveau, dan toont hij de aanvulopdracht met het berekende tekort in plaats van direct `meldOp` aan te roepen.
- `vulAanUitNiveau` in `src/hooks/useKoelcelCheck.ts` krijgt een `aantal`-parameter en zet daarna het tekort op het lagere niveau door via de bestaande bestemmingslogica (`bestemmingVoorBron` → `opBestelbord` / `naarMidsland`), zodat de vriescelvoorraad wordt aangevuld in plaats van stilletjes te dalen.
- `meldOp` met `soort: 'niveau'` wordt alleen nog gebruikt voor het pad "bron is ook leeg"; de tussenstatus 'gemeld' zonder vervolgactie verdwijnt.
- Het afgehandeld-lijstje leest `doorgezet_naar` uit `koelcel_checks` voor het label per product.
- Geen schemawijziging.
