# Eilandbezorger — Midsland-kaartcontrole, 23 november 2026

## Werkelijk gedaan

- Originele CSV teruggevonden: 89 unieke producten, waarvan 80 beschikbaar en 9 uit; 25 unieke keuzes. Overzicht in originele volgorde gemaakt, 114 unieke codes, zonder formaten als extra producten te tellen.
- Correctie nulmeting om 12:12 Amsterdam: naast de 28 productkoppelingen staan vier actieve, in Yoricks opdracht opgeslagen formaatkoppelingen in Midsland. Deze vier records opnieuw uitgelezen en via de normale ontvanger getest. Deze beurt heeft geen mappings gewijzigd. De bestaande unieke sleutel is `(vestiging, soort, externe_code)`.
- `eilandbezorger_live` voor Midsland teruggelezen als `false`. Niets aan deze vlag gewijzigd.
- Geen POST naar Lightspeed, geen kassawijziging, geen printerwijziging, geen wijziging aan prijzen bij Karin, geen FR01-aanroep of backend-/frontenduitrol.
- De bestaande gedeployde kaartactie via de normale appclient geprobeerd: HTTP 401, `{"fout":"niet ingelogd"}`. De browser toonde het inlogscherm, niet een geverifieerd eigenaarsdashboard.
- De normale eigen-accountaanmelding levert een account zonder actieve Pura-rol. Aanmelding als het oorspronkelijke bevoegde eigenaaraccount vereist toestemming die deze context niet aanbiedt. Geen rollen gewijzigd, geen sessie nagebootst of uit een andere browser gelezen.
- De eerdere bestanden `/tmp/ls/product.json`, `/tmp/ls/productgroup.json` en `/tmp/kp/prod.json` zijn niet aanwezig.
- Bestaande previewbouw heeft status `succeeded` (22 november 2026, 23:50 UTC). Geen appcode gewijzigd. Bestaande netwerkloze Deno-tests konden niet starten door ontbrekende gecachete `@std/assert`-manifest; geen testresultaat als geslaagd aangemerkt.

## Vier goedgekeurde formaten — opgeslagen en normaal ontvangen in testmodus

De eigenaarsopdracht geeft groep **BOWLS | BURGERS (46)** en onderstaande PLU’s/prijzen. De onderstaande ID’s, PLU’s en prijzen zijn nu daadwerkelijk in de vier actieve formaatrecords teruggelezen. Dit configuratiebewijs en de ontvangsttests staan los van het nog open actuele kassakaartonderzoek; schermprijs is niet zonder bewijs als actuele `deliveryPrice` aangemerkt.

| Gerecht | PV-code | Keuze | Opgeslagen PLU | Opgeslagen ID | Opgeslagen prijs | CSV-totaal |
|---|---|---|---|---|---:|---:|
| Hula klein | PV-F7B26912 | PVK-241B2733-1 | Dh16 | 1071103 | €16,50 | €16,50 |
| Hula groot | PV-F7B26912 | PVK-241B2733-2 | B140 | 2385828 | €25,00 | €25,00 |
| Sashimi zalm klein | PV-0F623FEC | PVK-77BFC4AF-1 | B136 | 2385824 | €17,00 | €17,00 |
| Sashimi zalm groot | PV-0F623FEC | PVK-77BFC4AF-2 | B141 | 2385829 | €25,50 | €25,50 |

**Vier echte ontvangsttests op 23 november, 12:12 Amsterdam:** uitsluitend `modus=test`, via bestaande ontvanger met bestaande intern beschikbare aanleversleutel; geen eigenaarssessie, actuele kassakaart of nieuwe toegang gebruikt. Alle vier POST-antwoorden HTTP 201; status via normale GET teruggelezen met HTTP 200. De database bevestigt per bestelling `test_ok`, één juiste regel met aantal 1, lege resterende extras, correct totaal, nul verzendpogingen, geen kassabericht en geen Lightspeed-order-ID.

| Bestelnummer | Formaat | PLU / ID | Totaal | Status | Verzendpogingen |
|---|---|---|---:|---|---:|
| TEST-EB-20261123-111220-0f6bdf-HULA-K | Hula klein | Dh16 / 1071103 | €16,50 | test_ok | 0 |
| TEST-EB-20261123-111220-0f6bdf-HULA-G | Hula groot | B140 / 2385828 | €25,00 | test_ok | 0 |
| TEST-EB-20261123-111220-0f6bdf-SASH-K | Sashimi klein | B136 / 2385824 | €17,00 | test_ok | 0 |
| TEST-EB-20261123-111220-0f6bdf-SASH-G | Sashimi groot | B141 / 2385829 | €25,50 | test_ok | 0 |

De bestaande `soort='formaat'`-configuratie met sleutel `PV-code|PVK-code` vervangt basis + maat door één artikel, bewaart het bestelde aantal, verplicht precies één maat en telt Groot niet tweemaal. Geen nieuwe module of codewijziging. `test_ok` bewijst hier ontvangst en opgeslagen normalisatie, niet kassaverwerking of actuele kassaprijzen.

## Uitsluitend aangewezen bovenste groepen

WARM DRANK, KOUD DRANK, VERS SAP, BIER, WIJNEN - GLAS, WIJNEN - FLES, COCKTAILS, ZOET, ONTBIJT, LUNCH | SOEP, FINGERFOOD, BOWLS | BURGERS.

Alleen groep 46 is door de eigenaar genoemd; geen groeps-ID is in deze beurt uit de API bevestigd. Een gelijknamige algemene of gearchiveerde groep is geen bewijs. Het overzicht noemt te verifiëren groepsnamen, maar laat API-bevestigde groeps-ID’s en actuele bezorgprijzen bewust leeg.

## Bestaande 28 mappings

Alle 28 productmappings bestaan nog, zijn actief en niet gewijzigd. Geen ervan is in deze beurt herbevestigd tegen de aangewezen topgroepen. Hun opgeslagen prijs is geen actuele Lightspeed-bezorgprijs. Van de 61 producten zonder afzonderlijke productmapping zijn Hula en Sashimi nu via vier actieve formaatrecords ondersteund; 59 andere producten blijven zonder product-/formaatmapping.

De drie kidsregels wijken aantoonbaar in PLU af van de eigenaarsopdracht:

| Product | Huidige PLU / ID | Aangewezen PLU | Eigenaarsprijs |
|---|---|---|---:|
| Kids Sashimi | B&b-a25 / 4636970 | B200 | €16,50 |
| Kids Bitterbal | B&b-a26 / 4636971 | B201 | €16,50 |
| Kids Pancakes | B&b-a27 / 4636972 | B226 | €11,00 |

Niet gecorrigeerd zonder actuele PLU↔ID-bevestiging. Bestaande historie is behouden, niets verwijderd.

## Overige formaten en burgers

Eigenaarsbewijs: Uluwatu B197/B208 €17,50/€26; Duck Dive B149/B150 €17,50/€26; Winter Dahl B145/BPB7 €17/€25,50. CSV-totaal klein/groot is voor elk gelijk aan deze bedragen. De actuele artikel-ID’s en bezorgprijzen blijven te bevestigen; geen configuratie geschreven.

Lamsburger B198/B215 en Bieten Burger BPB4/BPB6 kosten solo/met zoeteaardappelfriet €15,50/€22,50. Het comboartikel moet één regel worden. **Hier vraagt de huidige verwerking echt code:** zodra voor een product één formaatkoppeling bestaat, wordt ook solo zonder keuze afgekeurd. Optionele combo-ondersteuning met productgebonden keuze is dus niet veilig uitsluitend via de huidige formaatconfiguratie. Niet toegevoegd; geen correcte solo-regel aangepast. Voor deze twee CSV-productcodes bestaat momenteel overigens nog geen solo-mapping.

## Extra’s: wat Karin precies moet aanvullen

- Voor Vegan/Glutenvrij (`PVK-319766B2-1`, `PVK-456C0BDC-1`, `PVK-AD715B1F-1/-2`): per keuze de exacte toegestane PV-productcodes én varianten; niet generiek aan alle gerechten koppelen.
- Voor saus (`PVK-050E53CA-1/-2`), glutenvrij brood (`PVK-DBE8A359-1`) en burgeropties (`PVK-174BACEE-1/-2/-3`): toegestane gerechten/varianten, of opties combineren, aantal per portie en verplicht/optioneel. Voor friet ook aangeven welke solo→combo-combinatie hoort bij welk burgerproduct.
- Voor soep (`PVK-6DE6849B-1/-2/-3`): welke soep-PV-codes werkelijk deze drie maten toestaan, juiste naam/artikel per maat. De CSV-categorie alleen bewijst de toewijzing aan beide soepen niet.
- Voor Plat/Bruis (`PVK-5079BEA6-1/-2`): bijbehorende PV-productcode ontbreekt; geen expliciet waterproduct in deze CSV.
- Voor alle keuzegroepen: minimum/maximum selectie, verplicht/optioneel en toegestane combinaties.
- Van de kassa blijft productgebonden modifierClass/waarde-ID en prijs nodig. Gratis keuzes worden alleen ondersteund als ze bij dat specifieke gerecht geldig zijn en de kassa ze als gratis modifier bevestigt.

**Betaalde losse extra’s:** bestaande prijsvalidator en kassabericht blokkeren deze. `test_ok` bewijst alleen ontvangstvalidatie, niet Lightspeed-kassaverwerking. Veilige betaalde-extra-ondersteuning vraagt apart code en bewezen prijs-/btw-/modifiergegevens; niet gebouwd.

## Bronstatus van het volledige CSV-overzicht

`Eilandbezorger-Midsland-kaartcontrole-20261123.csv` bevat elke oorspronkelijke code eenmaal, huidige opgeslagen PLU/ID/prijs, eigenaarskandidaten, ontbrekend bewijs en status. Historische kandidaatprijzen komen uitsluitend uit het verslag van de kaartuitlezing op **21 november 2026**; de oorspronkelijke snapshots ontbreken. Ze zijn apart gemarkeerd en mogen niet als actuele prijs of bewijs voor de aangewezen groep worden gebruikt.

**Telling:** 89 producten = 80 beschikbaar + 9 uit; 25 keuzes; 28 productmappings + 4 actieve formaatmappings, 0 losse extramappings; deze beurt 0 mappingwijzigingen en 4 geslaagde normale testontvangsten. Er zijn 30 productcodes met product- of formaatmapping en 59 zonder; de vier formaten zijn twee producten, geen vier extra producten in de telling. Het overzicht is gecorrigeerd in versie v2.

## Nog open: actueel kassakaartonderzoek voor het gehele assortiment

Voor het gehele assortiment blijft de actuele Midsland-product- en groepskaart nodig om topgroep, actieve status, PLU↔ID en bezorgprijs te bevestigen. Dit was geen vereiste voor de vier ontvangsttests: die zijn nu uitgevoerd en geverifieerd tegen de opgeslagen formaten. Algemene liveverzending na afloop opnieuw teruggelezen als uit. Geen proef naar de kassa uitgevoerd.

FR01-voorbereiding is behouden en niet veranderd; de eerdere tijdelijke-knopopdracht wacht nog op plangoedkeuring. DE01 en overige eerdere taken vallen buiten deze opdracht.

Standaardisatievoorstel: laat Karin bij iedere PVK-code de toegestane PV-productcodes en selectieregels aanleveren in één vaste keuzetabel.