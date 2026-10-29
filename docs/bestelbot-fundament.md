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