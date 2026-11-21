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
  "klant": { "voornaam": "Sanne", "achternaam": "de Vries", "email": "sanne.devries@example.com", "klantcode": "EBK-10293" },
  "opmerking": "Geen ui",
  "regels": [
    { "code": "FRIET-ZOET", "naam": "Zoete Aardappel Friet", "aantal": 2, "stukprijs_cent": 700,
      "extras": [{ "code": "MAYO", "aantal": 1, "stukprijs_cent": 50 }] }
  ],
  "bedragen": {
    "restaurant_cent": 1500,
    "bezorgkosten_cent": 350,
    "fooi_cent": 0,
    "korting": null
  },
  "betaling": { "wijze": "vooraf_betaald", "referentie": "pay_123" }
}
```
Regels:
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

## Nog niet klaar of niet getest
- **Productcodes zijn nog niet gekoppeld.** Tot Pura de lijst vult, wordt elke bestelling afgekeurd met "Onbekend product". Stuur Pura je productcodes en prijzen.
- Daardoor is `test_ok` nog niet echt bereikt; de route ernaartoe is wel automatisch getest.
- **Live verzending naar de kassa staat uit.** Live-bestellingen worden nu `geblokkeerd`.
- Klant: voor live verplicht `klant.voornaam`, `klant.achternaam`, `klant.email`; optioneel `klant.klantcode` (vaste code van Eilandbezorger). Per gast ontstaat één Lightspeed-klantprofiel (herkend op klantcode of exact e-mailadres). Twijfel → status `ter_beoordeling`. `klant.telefoon` wordt geaccepteerd maar nooit gebruikt. Oude berichten met alleen `klant.naam` blijven geldig voor test.
- `opmerking` gaat ongewijzigd naar de bon (Lightspeed `note`), alleen bij die bestelling. Het bestelnummer staat in `description`.
- Betaling gaat mee als één `orderPayments`-object (officieel POST-voorbeeld). Formaat nog niet door een echte kassaproef bevestigd.

## Begeleide kassaproef (één keer, pas na akkoord Yorick en live aan)
`bestelnummer` nieuw (bijv. `EB-PROEF-20261122-1`), `modus: "live"`, 3× `PV-FFA8275F` à 700, `restaurant_cent: 2100`, `opmerking: "Saus apart"`, echte gastnaam/e-mail van de proefpersoon. Geslaagd: naam en "Saus apart" op keukenbon én klantbon, keukenbon precies één keer, €21,00 op "Eilandbezorger – vooraf betaald", €0,00 open, zonder handmatig afslaan. Bij een time-out niet opnieuw versturen; eerst teruglezen.
- Automatisch doorsturen van geplande bestellingen wordt pas aangezet als live aangaat.
- Kortingen worden afgekeurd tot een kassaproef.
- Annuleren of wijzigen na verzending gaat telefonisch.
