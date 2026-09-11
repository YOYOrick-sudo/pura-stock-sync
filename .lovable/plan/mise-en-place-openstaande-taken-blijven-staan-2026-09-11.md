# Mise en place: openstaande taken blijven staan

## Het probleem (gecontroleerd)
Het dagscherm haalt alleen taken op met precies de gekozen datum. Op dit moment staan er in West 8 openstaande taken van donderdag 10 september en nog 6 oudere open taken (2, 3 en 8 september) die vandaag nergens zichtbaar zijn. Wat niet gemaakt is, verdwijnt dus uit beeld in plaats van te blijven staan.

## Wat er verandert
- Op de daglijst zie je vanaf nu ook alle taken van eerdere dagen die nog open of bezig zijn.
- Zo'n taak krijgt een klein label dat laat zien hoelang hij al staat: "van gisteren" of "3 dagen open". Zo blijft zichtbaar dat het geen nieuwe taak is.
- Openstaande taken van eerdere dagen komen bovenaan de lijst, boven de taken van vandaag. Belangrijk blijft binnen die groepen bovenaan.
- Zodra je een taak afvinkt (of annuleert), verdwijnt hij van de lijst. Hij telt dan bij de dag waarop hij gemaakt is.
- Kijk je naar een dag in het verleden of in de toekomst, dan zie je alleen de taken van die dag — meeslepen gebeurt alleen op vandaag.
- De weekweergave blijft ongewijzigd: daar staat elke taak op de dag waarvoor hij bedoeld was.
- De voortgangsbalk telt de meegenomen taken gewoon mee, zodat "klaar" ook echt klaar betekent.

## Praktijk
- Vrijdagochtend opent de keuken de lijst en ziet direct wat er donderdag is blijven liggen, met hoelang het er al staat. Geen overtypen, geen appjes.
- Blijft iets dagenlang staan, dan valt dat op door de teller — dat is het signaal om het te schrappen of alsnog te doen.
- Risico: op een rustige dag na een drukke week kan de lijst langer worden. Daarom de teller en de groep bovenaan, zodat oude items opvallen en makkelijk te verwijderen zijn.
- Gesloten dagen (West op dinsdag) leveren geen probleem op: taken schuiven vanzelf door naar de eerstvolgende dag dat iemand de lijst opent.

## Technisch
- `useMepTaken(vestiging, datum)` in `src/hooks/useMepTaken.ts` haalt nu twee sets op wanneer `datum` gelijk is aan vandaag: de taken van vandaag, plus taken met `taak_datum < vandaag` en `status in ('open','bezig')`. Voor andere datums verandert de query niet.
- Sorteren: eerst achterstand (oplopend op `taak_datum`), dan vandaag; binnen elke groep de bestaande volgorde (`prioriteit`, `volgorde`, `created_at`).
- `MepTaak` krijgt een afgeleide vlag (bijv. `dagen_open`, berekend in de client uit `taak_datum`) voor het label; geen kolom of migratie nodig.
- `src/pages/kitchen/MepDag.tsx`: badge tonen bij taken met `dagen_open > 0` en de lijst in twee blokken renderen ("Blijft staan" / "Vandaag"). Voortgangsteller telt beide blokken.
- Realtime, afvinken, printen, bewerken en per persoon/per handeling blijven werken zoals nu — de taakrijen zelf veranderen niet.
- Geen databasewijziging, geen nieuwe pakketten, geen routewijzigingen.

## Wat ik heb nagekeken
- Het actieve scherm is `/kitchen/mep` (`MepDag.tsx`); `/kitchen/mep/oud` is een oude versie die hier buiten valt.
- De query in `useMepTaken` filtert hard op één datum — dat is de oorzaak, er is geen doorschuif-mechanisme.
- In de database staan nu 14 open taken op eerdere dagen in West; die worden na deze wijziging direct zichtbaar op vandaag.
