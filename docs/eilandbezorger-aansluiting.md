# Aansluitinstructie Eilandbezorger -> Pura Vida (Midsland)

## Adres
`https://ajtqzzzpawqcoaphdkaz.supabase.co/functions/v1/eilandbezorger-bestelling`

Alleen Midsland (vestiging `36864`). Andere vestigingen worden geweigerd.

## Authenticatie
- Kop `x-eilandbezorger-sleutel: <sleutel>` bij elke aanroep.
- Eén vaste sleutel voor test en live. Pura geeft hem via een veilig kanaal (wachtwoordmanager of eenmalige link), nooit via mail of chat.
- Bewaar hem uitsluitend server-side (geheim in jouw backend). Nooit in browsercode of logs.
- De sleutel kan alleen aanleveren, ophaaltijd wijzigen en status opvragen.

## Modus (verplicht)
Elke aanroep bevat `"modus": "test"` of `"modus": "live"`. Ontbreekt hij: 400.
- De modus wordt bij ontvangst vastgelegd en kan nooit veranderen.
- `test` gaat nooit naar de kassa, ook niet als live aan staat. Een test kan niet naar live worden omgezet; stuur dan een nieuwe live-bestelling.
- `live` gaat alleen door als Pura live verzending voor Midsland heeft aangezet en de kassa-instellingen compleet zijn. Anders: `geblokkeerd`. **Live verzending staat nu uit.**
- Test en live hebben elk hun eigen nummerreeks: hetzelfde bestelnummer mag in beide voorkomen.

## Bestelling aanleveren (POST)
```json
{
  "versie": 1,
  "modus": "test",
  "bestelnummer": "EB-2026-0001",
  "vestiging": "36864",
  "ophaaltijd": "2026-11-21T17:30:00+01:00",
  "bezorgtijd": "2026-11-21T17:50:00+01:00",
  "klant": { "voornaam": "Sanne", "achternaam": "de Vries" },
  "opmerking": "Saus apart",
  "regels": [
    { "code": "PV-FFA8275F", "naam": "Zoete Aardappel Friet", "aantal": 3, "stukprijs_cent": 700 }
  ],
  "bedragen": {
    "restaurant_cent": 2100,
    "bezorgkosten_cent": 350,
    "fooi_cent": 0,
    "korting": null
  },
  "betaling": { "wijze": "vooraf_betaald", "referentie": "pay_123" }
}
```
Regels:
- `klant`: alleen `voornaam` + `achternaam`, of `naam` als bestaande volledige naam. Als beide zijn ingevuld, gebruiken we voornaam + achternaam. E-mail, telefoon en klantcode zijn niet nodig: niet aanleveren; toch meegekomen velden worden genegeerd en niet opgeslagen in nieuwe berichten/logs. Ontbreken blokkeert nooit.
- `bestelnummer`: letters, cijfers, `.`, `_`, `-`; max 64.
- Tijden in ISO 8601 met tijdzone. `ophaaltijd` = wanneer de bezorger ophaalt (stuurt de keuken). `bezorgtijd` = bij de klant (alleen bewaard).
- `stukprijs_cent` per stuk; extras per hoofdproduct (aantal extra × aantal product).
- `restaurant_cent` = som van regels + extras, exact. Bezorgkosten en fooi apart; die gaan niet naar de kassa.
- `korting` (optioneel): `{ actiecode, oorspronkelijk_cent, korting_cent, betaald_door: "eilandbezorger"|"restaurant" }`. **Kortingen worden nu afgekeurd** ("Korting nog niet ondersteund") tot een kassaproef.
- `betaling.wijze` moet `vooraf_betaald` zijn.
- Productcodes moeten door Pura gekoppeld zijn; onbekende code of prijsafwijking > 1 cent: afgekeurd.

## Ophaaltijd wijzigen (POST)
```json
{ "actie": "ophaaltijd", "modus": "live", "vestiging": "36864", "bestelnummer": "EB-2026-0001", "ophaaltijd": "2026-11-21T18:00:00+01:00" }
```
Alleen zolang de bestelling nog niet naar de kassa is. Daarna 409: bel het restaurant.

## Status opvragen (GET)
`GET ...?vestiging=36864&bestelnummer=EB-2026-0001&modus=test`

Antwoord (ook bij aanleveren):
```json
{ "bestelnummer": "EB-2026-0001", "vestiging": "36864", "modus": "test", "status": "test_ok",
  "reden": null, "referentie": "EB-T-36864-EB-2026-0001", "ophaaltijd": "...", "bijgewerkt_op": "..." }
```

## Foutantwoorden
Fouten hebben de vorm `{ "fout": "<uitleg>" }`, bij 400 met `velden` per ongeldig veld. Bij 409 en 422 staat ook de bestaande status in het antwoord.

## HTTP-codes
| Code | Betekenis | Wat te doen |
|---|---|---|
| 201 | Nieuw ontvangen | Status lezen |
| 200 | Exact dezelfde bestelling al bekend | Niets; bestaande status staat in het antwoord |
| 400 | Ongeldig (veld/modus ontbreekt) | Bericht repareren |
| 401 | Sleutel fout | Niet herhalen; contact Pura |
| 404 | Onbekend (statusopvraag) | Controleer nummer en modus |
| 409 | Bestelnummer bestaat met andere inhoud, of wijziging te laat | Niet automatisch herhalen; bellen |
| 422 | Afgekeurd (zie `reden`) | Niet herhalen met dezelfde inhoud |
| 500 | Storing bij ons | Na 1 minuut exact hetzelfde opnieuw sturen (veilig: wordt herkend) |

Herhalingen van historische orders worden ook herkend na normalisatie zonder contactgegevens; gewijzigde gastnaam, opmerking, productregels of bedragen blijven 409. Historische testorders blijven staan.

Bij een time-out: stuur exact dezelfde bestelling opnieuw of vraag de status op. Nooit een nieuw bestelnummer voor dezelfde bestelling.

## Statussen
| Status | Betekenis |
|---|---|
| `test_ok` | Test goedgekeurd; niets naar de kassa |
| `afgekeurd` | Controle mislukt, zie `reden` |
| `geblokkeerd` | Live, maar live verzending staat uit of instellingen ontbreken; Pura beoordeelt |
| `gepland` | Live, wordt kort voor de ophaaltijd naar de kassa gestuurd |
| `verzenden` | Bezig |
| `verzonden` | Lightspeed heeft de order aangenomen (geen garantie op bon/betaling) |
| `geweigerd` | Lightspeed weigerde; Pura handelt af |
| `uitkomst_onbekend` | Onzeker of hij in de kassa staat; Pura controleert. Niet zelf opnieuw sturen |
| `geannuleerd` | Door Pura geannuleerd vóór verzending |

Annuleren of wijzigen ná verzending: telefonisch met het restaurant.

## Getest (20 november 2026, op de echte ontvangfunctie)
- Verkeerde sleutel: 401.
- Bestelling zonder modus: 400. West (41121): 400.
- Twee gelijktijdige identieke testbestellingen: één opgeslagen; de tweede kreeg de bestaande status (200).
- Identieke herhaling: 200. Zelfde nummer, andere inhoud: 409.
- Statusopvraag met modus toont `"modus": "test"`; dezelfde vraag met `modus=live`: 404; zonder modus: 400.
- Testbestelling ging niet naar Lightspeed (nul verzendpogingen).
- Daarnaast 17 automatische tests: bedragen, extra's, betaalwijze, korting, venster, dubbele verzending, verloren antwoord, laat antwoord, tokenvernieuwing.

## Vaste klant en orderspecifieke naam
- Alle Midsland-bestellingen gebruiken één vaste Lightspeed-klant ‘Eilandbezorger’, via de bestaande locatie-instelling `lightspeed_klant_id`.
- Er wordt geen klant per gast gezocht, aangemaakt of gewijzigd. Geen aparte bestelgeschiedenis per gast.
- Ontbreekt de vaste klant-ID, dan blijft ontvangst werken en blijft een geldige test `test_ok`; alleen kassaverzending wordt geblokkeerd met “Vaste Lightspeed-klant Eilandbezorger voor Midsland ontbreekt.”
- `description`: bestelnummer + ` — ` + gastnaam, bijvoorbeeld `EB-TEST-20261122-120013 — Sanne de Vries`.
- `note`: Karins opmerking exact, bijvoorbeeld `Saus apart`; geen toevoegingen of weggelaten spaties.
- Betaling blijft één `orderPayments`-object, met het volledige restaurantbedrag. Formaat en automatisch afslaan moeten fysiek worden bevestigd.

## Stand van de fysieke proef (22 november 2026)
Alleen bestaande instellingen uitgelezen; geen kassaverzoek uitgevoerd.
- Midsland-liveverzending: **uit**; blijft uit.
- Vaste klant-ID voor ‘Eilandbezorger’: **nog niet ingevuld**. Laat Yorick de juiste bestaande klant en ID bevestigen.
- Betaalwijze-ID en betaalwijze-type-ID: **nog niet ingevuld**. De bestaande betaalwijze ‘eilandbezorger’ is daarmee nog niet aan deze koppeling gekoppeld; of zij in Lightspeed actief en correct ingesteld is, is niet bevestigd.
- Orderroute: `customer_order`. Geen company-ID nodig voor deze variant; daadwerkelijke verwerking moet de kassaproef bevestigen.
- Frietcode `PV-FFA8275F` is gekoppeld aan kassaproduct `4636994`, €7 incl. btw. Andere onzekere producten/formaat-/extrakoppelingen blijven open; de bestaande prijscontroles blijven gelden.
- Historische test `EB-TEST-20261122-120013` blijft `test_ok` en wordt niet aangepast of verzonden.

## Lokaal testen (geen echte orders)
Gebruik de gegevens van de historische test: Sanne de Vries, 3× `PV-FFA8275F` à 700 cent, totaal 2100 cent, `korting: null`, `Saus apart`.
Controleer ontvangst/testmodus, een gesimuleerde liveweg met vaste klant, ontbrekende vaste klant, ontbrekende contactvelden, historische herhaling en inhoudsconflicten. Mocks vervangen alle kassatoegang; deze tests maken geen database- of Lightspeed-klanten aan.

Uitgevoerd: 40 lokale tests geslaagd, waaronder vier tests door de volledige ontvangfunctie met uitsluitend een database/kassa in geheugen. Geen echte kassatoegang, klantaanmaak of nieuwe opgeslagen testorder.

## Begeleide kassaproef (pas na akkoord Yorick)
Gebruik een **nieuw** bestelnummer (bijvoorbeeld `EB-PROEF-20261122-1`), `modus: "live"`, gastnaam zonder contactvelden, 3× friet à €7, totaal €21 en `opmerking: "Saus apart"`. Vul eerst de bevestigde vaste klant-ID en beide betaalwijze-IDs in; zet live alleen bewust voor de begeleide proef aan.

Controleer op de fysieke kassa:
1. Bestelnummer en **Sanne de Vries** op keukenbon én klantbon; `Saus apart` exact in de aparte notitie.
2. Eén keukenbon, 3× friet, totaal €21.
3. €21 geboekt op de bestaande betaalwijze ‘eilandbezorger’, €0 open en automatisch afgeslagen zonder handwerk.
4. Bij timeout: niet opnieuw versturen met een nieuw nummer; eerst status/teruglezen controleren. Afdruk op beide bonnen en automatisch afslaan zijn **nog niet bewezen**.

Geplande orders gaan pas door wanneer live aan staat en de instellingen compleet zijn. Kortingen blijven afgekeurd. Annuleren of wijzigen na verzending gaat telefonisch.
