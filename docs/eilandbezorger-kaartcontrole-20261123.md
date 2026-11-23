# Eilandbezorger — Midsland-kaartcontrole, 23 november 2026

## Werkelijk gedaan

- Originele CSV teruggevonden: 89 unieke producten, waarvan 80 beschikbaar en 9 uit; 25 unieke keuzes. Overzicht in originele volgorde gemaakt, 114 unieke codes, zonder formaten als extra producten te tellen.
- Alle 28 bestaande Midsland-productkoppelingen uitgelezen. Geen formaatkoppelingen of extra’s opgeslagen. De bestaande unieke sleutel is `(vestiging, soort, externe_code)`; configuratie kan dus idempotent zonder nieuw datamodel.
- `eilandbezorger_live` voor Midsland teruggelezen als `false`. Niets aan deze vlag gewijzigd.
- Geen POST naar Lightspeed, geen kassawijziging, geen printerwijziging, geen wijziging aan prijzen bij Karin, geen FR01-aanroep of backend-/frontenduitrol.
- De bestaande gedeployde kaartactie via de normale appclient geprobeerd: HTTP 401, `{"fout":"niet ingelogd"}`. De browser toonde het inlogscherm, niet een geverifieerd eigenaarsdashboard.
- De normale eigen-accountaanmelding levert een account zonder actieve Pura-rol. Aanmelding als het oorspronkelijke bevoegde eigenaaraccount vereist toestemming die deze context niet aanbiedt. Geen rollen gewijzigd, geen sessie nagebootst of uit een andere browser gelezen.
- De eerdere bestanden `/tmp/ls/product.json`, `/tmp/ls/productgroup.json` en `/tmp/kp/prod.json` zijn niet aanwezig.
- Bestaande previewbouw heeft status `succeeded` (22 november 2026, 23:50 UTC). Geen appcode gewijzigd. Bestaande netwerkloze Deno-tests konden niet starten door ontbrekende gecachete `@std/assert`-manifest; geen testresultaat als geslaagd aangemerkt.

## Vier goedgekeurde formaten — nog niet opgeslagen of door de ontvanger getest

De eigenaarsopdracht geeft groep **BOWLS | BURGERS (46)** en onderstaande PLU’s/prijzen. De ID’s blijven historische kandidaten: de vereiste PLU↔ID en actuele bezorgprijs konden niet uit de echte kaart worden bevestigd. Schermprijs is niet zonder bewijs als `deliveryPrice` aangemerkt.

| Gerecht | PV-code | Keuze | Aangewezen PLU | Historisch kandidaat-ID | Prijs volgens eigenaar | CSV-totaal |
|---|---|---|---|---|---:|---:|
| Hula klein | PV-F7B26912 | PVK-241B2733-1 | Dh16 | 1071103 | €16,50 | €16,50 |
| Hula groot | PV-F7B26912 | PVK-241B2733-2 | B140 | 2385828 | €25,00 | €25,00 |
| Sashimi zalm klein | PV-0F623FEC | PVK-77BFC4AF-1 | B136 | 2385824 | €17,00 | €17,00 |
| Sashimi zalm groot | PV-0F623FEC | PVK-77BFC4AF-2 | B141 | 2385829 | €25,50 | €25,50 |

**Uitvoeringsblokkade:** geen bevoegde actuele kaartuitlezing of beschikbare oorspronkelijke kaartbestanden; daarom nul nieuwe opgeslagen koppelingen en nul nieuwe testontvangsten. Geen nieuwe testnummers aangemaakt en dus geen teruggelezen `test_ok` of pogingentelling per nieuw nummer te rapporteren.

Na bevestigd kaartbewijs volstaat voor deze vier bestaande `soort='formaat'`-configuratie met sleutel `PV-code|PVK-code`. Bestaande verwerking vervangt basis + maat door één artikel, bewaart het bestelde aantal, verplicht precies één maat en telt Groot niet tweemaal. Daarvoor is geen nieuwe module of codewijziging nodig.

## Uitsluitend aangewezen bovenste groepen

WARM DRANK, KOUD DRANK, VERS SAP, BIER, WIJNEN - GLAS, WIJNEN - FLES, COCKTAILS, ZOET, ONTBIJT, LUNCH | SOEP, FINGERFOOD, BOWLS | BURGERS.

Alleen groep 46 is door de eigenaar genoemd; geen groeps-ID is in deze beurt uit de API bevestigd. Een gelijknamige algemene of gearchiveerde groep is geen bewijs. Het overzicht noemt te verifiëren groepsnamen, maar laat API-bevestigde groeps-ID’s en actuele bezorgprijzen bewust leeg.

## Bestaande 28 mappings

Alle 28 bestaan nog, zijn actief en niet gewijzigd. Geen ervan is in deze beurt herbevestigd tegen de aangewezen topgroepen. Hun opgeslagen prijs is geen actuele Lightspeed-bezorgprijs. De andere 61 producten hebben geen opgeslagen productmapping; formaatconfiguratie ontbreekt eveneens.

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

**Telling:** 89 producten = 80 beschikbaar + 9 uit; 25 keuzes; 28 bestaande productmappings; 0 bestaande formaat-/extramappings; 0 nieuwe mappings; 0 nieuwe ontvangerstests. De vier formaten zijn uitvoeringskandidaten van twee producten, geen vier extra producten in de telling.

## Benodigd om de geblokkeerde uitvoering af te maken

Een actuele Midsland-product- en groepskaart uit de bestaande bevoegde eigenaarfunctie, of de eerder werkelijk opgehaalde originele JSON-bestanden met datum. Daarmee kunnen topgroep, actieve status, PLU↔ID en bezorgprijs worden bevestigd, waarna uitsluitend bewezen configuratie wordt opgeslagen en vier nieuwe testbestellingen via de normale ontvanger worden ingediend. Geen nieuwe autorisatie of algemene livevrijgave nodig.

FR01-voorbereiding is behouden en niet veranderd; de eerdere tijdelijke-knopopdracht wacht nog op plangoedkeuring. DE01 en overige eerdere taken vallen buiten deze opdracht.

Standaardisatievoorstel: laat Karin bij iedere PVK-code de toegestane PV-productcodes en selectieregels aanleveren in één vaste keuzetabel.