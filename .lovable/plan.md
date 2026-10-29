# Besteldeadline: registratie en rustige hint

## Afbakening
- Alleen de preview aanpassen; niet publiceren en het openstaande rollenplan niet uitvoeren.
- De aangeleverde SQL is volgens jouw bevestiging al uitgevoerd. Leg de volledige tekst exact vast in één nieuw bestand `supabase/migrations/20261029204100_besteldeadline_leveranciers.sql`; niet opnieuw uitvoeren en geen andere databasewijzigingen doen.
- Alleen de leverancierskoppen in Op het bord, Advies en Onderweg krijgen een deadlinebadge. Geen andere schermonderdelen, RLS, tabellen of functies aanpassen.

## Wat het team ziet
- Naast de leveranciersnaam één kleine, rustige badge met het bestaande klok-icoon en bestaande muted badge-stijl; geen knop of tooltip.
- Alleen bij een actieve besteldag voor vandaag met een ingevulde deadline voor de gekozen vestiging.
- Vóór de deadline: `vóór 21:00` (de ingestelde tijd). Vanaf de deadline: `morgen` of de korte naam van de eerstvolgende actieve besteldag, bijvoorbeeld `zo` of `ma`.
- Europe/Amsterdam bepaalt dag en tijd; eens per minuut herberekenen. Geen extra handeling voor het team.

## Technische uitvoering
- **Registratie:** één nieuw migratiebestand met de SQL bytegetrouw overgenomen; dit is historische vastlegging, geen nieuwe uitvoering.
- **Data-lezen + weergavelogica:** een kleine, afzonderlijke read-only hook leest uitsluitend `leverancier_besteldagen`, gefilterd op `actief = true`, `deleted_at IS NULL` en de actieve `vestiging`. De querysleutel bevat de vestiging; geen terugval op een andere vestiging of algemene rijen.
- Een zuivere helper berekent de hint, inclusief seconden in de deadline en weekovergang, met de bestaande datumhulpmiddelen. Een lokaal interval van 60 seconden ververst de klok en wordt opgeruimd bij verlaten van de pagina.
- `Bestelbord.tsx` geeft hints door aan `BordTabel.tsx`, `AdviesTabel.tsx` en `OnderwegTabel.tsx`; een kleine gedeelde deadlinebadge binnen deze module gebruikt de bestaande Badge en Clock. Leverancier-ID is de koppeling, niet een losse overeenkomst in namen.
- Gebruik het bestaande `naam`-veld van GroepRij voor naam + badge; de gedeelde GroepRij en overige schermen blijven ongewijzigd.
- Bestellen, leverdatumberekeningen, bestaande mutaties en groepsindeling blijven ongewijzigd. Nieuwe tests volgen de bestaande Bun-teststructuur; geen nieuwe libraries.

## Risico's en controles
- Bij een leesfout geen mogelijk verkeerde deadline tonen; bestaande bestelfuncties blijven bruikbaar. Een badge is alleen een hint, geen blokkade of bestelling.
- Kooyman zonder deadline, ontbrekende besteldag en andere vestigingen krijgen geen badge. Bestaande orders en voorraad worden niet aangepast.
- Tests: vóór/op/na 21:00, morgen, korte weekdag, volgende week dezelfde dag, null/ontbrekende deadline, vestigingsscheiding, winter-/zomertijd en NL-middernacht.
- Draai de relevante tests en ontwerpcontrole; controleer de preview op desktop en iPad zonder bestellingen, tellingen of andere writes te doen. Eventueel ontbrekende sessietoegang expliciet melden; geen echte testregels aanmaken.
- Vergelijk het nieuwe migratiebestand met de aangeleverde SQL en controleer dat het alleen de drie genoemde CREATE OR REPLACE-functies bevat.