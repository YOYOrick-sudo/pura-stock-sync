# MEP-taak plannen op een gekozen dag

## Doel
Bij het toevoegen van een MEP-taak op `/kitchen/mep` kies je op welke dag de taak moet worden gedaan — vandaag, morgen of een specifieke datum verder vooruit. Nu landt elke nieuwe taak altijd op de dag die je op dat moment bekijkt; vooruitplannen kan alleen door eerst dag per dag vooruit te bladeren.

## Wat er nu is (gecheckt in code en database)
- `MepTaakToevoegen` gebruikt altijd `datum` van de pagina; `useMepTaakMutaties.toevoegen` zet `taak_datum` vast op die paginadatum.
- De dagpagina heeft pijltjes en een weekknop, dus plannen kan alleen via bladeren — omslachtig voor bijvoorbeeld "brine kip voor overmorgen".
- `useMepKalender` kent de openingsdagen en sluitdatums per vestiging (`vestiging_opendagen`, `vestiging_sluitdatums`) — die hergebruiken we.
- Open taken van vorige dagen rollen automatisch mee naar vandaag (carry-over in `useMepTaken`), dus een vooruitgeplande taak verschijnt vanzelf op de goede dag en blijft niet achter.
- De database staat elke datum toe (`validate_mep_taak` controleert alleen status/prioriteit/vestiging). Geen database- of RLS-wijziging nodig.

## Wat we bouwen

### 1. "Wanneer?" in het toevoegscherm
- Na het toevoegen (in het groene bevestigingsblok, naast Hoeveel/Prioriteit/Handeling/Wie) komt een rij **Wanneer?** met knoppen: de dag die je bekijkt, plus de eerstvolgende open dagen (bijv. "Vandaag", "Morgen", "Do 25 sep"), 44px tikvlakken.
- Daarnaast een knop "Kies datum…" met een kalender tot 60 dagen vooruit. Gesloten dagen zijn herkenbaar (grijs + reden), maar wél te kiezen met een duidelijke waarschuwing — soms wil je bewust prep op een gesloten dag (bijv. opbouwdag).
- Standaard staat de bekeken dag gekozen; alleen de gekozen optie is gekleurd.

### 2. Opslaan op de gekozen dag
- De taak krijgt `taak_datum` = gekozen dag (in plaats van altijd de bekeken dag).
- Bij een andere dag dan de bekeken: de taak verschijnt níét in de huidige lijst, maar de lijsten van beide dagen en het weekoverzicht verversen direct, en de melding zegt "Gepland op [dag]". De bevestigingsbalk blijft staan zodat aantal/handeling/persoon alsnog aangepast kunnen worden.
- Doppeltikken wordt geneutraliseerd (bestaande `bezig`-blokkade), dus geen dubbele taken bij haperende wifi.

### 3. Verplaatsen vanuit bewerken
- In het bewerkscherm van een taak komt dezelfde dagkeuze ("Verplaats naar dag"), zodat een verkeerd geplande taak zonder verwijderen en opnieuw aanmaken verzet kan worden.
- Verplaatsen van een afgeronde taak blijft mogelijk maar toont dezelfde gesloten-dag-waarschuwing.

### 4. Het geheel blijft kloppen
- De carry-over (open taken van gisteren komen vandaag bovenaan, met datum) blijft ongewijzigd en werkt ook voor geplande taken.
- De weekweergave (`/kitchen/mep/week`) toont de geplande taken op de juiste dag — die leest hetzelfde bereik.
- Automatische MEP-regels uit de koelcel-check/voorraadronde blijven op de dag van de check landen (context: "dit moet vandaag"); die worden niet verplaatsbaar via dit scherm.
- Templates ("elke open dag", per weekdag) blijven zoals ze zijn; dat is terugkerend werk, dit is eenmalig plannen. Twee aparte begrippen, bewust niet samengevoegd.

## Praktijk en risico's
- Wie/wanneer: chef of manager Midsland plant 's middags prep voor later in de week, op de keuken-iPad; West gebruikt het nauwelijks maar het werkt er hetzelfde.
- Als niemand het gebruikt: alles werkt als nu — de bekeken dag is de standaardkeuze.
- Foutrisico: iemand plant per ongeluk op een gesloten dag en de taak verschijnt "nergens zichtbaar" op een open dag. Maatregel: gesloten dagen tonen de reden en vragen een extra bevestiging; de dagpagina van die gesloten dag toont de taken gewoon, dus ze zijn nooit weg.
- Geen risico voor bestaande data of flows: geen schema-wijziging, geen wijziging aan afronden/batches/stickers.

## Technisch
- `src/components/kitchen/MepTaakToevoegen.tsx`: "Wanneer?"-stap in het bevestigingsblok; `onBijwerken` patcht `taak_datum`.
- `src/hooks/useMepTaken.ts`: `toevoegen` gebruikt `input.taak_datum ?? datum`; `bijwerken` invalideert óók de oude daglijst als `taak_datum` verandert.
- Nieuwe kleine component `MepDagKiezer` (knoppenrij + kalender) gedeeld door toevoegen en bewerken; gebruikt `useMepKalender` voor open/gesloten.
- `src/components/kitchen/MepTaakBewerken.tsx`: dagkeuze toevoegen.
- Geen database-wijziging, geen nieuwe libraries (bestaande kalender/date-fns).

## Test
- Op iPad-breedte: taak toevoegen op vandaag (bestaand gedrag onveranderd), op overmorgen (melding "Gepland op…", niet in de huidige lijst, wél op die dag), op een gesloten dag (waarschuwing + bevestiging).
- Verplaatsen via bewerken van vandaag naar volgende week, en terug.
- Weekweergave toont de geplande taak op de juiste dag; carry-over van open taken blijft werken.

## Standaardisatie-suggestie (één, ter overweging)
Koppel geplande MEP-taken aan de bestelronde: als een vooruitgeplande taak een ingrediënt nodig heeft dat niet op voorraad staat, zou dat automatisch op het bestelbord kunnen komen. Dat vraagt een koppeling taak ↔ recept ↔ ingrediënten — los voorstel, niet in dit plan.
