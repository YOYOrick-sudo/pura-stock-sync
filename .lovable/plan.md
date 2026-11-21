# Kassaproef Midsland (36864) klaarzetten

Liveverzending blijft uit, bestaande testbestellingen blijven staan, er wordt niets naar Lightspeed verstuurd en niets in Lightspeed aangemaakt.

## 1. Lightspeed-instellingen uitlezen (alleen-lezen)
- Nieuwe beheeractie `kassa_instellingen` in de beheerfunctie, met dezelfde eigenaarscontrole als `kaart`. Alleen GET-verzoeken, alleen Midsland.
- Leest: bedrijfs-/vestigingsstructuur (bepaalt `customer_order` of `establishment_order` en `companyId`), klanten gezocht op "Eilandbezorger", en alle betaalwijzen met `id`, naam en type (`paymentTypeTypeId`).
- Ik log de preview in als eigenaar (sessie aanmaken; vraagt zo nodig jouw akkoord) en voer de actie uit.
- Uitkomst: gevonden ID's, of precies wat jij in de backoffice moet aanmaken. Niets wordt automatisch opgeslagen in de kassaconfiguratie zonder jouw akkoord.

## 2. Kassabericht corrigeren en lokaal testen
- Verzendbericht volgens L-Series-documentatie: `orderPayments: [{ amount, paymentTypeId, paymentTypeTypeId }]`, expliciete status `ACCEPTED`, correcte establishment-route met klantgedeelte en `companyId`, product via PLU/ID.
- Configuratie krijgt het betaalwijzetype erbij (kleine migratie: één nullable kolom op `externe_kassa_config`).
- Lokale test: 3x Zoete Aardappel Friet a €7,00 geeft restaurantbedrag €21,00 en precies €21,00 extern vooruitbetaald; afwijking geeft blokkade, geen verzending.
- Pas op de echte kassa te bevestigen: acceptatie door Lightspeed, juiste betaalboeking, juiste printer/kassa.

## 3. Klein en Groot voor bowls
- Gerecht + formaatkeuze van Karin wordt vertaald naar precies 1x het afzonderlijke kassaproduct per formaat; formaattoeslag wordt niet opgeteld. Klein (€0) selecteert expliciet het kleine product.
- Producten voor Hula en Sashimi Zalm per formaat zoeken in de uitgelezen Midsland-kaart; alleen zekere koppelingen opslaan.
- Tests voor alle vier combinaties: Karins product- en keuzecode, kassaproductnaam en ID, aantal, totaalprijs. Ontbrekend/onduidelijk formaat of prijsverschil wordt geblokkeerd en getoond.

## Afsluiting
Twee korte antwoorden: wat jij nog moet doen vóór de friet-proef, en welke bowlformaten goed staan en waarover je nog beslist.

## Technisch
- Bestanden: `_shared/eilandbezorgerLogica.ts`, `_shared/eilandbezorgerVerzend.ts`, `_shared/eilandbezorger_test.ts`, `eilandbezorger-beheer/index.ts`, migratie voor `betaalwijze_type_id` en formaatkoppeling (keuzecode -> vervangend product, in bestaande productmapping indien mogelijk).
- Alleen de twee Eilandbezorger-functies opnieuw deployen; geen frontendpublicatie.
- Risico: preview en live delen de database; koppelingen zijn direct actief, maar verzending blijft door de live-vlag uit.
