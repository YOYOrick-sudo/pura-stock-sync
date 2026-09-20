# Mobiele West/Daily verbeteren in fases

## Gekozen richting
De mobiele app volgt **Cohesive mobile workspace**: een compacte werkpagina met duidelijke volgorde, grote tikvlakken, rustige taakregels en één opvallende eerstvolgende actie. We behouden de bestaande Pura Vida-kleuren, typografie, functies en zijmenu-inhoud.

De screenshots worden alleen als probleemreferentie gebruikt. Er komen geen nieuwe kleuren, lettertypes, functies of navigatiebestemmingen bij.

## Wat dit in de praktijk oplevert
- Een medewerker kan met één hand door de koelcel lopen en tellen zonder horizontaal schuiven of kleine knoppen.
- Datum, Openen/Sluiten, Bediening/Keuken en Voorraadronde blijven herkenbaar, maar staan niet meer in elkaar gedrukt.
- De actuele telling blijft bewaard bij verversen of een wifi-hapering.
- Een nieuw teamlid ziet steeds één logische volgende handeling, zonder extra uitleg in beeld.
- Bestaande voorraad-, MEP-, bestel- en printerlogica blijft ongewijzigd.

## Fase 1 — Mobiele basis en veilige schermranden
- Maak menu- en sluitknoppen minimaal 44px.
- Laat kop, inhoud, menu en meldingen rekening houden met iPhone/iPad-schermranden en de onderste browserbalk.
- Trek de bestaande 600px-grens consequent door, zodat telefoon en iPad niet verschillende indelingen tegelijk krijgen.
- Maak het mobiele zijmenu eenvoudiger: geen inklapbediening die alleen voor het vaste bureaubladmenu bedoeld is.

**Controle:** 390px telefoon, 600–743px compact scherm en iPad-portret; menu opent/sluit, niets raakt de browserrand en de bestaande iPad-zijbalk blijft vanaf 744px intact.

## Fase 2 — Takenpagina als compacte werkruimte
- Verminder buitenruimte en overbodige omlijsting op telefoon.
- Geef de dagkeuze een vaste, passende breedte met 44px-pijlen en tekst die nooit afsnijdt.
- Zet Openen/Sluiten in een heldere tweedeling met voortgang per fase.
- Maak Bediening/Keuken minimaal 44px hoog; plaats beheerknoppen eronder zodat de hoofdkeuze breed blijft.
- Maak **Voorraadronde** een compacte actiekaart met actuele voortgang, zoals in de gekozen richting.

**Controle:** alle combinaties van Openen/Sluiten en Bediening/Keuken op 390px; geen horizontale verschuiving, afsnijding of onbedoelde fasewissel.

## Fase 3 — Taakregels voor duimgebruik
- Maak de hele taakregel een betrouwbaar tikvlak, met een duidelijk selectievak en vaste uitlijning.
- Geef info- en beheeracties elk minimaal 44px ruimte zonder de taaktekst te verdringen.
- Voorkom dat een tik op info of beheer tegelijk de taak afvinkt.
- Houd taaknummer, titel, tijd en status scanbaar bij lange Nederlandse teksten.

**Controle:** taak afvinken/terugzetten, info openen en beheeracties afzonderlijk testen; geen dubbele acties en geen verspringende lijst.

## Fase 4 — Voorraadronde als gefocuste telmodus
- Haal de diepe kaarten-in-kaarten weg en maak plek, lade/groep en product visueel vlakker.
- Toon voortgang op productniveau, niet alleen per afgeronde groep.
- Maak Vol/Half/Bodempje/Leeg op telefoon een 2×2-keuzevlak met ruime tikvlakken; alleen de gekozen waarde krijgt kleur.
- Houd de actuele plek of lade rustig zichtbaar zonder twee vaste koppen over elkaar.
- Laat een lade pas inklappen zodra het eerste product van de volgende lade wordt gekozen; de bestaande telvolgorde blijft gelijk.
- Plaats de knop voor “groep klaar” veilig boven de onderste browserrand.

**Controle:** volledige koelwerkbankroute op 390px, inclusief lange productnamen, alle vier vulkeuzes, automatisch inklappen, terugscrollen en correctie.

## Fase 5 — Herstel, wifi en hervatten
- Maak “Telling teruggezet” tijdelijk en duidelijk, in plaats van permanent aanwezig.
- Toon zichtbaar welke telling lokaal bewaard is en welke actie nog moet worden doorgezet.
- Behoud de bestaande telling na verversen en voorkom dubbel doorzetten na herhaald tikken.
- Geef bij een fout één duidelijke herkansactie zonder reeds getelde producten kwijt te raken.

**Controle:** verversen halverwege, korte offline-situatie, opnieuw online, dubbele tik en hervatten op dezelfde productpositie.

## Fase 6 — Aanvulbon en afronden
- Maak de aanvulbon vlak en scanbaar per herkomst: koelcel, vriescel, magazijn, MEP, Midsland en bestelbord.
- Behoud FIFO bovenaan en productspecifieke notities direct onder het product.
- Zorg dat lange product- en actieteksten onder elkaar passen.
- Houd Terug en Bevestigen veilig boven de browserrand; voorkom dubbel bevestigen en toon duidelijk welke regel niet kon worden verwerkt.

**Controle:** lege bon, gemengde bon, lange namen/notities, succesvolle verwerking en gedeeltelijke fout zonder dubbele MEP- of bestelregels.

## Fase 7 — Eindronde op echte apparaten
- Loop de complete West-route na op 390px telefoon, iPad-portret en iPad-landschap.
- Controleer licht/donker, grotere tekst, draaien van het scherm en browser/PWA-weergave.
- Vergelijk na iedere fase opnieuw met de drie aangeleverde screenshots en herstel alleen regressies binnen die fase.

## Werkwijze per fase (/loop)
Elke fase doorloopt dezelfde korte lus:

```text
bouwen → mobiele praktijktest → screenshot beoordelen → fout herstellen → opnieuw testen → fase afronden
```

Na elke fase meld ik afzonderlijk wat zichtbaar verbeterd is en wat in de koelceltest is gecontroleerd. Pas daarna ga ik door naar de volgende fase.

## Risico’s en afbakening
- **Verkeerde telling of dubbele MEP/bestelling:** voorraadberekeningen en ketenregels worden niet herschreven; we testen wel elke bestaande uitkomst opnieuw.
- **Telling kwijt bij slechte wifi:** lokale hervatting blijft behouden en krijgt in fase 5 duidelijkere status en herstel.
- **iPad-regressie door telefoonaanpassingen:** de bestaande vaste iPad-zijbalk vanaf 744px blijft leidend en wordt per fase meegetest.
- **Printer- of stickerproblemen:** printgedrag wordt niet gewijzigd.
- **Bestaande historie:** er worden geen gegevens verwijderd of gemigreerd; dit traject blijft aan de voorkant.

## Technische uitvoering
- Bestaande onderdelen en ontwerptokens blijven leidend; geen nieuwe bibliotheken.
- Responsieve wijzigingen blijven beperkt tot de app-schil, takenpagina en voorraadronde.
- De bestaande 600px JavaScript-grens en 744px iPad-zijbalk worden bewust op elkaar afgestemd; algemene tabletstijlen blijven behouden.
- Elke fase krijgt een gerichte telefoon-/iPad-test en controle van de actuele bouwmeldingen.
