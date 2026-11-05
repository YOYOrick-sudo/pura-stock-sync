# Review Klus 15 – Eén artikelstam (alleen advies, niets gebouwd)

Getoetst op 5 nov aan het live schema, de RLS-regels en de code. Niets gewijzigd.

## Oordeel
De richting klopt: `artikelen` als stam, additief koppelen, facturen in schaduw. Het plan onderschat twee dingen: **de huidige RLS is op prijzen en stamdata te open**, en **de werkvloerfases (stickers/MEP) raken de printflow eerder dan nodig**. Ik zou het plan kleiner knippen.

## 1. Klopt het plan met schema en code?
- Bevestigd: `sticker_producten`, `mep_taken`, `koelcel_check_items`, `voorraad_artikel`, `bain_marie_bakken` en `print_jobs` hebben **geen `artikel_id`**. `print_jobs` heeft alleen `recipe_id`, `label_omschrijving`, `zpl`, `vestiging`. `artikel_vormen` heeft `inhoud_basis` en `vestiging`, **geen `ean`**. `prijs_waarneming` heeft `geverifieerd` maar **geen `artikel_vorm_id`**.
- `leverancier_artikelen` (leeg) wordt nog gelezen in `useVoorraadModule.ts`, `useKeten.ts`, `useBestelronde.ts` en `LeveranciersTab.tsx`. Opruimen is dus codewerk in vier plekken, niet alleen een view.
- `sticker_producten` wordt geschreven via `sticker_producten_bump` in `useStickerProducten.ts`; die RPC accepteert geen bain-type (bekend uit de dubbele-stickerfix). Een nieuwe `artikel_id`-route moet die uitzondering behouden.
- Plan noemt "globale alias: `vestiging` NULL". De leesregel op `artikel_aliassen` is `heeft_vestiging(auth.uid(), vestiging)`; met NULL ziet **niemand** die alias. Dat vraagt een policywijziging, niet alleen semantiek.
- Ontbreekt in het plan: `bot-bestelbord` (v2 werkt al op `artikel_vorm_id`), `kooyman-ontvangst-sync`, `keuken_telartikel`/telpool, `voorraadproef`, interne levering en de vestiging **Test**. Elke nieuwe zoek-RPC en elk nieuw tabel moet Test als derde vestiging aankunnen.

## 2. Risico's per module
- **Stickerprinter/print-bridge**: grootste risico. Nieuwe kolommen op `print_jobs` zijn veilig zolang `claim_next_print_job` en de bridge ongewijzigd blijven en het ZPL-pad niet afhangt van de nieuwe velden. Een partij die bij herdruk andere datums kiest is direct een voedselveiligheidsfout. Houd de vrije-tekstinvoer als fallback werkend.
- **MEP**: `mep_taken` heeft beheer-policies voor manager/owner; teamleden die afronden en printen schrijven elders. Partij aanmaken bij afronden mag de afrondmutatie niet blokkeren bij haperende wifi (eerst afvinken, partij los en idempotent).
- **Bestelbord**: `bestel_signalen` is hard limiet; koppelen van open regels kan dubbel bestellen veroorzaken met restwaarschuwingen en bot-v2. Alleen nieuwe regels koppelen, oude laten.
- **Koelcel**: `product_sleutel` stuurt bestaande routering (groente/fruit-ketenregel, blauwe bessen, tahinidressing). `artikel_id` erbij mag die sleutel niet vervangen in fase 3.
- **Drank**: `voorraad_artikel` hangt aan Lightspeed-verbruik en drankadvies; koppelen is laag risico mits het alleen een extra kolom is.
- **Facturen/kostprijs**: `v_gerecht_kostprijs` leunt op `v_prijs_aankoop` + `inhoud_basis` (72/712). Elke wijziging aan die view verandert direct kostprijzen.

## 3. Wat ik eenvoudiger zou doen
- **Geen `productie_partij` in fase 1.** Begin met gestructureerde velden op `print_jobs` (artikel_id, bereid_op, tht_op, herdruk_van). Herdruk = kopie van de oude job. Partijtabel pas als MEP er echt om vraagt.
- **`artikel_houdbaarheid` eerst als simpele tabel** (artikel, toestand, dagen, goedgekeurd_door). Bewaarconditie/versie later.
- **Geen `artikelen.status` concept** in fase 1; concept leveranciersregels in `koppel_voorstel` houden de stam schoon.
- **Factuurroute pas na UBL-voorbeelden**, en eerst alleen Kooyman of Bidfood. Drive-intake is een afhankelijkheid van een bot; prima als start, maar maak ontbreken van documenten zichtbaar.
- Fase 6 (vormen splitsen per vestiging) waarschijnlijk niet doen: het huidige model werkt met RLS per vestiging; splitsen raakt bot-v2, bestelbord en policies tegelijk.

## 4. Volgorde en migratierisico (gedeelde database)
Voorgestelde volgorde:
1. **RLS dichtzetten op prijzen en stam** (zie 5) – vóór alles, want nieuwe prijsfeiten maken het lek groter.
2. PR #8 zoeken (frontend en migratie samen publiceren).
3. Alleen nullable `artikel_id`-kolommen + `artikel_zoek` + `koppel_voorstel`. Geen gedrag.
4. Koppelvoorstellen voor stickers/koelcel/drank (data, met log en OK).
5. Stickers op stam voor één productgroep, achter vlag, print-bridge ongewijzigd.
6. MEP-resultaatartikel, daarna pas partij.
7. Factuur-schaduw één leverancier; 8. prijzen live.

Migratierisico's: preview en live delen één database, dus elke kolom/RPC staat direct live onder de oude bundel. Nooit RPC-signaturen wijzigen (nieuwe `_v2`, zoals bij bot-bestelbord). Geen NOT NULL of triggers op `print_jobs`/`mep_taken` die de oude bundel kunnen laten falen. Elke data-koppeling met samenvoeglog en zonder testrijen in echte tabellen.

## 5. RLS – wat nu te open is
- `prijs_waarneming`: **SELECT `true` voor elk ingelogd account**. Teamleden en keukentablets kunnen alle inkoopprijzen lezen. In strijd met de regel dat staff geen inkoophistorie ziet.
- `artikel_vormen`: SELECT per vestiging, inclusief **prijskolommen** – staff op eigen vestiging ziet prijzen.
- `artikelen`: **INSERT en UPDATE `true`** voor iedereen ingelogd. Elk account kan stamnamen wijzigen; met één stam voor alles wordt dat één fout voor alle modules.
- `sticker_producten`: INSERT/UPDATE `true` (acceptabel als telling, niet als bron van houdbaarheid).
- `print_jobs`: SELECT `true` over alle vestigingen.
- `horeko_artikelen`: SELECT `true` (bevat prijs-/catalogusdata).
- Goed: `bestel_historie_import` alleen inkoopbeheerder; schrijven op vormen/aliassen afgeschermd.

Nodig: prijzen alleen via security-definer RPC/view met rolcheck (owner/manager), stam-UPDATE alleen beheerders, aliaspolicy die NULL = globaal toestaat, nieuwe tabellen (`koppel_voorstel`, `artikel_houdbaarheid`, `inkoop_document*`) met policies per vestiging inclusief Test, en `artikel_zoek` die prijs alleen meegeeft bij prijsrecht.

## 6. Wat mist of klopt niet in de ChatGPT-review
- Controleerde geen RLS; mist dat prijzen en stamwijzigingen nu al open staan.
- Mist de gedeelde productiedatabase en het signatuurprobleem van RPC's onder een oude bundel.
- Mist print-bridge/`claim_next_print_job` en de bain-uitzondering bij `sticker_producten_bump`.
- Mist de NULL-vestiging-valkuil voor globale aliassen.
- Mist Test-vestiging, bot-bestelbord v2 en koelcelrouting via `product_sleutel`.
- Partij is terecht, maar te vroeg; HACCP-nuance is terecht. Wel klopt het advies over trigram, documentidentiteit en echte schaduw.

## Top 5 adviezen
1. Eerst RLS herstellen: prijzen afschermen, stam-UPDATE alleen beheerders.
2. Printflow blijft onaangeroerd; alleen extra velden op `print_jobs`, herdruk kopieert datums.
3. Alleen additief en met `_v2`-RPC's; nooit iets wat de live bundel breekt.
4. Begin klein: één productgroep stickers, één leverancier facturen.
5. Vul `inhoud_basis` voor de top-artikelen vóór welke prijsautomatisering ook.

## Advies per open vraag
1. Houdbaarheid: ja, goedgekeurde standaard; kortere partij overschrijft niet; printhistorie alleen voorstel.
2. Prijzen: ja, maar pas na RLS-fix, schaduwfase en met verplichte `inhoud_basis`.
3. Drive eerst: ja, met zichtbare melding als er een week niets binnenkomt.
4. UBL: eerst echte leveranciers inventariseren, dan voorbeeldfactuur + credit vragen.
5. Samenvoegen: alleen bij gelijke specificatie, altijd met alias en herstel-log; granaat-groep via review.
