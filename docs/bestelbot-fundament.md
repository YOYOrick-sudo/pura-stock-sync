# Bestelbot — fundament, gedeeltelijke oplevering

## Toegevoegd
- Eén migratie: `drizzle/migrations/0032_bestelbot_fundament.sql` (door het beheerde migratiesysteem aangemaakt).
- Nullable bordkolommen: leverancier_id, artikel_id, bestelreferentie, besteld_via, match_zekerheid; geen defaults, geen backfill.
- Tabellen: artikel_aliassen, leverancier_artikel_vestiging, bot_instellingen, bot_audit_log, bestel_historie_import.
- Functies: bestelbot_normaliseer, bestelbot_leverancier_actief, bestelbot_koppeling_bewaken, rpc_zoek_artikel, bestelbot_aanroep_start, bestelbot_import_historie.
- View: v_bestel_historie_top, security_invoker=true.
- Uitbreidingen: pg_trgm, unaccent. Nieuwe normalisatie verwijdert accenten, hoofdletters en leestekens; exacte alias heeft score 1. Geen automatische artikelcreatie.
- Tien leveranciers en zestien vestigingsconfigregels uitsluitend toegevoegd waar ontbrekend. Zes voor beide vestigingen, vier alleen Midsland. Geen klantnummers of sleutels.
- Alleen aanvullend klein leverancierlabel op de bestellijst; bestaande hook en mutaties ongewijzigd.

## Geblokkeerd / niet gebouwd
**De edge function is niet gebouwd en niet gepubliceerd.** `BOT_BESTELBORD_TOKEN` ontbreekt. Yorick moet zelf een sterke unieke waarde toevoegen in **Project Settings → Secrets**. Niet in chat plaatsen; dezelfde waarde moet de externe bot gebruiken.

De bestaande trigger `set_updated_at_bestel_signalen` past `updated_at` bij iedere update aan. Dat botst met de eis dat botupdates uitsluitend de opgesomde kolommen wijzigen. Deze trigger is niet aangepast. Bord-POST en optioneel koppelen zijn niet gebouwd; expliciete toestemming nodig om het bestaande tijdstempelgedrag te behouden. Goedkeuring van het plan is niet behandeld als toestemming om deze harde beperking te versoepelen.

De service-only historie-import en rate-admission RPC zijn voorbereid, maar er is zonder edge function geen publieke bottoegang. Geen andere bestaande edge function, guard, RLS-policy, ordertabel of printer/n8n-flow gewijzigd. Lovable zou nieuwe bestanden in de functions-map automatisch beschikbaar maken; er zijn daarom geen nieuwe functiebestanden geschreven.

## Testen nu
1. Open de bestellijst als ingelogd teamlid van West/Midsland. Toevoegen, verpakking, afvinken en terugzetten moeten onveranderd zijn. Het leverancierlabel verschijnt alleen voor een gekoppelde regel; bestaande regels zijn niet gekoppeld.
2. Databasebeheer: voer `select * from public.rpc_zoek_artikel('West','falaf');` uit. Maximaal vijf kandidaten, scores 0..1, alleen die vestiging. Er zijn nog geen aliassen; bestaande artikelnamen dienen al als kandidaten.
3. Beheer kan aliassen toevoegen; `alias_norm` wordt door de nieuwe trigger ingevuld. Dezelfde genormaliseerde actieve alias mag niet tweemaal in één vestiging, wel onafhankelijk in de andere.
4. Hanos/In One/Drank Dozijn/Wielinga naar West koppelen moet geweigerd worden; Midsland kan wel. Artikel moet actief in de betreffende vestiging zijn. Nieuwe koppelingen/historie kunnen door de client niet hard verwijderd worden.
5. `bot_instellingen.bot_bestelbord_actief` staat op JSON-boolean true. Bij false blokkeert de toekomstige endpoint alle acties; handmatige bestellijst blijft werken.

## Later te testen na token en function
Geen endpoint bestaat nu, dus geen werkende URL suggereren. Verwacht contract: GET met verplicht `vestiging=West|Midsland` en Authorization Bearer; POST `actie=import_historie`, vestiging en maximaal 500 rijen. Een globale databasecontrole laat maximaal 60 aanroepen per rollende minuut toe. Beide RPC's zijn uitsluitend service-role uitvoerbaar; authenticated/anon niet. Import is transactioneel en dedupliceert ook bij een ontbrekend extern ordernummer. Audit van een mislukte import moet later door de edge function worden afgerond; een transactie die faalt kan haar eigen foutlog niet bewaren.

## Terugdraaien (down-opmerking, NIET uitgevoerd)
1. Eerst bot stoppen en eventuele data uit de vijf nieuwe tabellen veiligstellen. Down vernietigt nieuw opgebouwde historie; alleen na expliciete toestemming.
2. Alleen de nieuwe view, nieuwe triggers op nieuwe tabellen, nieuwe functies en vijf nieuwe tabellen verwijderen; nooit bestaande triggers/policies wijzigen.
3. Alleen de vijf toegevoegde bordkolommen en de nieuwe vestiging/status-index verwijderen, nadat koppelingen/referenties zijn veiliggesteld.
4. Alleen door deze opdracht toegevoegde leverancier/config-rijen terugnemen als ze nergens gebruikt worden en expliciet toestemming is gegeven. Geen bestaande leverancierdata verwijderen.
5. pg_trgm/unaccent niet verwijderen als elders gebruikt. Geen automatische down en geen Git-commit gemaakt.

## Grenzen
Geen daadwerkelijke bestellingen of advies. Geen bestaande borddata aangepast. Historie en audit groeien zonder automatische opschoning. Historie toont per vestiging/gekoppeld artikel (of ruwe naam als ongekoppeld) het aantal regels en de laatst bekende hoeveelheid, eenheid, verpakking en leverancier.

## Uitgevoerde verificatie
- Alle bestaande bordwaarden, bestaande policies en bordtrigger voor/na exact vergeleken: ongewijzigd. Alle tien bordregels hebben de vijf nieuwe velden nog NULL. Bestaande hook byte-identiek.
- Zeven integratietests in `tests/bestelbot.integration.py` geslaagd: normalisatie, bestaand product via typfout, ongeldige vestiging, clientweigering voor beide bot-RPC's, audit-insert en Hanos-West-koppeling. Veertien bestaande MEP/sluitrondetests geslaagd. Geen testdata aangemaakt.
- Falafel staat niet in de huidige canonieke artikelentabel; daarom is de positieve typfouttest `bloemko` → `Bloemkool`. Geen ontbrekend artikel aangemaakt.
- Ingelo gd desktop/iPad bekeken; jouw sessie toonde een lege lijst. Toevoegen/afvinken en het leverancierlabel op een echte gekoppelde regel zijn niet end-to-end getest, omdat dit bestaande operationele data zou wijzigen. Geen fouten in de nieuwste previewcontrole.
- Exacte aliasduplicaten, vestigingswissel met gekoppelde data, service-role-importtransacties en 60/61-rate-limit zijn nog niet daadwerkelijk gesimuleerd; ontbrekend token/endpoint en geen rollback-testtoegang. Niet als geslaagd gepresenteerd.
- Import met een gekoppelde inmiddels inactieve leverancier/artikel wordt momenteel geweigerd door de nieuwe koppelingstrigger. Historie kan met NULL-koppelingen en ruwe namen worden ingelezen; deze beperking expliciet bepalen vóór gekoppelde historie wordt geladen. Niet stil guards versoepelen.
- Beheerders mogen historie rechtstreeks toevoegen/wijzigen zoals gevraagd bij D; audit is alleen gegarandeerd voor de toekomstige bot-import, niet voor rechtstreeks beheer. Er is geen client-grant voor bot-audit schrijven.

Werkwijze: Bouwdiscipline.
## Update: bot-koppeling actief
- Functie `bot-bestelbord` staat live. Header `Authorization: Bearer <BOT_BESTELBORD_TOKEN>`.
- `GET ?vestiging=West|Midsland` → open regels.
- `POST {vestiging, actie:"bestellen", regels:[{id,bestelreferentie}]}` (max 100, idempotent).
- `POST {vestiging, actie:"koppel", id, leverancier_id, artikel_id, match_zekerheid}`.
- `POST {vestiging, actie:"import_historie", rijen:[...]}` (max 500, dubbel overgeslagen).
- Historie-import controleert alleen dat leverancier/artikel bij de vestiging hoort (niet of het nu actief is). Alleen de bot schrijft historie.
- Down (0033): drop bestelbot_lees_open/markeer_besteld/koppel/aanroep_afsluiten; herstel trigger-body en policies uit 0032.

## Update: Besteld & levering (0034)
- Nieuwe bordkolommen (nullable): verwachte_levering (date), geleverd_op, geleverd_door, levering_status ('geleverd'|'niet_geleverd'|'deels'), levering_opmerking, restant_van (zelf-FK). Status-CHECK toegevoegd: open/besteld/geleverd/vervallen. Index (vestiging, status, verwachte_levering).
- `bestel_verwachte_levering(vestiging, leverancier_id, besteld_op)`: eerstvolgende besteldag van de leverancier + leverdag_offset, anders morgen (Europe/Amsterdam); dichte dag van de vestiging → volgende open dag (via mep_is_open, max 14 vooruit). Trigger vult dit bij elke overgang naar 'besteld' als het leeg is — ook bij handmatig bestellen.
- `POST actie:"bestellen"` accepteert per regel optioneel `verwachte_levering` (YYYY-MM-DD, niet in verleden, max +30 dagen); antwoord per regel bevat `verwachte_levering`. Achterwaarts compatibel: zonder datum vult de server.
- `GET ?vestiging=...&status=besteld` (default `open`, andere waarde → 400) geeft bestelde regels met bestelreferentie, besteld_op, verwachte_levering, te_laat en dagen_te_laat (alleen open dagen tellen). Bot meldt achterstand, bestelt niet opnieuw. Open regels geven nu ook levering_opmerking en restant_van (herbestellingen).
- Nieuwe service-only RPC `bestelbot_lees_besteld`; `bestelbot_lees_open` opnieuw aangemaakt met twee extra kolommen; `bestelbot_markeer_besteld` uitgebreid (zelfde signatuur).
- App: tab 'Onderweg' op de bestellijst (Vandaag te checken / Onderweg / Zonder datum / Geleverd), per leverancier + ordernummer, 'Alles geleverd', niet/deels geleverd met opmerking; 'niet geleverd' en restant van 'deels' komen als open regel terug op het bord.
- Down (0034): drop trigger bestel_signalen_verwachte_levering en functies bestel_signalen_vul_verwachte_levering, bestel_verwachte_levering, bestelbot_lees_besteld; herstel bestelbot_lees_open/markeer_besteld uit 0033; verwijder de zes nieuwe kolommen, twee CHECK's en de leveringsindex.

## Kassa-verkoop per product (Lightspeed) — 29 okt 2026

Tabel `kassa_verkoop_dag`: per vestiging + werkdag (Europe/Amsterdam, kanteluur 06:00, gelijk aan `omzet_uren`) + `lightspeed_product_id` (= `items[].prodId`): productnaam, aantal, omzet_excl, omzet_incl. Alleen PAID-bonnen; retouren tellen negatief mee. Bron: `items[]` in `GET /resto/rest/financial/receipt`.

- Uurlijkse sync (`lightspeed-sync`, `type: auto`, window hot) vervangt gisteren en vandaag volledig.
- Inhaalslag: `POST lightspeed-sync {"type":"backfill_verkoop","vestiging":"West"}` verwerkt 7 dagen per aanroep vanaf 2025-01-01; voortgang in `sync_runs` (type backfill, details.doel = verkoop, state.cursor). Antwoord `klaar: true` = bij.
- `omzet_excl/incl` = `totalPrice(WithoutVat)` van de regel; kortingen (`discountPrice`) worden niet apart verrekend.

## Advies (0042) — 29 okt 2026
- Tabel `bestel_advies`: drankadvies per vestiging + leverdag. Lezen via `heeft_vestiging`; gebruikers mogen alleen `op_bord_regel_id` bijwerken; schrijven verder alleen service role.
- Functie `bestelbot_advies_vervangen` (alleen service_role): vervangt alle regels van vestiging+leverdag in één transactie, koppelt artikel/leverancier op exacte naam (hoofdletterongevoelig) en vorm (zelfde leverancier, anders standaard), behoudt `op_bord_regel_id` bij gelijk artikel+leverancier.
- Bot: `POST {actie:"advies", vestiging, datum, leverdag, regels:[{artikel, leverancier?, hoeveelheid, eenheid?, verwacht_verbruik?, onzeker?, reden?, artikel_id?, artikel_vorm_id?}]}` → `{ok:true, aantal, gekoppeld}`. Max 500 regels. Maakt geen bordregels en bestelt niets.
- UI: blok "Advies (nog niet besteld)" bovenaan het Bestelbord; "Op bord zetten" maakt een gewone open regel (of hoogt een open regel met dezelfde naam op).
