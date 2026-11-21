# Eilandbezorger Midsland: één Lightspeed-klant per gast

Liveverzending blijft uit. Bestaande testbestellingen blijven staan. In testmodus gaat niets naar Lightspeed, ook geen klantaanmaak.

## Wat er verandert

1. **Gastgegevens in het aanleverbericht**
   - Nieuw: `klant.voornaam`, `klant.achternaam`, `klant.email` en een optionele `klant.klantcode` van Eilandbezorger.
   - Het telefoonnummer van Karin (van Eilandbezorger zelf) wordt nooit als gastnummer opgeslagen of naar Lightspeed gestuurd.
   - `klant.naam` blijft werken voor oude berichten.

2. **Gast herkennen of aanmaken** (alleen in livemodus, vlak voor verzenden)
   - Volgorde: eerst een eerder vastgelegde koppeling (klantcode of e-mail). Anders in Lightspeed zoeken op het exacte e-mailadres.
   - 1 treffer: dat customerId gebruiken en koppeling vastleggen.
   - 0 treffers: klant één keer aanmaken en koppeling vastleggen.
   - Meerdere treffers, of naam die niet bij het e-mailadres past: bestelling krijgt status "ter beoordeling" met een reden. Er wordt niets verstuurd.
   - Twee bestellingen tegelijk voor dezelfde gast maken samen één klant. Daarvoor krijgt de klantkoppeling een unieke sleutel per e-mailadres en een vergrendeling per gast.

3. **Opmerking bij de bestelling**
   - Karins `opmerking` gaat ongewijzigd in het Lightspeed-veld `note`.
   - Het Eilandbezorger-bestelnummer blijft apart in `externalReference` en `description`.
   - Geen gastnaam of telefoon meer in de notitie. De naam komt via het klantprofiel. De opmerking wordt alleen bij de bestelling bewaard, niet bij de klant.
   - De order gaat naar de route met het customerId van de gast in plaats van de vaste klant "Eilandbezorger".

4. **Tests (lokaal, zonder Lightspeed)**
   - Een nieuwe gast bestelt twee keer, met "Saus apart" en daarna "Geen bestek". Dan ontstaat één klantprofiel, krijgen beide orders hetzelfde customerId en bevat elke order alleen zijn eigen notitie.
   - Gelijktijdige en herhaalde aanlevering leveren geen dubbele klant en geen dubbele order op.
   - Meerdere treffers of tegenstrijdige gegevens leiden tot "ter beoordeling".
   - In testmodus vindt geen enkele aanroep naar Lightspeed plaats.
   - Het telefoonnummer komt nergens in het bericht voor.
   - Bij 3× friet sturen we €21,00 als betaling mee.

5. **Voorbereiding fysieke proef**
   - Een nieuw bestelnummer, 3× Zoete Aardappel Friet (PV-FFA8275F) met opmerking "Saus apart". Die wordt pas verstuurd als jij live aanzet.
   - Een checklist met de slaagcriteria. Naam en notitie zijn leesbaar op keukenbon en klantbon. De keukenbon verschijnt één keer. €21,00 staat op "Eilandbezorger – vooraf betaald" en er staat €0,00 open.

## Wat je daarna van mij krijgt
- Een kort bericht voor Karin met de nieuwe klantvelden en één fictief voorbeeld.
- Een lijst met handelingen in de Lightspeed-backoffice: de betaalwijze-ID en het type ervan, welke printerinstellingen je controleert (online orders naar de keukenprinter, klantbon met klantnaam en notitie, één keer printen) en de instelling voor automatisch accepteren en voltooien.

## Risico's
- **Klant zoeken en aanmaken is nog niet bevestigd door Lightspeed.** De route uit de documentatie is nog niet getest, en Lightspeed weigerde eerder tijdelijk verzoeken omdat het er te veel waren. Dit blijkt pas bij de eerste liveproef. Tot die tijd valt de bestelling bij twijfel op "ter beoordeling" en wordt er niets dubbel aangemaakt.
- **Gastgegevens zijn persoonsgegevens.** Ze worden alleen server-side bewaard en zijn zichtbaar voor eigenaren.
- **Betaling als lijst is nog een aanname.**

## Technisch
- Migratie (alleen toevoegingen):
  - Tabel `externe_klant_koppeling` (vestiging, e-mail in kleine letters, klantcode, lightspeed_customer_id), met unieke sleutels per vestiging plus e-mail en per vestiging plus klantcode. RLS alleen voor eigenaren en de service role.
  - Status `ter_beoordeling` toegestaan maken, met kolommen voor de gastvelden op `externe_bestellingen`.
- `eilandbezorgerLogica.ts`:
  - Schema uitbreiden.
  - Pure functie `kiesKlant(koppeling, treffers, gast)` die `gebruik`, `aanmaken` of `beoordelen` teruggeeft.
  - `orderbericht` aanpassen: note is alleen de opmerking, het customerId komt per order mee en telefoon gaat er niet in.
- `eilandbezorgerVerzend.ts`:
  - Klantstap vóór de orderpoging, met een lease per gast. Na het aanmaken eerst opnieuw zoeken, zodat er geen tweede klant ontstaat.
  - Bestaande poginglog en statusovergangen blijven werken.
- Nieuwe Deno-tests in `_shared/`. Alleen de twee Eilandbezorger-functies worden gedeployed en er komt geen live-aanroep. `docs/eilandbezorger-aansluiting.md` wordt bijgewerkt.
