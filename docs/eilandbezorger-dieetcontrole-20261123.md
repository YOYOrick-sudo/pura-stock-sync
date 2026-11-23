# Midsland-dieetcontrole — 23 november 2026

## Afbakening en bron
De actuele eigen Midsland-menukaart op https://www.puravidafoodbar.nl/menukaart-midsland is leidend voor aangeboden dieetkeuzes, samen met Yoricks expliciete aanwijzingen. Website HTTP 200; Loaded Hummus en Roasted Bloemkool tonen Veganistisch, bloemkool Glutenvrij en Sate spicy tahoe Veganistisch / Glutenvrij optioneel. Geen recepten of ingrediënten als validatiebron onderzocht; geen menu-/allergenenlabel-/prijswijziging.

De testprijzen zijn de bestaande gekoppelde EB-productprijzen; de websitebron wordt niet gebruikt om prijzen te wijzigen. Nieuwe bevestigingen hebben geen vaste historische prijs: gewone productprijscontrole blijft gelden, en toekomstige kassaberichten blijven onder de bestaande actuele bezorgprijs-/btwvalidator.

## Implementatie
- Alleen gedeelde eilandbezorgerLogica: Loaded Hummus PV-6F37A149 / 2084809 / V11 en bloemkool PV-3AC166C3 / 4705081 / F76 accepteren PVK-AD715B1F-1, exact één gratis keuze, als bevestiging zonder modifier/toeslag. Definitieve gerecht-/ID-/PLU-koppeling verplicht; oorspronkelijke invoer blijft intact.
- Bloemkool PVK-AD715B1F-2: optionele regelmetadata bloemkool_glutenvrij, geen fictieve modifier. De gedeelde orderwriter voegt de expliciete vraag toe aan de juiste regel in de zichtbare ordernotitie.
- Saté PV-51FDF8F3 / 1071041 / Dv11 + PVK-456C0BDC-1 behoudt echte waarde 263905 en krijgt regelmetadata tahoe_glutenvrij: ‘Saté Spicy Tahoe – glutenvrij verzocht, zonder gefruite uitjes’. Gewone saté geen verzoek of extra tekst.
- De orderwriter weigert onveilig gekoppelde gastverzoeken en Saté-verzoeken zonder de echte modifier. Metadata reist met de bestaande genormaliseerde JSON-regels via prijsRegels naar zowel planning als heropbouw bij verzenden. Geen nieuwe kolom, route, prijs- of verzendlogica.
- Historische regels zonder metadata worden niet herschreven of alsnog voorzien van nieuwe tekst. Oorspronkelijke gastnotitie wordt bytegetrouw als prefix behouden. Alleen automatisch gegenereerde verzoekregels worden appended, eenmaal per aangevinkte regel.
- Uluwatu/aubergine Vegan en Hula/Sashimi/Springroll/Saté Glutenvrij blijven echte modifiers; onbekende opties blijven geblokkeerd.

## Lokale verificatie en uitrol
470 bestaande en nieuwe netwerkloze tests geslaagd (0 failed); 40 nieuwe gerichte dieettests en 4 aanvullende normale-ontvangfixturetests. Beide functiechecks geslaagd. Uitsluitend eilandbezorger-bestelling en eilandbezorger-beheer succesvol uitgerold.

Tests omvatten verkeerde definitieve IDs/PLUs, keuzeaantallen/prijzen/duplicaten, normale gewijzigde productprijs, raw-input behoud, echte modifierbehoud, ontbrekend vinkje zonder verzoek, bonnotitie bij juiste regel, heropbouw zonder dubbele tekst en onveilige metadata-afkeur. Een gemockte geplande order bewijst dezelfde bonnotitie bij planning en heropbouw; geen echt netwerk in lokale tests.

## Werkelijke normale ontvangstproeven
Prefix: `TEST-EB-DIEET-20261123-180604-634f-`.
Alle proeven uitsluitend Midsland 36864, modus test, fictieve klantnaam, vooraf_betaald. Ophaaltijd: 23 november 21:30 Europe/Amsterdam. Vooraf ieder GET 404; daarna precies één POST per nummer; ieder status-GET 200.

| Suffix | POST | GET | Opgeslagen status | Restaurant cent | Exacte reden |
|---|---:|---:|---|---:|---|
| HUM-V | 201 | 200 | test_ok | 1080 | — |
| HUM-ZONDER | 201 | 200 | test_ok | 1080 | — |
| HUM-V2 | 201 | 200 | test_ok | 2160 | — |
| BLOEM-V | 201 | 200 | test_ok | 1050 | — |
| BLOEM-GF | 201 | 200 | test_ok | 1050 | — |
| BLOEM-BEIDE | 201 | 200 | test_ok | 1050 | — |
| BLOEM-ZONDER | 201 | 200 | test_ok | 1050 | — |
| BLOEM-REGEL2 | 201 | 200 | test_ok | 3180 | — |
| SATE-GF | 201 | 200 | test_ok | 1100 | — |
| SATE-ZONDER | 201 | 200 | test_ok | 1100 | — |
| SATE-MIX | 201 | 200 | test_ok | 2200 | — |
| SATE-BEIDE | 201 | 200 | test_ok | 2200 | — |
| ULU-V | 201 | 200 | test_ok | 1750 | — |
| AUB-V | 201 | 200 | test_ok | 1150 | — |
| HULA-GF | 201 | 200 | test_ok | 1650 | — |
| SASH-GF | 201 | 200 | test_ok | 1700 | — |
| SPRING-GF | 201 | 200 | test_ok | 890 | — |
| NEG-HUM-DUBBEL | 422 | 200 | afgekeurd | 1080 | Dubbele extra of keuze voor PV-6F37A149 |
| NEG-HUM-AANTAL | 422 | 200 | afgekeurd | 1080 | Dieetkeuze PVK-AD715B1F-1 vereist het bevestigde product voor PV-6F37A149 en één gratis keuze. |
| NEG-HUM-PRIJS | 422 | 200 | afgekeurd | 1081 | Dieetkeuze PVK-AD715B1F-1 vereist het bevestigde product voor PV-6F37A149 en één gratis keuze. |
| NEG-BLOEM-DUBBEL | 422 | 200 | afgekeurd | 1050 | Dubbele extra of keuze voor PV-3AC166C3 |
| NEG-BLOEM-AANTAL | 422 | 200 | afgekeurd | 1050 | Dieetkeuze PVK-AD715B1F-2 vereist het bevestigde product voor PV-3AC166C3 en één gratis keuze. |
| NEG-BLOEM-PRIJS | 422 | 200 | afgekeurd | 1051 | Dieetkeuze PVK-AD715B1F-2 vereist het bevestigde product voor PV-3AC166C3 en één gratis keuze. |
| NEG-VERKEERDDOEL | 422 | 200 | afgekeurd | 1080 | Onbekende of niet toepasselijke extra voor PV-6F37A149: PVK-AD715B1F-2 |
| NEG-AUB-GF | 422 | 200 | afgekeurd | 1150 | Onbekende of niet toepasselijke extra voor PV-97B8CCA0: PVK-AD715B1F-2 |
| NEG-BIET-V | 422 | 200 | afgekeurd | 1550 | Onbekende of niet toepasselijke extra voor PV-CE0EF3F3: PVK-AD715B1F-1 |
| NEG-TOMKHA-V | 422 | 200 | afgekeurd | 1190 | Onbekende of niet toepasselijke extra voor PV-7B1071AD: PVK-AD715B1F-1 |
| NEG-BROOD | 422 | 200 | afgekeurd | 1180 | Onbekende of niet toepasselijke extra voor PV-6F37A149: PVK-DBE8A359-1 |
| NEG-ONBEKEND | 422 | 200 | afgekeurd | 1050 | Onbekende of niet toepasselijke extra voor PV-3AC166C3: PVK-5079BEA6-1 |
| NEG-SATE-DUBBEL | 422 | 200 | afgekeurd | 1100 | Dubbele extra of keuze voor PV-51FDF8F3 |

Onafhankelijke database-readback: 30 orders, 17 test_ok, 13 afgekeurd. Nul bedragafwijkingen, nul gewijzigde oorspronkelijke gastnotities, alle test/Midsland, nul verzendpogingen, nul kassaberichten, nul Lightspeed-order-IDs. Alle afgekeurde orders hebben regels=null.

Positieve ID-readback: Hummus 2084809, bloemkool 4705081, Saté 1071041, Uluwatu 3278252, aubergine 1059431, Hula 1071103, Sashimi 2385824, Springroll 1071044. Hummus/bloemkool hebben geen fictieve extra. Bloemkool-glutenvrij en Saté-glutenvrij hebben de juiste regelmetadata. Saté/Hula/Sashimi/Springroll behouden 263905; Uluwatu/aubergine behouden 1307820. BLOEM-REGEL2 heeft Hummus als regel 1 en 2× bloemkool met gastverzoek als regel 2. SATE-MIX heeft geen verzoek/modifier bij regel 1, beide wel bij regel 2; SATE-BEIDE bij beide regels.

## Lokaal opgebouwde bonberichten
De zes geselecteerde werkelijk aangeleverde scenario-invoeren zijn opnieuw lokaal genormaliseerd en opgebouwd met de productie-orderwriter en expliciete lokale prijs-/btwfixtures, zonder netwerkrechten. Readback bevestigt dezelfde metadata/bedragen/modifiers. Hiermee is bonopbouw bewezen, niet daadwerkelijke Lightspeed-verwerking of printerafdruk.

### BLOEM-BEIDE

```text
  TEST DIEET – NIET BEREIDEN
Eigen gastnotitie intact  

Regel 1 (1×) – Geroosterde bloemkool – gast vraagt glutenvrij
```

Productregels/modifierwaarden: `[{"amount": 1, "totalPrice": 10.5, "modifiers": []}]`.

### BLOEM-REGEL2

```text
  TEST DIEET – NIET BEREIDEN
Eigen gastnotitie intact  

Regel 2 (2×) – Geroosterde bloemkool – gast vraagt glutenvrij
```

Productregels/modifierwaarden: `[{"amount": 1, "totalPrice": 10.8, "modifiers": []}, {"amount": 2, "totalPrice": 21, "modifiers": []}]`.

### SATE-GF

```text
  TEST DIEET – NIET BEREIDEN
Eigen gastnotitie intact  

Regel 1 (1×) – Saté Spicy Tahoe – glutenvrij verzocht, zonder gefruite uitjes
```

Productregels/modifierwaarden: `[{"amount": 1, "totalPrice": 11, "modifiers": [263905]}]`.

### SATE-ZONDER

```text
  TEST DIEET – NIET BEREIDEN
Eigen gastnotitie intact  
```

Productregels/modifierwaarden: `[{"amount": 1, "totalPrice": 11, "modifiers": []}]`.

### SATE-MIX

```text
  TEST DIEET – NIET BEREIDEN
Eigen gastnotitie intact  

Regel 2 (1×) – Saté Spicy Tahoe – glutenvrij verzocht, zonder gefruite uitjes
```

Productregels/modifierwaarden: `[{"amount": 1, "totalPrice": 11, "modifiers": []}, {"amount": 1, "totalPrice": 11, "modifiers": [263905]}]`.

### SATE-BEIDE

```text
  TEST DIEET – NIET BEREIDEN
Eigen gastnotitie intact  

Regel 1 (1×) – Saté Spicy Tahoe – glutenvrij verzocht, zonder gefruite uitjes
Regel 2 (1×) – Saté Spicy Tahoe – glutenvrij verzocht, zonder gefruite uitjes
```

Productregels/modifierwaarden: `[{"amount": 1, "totalPrice": 11, "modifiers": [263905]}, {"amount": 1, "totalPrice": 11, "modifiers": [263905]}]`.

## Beperkingen en ongewijzigde grenzen
- Betaald glutenvrij brood PVK-DBE8A359-1 (€1) wordt niet gratis gemaakt of weggefilterd. De bestaande Hummus-broodmapping is inactief: echte ontvangst afgekeurd als onbekend/niet toepasselijk. Een afzonderlijke lokale test met actieve betaalde fixture blokkeert bovendien expliciet vanwege onbevestigde bezorg-btw/bedragopbouw. Geen betaalde broodverwerking als geslaagd presenteren.
- Aubergine Glutenvrij, Bietenburger/Tom Kha Vegan en verkeerde/ongekende keuzes bleven afgekeurd; geen automatische menu- of recipe-based aannames toegevoegd.
- Geen allergenenvrij-/kruisbesmettingsgarantie, echte kassaverzending of betaling, Lightspeed/Karin-menuwijziging, frontendpublicatie, printer-/livevlag-/FR01-wijziging. Live=false opnieuw teruggelezen. Geen rate limit waargenomen.
