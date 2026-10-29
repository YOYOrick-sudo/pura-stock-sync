# Review en dubbele simulatie van alles van vandaag

Doel: alles wat vandaag gebouwd is twee keer doorlopen, in de preview zoals een teamlid het gebruikt (ingelogd, echte invoer, op iPad- en telefoonformaat). Eerst testen, dan pas repareren wat echt stuk blijkt.

## Wat wordt getest

1. **MEP – taak toevoegen (West en Midsland)**: volgorde Wie/Wat/Wanneer/Hoeveel, prioriteit, "Klaar". Na 17:00 komt een taak voor vandaag op de volgende open dag.
2. **MEP – toewijzen**: poppetje bij een taak zonder iemand, teamlid kiezen, "Niemand", ongedaan maken. Gearchiveerde mensen (Ezra, sd) staan niet in de lijst.
3. **MEP – compacte kop**: lijst begint hoog in beeld op iPad en telefoon.
4. **MEP – te laat doorschuiven**: per taak "Vandaag"/"Morgen", "Alles naar …", "Wissen" met ongedaan maken; korte badge ("Gisteren", "2 dagen"). Het tijdstip wordt nagebootst: één keer overdag, één keer na 17:00, ook met een gesloten dag erna.
5. **Keuken-sluitlijst West**: volgorde Opzetkoeling → Au bain-marie (4 stappen, "Belangrijk") → stickers → voorraadronde → rest. Vinkjes blijven na opnieuw laden. Midsland is ongewijzigd.
6. **Bestellijst (West en Midsland)**: toevoegen met aantal en verpakking, eerdere producten, geen dubbele regels, wijzigen, "Besteld" en "Toch niet nodig" met ongedaan maken (bewaard, niet verwijderd). Paginatitel "Bestellijst". Menu-item zichtbaar in Midsland. West en Midsland blijven gescheiden.

## Werkwijze

- **Ronde 1**: alle flows doorlopen met screenshots, op iPad (staand) en telefoon, in West en Midsland. Bevindingen noteren.
- **Code-review**: wijzigingen van vandaag nalezen op randgevallen (gesloten dagen, wifi-fout, twee tablets, dubbel tellen).
- **Fouten repareren** die gevonden zijn, en voor elke regel die stuk ging een kleine test toevoegen.
- **Ronde 2**: alles opnieuw doorlopen om te bevestigen dat het werkt en dat er niets anders stuk is gegaan.
- **Opruimen**: testtaken en testbestellingen archiveren of terugzetten, zodat de echte lijsten schoon blijven.

## Wat je terugkrijgt

Per onderdeel: werkt / gerepareerd / bekend risico, met wat ik niet kon testen (bijvoorbeeld echt printen op de labelprinter: dat simuleer ik niet, om geen stickers te printen).

## Technische details

- Playwright met sessie via `puravida-auth` storage key; tijd nabootsen via `page.clock` voor 17:00-grens.
- Bestaande Bun-tests (mep-avondgrens e.a.) draaien; nieuwe tests alleen voor gevonden fouten.
- Geen schema- of printflow-wijzigingen zonder apart akkoord.
