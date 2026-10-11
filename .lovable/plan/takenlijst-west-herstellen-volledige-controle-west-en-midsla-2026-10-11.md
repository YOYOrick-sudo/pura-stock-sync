# Takenlijst West herstellen + volledige controle West en Midsland

## Wat er mis is (gemeten)

- **West heeft vandaag 0 taken.** Midsland heeft er precies de West-taken bij: Openen 38 + 60 = 98, Sluiten 64 + 67 = 131.
- **Alle 134 vaste taken van West staan nu op "Midsland"**: de afdelingen bediening (60), keuken (32) en samen (42), die alleen West gebruikt. Daardoor maakte de ochtendronde van 04:00 vandaag niets voor West aan, en ziet Midsland een te lange lijst.
- **Oorzaak:** een automatische regel in de database zet bij elke wijziging van een vaste taak de vestiging op die van degene die de wijziging doet. Toen gisteravond de Engelse teksten werden opgeslagen, gebeurde dat met een account van Midsland, en kregen alle West-taken het label Midsland. Dat kan ook opnieuw gebeuren als een manager in Templates Beheren een taak van de andere vestiging aanpast.
- Gisteren (10-10) waren beide lijsten nog in orde. De ochtendronde zelf draaide goed.

## Wat ik doe

1. **Vaste taken van West terugzetten**
   De 134 taken met afdeling bediening, keuken of samen gaan terug naar West. Midsland gebruikt die afdelingen niet, dus de scheiding is eenduidig. Er wordt niets verwijderd.

2. **Lijst van vandaag rechtzetten**
   De taken van vandaag van die West-taken gaan terug naar West, met hun afvinkstatus. Daarna kloppen beide lijsten meteen weer: West 60 / 67, Midsland 38 / 64.

3. **Oorzaak weghalen**
   De automatische regel geldt alleen nog bij het **aanmaken** van een taak, niet meer bij het **wijzigen**. Een bestaande taak houdt dan altijd zijn vestiging, wie hem ook aanpast. Voor gewone medewerkers blijft de bescherming hetzelfde: zij kunnen alleen taken van hun eigen vestiging aanmaken.

4. **Controle per module door aparte agents, voor West en voor Midsland**
   Elke agent logt in, kiest de vestiging en loopt de module na op telefoon- en iPad-formaat:
   - Takenlijst: Openen / Tussen / Borrel / Sluiten, afvinken, NL/EN, voorraadronde en bain-marie in de sluitlijst van West
   - Kassatelling en kas-controle
   - MEP-planning (lijst Alle taken, plannen, afronden)
   - Snel printen / stickers (alleen tonen, geen echte print)
   - Voorraad West, interne bestelling en Midsland-bestellingen
   - Onderhoud, HR, Personeel, Cijfers (laden zonder fouten)
   Gevonden fouten meld ik per module. Kleine fouten los ik direct op; voor grotere fouten maak ik eerst een voorstel.

## Risico's

- Terugzetten raakt alleen de vestiging van West-taken, niet de tekst, volgorde of vertaling.
- Als iemand vandaag al taken op de lange Midsland-lijst heeft afgevinkt, blijven die vinkjes staan; ze verschijnen dan bij West.
- Na de aanpassing van de automatische regel kan een manager van de ene vestiging nog wel een taak van de andere aanpassen, maar die taak blijft dan bij zijn eigen vestiging. Dat is de bedoeling.
- Testen gebeurt zonder echte prints en zonder kassatellingen in te sturen. Achtergebleven testgegevens worden gearchiveerd.

## Technisch

- Data-update: `foh_daily_templates` en de `foh_tasks` van vandaag met `department in ('bediening','keuken','samen')` krijgen `location = 'West'`. Omdat dit via de migratierol gebeurt, grijpt `current_user_location()` niet in.
- Migratie: triggers `foh_enforce_location_templates` en `trg_foh_tasks_loc` alleen nog `BEFORE INSERT`. Voor UPDATE een guard die een andere `location` alleen toestaat bij owner/manager. RLS blijft ongewijzigd.
- Controle: tellingen per vestiging en fase vóór en na de wijziging; daarna gaan de Playwright-agents parallel per module langs, voor beide vestigingen.
- De edge function `reset-daily-tasks` blijft hetzelfde.

Standaardisatie-suggestie: een dagelijkse controle om 04:05 die een melding (via n8n) stuurt als een vestiging 0 taken heeft.
