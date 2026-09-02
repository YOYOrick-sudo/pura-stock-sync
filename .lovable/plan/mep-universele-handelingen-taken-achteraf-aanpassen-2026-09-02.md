# MEP: universele handelingen + taken achteraf aanpassen

## Wat er nu mis is
Een taak die je toevoegt (vrije invoer én recept) staat vast: je kunt achteraf niet meer wijzigen wie het doet, welke prioriteit het heeft of wát er met het item moet gebeuren. En er is geen manier om "lente-ui → snijden" of "zout → aanvullen" vast te leggen, omdat die items geen recept hebben.

## Het idee: handeling los van item
Elke MEP-regel wordt: **item + handeling**.

- Het **item** is een recept (Chimichurri mayonaise) óf vrije tekst (lente-ui, zout, kip).
- De **handeling** is universeel en geldt voor beide: Bereiden, Vacumeren, Snijden, Aanvullen, Ontdooien.

Die handelingenlijst bestaat al per vestiging in de database (5 handelingen voor West en Midsland) en is te beheren via instellingen. Zo kun je hetzelfde item op verschillende dagen met een andere handeling opvoeren ("lente-ui snijden" maandag, "lente-ui aanvullen" donderdag) en zie je in de lijst meteen wat er moet gebeuren.

## Wat je straks ziet

**Toevoegen (inline zoekveld, blijft zoals het is)**
1. Typ "lente-ui" → geen recept gevonden → rij "Nieuw: lente-ui".
2. Tik erop → taak staat direct in de lijst.
3. In hetzelfde kaartje verschijnen nu twéé rijen grote knoppen: eerst **handeling** (Snijden / Aanvullen / …), daarna **wie doet het**. Beide overslaan mag.

**Aanpassen achteraf**
Elke taakregel krijgt een tikbaar gebied (tik op de titel) dat een bewerkscherm opent met grote knoppen:
- Handeling (chips)
- Wie doet het (chips, incl. "Niemand")
- Prioriteit (Moet vandaag / Normaal / Als er tijd is)
- Aantal + eenheid
- Notitie en deadline

Opslaan is direct zichtbaar, ook op trage wifi, en synct naar de andere tablets.

**In de lijst**
De handeling staat als badge vóór/naast de titel ("Lente-ui · Snijden"). De weergavetabs worden: Per categorie · Per persoon · **Per handeling** — zo kun je in één keer alles zien wat gesneden moet worden.

**Snelknoppen "Vaakst gemaakt"**
Onthouden nu item + handeling samen, zodat "Lente-ui · Snijden" één knop wordt en niet botst met "Lente-ui · Aanvullen".

## Praktijk
- Werkt op de keuken-iPad: alles chips van minimaal 44px, geen dropdowns, één tik per keuze.
- Vergeet iemand de handeling? Dan blijft de taak gewoon staan zonder handeling — niets breekt.
- Bestaande taken van vandaag houden hun huidige gedrag; handeling is leeg tot iemand hem zet.
- Recepten met een methode (bijv. "Chimichurri · basis") houden hun methode; de handeling is een extra laag daarbovenop en verandert niets aan batches, stickers of houdbaarheid.

## Techniek
- Migratie: kolom `handeling text null` op `mep_taken` (+ index op `vestiging, taak_datum, handeling`). Geen datamigratie nodig.
- `src/hooks/useMepTaken.ts`: `handeling` in `MepTaak`/`MepTaakInput`, favorietensleutel uitbreiden met handeling, hergebruik van de bestaande `mep_handelingen`-query uit `useMepPlanning.ts`.
- `src/components/kitchen/MepTaakToevoegen.tsx`: na toevoegen eerst handeling-chips, dan medewerker-chips.
- Nieuw `src/components/kitchen/MepTaakBewerken.tsx`: bewerkscherm (sheet) met bovenstaande velden, schrijft via de bestaande `bijwerken`-mutatie.
- `src/pages/kitchen/MepDag.tsx`: handeling-badge, derde weergavetab, taakregel opent het bewerkscherm.
- Instellingen: handelingenbeheer (toevoegen/hernoemen/uitzetten, volgorde) zichtbaar maken op `/settings/mep` via de bestaande beheerhook.

## Testen (klikronde als owner, beide vestigingen)
1. Vrije taak "lente-ui" toevoegen → handeling Snijden → persoon kiezen → regel toont "Lente-ui · Snijden" met naam.
2. Regel openen → prioriteit naar "Moet vandaag", andere persoon, handeling naar Aanvullen → direct zichtbaar na sluiten en na herladen.
3. Recepttaak toevoegen → handeling zetten → afronden werkt nog en maakt batch/sticker zoals voorheen.
4. Tab "Per handeling" toont de juiste groepen; taken zonder handeling staan onder "Geen handeling".
5. Snelknoppen tonen item + handeling als aparte knoppen.
6. Tweede tablet-sessie: wijziging verschijnt via realtime.
