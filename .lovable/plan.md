# Gericht herstel van de eerste Ginger Beer-proef

## Bevestigde diagnose
Read-only gecontroleerd: de bestaande rij `3c06328f-e0f1-4a10-8959-cad39ac7ab01`, referentie `PV-PROEF-MID-20261122-GB01`, staat op `geblokkeerd`, versie **3**, met reden **“Proefinhoud of vaste klantconfiguratie is gewijzigd.”** Alle pogingen voor de order: **0**; permanente poging-ID: **afwezig**. `lightspeed_order_id` en `orderbericht` zijn beide `null`.

De opgeslagen productregel bevat exact de zes verwachte velden, inclusief PLU `Kd-a11`. De jsonb-volgorde begint met `naam, aantal, extras`; de opgebouwde regel begint met `lightspeed_product_id, lightspeed_plu, naam`. De huidige `JSON.stringify`-vergelijking behandelt die sleutelvolgorde ten onrechte als inhoudsverschil.

Huidige configuratie: vaste klant **13597022**, betaalwijze **285794/type 4**, `customer_order`, venster **45 minuten**, gewone livevlag **false**. Opgeslagen ophaaltijd: **22 november 2026 16:38:29.908 Amsterdam**.

## 1. Alleen de vergelijking herstellen
- Hergebruik het bestaande recursieve sleutel-sorteringspatroon uit `eilandbezorgerLogica.ts` voor een gedeelde vergelijking van JSON-inhoud. Alleen object-sleutelvolgorde is irrelevant; arrayvolgorde blijft exact, ook genest. Geen conversie van waarden, ontbrekend/null, extra velden, getallen/strings of andere inhoud.
- Pas die vergelijking toe op **beide** JSON-objecten in `exacteProef`: opgeslagen invoer en productregels. Valideer ook de onbewerkte opgeslagen invoer, zodat het schema geen extra of afwijkende velden stilzwijgend kan wegfilteren voor de exactheidscontrole.
- Bestaande vingerafdrukken en gewone bestel-/duplicaatlogica blijven byte-equivalent in gedrag. Geen nieuwe library.

## 2. Afzonderlijk afgeschermd hervatten voorbereiden
Dit onderdeel vraagt expliciet akkoord via deze plankaart; **akkoord is geen uitvoeropdracht**.

- Voeg binnen de bestaande eigenaaractie een expliciete vaste hervattingskeuze toe, zonder vrije bestellinginvoer. Geen automatische hervatting bij een herhaalde normale proefaanroep.
- Alleen de **eerste bestaande rij** hierboven komt in aanmerking: exacte UUID/referentie, bron/merchant/modus, oorspronkelijke invoer en vingerafdruk, oorspronkelijke toestemming van Yorick, versie 3, exacte vóór-verzendreden en status `geblokkeerd`. Controleer het bestaande auditpad `ontvangen → verzenden → geblokkeerd`; iedere andere geschiedenis blokkeert.
- Vereis opnieuw een actieve eigenaar en expliciete bevestiging, datum **22 november 2026 Amsterdam**, live **false**, vaste klant **13597022**, betaalwijze **285794/type 4**, exacte actieve Ginger Beer-mapping inclusief PLU, 1 stuk en 490 cent, ongewijzigde route/venster en alle overige opgeslagen waarden. Geen nieuwe klantkeuze of configuratiewijziging.
- Controleer zowel de permanente poging-ID `3c06328f-e0f1-4a10-8959-cad39ac7ab02` als **alle pogingen, ongeacht soort of uitkomst**, voor deze order: beide moeten afwezig zijn. Iedere leesfout, externe order-ID, opgeslagen uitgaand bericht of ander verzendspoor blokkeert. Ook vóór de daadwerkelijke POST controleren dat alleen de door deze hervatting nieuw geclaimde permanente poging bestaat.
- Claim uitsluitend deze bestaande rij atomair via status/versie én de exacte blokkadevoorwaarden; behoud UUID, referentie, invoer, oorspronkelijke toestemming en afhaaltijd. Alleen claimwinnaar gaat verder via de bestaande gedeelde verzender en de blijvende unieke poging-ID. Voeg een auditregel voor de expliciete hervatting toe; geen reset, wissen, nieuwe order of tweede referentie.
- Een tweede gelijktijdige hervatting verliest de claim. Na claim of poging volgt nooit automatisch herhalen, ook niet bij weigering, time-out of een storing vóór verzending. Geen hervatting vanuit een andere status/versie.

## Bestanden en uitrol na akkoord
Categorie: beveiligde servercode met mogelijke latere schrijfimpact.

- `_shared/eilandbezorgerLogica.ts`: gedeelde inhoudsvergelijking, bestaand sorteringsgedrag behouden.
- `_shared/eilandbezorgerProef.ts`: exacte JSON-controles en vaste eerste-proefvoorwaarden.
- `eilandbezorger-beheer/proef.ts` en `index.ts`: afzonderlijke owner-only hervattingskeuze en atomaire claim.
- `_shared/eilandbezorgerVerzend.ts`: controle op eerdere pogingen en behoud van permanente idempotentie.
- Gerichte lokale tests, aansluitinstructie, `AGENTS.md` en `roadmap.md` bijwerken.
- Geen tabellen, migraties, RLS, instellingen, frontend, gewone bestelstroom of partnerroute wijzigen. Alleen de minimaal betrokken eigen functie(s) uitrollen met hun gedeelde code; alle relevante bestaande tests opnieuw uitvoeren.

## Verificatie vóór oplevering
- Gebruik de werkelijk uitgelezen jsonb-teksten als lokale fixtures, inclusief alle zes productvelden. Bootst opslag/uitlezing na met een jsonb-roundtrip; object-sleutelvolgorde mag geen fout geven, inhoudsverschil wel. Een eventuele echte database-roundtrip uitsluitend met read-only `SELECT`, geen testrecords.
- Tests voor strikte waarden, ontbrekende/extra velden, nested objecten en arrayvolgorde. Afzonderlijke negatieve tests voor klantkaart, betaalwijze, product/PLU, prijs, aantal, toestemming, datum en venster.
- Twee parallelle hervattingen van de jsonb-teruggelezen eerste rij: één atomaire winnaar, maximaal één nagebootste POST, één blijvende poging en dezelfde order-ID/invoer.
- Iedere eerdere poging (ook teruglezen of `niet_verstuurd`), permanente poging-ID bij een andere order, uitgaand bericht, order-ID, verkeerde status/versie/reden/auditgeschiedenis of leesfout: **nul POSTs**. Ook verlies van antwoord of latere herhaling: geen tweede POST.
- Alle tests lokaal met nagebootste kassa; in deze voorbereiding geen eigenaaractie of Lightspeed-aanroep uitvoeren.

## Concrete gevolgen en grenzen
De oorspronkelijke afhaaltijd blijft exact staan. Met het huidige venster vervalt de mogelijkheid om deze rij veilig te hervatten **na 17:23:29.908 Amsterdam vandaag**, ook al is de kalenderdag nog niet voorbij. Geen tijd aanpassen of venster vergroten om dit te omzeilen; na verloop uitsluitend blokkeren en rapporteren.

Bij een storing na de atomaire claim kan deze proef ongezonden blijven. Dat is bewust veiliger dan een dubbele keukenbon. Gewone Eilandbezorger-orders blijven uit; historie blijft bewaard. Bonafdruk en automatisch afslaan blijven pas fysiek te bevestigen.

**Nu:** alleen plan, geen codeherstel, deploy, databasewijziging of POST. **Na planakkoord:** herstel bouwen, lokaal testen en minimaal uitrollen; daarna opnieuw wachten op Yoricks afzonderlijke expliciete opdracht om uitsluitend deze ongezonden eerste proef te hervatten.