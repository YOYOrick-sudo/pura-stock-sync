# Antwoord: Lightspeed-gegevens en mogelijkheden (niets gewijzigd)

Er hoeft niets gebouwd te worden. Bij elk punt staat [code] als ik het in de code of database heb gezien, en [vermoeden] als ik het niet heb gecontroleerd.

## 1. Wat de app nu ophaalt
- Bron: één Lightspeed L-Series-adres, de bonnenlijst (financial/receipt), per dag en per 50 bonnen. [code]
- **omzet_uren**: omzet per werkdag per uur, met en zonder btw, plus het aantal bonnen. Midsland vanaf 31-12-2024, West vanaf 01-01-2025, tot en met vandaag. [code]
- **kassa_verkoop_dag**: per dag per product het aantal en de omzet, met en zonder btw. Beide vestigingen vanaf 01-01-2025. [code]
- Losse bonnen worden niet bewaard. Ze worden opgehaald, opgeteld en daarna weggegooid. [code]
- Verversen: Midsland elke 30 minuten, West om :05 en :35. Elke nacht een controle (01:30 en 01:35 UTC) en een dagelijkse sync om 05:15 UTC. [code]

## 2. Wat er al is of zonder nieuwe toestemming kan
De toestemming is gevraagd zonder speciale rechten [code]. Welke gegevens Lightspeed daarmee geeft, is per onderdeel niet getest [vermoeden].
- a. Bonnen met tijdstippen: zitten in de opgehaalde gegevens, maar worden niet bewaard. Het openingstijdstip (creationDate) en het laatste wijzigingstijdstip (modificationDate) zijn er. Het sluittijdstip (closingDate) is bij jullie altijd leeg; daarom gebruiken we het wijzigingstijdstip als afrekenmoment. [code]
- b. Bonregels per product: product, aantal en prijs zijn er, maar zonder eigen tijdstip; ze krijgen het tijdstip van de bon. [code]
- c. Gasten/couverts: niet gebruikt. Zit waarschijnlijk wel in de bon. [vermoeden]
- d. Tafel/plattegrond: niet gebruikt. De tafel staat waarschijnlijk op de bon; de plattegrond kan via een apart onderdeel van Lightspeed. [vermoeden]
- e. Betaalwijze en fooi: niet bewaard. Betalingen staan waarschijnlijk op de bon; fooi is onzeker. [vermoeden]
- f. Artikelstam: wordt niet periodiek gesynct. Voor Eilandbezorger is de productkaart wel eenmalig, alleen-lezen opgehaald: 1154 producten, groepen, prijzen en extra's. Dat lukte met de bestaande toegang. [code] Btw per product niet gecontroleerd. [vermoeden]
- g. Kortingen, retouren en annuleringen: negatieve regels tellen mee in de omzet, zonder aparte behandeling. Alleen bonnen met status PAID, DONE of ACCEPTED tellen mee; andere statussen vallen weg. Kortingsvelden worden niet gelezen. [code]

## 3. Tussenweg nu, en wat uitbreiden zou kosten
- Nu: één bericht per vestiging met per dag (hooguit 3 dagen):
  - dag en opgehaald_op;
  - uren: uur, omzet met en zonder btw, aantal bonnen;
  - producten: product-ID, naam, aantal, omzet met en zonder btw. [code]
- Moment: elke 30 minuten (:10 en :40), en gisteren nog eens na de nacht-sync. Bij een storing één herhaling na 60 seconden; mislukte dagen schuiven door naar de volgende ronde. De laatste test gaf nog een 404 bij de ontvanger. [code]
- Bonnen en bonregels toevoegen kost ongeveer 1,5 tot 2,5 dag [vermoeden]:
  - de bonnen bewaren in twee nieuwe tabellen (bonnen, bonregels) met een vaste sleutel per bon;
  - het doorsturen uitbreiden en de berichten opdelen per dag (er is al een terugval bij te grote berichten);
  - tests schrijven;
  - afspreken met de ontvanger welk formaat ze verwachten.
- Risico: de opslag groeit, ruwweg enkele duizenden bonnen per week in het seizoen [vermoeden]. De huidige omzetberekening blijft gewoon werken.

## 4. Bezorgkoppeling (Eilandbezorger)
- Die gebruikt dezelfde Lightspeed-toegang: dezelfde app-registratie, dezelfde koppeling per vestiging en een gedeelde vernieuwing van de toegang (met een slot zodat ze niet botsen). [code]
- Een extra, eigen koppeling ernaast:
  - een aparte app-registratie heeft eigen toegang en zit de bestaande twee niet in de weg;
  - een tweede toestemming op dezelfde registratie kan de huidige toegang ongeldig maken, dus dat niet doen. [vermoeden]
  - Aanvraaglimieten gelden waarschijnlijk per account en worden dan gedeeld. [vermoeden]

## 5. Grenzen
- Limieten: de code wacht als Lightspeed "te veel aanvragen" (429) of een serverfout geeft, en houdt zich aan de opgegeven wachttijd. Tussen dagen zit 250 ms pauze en er is een maximum van 500 pagina's per dag. Lightspeed noemt geen vaste limiet. [code]
- Vertraging: gegevens zijn tot ongeveer 30 minuten oud, en de tussenweg komt daar nog 5 tot 10 minuten achteraan. Een bon die nog openstaat telt pas mee als hij afgerekend is. [code]
- Dagwissel: de werkdag kantelt om 06:00 Amsterdamse tijd. Een bon van 01:00 hoort dus bij de vorige dag. [code]
- Twee vestigingen: elk heeft een eigen koppeling (Midsland 36864, West 41121) en eigen sync-taken. Een fout bij de ene vestiging stopt de andere niet. Een gesloten dag levert gewoon geen gegevens. [code]
