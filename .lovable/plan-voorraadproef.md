# Plan — voorraadproef + lichte leercurve

**Status: goedgekeurd; uitvoering met ontvangst-daggrensaanpassing van 29 oktober 2026.** `.lovable/plan.md` en de andere plannen blijven staan.

## 1. Praktijk en harde grenzen

Op West en Midsland telt de bediening op woensdag vóór opening drie proefartikelen, op telefoon/iPad. De medewerker vult alleen lege velden per opslagplek in. Pas na opslaan en eventueel blind hertellen verschijnen berekende stand en verschil. De proef staat in een inklapbaar blok **Even tellen (proef)** op het Bestelbord, onder Advies; niet op de takenlijst. Bediening/Keuken is een rustige rolkeuze; Keuken bevat aanvankelijk geen proefartikelen.

Nieuwe afspraak: alle koffiebonen behalve decaf samen tellen, inclusief open zakken en hopper; Fritz ook in koeling én magazijn. Niets ingevuld: **voorraad onbekend**, nooit nul. Een vergeten woensdagtelling geeft de badge **tellen**; geen automatische taak of bestelling. Bij verbindingsproblemen blijft invoer staan, verschijnt een fout en kan dezelfde telling met hetzelfde `bron_ref` opnieuw worden aangeboden.

Alleen voorstellen: nooit automatisch bestellen, versturen, voorraadverlies boeken, koppelingen veranderen of `verbruiksopslag_pct` verhogen. Bestaand Advies, bordregels, zoeken, vormen, prijzen, snelkeuze en bot-acties behouden hun gedrag. `foh_tasks`, takenlijst, hun triggers/policies en `rpc_zoek_artikel` blijven onaangeraakt. Bestaande tabellen uitsluitend additief, maar voor deze proef zijn daarin geen nieuwe kolommen nodig. Geen nieuwe libraries, publieke toegang of publicatie.

**Classificatie:** nieuwe schema/data/RLS; nieuwe berekeningslogica; beperkte Bestelbord-UI; achterwaarts compatibele uitbreiding van alleen bot-actie `advies`.

## 2. Eerst controleren, dan toevoegen

Gelezen: `telrondes`/`telronde_regels` worden al gebruikt door `useBestelronde.ts` en `useVoorraadModule.ts`. Ze zijn geen vrije tabellen: tellingen vereisen een canoniek artikel en horen bij leverancier/interne route. Koffie is een groep bonensoorten, en de proef vereist plekken, blind hertellen en een zelfstandig telanker. Daarom **nieuwe tabellen**, geen hergebruik of wijziging van de bestaande telrondes.

Live schema en policies zijn alleen gelezen. Historie gebruikt `besteldatum`, `leverancier_naam_ruw`, `artikel_naam_ruw`, `extern_ordernummer`; bordregels hebben `bestelreferentie`, `geleverd_op`, `levering_status`, `restant_van` en `artikel_vorm_id`. Verkoop en importhistorie hebben strengere leesrechten dan gewone bordregels. Die rechten blijven intact.

Vóór uitvoering: actuele kolommen, grants, helpers, PostgreSQL-versie, bestaande objectnamen, ontvangstmatches en product-id's opnieuw controleren. Geen gokconversies of ontbrekende ids stil aanvullen.

## 3. Nieuwe tabellen en toegangsrechten

Eén additieve schema-migratie via de migratietool; seed daarna als afzonderlijke data-inserts. Alle nieuwe tabellen: UUID-identiteit waar nodig, expliciete grants vóór RLS/policies, foreign keys alleen naar publieke tabellen, vestiging exact `West`/`Midsland`. Relaties naar proefartikelen moeten dezelfde vestiging hebben; geen toegang tot een andere vestiging via een meegegeven id.

| Object | Inhoud en unieke sleutels |
|---|---|
| `voorraad_artikel` | Alle gevraagde velden: vestiging, naam, tel_eenheid, telrol bediening/keuken, bestelbuffer numeric, verbruiksopslag_pct numeric default 0, opslagplekken jsonb met naam/eenheid/factor, telmoment, actief, notitie. Uniek vestiging+naam. |
| `voorraad_ontvangst_koppeling` | Proefartikel, leverancier_naam (ILIKE), regex naam_patroon, uitsluit_patroon, artikel_id nullable, factor in tel-eenheden per besteld aantal. |
| `voorraad_verbruik_koppeling` | Proefartikel, Lightspeed-product-id text, factor. Uniek proefartikel+product-id. |
| `voorraad_telling` | Alle gevraagde velden; moment voor_opening/na_sluiting, per_plek, totaal, berekend_op_moment nullable, hertelling_van, betrouwbaar, geteld_door, uniek bron_ref. Server valideert totaal uit plekken/factoren en identiteit. |
| `voorraad_correctie` | Id, proefartikel, datum, hoeveelheid met teken, soort transfer/breuk/uitval, notitie, uniek bron_ref. Alleen handmatige eigenaarinvoer, geen automatisch verlies. |
| `advies_log` | Alle gevraagde velden; artikel_id en voorraad_artikel_id nullable; gegevens jsonb; methode_versie; werkelijk_besteld/later_verkocht/later_geteld/afwijking nullable; bijgewerkt_op. Uniek vestiging+leverdag+artikel+methode_versie, `NULLS NOT DISTINCT`. |
| `voorraad_periode` | Proefartikel, begin_telling_id, eind_telling_id, begin/einddatum, begin, ontvangen, correcties, kassa, eind, onverklaard, pct_van_kassa, bijgewerkt_op. Uniek proefartikel+begin_telling_id. |
| `leer_voorstel` | Alle gevraagde velden; onderwerp, proefartikel/artikel, soort, huidige/voorgestelde waarde, onderbouwing, open/akkoord/afgewezen, beoordeeld_door/op, created_at. Eén open voorstel per vestiging+onderwerp+soort; vestiging opnemen voorkomt botsing tussen locaties. |

**Rechten:** geen grants aan anon/PUBLIC. Authenticated leest nieuwe proefgegevens uitsluitend via `heeft_vestiging(auth.uid(), vestiging)` of de gekoppelde proefartikelvestiging. Instellingen/correcties alleen owner, met bestaande veilige rolhelper; admin alleen indien bestaande owner-guard die alias al toestaat. Geen rollen op profiles of client-opslag.

Authenticated krijgt alleen INSERT op invoerkolommen van `voorraad_telling`, geen UPDATE/DELETE of schrijfrecht op berekende velden. `geteld_door` komt van `auth.uid()`. Een nieuwe trigger/functie op uitsluitend de nieuwe tellingtabel berekent na insert de snapshot en betrouwbaarheid; de medewerker kan die niet zelf bepalen. Het scherm schrijft uitsluitend tellingen. Eigenaars krijgen bij voorstellen alleen `UPDATE(status, beoordeeld_door, beoordeeld_op)`; die beoordeling past **geen** instelling toe. Logs/periodes worden alleen door service_role geschreven. Testdata opruimen via bevoegde servertoegang, nooit echte tellingen verwijderen.

**Views en financiële bescherming:** nieuwe views krijgen `security_invoker=true`; gewone medewerkers krijgen geen toegang tot ruwe kassa, omzet of importhistorie. Omdat die bronpolicies voorraadberekening voor staff blokkeren, gebruikt de voorraadview een kleine afgeschermde SECURITY DEFINER-leeshulp: vaste search_path, servercontrole `heeft_vestiging`, uitsluitend proefartikelbewegingen/tel-eenheden van de eigen vestiging teruggeven, nooit prijzen, omzet of ruwe bonnen. Alleen benodigde execute-grants; geen vrijblijvende definer-view die RLS omzeilt. Advies-/voorstelviews beperken zich tot eigen vestiging en de gevraagde samenvattingen.

## 4. Bewegingen, stand en dubbeltelling

`v_voorraad_bewegingen` geeft proefartikel, vestiging, datum, soort, getekende hoeveelheid, bron_ref en bronkwaliteit terug:
- Historie: `hist:<id>`, match leverancier ILIKE + regex op artikel_naam_ruw, uitsluitpatroon toegepast, aantal × factor. Datum is besteldatum **als ontvangstbenadering**, niet bewezen afleverdatum.
- Bord: `bord:<id>`, uitsluitend geleverd_op niet NULL; ontvangst via artikel_id en passende vorm/eenheid. Geen tweede ontvangst als niet-lege bestelreferentie al als extern_ordernummer voorkomt in historie van dezelfde vestiging en leverancier.
- Kassa: `kassa:<vestiging>:<datum>:<product-id>`, verkoop × factor als negatieve beweging. Retouren/negatieve verkoop blijven meetellen. De bron heeft al de bestaande 06:00–06:00-werkdag; geen nieuwe bucketing.
- Correctie: `corr:<id>`, hoeveelheid met het opgeslagen teken.

Geen ordernummermatch op NULL/lege referenties. Ontvangstkoppelingen mogen niet meerdere proefartikelen voor dezelfde bron raken: ambiguïteit wordt als dataprobleem gemeld, niet willekeurig opgelost of met DISTINCT verborgen. Kassafactoren worden per proefartikel vastgelegd; voor deze seed is elke bron aan precies één groep gekoppeld. Verifieer globale bron_ref-uniciteit met GROUP BY/HAVING en rowcount versus COUNT(DISTINCT).

**Deellevering — concreet bestaand risico:** de bordregel bewaart het oorspronkelijke aantal; het ontvangen aantal staat slechts in vrije tekst, terwijl een restantregel kan worden gewijzigd. Het oorspronkelijke aantal blind als ontvangst tellen zou voorraad te hoog maken. Zonder bestaande borden te veranderen wordt een deelontvangst alleen numeriek afgeleid als oorspronkelijke hoeveelheid minus gekoppeld restant aantoonbaar eenduidig is, met dezelfde eenheid/vorm. Anders niet kwantificeren en de stand als onvolledig markeren; geen tekstbedrag gokken. Dit wordt vóór bouw met bestaande voorbeelden gecontroleerd.

`v_voorraad_stand` gebruikt de laatste betrouwbare telling (geteld_op, stabiele id-tiebreak):
- Voor_opening: kassaverbruik vanaf teldatum inclusief; na_sluiting: vanaf de volgende werkdag.
- Ontvangsten en correcties bij **voor_opening: datum >= teldatum**; bij **na_sluiting: datum > teldatum**. Dezelfde grens geldt in `voorraad_periode`. Leveringen op de teldag komen na een ochtendtelling.
- `opslag = netto_kassaverbruik × verbruiksopslag_pct / 100`.
- `stand = geteld + ontvangen + correcties − netto_kassaverbruik − opslag`.
- Geen betrouwbaar telanker: status **voorraad onbekend**, stand NULL. Negatieve standen niet op nul afkappen.
- `tellen_nodig`: geen betrouwbare telling sinds het laatst verstreken woensdag-voor-opening-telmoment, in Amsterdam. Aannames: woensdag vanaf 06:00 geldt de nieuwe teldeadline; bij een gesloten woensdag blijft de badge staan, geen taak/verplaatsing. Het team telt dan vóór de volgende opening.

**Daggrensbeperking:** na een ochtendtelling tellen ontvangsten/correcties van de teldag mee, na een sluittelling niet. Binnen een dag is geen preciezer tijdstip bekend. Historische besteldatum kan vóór werkelijke levering liggen. De proef toont daarom een berekende indicatie, geen gegarandeerde fysieke voorraad. Geen automatische orderbeslissing hierop.

## 5. Blind tellen en hertellen

In `Bestelbord.tsx` alleen het nieuwe inklapbare blok; nieuwe kleine proefcomponent/hook met bestaande vormgeving, 44px tikdoelen en Bediening/Keuken-keuze. Opslagplekvelden zijn leeg, ook bij een tweede telling. Geen vorige waarden of verwachte stand in invoer, placeholders of de onderliggende tabel terwijl iemand blind telt.

1. Client maakt één telling-id en `bron_ref='telling:'||id` vóór opslaan. Dubbeltikken/retry gebruikt dezelfde identiteit; unieke sleutel voorkomt een tweede opslag. Bij bestaande id leest de app het resultaat terug.
2. Na INSERT berekent de server de vergelijkingsstand vanuit het **vorige** betrouwbare telanker, exclusief de nieuwe telling. De snapshot wordt daarna ingevuld, nooit uit clientinvoer overgenomen.
3. Zonder eerdere berekende stand is de eerste telling direct betrouwbaar. Anders: `abs(totaal − snapshot) > greatest(abs(snapshot) × 0.20, 2)` geeft **Tel nog één keer**; eerste afwijkende telling is niet betrouwbaar.
4. Hertelling krijgt nieuw id/bron_ref en hertelling_van; wederom lege velden. Aanname: de bevestigde tweede telling wordt het betrouwbare anker, ook bij een blijvend verschil. Beide metingen blijven bewaard; pas daarna verschijnen stand en verschil.
5. Onder de kaart: artikel, laatste telling, +ontvangen, −kassa, =berekend/onbekend en badge tellen. Handmatige correcties en opslag blijven controleerbaar in detail; anders lijkt de handmatige som onjuist.

## 6. Advieslog zonder bestaand adviesgedrag te veranderen

Nieuwe service-role-only wrapper-RPC schrijft in **één transactie** het bestaande advies via ongewijzigde `bestelbot_advies_vervangen(text,date,date,jsonb)` én het log. Revoke EXECUTE van PUBLIC/anon/authenticated; alleen service_role. De bestaande vervanging en behoud van op_bord_regel_id blijven letterlijk het bestaande pad.

Bot-actie `advies` accepteert optioneel topniveau `methode_versie` en per regel `gegevens`; alle bestaande velden blijven toegestaan. Zonder metadata: methode_versie NULL, gegevens `{}`, log met onvolledige leerstatus. Herhaling upsert, nooit extra optellen. Snapshot-invoer bevat kassa_ids `[{id,per_eenheid}]`, periode_van/tot, verwacht_verbruik, kalender, trend en eventueel voorraad_artikel_id. Ongeldige nieuwe metadata wordt duidelijk afgewezen, geen stil onjuiste berekening. Response behoudt `{ok,aantal,gekoppeld}` plus `gelogd`.

Voorbeeld:
```json
{"actie":"advies","vestiging":"West","datum":"2026-10-29","leverdag":"2026-10-30","methode_versie":"proef-v1","regels":[{"artikel":"Fritz Kola 20 cl","hoeveelheid":24,"eenheid":"fles","gegevens":{"kassa_ids":[{"id":"1737439","per_eenheid":1}],"periode_van":"2026-10-30","periode_tot":"2026-11-05"}}]}
```
Response: `{"ok":true,"aantal":1,"gekoppeld":1,"gelogd":1}` indien die regel gekoppeld is. De wekelijkse bestaande externe bot-routine mag `v_leer_voorstellen_open` lezen met serverrechten; deze opdracht maakt geen nieuw verzendkanaal of wekelijkse pollingjob.

**Log-eenheden:** besteld/verkopen/advies zijn alleen vergelijkbaar na expliciete conversie naar advies-eenheid; ontbrekende conversie blijft NULL met reden. Geen kg versus dozen of fles versus doos vergelijken. Meerdere leveranciers voor hetzelfde artikel vormen volgens de opgegeven unieke sleutel één log: alleen optellen bij gelijke eenheid en identieke methode/periode; anders als niet vergelijkbaar markeren, bestaand advies wel behouden.

## 7. Nachtelijke berekening en voorstellen

`leercurve_bijwerken()` is idempotent, SECURITY DEFINER met vaste search_path; alleen postgres/service_role EXECUTE, expliciet revoke PUBLIC/anon/authenticated. Verwerkt uitsluitend nieuwe log-, periode- en voorsteltabellen; leest bestaande bronnen zonder daar te schrijven.

- `werkelijk_besteld`: besteld/geleverd bord + historie tussen adviesdatum en leverdag inclusief, artikel_id eerst, anders exacte genormaliseerde naam; vestiging altijd gelijk. Dezelfde referentie-deduplicatie als ontvangst. Een restant is geen tweede bestelling zolang het open staat. Opnieuw werkelijk besteld restant telt als aanvullende bestelling, niet naast een dubbel geïmporteerde bron. Aantallen altijd naar advies-eenheid omrekenen.
- `later_verkocht`: alleen nadat periode_tot voorbij is, som verkoop × kassa_ids.per_eenheid. Ontbrekende periode/factor/bron = NULL, niet nul.
- `later_geteld`: laatste betrouwbare proefartikeltelling binnen die periode; geen telling = NULL. Alleen vergelijken bij bekende eenheidsconversie.
- `afwijking = advies − later_verkocht`, niet later_geteld of werkelijk_besteld.
- `voorraad_periode`: twee opeenvolgende betrouwbare tellingen; dezelfde begin-/eindmomentgrenzen als de stand. `onverklaard = begin + ontvangen + correcties − eind − kassa`. De handmatig goedgekeurde opslag niet nogmaals als fysiek verbruik boeken. `pct_van_kassa = 100 × onverklaard/kassa`; kassa 0 ⇒ NULL. Alleen volledige, eenduidige intervallen tellen voor leren; gemengde dagmomenten worden op werkdaggrenzen afgegrensd, onmeetbare gedeeltelijke dagen als onvolledig gemarkeerd.
- Na ≥3 complete periodes met positieve som kassa: voorstel verbruiksopslag_pct = `100 × Σonverklaard / Σkassa`. Geen automatisch toepassen; negatieve uitkomst blijft zichtbaar als onderzoekssignaal, niet als stil verlies.
- Eén complete periode met `abs(pct_van_kassa)>30`: voorstel onderzoeken (koppeling/levering/dosering).
- ≥4 afgeronde, vergelijkbare adviezen en gemiddelde absolute procentuele afwijking >25%: voorstel advies_controleren. Dit betekent MAPE op later_verkocht, niet absoluut verschil in stuks. Werkelijk verbruik 0: uitgesloten van MAPE, apart vermeld; niet delen door nul.
- `v_advies_nauwkeurigheid`: vestiging×artikel, n, gemiddelde getekende afwijking, MAPE en aantal niet vergelijkbaar/nulverbruik. `v_leer_voorstellen_open`: alleen open, nieuwste eerst, leesbare onderbouwing. Herhaling werkt bestaand open voorstel bij; afgewezen/akkoord historie blijft bewaard. Status akkoord is beoordeling, **geen wijziging van opslag**.

**Cron:** één SQL-job `leercurve-nachtelijk`, dagelijks **02:45 UTC** zoals gevraagd: 03:45 Amsterdam in wintertijd, **04:45 in zomertijd**. Een vaste UTC-job is dus niet jaarrond 03:45 lokaal; dit plan kiest expliciet jouw 02:45 UTC. Eén run per dag, geen extra sweeper of externe oproep. Aanmaken als jobconfiguratie, niet als data-seed in de schema-migratie.

## 8. Seed: exact zes proefartikelen

Per vestiging onderstaande drie artikelen, bediening, actief, woensdag voor opening, opslagpct 0. Idempotente seed via data-tool ná schema; geen bestaande artikeldata aanpassen.

| Naam | Tel-eenheid / buffer | Plekken: invoereenheid → factor |
|---|---|---|
| Koffiebonen espresso (alle soorten, excl. decaf) | kg / 6 | dichte zakken 3 kg → 3; open zakken gram → 0.001; hopper molen gram → 0.001 |
| Fritz Kola 20 cl | fles / 24 | dichte dozen ×24 → 24; losse flesjes koeling → 1; losse flesjes magazijn → 1 |
| Fritz Kola superzero 20 cl | fles / 24 | idem |

Ontvangst: koffie Keen Coffee, regex `3000 gram`, uitsluit `decaf`, factor 3; Fritz `^Fritz Kola klein`, factor 24, artikel `f76f79c8-0bb0-432d-a6c4-e936e84a2688`; superzero `^Fritz Kola Superzero`, factor 24, artikel `4ed33f0a-8778-4ca7-a82c-1201a7a39afb`. Fritz leverancierfilter onbeperkt waar geen leverancier is opgegeven. Naamregex/uitsluiting hoofdletterongevoelig. Bord via artikel_id + passende doos-24-vorm ⇒ 24; losse fles ⇒ 1 alleen bij bevestigde conversie. Groepskoffie zonder eenduidige artikel/vormkoppeling niet raden.

Fritz-kassafactor 1: Midsland 1057234/Fritz en 1057237/superzero; West 1737439/Fritz en 3601055/superzero.

Koffie-id's hieronder zijn text en letterlijk de opgegeven mapping; alleen compacte groepering op factor. Alle mappings afzonderlijk seeden per vestiging, geen prefixherkenning.

**Midsland, 0.0105 kg per verkoop:**
2188326,1056953,5266697,3356345,1056972,1319371,1056960,1043099,2213833,3444538,4498795,1056957,4498876,5093621,5267401,4861965,5093620,5093631,5267424,4958309,5267411,5093639,5267402,5267419,5267400,5267420,5093629,4958308,5267407,5267409,4958319,5093630,5267410,5093628,5267415,5093635,5267423,5093640,4958327,5267422,5093643,4958317,5267408,5216662.

**Midsland, 0.0185 kg per verkoop:**
1056970,1056971,1056956,2124785,2093940,3370291,1056959,2188317,5266699,5093623,5467504,5267418,5267403,5093638,5093622,5093627,4958326,5093624,5093625,5267404,4958311,5093641,5267425,4958312,4958315,4958310,5267421,5093626.

**West, 0.0105 kg per verkoop:**
1904325,1904313,1904336,1737438,2193539,1904345,5503463,5453115,2193527,4392098,4413254,5456046,5501484,5453109,5442323,4176114,5453117,5453113,5442331,5453121,5453122,5526781,5442324,5453119,4176134,5442322,5442329.

**West, 0.0185 kg per verkoop:**
1904329,1904334,4690984,1904314,1737437,2227023,1904331,4398207,5503464,5453111,2974419,5453116,5453120,5453112,5453110,5453131,5442333,4176120,5442326,5453114,4176118,1737443,5442325,5442327.

Verwachte seedcontrole: 6 artikelen, 6 ontvangstkoppelingen, 123 koffie-verbruikskoppelingen (72 Midsland/51 West) + 4 Fritz = 127; geen dubbele proefartikel/productcombinatie. Geen testtelling in de seed.

## 9. Bestanden, documentatie en tests na akkoord

Wijzigingsgebied: nieuwe additieve migratie(s); nieuwe proefhook/component naast bestaande keukenonderdelen; beperkte toevoeging in `src/pages/kitchen/Bestelbord.tsx`; alleen adviesvalidatie/-aanroep in `supabase/functions/bot-bestelbord/index.ts`; contractaanvulling in `docs/bestelbot-fundament.md`; nieuwe `docs/voorraad-leercurve.md`; kleine concrete logica-/integratietests. Geen andere modules of bestaande functies wijzigen. Nieuwe helperfuncties alleen voor deze proef en de atomische advieswrapper. COMMENT ON TABLE/VIEW/FUNCTION op ieder nieuw object, met formules, grenzen en rechten. Geen methoderegister.

Vóór/na testen en eigen testdata opruimen:
1. `foh_tasks` uitsluitend read-only: aantal én md5 van gesorteerde ids vóór en na exact gelijk. Geen triggers, policies of taakrijen aanraken.
2. Geen telling ⇒ voorraad onbekend/NULL, ook na nachtjob; telbadge volgens woensdagdeadline.
3. Blind eerste telling en afwijking/hertelling met handmatige som op één herkenbaar testartikel **TEST voorraadproef – verwijderen**. Snapshot gebruikt vorig anker; drempelgevallen exact 20%, 2 eenheden en erboven apart testen. Geen verwacht getal vóór hertelling.
4. Dubbel bron_ref-insert faalt; retry leest dezelfde telling terug. Hertelling heeft eigen ref/relatie.
5. Bewegingsrefs uniek; historie/bord met dezelfde referentie tellen eenmaal; vestigingen en leveranciers met hetzelfde ordernummer niet verwarren. Retouren, doos/fles en deellevering/ontbrekende conversie testen.
6. Voor-/na-opening, woensdag, gesloten dag, 06:00-bucketing en ontvangst op teldag met concrete dagen testen; handmatige som inclusief correctie/opslag.
7. `leercurve_bijwerken()` handmatig en opnieuw zonder fout; geen optellen. ≥3 periodes, >30%, ≥4 adviezen/>25%, nulverbruik en ontbrekende gegevens testen. Akkoord wijzigt geen verbruiksopslag.
8. Als ingelogde medewerker eigen telling toegestaan; andere vestiging, berekende velden, instellingen, ruwe kassa en leercurve-functie geweigerd. Owner alleen toegestane voorstelkolommen. Anon alles geweigerd.
9. Bot-advies zonder/met metadata: bestaand advies/vinkjes behouden, log-upsert, extra gelogd en volledige rollback bij fout. GET/bestellen/koppel/import_historie ongewijzigd. Echte bot-token alleen indien veilig beschikbaar; anders HTTP-validatie expliciet ongetest melden.
10. Bestelbord West/Midsland op telefoon/iPad: bestaande keuzelijst/vormen/prijzen/snelkeuze en besteld/geleverd/deels/restant regres­sie uitsluitend met eigen herkenbare testregels. Geen echte open naam ophogen. Typecontrole via previewcontroles, bestaande tests en buildsignaal controleren.
11. Alle eigen testtellingen, hertellingen, voorstellen, logs en testartikelen in afhankelijkheidsvolgorde verwijderen; count/select bevestigt nul restdata. Echte bordregels ongewijzigd. Tests die alleen SQL nodig hebben bij voorkeur met rollback. Geen publicatie.

## 10. Risico's en bewuste beperkingen

Een gemiste levering, onjuiste factor of ongeregistreerde transfer lijkt op verlies. Daarom alleen voorstellen, complete periodes en onderbouwing; geen automatisch bijgeboekt verbruik. Meer dan één telling per dag en historische besteldatum zijn niet exact met dagelijkse verkoopdata te reconstrueren: onvolledige intervallen tellen niet mee in leren. Bij >30% afwijking eerst ontvangst/kassakoppeling/dosering onderzoeken, niet de bestelling vergroten.

Na een maand blijven tellingen, periodes, adviezen en beoordelingen als historie staan; open voorstellen worden bijgewerkt in plaats van gestapeld. Seizoenssluiting genereert geen taken of nepverkoop; zonder recente telling blijft tellen nodig. Koffie telt als groep, niet als voorraad per merk/bonensoort. Geen externe verzending, nieuwe dashboardpagina, voorraadgestuurde automatische bestelactie of automatische goedkeuring.

**Bevestigd bij akkoord:** tweede blinde telling is leidend; woensdagdeadline 06:00 Amsterdam; momentafhankelijke ontvangst-/correctiegrens zoals hierboven; 02:45 UTC ook tijdens zomertijd; onduidelijke deelleveringen niet kwantificeren; MAPE op later_verkocht, nulverbruik apart. Bestaande werkprocessen blijven intact.