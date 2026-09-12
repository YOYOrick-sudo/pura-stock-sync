# Kassatelling weer betrouwbaar naar de sheet

## Vastgestelde oorzaak
- De telling zelf werkt: recente open- en sluittellingen van **West én Midsland** staan in Kas-controle.
- De app schrijft sinds juni alleen naar Kas-controle. Er staat nu **geen** koppeling, automatische actie of achtergrondtaak meer die deze tellingen naar een sheet stuurt.
- De oude n8n-koppeling is destijds verwijderd nadat die onbereikbaar werd. Ik heb daarna ten onrechte aangenomen dat Kas-controle de sheet volledig mocht vervangen. Daardoor kreeg de app wel de melding “Kassatelling verzonden”, terwijl alleen Kas-controle was bijgewerkt.

## Wat ik bouw
1. **Rechtstreekse Google Sheets-koppeling**
   - De app blijft de telling eerst veilig opslaan in Kas-controle.
   - Daarna zet een beveiligde achtergrondfunctie dezelfde telling in de bestaande Google Sheet.
   - Open- en sluittellingen, West en Midsland, krijgen ieder de juiste locatie en hetzelfde gegevensformaat als voorheen.

2. **Geen stille fouten meer**
   - Per telling bewaren: `wacht op verzending`, `verzonden` of `mislukt`, plus tijdstip en foutmelding.
   - De succesmelding zegt pas dat de sheet is bijgewerkt wanneer dit werkelijk gelukt is.
   - Als Google tijdelijk niet bereikbaar is, blijft de telling veilig staan en wordt deze opnieuw geprobeerd; medewerkers hoeven niet opnieuw te tellen.

3. **Controle en herstel**
   - In Kas-controle komt een compacte verzendstatus per telling.
   - Managers kunnen een mislukte telling opnieuw naar de sheet sturen.
   - Dubbele regels worden voorkomen met het unieke nummer van de telling, ook bij opnieuw proberen of dubbel tikken.

4. **Achterstand herstellen**
   - Na controle van de doel-sheet bepaal ik welke opgeslagen tellingen ontbreken.
   - Alleen ontbrekende tellingen worden alsnog toegevoegd; bestaande regels worden niet blind opnieuw geplaatst.

## Benodigd vóór de eindtest
- De bestaande Google Sheet moet aan dit project worden gekoppeld.
- De link van de juiste Google Sheet en de namen van de tabbladen zijn nodig. Deze informatie staat niet in de app of database en kan niet uit de oude, verwijderde n8n-koppeling worden teruggehaald.

## Praktijk en risico
- **Gebruikers:** medewerkers blijven op de iPad exact hetzelfde tellen; managers zien de status in Kas-controle.
- **Bij uitval:** de telling blijft bewaard en gaat in de wachtrij; geen gegevensverlies en niet opnieuw tellen.
- **Grootste risico:** zonder controle van de bestaande kolommen kunnen bedragen in de verkeerde kolom terechtkomen. Daarom lees ik eerst de sheetstructuur en voer ik daarna één herkenbare testtelling per vestiging uit.
- De bestaande Kas-controle, kassa-validatie en tellinghistorie blijven leidend en worden niet vervangen.

## Verificatie
- Echte test voor **West** en **Midsland**.
- Per vestiging controleren: telling staat in Kas-controle, precies één nieuwe sheetregel staat goed, en status is `verzonden`.
- Geforceerde fout testen: telling blijft bewaard, status wordt `mislukt`, opnieuw proberen maakt geen duplicaat.
- Controleren dat openen en sluiten hun volledige, juiste gegevens meesturen.

## Technische details
- Nieuwe beveiligde functie voor het toevoegen van een sheetregel; Google-toegang blijft buiten de iPad.
- Verzendstatus en idempotentie worden in de database vastgelegd en zijn alleen voor managers zichtbaar.
- De bestaande invoerschermen sturen na een geslaagde database-opslag het unieke tellingnummer door; geen directe Google-aanroep vanuit de browser.
