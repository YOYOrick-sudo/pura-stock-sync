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
- Vaste klant-ID: bij de eerste controle leeg; bij de eindcontrole van deze voorbereiding **inmiddels ingevuld**. In deze beurt niet gekozen of gewijzigd; de juiste klantkaart wordt in het afzonderlijke bevestigingstraject gecontroleerd. Geen klantgegevens bij Lightspeed opgevraagd.
- Betaalwijze ‘Eilandbezorger’: **ID 285794, typeId 4**, bevestigd met HTTP 200 via de gerichte paymenttype-GET en opgeslagen voor Midsland. Yorick heeft Card/type 4 en Auto finalize in de backoffice bevestigd; automatisch afslaan bij een fysieke order blijft te controleren.
- Orderroute: `customer_order`. Geen company-ID nodig voor deze variant; daadwerkelijke verwerking moet de kassaproef bevestigen.
- Frietcode `PV-FFA8275F` is gekoppeld aan kassaproduct `4636994`, €7 incl. btw. Andere onzekere producten/formaat-/extrakoppelingen blijven open; de bestaande prijscontroles blijven gelden.
- Historische test `EB-TEST-20261122-120013` blijft `test_ok` en wordt niet aangepast of verzonden.

## Lokaal testen (geen echte orders)
Gebruik de gegevens van de historische test: Sanne de Vries, 3× `PV-FFA8275F` à 700 cent, totaal 2100 cent, `korting: null`, `Saus apart`.
Controleer ontvangst/testmodus, een gesimuleerde liveweg met vaste klant, ontbrekende vaste klant, ontbrekende contactvelden, historische herhaling en inhoudsconflicten. Mocks vervangen alle kassatoegang; deze tests maken geen database- of Lightspeed-klanten aan.

Uitgevoerd: 40 lokale tests geslaagd, waaronder vier tests door de volledige ontvangfunctie met uitsluitend een database/kassa in geheugen. Geen echte kassatoegang, klantaanmaak of nieuwe opgeslagen testorder.

## Eenmalige fysieke Ginger Beer-proef — alleen voorbereid
**Nog niet uitvoeren: wacht op de afzonderlijke expliciete uitvoeropdracht van Yorick en de bevestiging van de vaste klantkaart.** De voorbereiding maakt geen proeforder aan, kiest geen klant-ID en stuurt niets naar Lightspeed.

Deze uitzondering is uitsluitend geldig op **22 november 2026, Europe/Amsterdam**, en vereist dat gewone liveverzending expliciet **uit** staat. Ze werkt alleen via de bestaande Pura-beheerfunctie, met een ingelogde actieve eigenaar. De partner-ontvangsleutel, managers en cron hebben geen toegang. Er is geen nieuwe schermknop of frontendpublicatie.

Exacte normale functieaanroep vanuit de bestaande ingelogde Pura-client (`@/integrations/supabase/client`), uitsluitend na uitvoerakkoord:
```typescript
const { data, error } = await supabase.functions.invoke('eilandbezorger-beheer', {
  body: {
    actie: 'ginger_beer_proef',
    referentie: 'PV-PROEF-MID-20261122-GB01',
    bevestiging: true,
  },
});
```
Dit is de bestaande Pura-aanroepwijze, niet een verzoek rechtstreeks naar Lightspeed en geen los in de browserconsole beschikbaar gemaakte client. In de Lovable-editor kan Yorick later expliciet opdracht geven om deze ene actie met zijn beveiligde Pura-preview-eigenaarslogin uit te voeren; niet de partnerontvangfunctie gebruiken. De bestaande bestellijst op `/cijfers/eilandbezorger` toont daarna de proef en haar pogingen/status.

Alle bestellingvelden worden vast server-side opgebouwd; vrije product-, klant- of bestellinginvoer wordt geweigerd:
- Referentie én bestelnummer `PV-PROEF-MID-20261122-GB01`; nieuwe live-proef, nooit een omgezette test.
- Midsland `36864`, 1× `PV-0680E844` Naturfrisk Ginger beer → `4636894`, exact €4,90 incl. btw.
- `description`: `PV-PROEF-MID-20261122-GB01 — Pura Test`.
- `note`: exact `TEST – niet klaarmaken`.
- Betaalobject: €4,90, bestaande betaalwijze `285794`, type `4`, fooi 0. Geen incasso of nieuwe betaalwijze.
- Geen extra’s, korting of bezorgkosten. Ophaaltijd is het uitvoermoment, dus binnen het bestaande afhaalvenster; geen geplande wachtrij.
- Alleen de afzonderlijk bevestigde, bestaande vaste klant-ID uit de Midsland-configuratie. Ontbreken of tussentijdse wijziging blokkeert veilig; de proef zoekt, maakt of wijzigt geen klant.

De referentie is voor partneraanlevering en tijdwijzigingen gereserveerd. Normale vrijgave/herverzending en de normale verzender kunnen deze proef niet versturen. Een unieke order-ID/referentie en permanente unieke poging-ID voorkomen een tweede POST, ook na gelijktijdigheid, weigering of verloren antwoord. **Eenmaal geclaimd nooit opnieuw proberen**: een storing vóór het verzoek kan daarom een ongezonden proef opleveren. Historie blijft bewaard; status/teruglezen controleren, niet omzeilen met een ander nummer.

Voorbereiding geverifieerd met **82 lokale tests** zonder netwerkrechten; alleen `eilandbezorger-beheer` en `eilandbezorger-bestelling` uitgerold. Eindcontrole: live uit, betaalwijze ongewijzigd `285794`/`4`, nul opgeslagen proeforders. Geen Lightspeed-aanroep, klantmutatie, live-vlagwijziging of frontendpublicatie in deze voorbereiding.

Vóór en direct voor het latere kassaverzoek worden datum, actieve eigenaarsrol, vaste klant, live-uit, betaalwijze, actieve exacte productmapping en afhaalvenster opnieuw gecontroleerd. Geen globale aan-uittruc. Na Amsterdamse middernacht vervalt de actie vanzelf.

Controleer tijdens de begeleide fysieke proef:
1. Bestelnummer en **Pura Test** op keukenbon én klantbon; `TEST – niet klaarmaken` exact in de aparte notitie.
2. Eén keukenbon, 1× Ginger beer, totaal €4,90; team maakt niets klaar.
3. €4,90 op Eilandbezorger, €0 open; automatisch accepteren/voltooien via het echte apparaatprofiel en afslaan, zonder incasso of app-vlagsimulatie.
4. Bij onzeker antwoord: alleen status/pogingen uitlezen; geen tweede verzending. Afdruk op beide bonnen, betaalobjectverwerking en automatisch afslaan blijven fysiek onbevestigd.

Geplande orders gaan pas door wanneer live aan staat en de instellingen compleet zijn. Kortingen blijven afgekeurd. Annuleren of wijzigen na verzending gaat telefonisch.
