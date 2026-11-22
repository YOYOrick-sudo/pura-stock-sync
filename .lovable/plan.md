# Eilandbezorger: vaste klant en gastnaam per bestelling

## Resultaat
Alle Midsland-orders gebruiken één configureerbare Lightspeed-klant ‘Eilandbezorger’. Karin levert alleen voornaam + achternaam aan, of de bestaande volledige naam. Geen gastprofielen, geen klantacties en geen contactgegevens in nieuwe opgeslagen berichten of logs.

- `description`: `EB-TEST-20261122-120013 — Sanne de Vries`.
- `note`: exact `Saus apart`, inclusief oorspronkelijke spaties als Karin die meestuurt.
- Ontbrekende e-mail, telefoon of klantcode blokkeren nooit; meegestuurde contactvelden worden genegeerd.
- Ontbrekende vaste klant-ID blokkeert alleen kassaverzending, niet ontvangst of testmodus.

## Werkzaamheden
Categorie: **edge function / logic / data-verwerking**, geen UI- of RLS-wijziging.

1. Ontvangstvalidatie en opslag aanpassen: opgeschoonde invoer bewaren in plaats van het ruwe bericht; gastnaam orderspecifiek in de omschrijving.
2. Historische duplicaten herkennen door opgeslagen invoer met dezelfde nieuwe normalisatie te vergelijken. Gewijzigde naam, producten, bedragen of opmerking blijven conflicten; bestaande unieke sleutel, tijdcontrole, atomaire claims en onzekerheidsbeveiliging blijven behouden. Historische orders en vingerafdrukken niet wijzigen.
3. Gastklantzoek-/aanmaakcode uit de verzendweg verwijderen; vaste klant-ID vóór kassatoegang controleren. Betaal- en productcontroles behouden, inclusief één betalingsobject en exact €21 voor de frietproef.
4. Aansluitinstructie en gerichte lokale tests actualiseren. Alleen de benodigde Eilandbezorger-functies uitrollen na succesvolle tests; geen frontendpublicatie.

## Bestanden en tabellen
- `supabase/functions/eilandbezorger-bestelling/index.ts`
- `supabase/functions/eilandbezorger-beheer/index.ts` (controle bij vrijgave)
- `supabase/functions/_shared/eilandbezorgerLogica.ts`, `eilandbezorgerVerzend.ts`, `eilandbezorgerKlant.ts` en bijbehorende Eilandbezorger-tests
- `docs/eilandbezorger-aansluiting.md`, bestaande architectuurregel in `AGENTS.md`, `roadmap.md`
- **Geen migraties, wijzigingen aan tabellen/RLS/instellingen of nieuwe libraries.** Hergebruik `externe_kassa_config.lightspeed_klant_id`; bestaande historische klantkoppelingen blijven staan, maar worden niet meer gebruikt.

## Lokale verificatie, zonder echte kassatoegang
Gebruik Sanne de Vries, 3× Zoete Aardappel Friet à €7, totaal €21, ‘Saus apart’ en `korting: null`.
- Testmodus: `test_ok`, nul kassatoegang.
- Gesimuleerde liveweg met vaste klant: juiste customerId, omschrijving/notitie en €21 betaald; nul klantzoek-/aanmaak-/wijzigingsacties.
- Gesimuleerde liveweg zonder vaste klant: geblokkeerd met duidelijke reden, nul kassatoegang.
- Volledige naam als alternatief; ontbrekende of onbruikbare contactvelden veroorzaken geen blokkade en komen niet in opslag/verzending.
- Historische herhaling inclusief oude contactvelden geeft bestaande order terug; gewijzigde inhoud geeft conflict. Test/live blijven gescheiden.
- Bestaande prijs-, korting-, betaal-, gelijktijdigheids- en timeouttests uitvoeren.

## Huidige instellingen: alleen-lezen bevestigd
- Midsland-livevlag: **uit**; blijft uit.
- Vaste klant-ID: ontbreekt.
- Betaalwijze-ID en betaalwijze-type-ID: ontbreken in de koppeling.
- Orderroute: `customer_order`; company-ID leeg (niet nodig voor deze variant).
- Of de bestaande betaalwijze ‘eilandbezorger’ in Lightspeed actief/correct ingesteld is, is hiermee **niet bevestigd**. Geen Lightspeed-aanroep in deze opdracht; voor de fysieke proef zijn de juiste IDs en bevestiging nodig.

## Praktijk, risico’s en resterende proef
Karin hoeft geen contactgegevens meer aan te leveren. Zonder juiste klant-/betaalinstellingen blijven live-orders geblokkeerd; niemand hoeft ontbrekende gastgegevens aan te vullen.

Historische herhalingen kunnen bij foutieve normalisatie onterecht conflicteren of wijzigingen doorlaten: daarom concrete regressietests vóór uitrol. Een verkeerde vaste klant-ID koppelt orders aan de verkeerde klant: Yorick moet de gekozen ID voor de proef bevestigen.

Naam in description bewijst niet dat hij op keukenbon én klantbon wordt afgedrukt. Afdruk op beide bonnen, éénmalig printen, €0 open en automatisch afslaan blijven uitsluitend onderdeel van de begeleide kassaproef. Bij een onzekere uitkomst nooit automatisch opnieuw sturen.

Historische testorders blijven staan. Geen echte orders, klantacties of nieuwe testregels in de database.
