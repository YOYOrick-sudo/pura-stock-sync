# GB04 uitsluitend voorbereiden

## Resultaat en afbakening
De bestaande beveiligde eigenaaractie krijgt één extra vaste opdracht voor `PV-PROEF-MID-20261122-GB04`. Yorick kan die later als ingelogde eigenaar eenmaal starten; tijdens deze voorbereiding wordt de actie **niet** uitgevoerd. De ingeplande taak zelf wordt niet gewijzigd.

Vaste inhoud: Midsland 36864, 1× Naturfrisk Ginger beer (4636894), €4,90, betaalwijze Eilandbezorger 285794/type 4, gast Pura Test, `note: TEST – niet klaarmaken`. De omschrijving wordt `PV-PROEF-MID-20261122-GB04 — Pura Test`.

## Wijzigingen
- Voeg GB04 toe aan de bestaande proefconfiguratie met eigen permanente order-ID, poging-ID en interne vrijgave.
- Voeg uitsluitend `ginger_beer_proef_gb04` met exacte referentie en `bevestiging: true` toe aan de bestaande beheeractie.
- Pas dezelfde controles als GB03 toe: oorspronkelijke eigenaar én actieve eigenaarsrol, vaste Midsland-configuratie, live expliciet uit, geldige Amsterdamse proefdatum en afhaalvenster, bevestigde GB01/GB02-weigeringen, geen bestaande GB04-order of poging, hercontrole vlak vóór verzending.
- Laat de geverifieerde orderbouw, actuele automatische btw en betaalarray ongewijzigd; reserveer GB04 ook tegen partnerontvangst en gewone vrijgave/herverzending.
- Werk uitsluitend noodzakelijke proefcode, lokale tests en projectdocumentatie bij. Geen tabellen, migraties, bestaande orders, POS-instellingen, vlaggen, frontend of geplande taken wijzigen.

## Praktijk en risico
Alleen Yorick start later de proef via zijn ingelogde Pura-account. Een andere eigenaar, manager, partnersleutel of cron-sleutel mag deze actie niet starten.
Gelijktijdige aanvragen mogen samen maximaal één poging opleveren. Bij een verloren antwoord, weigering of blokkade wordt nooit automatisch herhaald: dit voorkomt dubbele keukenbonnen en betalingen.
Zoals GB03 is de proef alleen geldig op 22 november 2026 in Amsterdam; een latere uitvoering blokkeert. Er ontstaan tijdens voorbereiding geen echte order- of pogingregels.

## Verificatie en uitrol
- Lokale volledige beheer-/ontvangsttests met onderschepte HTTP en zonder netwerkrechten: exacte orderregel en betaling, gastnaam/notitie, btw, parallelle aanvragen, bestaande poging/order, verlopen datum/venster, verkeerde eigenaar/configuratie, timeout/weigering, partner- en normale herverzendblokkades, behoud van GB01–GB03.
- Draai relevante bestaande proef-, prijs- en schrijverregressies; controleer beide getroffen functie-entrypoints.
- Rol uitsluitend `eilandbezorger-beheer` en `eilandbezorger-bestelling` uit, omdat gedeelde proefherkenning ook de partnerontvangst beschermt. Controleer actieve versies zonder de fysieke proef aan te roepen.
- Lever testresultaten, uitrolstatus en de exacte latere opdracht:

```json
{"actie":"ginger_beer_proef_gb04","referentie":"PV-PROEF-MID-20261122-GB04","bevestiging":true}
```

## Technische scope
Categorie: edge-function/logica; bestaande autorisatie hergebruiken, geen nieuwe rol- of RLS-regels.
Bestanden: `_shared/eilandbezorgerProef.ts`, `_shared/eilandbezorgerVerzend.ts`, `eilandbezorger-beheer/index.ts`, `eilandbezorger-beheer/proef.ts`, `eilandbezorger-beheer/proef_test.ts`, `AGENTS.md`, `roadmap.md`.
Open vragen: geen; GB04 krijgt dezelfde begrenzing als GB03, zonder nieuwe voorwaarde op de uitkomst van GB03.