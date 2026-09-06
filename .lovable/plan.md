# Onderzoek: trage app + kassatelling die niet meer aankomt

## Wat ik heb gevonden (gecontroleerd, niet gegokt)

### 1. Kassatelling — sluittelling blokkeert op een verplicht opmerkingenveld
In de database staat de laatste **sluit**telling op 2 september 21:36. Opentellingen komen wél nog binnen (laatste: 6 september, West).

In het sluitscherm is "opmerkingen" verplicht geworden (minimaal 3 tekens) terwijl de afspraak is dat alleen naam en cash-omzet verplicht zijn. Wie niets invult bij opmerkingen krijgt "vul alle verplichte velden in" en de telling wordt niet opgeslagen. Daarnaast zit er een blokkade van 10 minuten na een poging, die alleen in de browser van dat apparaat wordt onthouden.

### 2. Kassatelling — er zit geen verzending in de app
De app slaat de telling alleen op in de database. Er is nergens in de app code die de telling doorstuurt naar een sheet of mailbox, en er staat ook geen automatische actie op de tabel. De doorzending liep dus buiten de app om (n8n). Zodra er geen tellingen meer worden opgeslagen, komt er ook niets meer in de sheet — de twee problemen hangen samen.

### 3. Traagheid — de takenlijst is de zwaarste last
De takentabel is doorgegroeid naar ruim 47.000 regels (18 MB) en er wordt niets opgeruimd of gearchiveerd. De twee zwaarste app-verzoeken zijn takenlijst-verzoeken met gemiddeld 87 ms en 126 ms, met uitschieters tot 0,78 seconde per verzoek. Er ontbreken passende indexen voor precies die twee zoekpatronen (op vestiging + gearchiveerd, en op vestiging + datum).

### 4. Traagheid — de app haalt te vaak álles opnieuw op
Zodra een tablet uit slaapstand komt of de wifi terugkomt, ververst de app **alle** gegevens tegelijk. Op een tablet die de hele dag aan en uit gaat betekent dat tientallen keren per dienst een volledige laadronde over die zware takentabel.

### 5. Printkastje bevraagt de database extreem vaak
De printopdracht-check is inmiddels 1,65 miljoen keer uitgevoerd (het kastje meldt zich ongeveer elke 1,5 seconde). Dat is de meest uitgevoerde vraag op de hele database. Los daarvan draait de e-mailwachtrij-check 1,58 miljoen keer.

## Wat ik ga doen

### Stap 1 — Kassatelling weer werkend (eerst)
- Opmerkingen weer optioneel in de sluittelling; verplicht blijven alleen naam en cash-omzet.
- Duidelijke foutmelding bovenaan het formulier als opslaan mislukt, in plaats van alleen een korte melding.
- De blokkade van 10 minuten alleen laten gelden na een gelukte inzending, niet na een mislukte.

### Stap 2 — Verzending in de app zelf zetten
- Na een gelukte telling verstuurt de app zelf een net overzicht per e-mail (vestiging, datum, naam, coupures, totaal, afdracht, kasverschil, opmerking) naar een in te stellen adres. Dan is de sheet niet meer de enige plek waar het terechtkomt en zie je in de app of het verstuurd is.
- Er komt een klein overzicht "laatste tellingen" met verzendstatus, zodat een mislukte verzending zichtbaar is en opnieuw geprobeerd kan worden.

### Stap 3 — Snelheid
- Indexen toevoegen die exact op de twee zware takenlijst-vragen passen.
- Oude taken opruimen: taken ouder dan een bepaalde periode archiveren (niets hard verwijderen, historie blijft bewaard).
- Alleen de gegevens verversen van het scherm waar je op staat als een tablet wakker wordt, in plaats van alles.
- Het printkastje rustiger laten opvragen (elke paar seconden in plaats van elke 1,5 seconde) zonder dat stickers later uit de printer komen.

## Wat ik nog van jou nodig heb
Naar welk e-mailadres moet de kassatelling gestuurd worden? En moet de sheet-koppeling via n8n blijven bestaan naast de e-mail, of vervangen we die?

## Technische details
- Bestanden: `src/pages/Kassa.tsx` (validatie + throttle), `src/pages/KassatellingOverdag.tsx`, `src/App.tsx` (gerichte invalidatie i.p.v. `invalidateQueries()`), `src/components/foh/FohTasks.tsx` (query-scope), print-poll-interval in de bridge.
- Migratie: index op `foh_tasks(location, archived)` en `foh_tasks(location, due_date)`; archiveringsroutine voor oude `foh_tasks`.
- Nieuwe edge function voor de kassatelling-mail via de bestaande transactionele e-mailketen; verzendstatus vastleggen zodat mislukken zichtbaar is.
- Geen wijziging aan het printgedrag van de Raspberry Pi zelf, alleen de opvraagfrequentie.
