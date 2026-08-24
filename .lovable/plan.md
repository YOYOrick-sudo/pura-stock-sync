# Mise-en-place lijst (MEP) — bouwplan v3

Basis: recept-of-vrije-taak, nullable `recipe_id`, drie prioriteiten, drie views, slepen met @dnd-kit zoals de takenlijst. v3 verwerkt de drie aanvullingen (gesloten dagen, handeling per halfproduct, consistente vrije taken).

## A. Templates zijn core, geen sluitstuk

- Tabel `mep_templates`: vestiging, weekdag (of "dagelijks"), titel, `recipe_id` (nullable), `handeling` (nullable), aantal, eenheid, prioriteit, `sort_order`, `actief`.
- Een open dag wordt automatisch gevuld vanuit de templates van die weekdag. Geen knop.
- Elke dagregel kan met één actie ("elke donderdag") template worden.

## B. Openingsdagen — fundament, niet een randgeval

- **Eén bron van waarheid.** Vandaag staan gesloten dagen hardcoded in de afval-edge-function: `CLOSED_DOW` = Midsland ma+di, West wo, plus open-uitzonderingen (Midsland 15+16 juni 2026). Die kennis verhuist naar de database: `vestiging_opendagen` (vestiging × weekdag 0–6, open ja/nee) en `vestiging_sluitdatums` (losse datums met reden) plus open-uitzonderingen. Gevuld met de huidige waarden — **te bevestigen door jou of dit de actuele (zomer)situatie is**. De afval-function later laten meelezen is een losse opruimstap; geen tweede lijstje bijhouden.
- **De tweede tab heet niet "Morgen"** maar toont de **eerstvolgende open dag**, met de dagnaam als label ("Donderdag"; "Morgen" alleen als dat toevallig morgen is). Zoeken slaat gesloten weekdagen én sluitdatums over, maximaal 14 dagen vooruit.
- **Dagwissel, doorschuiven en de 17:00-standaard slaan gesloten dagen over.** In West landt dinsdag-restant op donderdag; templates van woensdag worden nooit geladen. De doorschuif-teller telt open dagen, niet kalenderdagen.
- **Gesloten ≠ geblokkeerd.** Een gesloten dag wordt alleen niet automatisch gevuld. Handmatig toevoegen kan altijd, met een rustige melding "West is deze dag gesloten".
- **Sluitdatum toevoegen op een dag die al gevuld is**: bij het opslaan van een sluitdatum verhuizen alle openstaande regels van die dag automatisch naar de eerstvolgende open dag (ontdubbeling uit C wordt toegepast), met melding "7 regels verplaatst naar donderdag" en één keer ongedaan maken. Afgeronde regels blijven staan waar ze staan, als historie.
- **Seizoenswissel** = de instellingen aanpassen. Geen aparte seizoenslogica.


## C. Twee tabs: Vandaag en eerstvolgende open dag

- **Tab Vandaag** = werkscherm. **Tweede tab** = vooruitplannen.
- Dagwissel om **04:00**, instelbaar per vestiging. De tweede tab wordt dan de nieuwe Vandaag, aangevuld met de weekdag-templates.
- **Ontdubbeling** bij dagopbouw: regels met dezelfde sleutel (titel + handeling, of hetzelfde recept + handeling) worden één regel — hoogste prioriteit wint, aantallen niet optellen (bestaande regel wint), badge blijft.
- **Doorschuiven = kopiëren**: het onafgeronde origineel blijft op zijn eigen dag staan; op de volgende open dag komt een nieuwe regel met `bron = doorgeschoven`, `doorgeschoven_van` en opgehoogde teller. Historie laat per dag zien wat gepland stond en niet af kwam.
- 3+ keer doorgeschoven krijgt aparte markering.
- **Slimme standaard bij toevoegen**: vóór 17:00 → Vandaag, na 17:00 → volgende open dag, met altijd een zichtbare toggle. Grens instelbaar per vestiging. Is vandaag gesloten, dan staat de standaard op de eerstvolgende open dag.
- **Handmatig verplaatsen**: elke regel met één knop naar de andere tab en terug. Swipe alleen als extra.
- **Opnieuw toevoegen na afronden**: botst een insert op de unieke index met een afgeronde regel, dan wordt die heropend en het aantal opgehoogd (`aantal_klaar` blijft staan: "3 van 5" wordt "3 van 8"). Nooit een stille fout.
- **Dagopbouw is idempotent en zelfherstellend.** De opbouw zit in één SQL-functie `mep_bouw_dag(vestiging, datum)` die veilig meerdere keren mag draaien: bestaat de regel al (zelfde sleutel), dan gebeurt er niets. Per vestiging + dag wordt in `mep_dagopbouw_log` vastgelegd dat de opbouw klaar is. De 04:00-cron roept de functie aan; **daarnaast roept de app hem bij het openen van de MEP-lijst zelf aan** wanneer er voor die dag nog geen log-regel staat. Cron is gemak, geen single point of failure — de keuken staat nooit voor een lege lijst.

## D. Handeling per halfproduct

- Nieuw **optioneel** veld `handeling` op planning én templates: bereiden / vacumeren / snijden / aanvullen / ontdooien — beheerbaar lijstje per vestiging (`mep_handelingen`, met `sort_order` en `actief`).
- Hetzelfde recept kan zo meerdere keren op één dag staan: "Döner — ontdooien" 's ochtends, "Döner — vacumeren" 's middags.
- Handeling verschijnt als badge naast de titel, en zit in:
  - de unieke index: `(date, location, lower(titel), coalesce(handeling,''))`
  - de ontdubbelregel bij dagopbouw
  - het heropen-gedrag bij conflict
  - de suggestie-chips (chip = titel + handeling)
- Leeg mag: een vrije taak zonder handeling blijft gewoon één regel.

## E. Vrije taken consistent houden

- Halfproduct zonder recept gaat via de vrije taak — geen modelwijziging.
- **Wel: autocomplete op eerder gebruikte titels** uit de historie van die vestiging (laatste ~6 maanden, ontdubbeld op `lower(titel)`, gesorteerd op frequentie), plus receptnamen in dezelfde lijst. Bij typen van "kip vac" komt "Kip vacumeren" bovenaan; een nieuwe titel aanmaken kan altijd, maar kost een extra bewuste tik ("+ Nieuw: …").
- Zo blijven ontdubbeling, chips en de latere analyse betrouwbaar.

## F. Realtime sync tussen tablets

- Realtime-subscription op `mep_planning` per vestiging + dag, bovenop React Query optimistic updates.
- Laatste schrijver wint per veld; afvinken is idempotent.

## G. Gedeeld keukenaccount

- Gedeeld, permanent ingelogd account per vestiging; sessie verloopt niet (`persistSession`, `autoRefreshToken`).
- RLS in lijn met `foh_tasks`: lezen/schrijven binnen eigen vestiging, met GRANTs.
- `foh_employees` krijgt `afdeling` (bediening/keuken); keukenteam West wordt in stap 1 toegevoegd. Geen tweede personentabel.

## H. Bestellingen-koppeling niet stilletjes breken

`titel` wordt verplicht, dus `create_mep_from_order` gaat mee in dezelfde migratie: productnaam als titel (ook zonder recept-match), `handeling` leeg, en `ON CONFLICT` op de nieuwe index met het heropen-gedrag uit C. Beide paden expliciet testen.

## I. Historie, slimmigheden, werkview

- Verwijderen = soft-delete (`deleted_at`); `completed_at`/`completed_by` altijd vullen.
- Suggestie-chips: 5 combinaties (titel + handeling) die de afgelopen 4 weken op deze weekdag het vaakst voorkwamen en vandaag ontbreken.
- Deelvoortgang per regel ("3 van 5 bakken"), voortgangsbalk per dag en per persoon, doorschuif-teller als signalering.
- Werkview: regels groot, afvinkdoel ≥56px, filter "mijn naam", zoekveld bovenaan, wake-lock zolang de view open staat.

## J. Datamodel (delta)

`mep_planning`: `recipe_id` nullable; `titel` verplicht; `handeling` (nullable); `prioriteit` (1/2/3); `aantal`, `eenheid`; `sort_order`, `sort_order_persoon`; `employee_id` → `foh_employees`; `aantal_klaar` (default 0); `completed_at`, `completed_by`, `deleted_at`; `doorgeschoven_van`, `doorschuif_teller`; `bron` (handmatig/template/bestelling/doorgeschoven). Unieke index `(date, location, lower(titel), coalesce(handeling,''))` waar `deleted_at is null`.

Nieuw: `mep_templates`, `mep_handelingen`, `mep_instellingen` (`dagwissel_uur` 04:00, `morgen_grens_uur` 17:00), `vestiging_opendagen`, `vestiging_sluitdatums`.

Helper in SQL: `mep_volgende_open_dag(vestiging, vanaf_datum)` — gebruikt door dagopbouw, doorschuiven en de tab-labels, zodat frontend en cron dezelfde definitie delen. `sort_order` in stappen van 10 met renumber-routine.

## K. Bouwvolgorde

1. Migratie: alle tabellen/kolommen hierboven, RLS + GRANTs, unieke index, `mep_volgende_open_dag`, `create_mep_from_order` herschreven, gesloten dagen en handelingen gevuld voor West/Midsland, keukenteam West in `foh_employees`
2. Hook + view "Alles" met de twee tabs: toevoegen (recept-of-vrij, autocomplete, handeling, slimme standaard + toggle), afvinken met deelvoortgang, slepen, prio, verplaatsen tussen tabs, dagopbouw uit templates + doorschuif-kopie + ontdubbeling, gesloten-dag-gedrag
3. Realtime sync
4. Werkview + voortgangsbalk
5. View "Per persoon" met eigen volgorde
6. Suggestie-chips + "opslaan als template" + beheer van handelingen/openingsdagen in settings

Nu bouwen: stap 1 t/m 4 voor West.

## L. Toets: een normale zondag in West

```text
04:00  dagwissel   -> zondag is open: templates zondag geladen; zaterdag-restant
                      gekopieerd naar zondag met badge "van gisteren"
08:00  binnenkomst -> Werkview op tablet, filter "mijn naam", wake-lock aan
09:00  prep        -> "Döner — ontdooien" afvinken; "Kip vacumeren" 3 van 5
12:00  bestelling  -> order uit Midsland valt binnen: regel via create_mep_from_order,
                      bron = bestelling, botst niet want andere titel
15:00  bijwerken   -> "Chimichurri" is op -> opnieuw toevoegen: heropent de afgeronde
                      regel en hoogt het aantal op
17:30  vooruit     -> nieuwe regel krijgt standaard tab "Woensdag" (ma+di gesloten),
                      toggle zichtbaar om alsnog vandaag te kiezen
22:00  sluiten     -> onafgeronde regels blijven op zondag staan; kopie verschijnt
                      woensdag 04:00, teller +1 (open dagen, dus niet +3)
```

Wat hier niet uitkomt, vangen we in week één in de praktijk.

## Bewust niet

Automatisch vullen op reserveringen, weer, verkoop of voorraad; AI-voorspellingen. Later, gevoed door de historie.
