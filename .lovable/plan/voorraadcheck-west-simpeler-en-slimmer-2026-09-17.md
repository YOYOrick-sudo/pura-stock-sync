# Voorraadcheck West: simpeler en slimmer

Je hebt gelijk. Nu moet iemand tijdens het sluiten 44 + 34 + 3 regels langs en bij elke regel kiezen uit drie knoppen met wisselende teksten. Dat is geen check, dat is werk.

## Het idee: alleen melden wat mist
Bij het sluiten klopt 90% gewoon. Dus draaien we het om.

1. Je opent de sectie en ziet bovenaan één grote groene knop: **Alles ligt er (44)**.
2. Daaronder een lijst met alleen de productnamen, compact, twee kolommen naast elkaar op de iPad. Tik je op een naam, dan markeer je hem als probleem — hij springt naar boven in een rood blokje "Klopt niet".
3. Als je klaar bent tik je op de groene knop. Alles wat je niet hebt aangetikt staat in één keer op "aanwezig".
4. Pas daarna handel je de paar rode regels af: per stuk één venster met de concrete opdracht ("Pak 1 forel uit de vriescel en leg hem in de koelcel") en de knoppen *Gedaan*, *Te weinig* of *Bron is ook leeg*.

Resultaat: een normale sluitdienst is drie tikken in plaats van tachtig, en alleen de uitzonderingen kosten aandacht.

## Wat er verder verandert
- **Geen drie knoppen per regel meer.** Een regel is alleen een naam met het aantal erachter.
- **Route-uitleg verdwijnt uit de lijst.** "Aanvullen uit de vriescel · daarna het bestelbord" zie je pas in het venster van dat ene product, precies op het moment dat je het nodig hebt.
- **Afgehandeld verdwijnt.** Wat op peil is, klapt weg in een dichtgevouwen regel "44 op peil".
- **Slimme volgorde.** Producten die de afgelopen weken vaak op waren, staan bovenaan de lijst. De rest daaronder.
- **Zoekveld per sectie** zodra er meer dan 20 items zijn, zodat je een product direct kunt aantikken.
- **Bestelinfo als klein groen chipje** achter de naam ("2 besteld"), niet in een lopende zin.

## Eén ding dat ik nog controleer
Bij Tempeh staat "17 zak besteld", bij Vissoep "26 stuks". Dat lijkt niet te kloppen. Ik kijk die openstaande bestellingen na voordat ik dat chipje toon.

## Technisch
- Herschrijf van `src/components/foh/KoelcelCheckBlok.tsx`: `ItemRij` wordt een tik-toggle zonder actieknoppen, `CheckBlok` krijgt een "alles op peil"-actie (bulk-insert van `aanwezig` voor alle niet-gemarkeerde items via één mutatie), plus een afhandelsectie voor gemarkeerde items.
- `AanvulDialog` en `TekortDialog` worden één actievenster met drie uitkomsten.
- `useKoelcelCheck.ts` krijgt één nieuwe mutatie `zetAllesAanwezig(plek)` die in één call schrijft; bestaande ketenlogica (`vervolgactieVoorRegel`, `meldOp`, `vulAanUitNiveau`) blijft ongewijzigd.
- Sorteren op probleemfrequentie gebeurt met een leesquery op `koelcel_checks` van de laatste 30 dagen.
- Inline stijlen naar Tailwind met bestaande tokens; tikdoelen minimaal 48 px.
- Geen schemawijziging.
