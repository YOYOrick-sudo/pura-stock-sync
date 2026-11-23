# Hula Vegan — gerichte correctie en ontvangstbewijs

## Actuele correctie — 23 november 2026 18:37 UTC
Hula is volgens de nieuwste eigenaarcorrectie niet standaard vegan. De eerdere goedkeuring hieronder is ingetrokken: nieuwe Hula-aanleveringen met Vegan worden afgekeurd, ook via gekoppelde Vegan-aliassen. Gewone Klein/Groot en onafhankelijk geldige andere keuzes blijven behouden. De code en regressies zijn aangepast; uitrol en nieuwe normale POST/GET-ontvangstcontrole staan nog open. De onderstaande resultaten blijven uitsluitend historische resultaten, geen actuele toestemming.

## Historische wijziging
Gedeelde `controleer` accepteert uitsluitend het gratis informatieve Vegan-vinkje PVK-319766B2-1 bij PV-F7B26912, Midsland 36864, met expliciet Klein PVK-241B2733-1 / Dh16 / 1071103 (1650 + 0 cent) of Groot PVK-241B2733-2 / B140 / 2385828 (1650 + 850 cent). Definitieve koppeling en prijs moeten exact overeenkomen; keuzeaantal is 1 en keuzeprijs 0.

De aangeleverde keuze blijft in `invoer` en de vingerafdruk; de genormaliseerde Hula-regel bevat geen Vegan-extra. Glutenvrij blijft een echte optie. Het gedrag zonder Vegan is ongewijzigd. Geen mappings, schema, rollen, menu's, livevlag of printers gewijzigd.

## Uitrol en lokale tests
- Alleen `eilandbezorger-bestelling` en `eilandbezorger-beheer` succesvol uitgerold.
- 426 netwerkloze Deno-tests geslaagd, waaronder 30 gerichte Hula-regressies; beide functiechecks geslaagd.
- Onder meer verkeerde definitieve ID/PLU/prijs, inactieve/optionele/verkeerde/ontbrekende maat, één cent afwijking, dubbele/meervoudige/betaalde keuze, beide echte/confirmation-opties en behoud oorspronkelijke invoer getest.
- Uluwatu blijft een echte bereidingsmodifier; Sashimi Vegan blijft afkeur.

## Werkelijke ontvangstproeven
Vaste prefix voor onderstaande nieuwe nummers: `TEST-EB-HULAV-20261123-114021-aa7c-`.
Alle proeven via de bestaande geautoriseerde normale ontvanger, uitsluitend modus `test`, Midsland `36864`, fictieve naam, vooraf_betaald, ophaaltijd 23 november 2026 20:30 Europe/Amsterdam. Elke referentie vooraf GET 404; één POST per referentie; daarna GET 200.

| Suffix | POST | Status | Definitief product | Aantal | Stuk/regel cent | Genormaliseerde extra |
|---|---:|---|---|---:|---|---|
| K-VEGAN | 201 | test_ok | 1071103 | 1 | 1650 / 1650 | Geen |
| G-VEGAN | 201 | test_ok | 2385828 | 1 | 2500 / 2500 | Geen |
| G-ZONDER | 201 | test_ok | 2385828 | 1 | 2500 / 2500 | Geen |
| G-VEGAN2 | 201 | test_ok | 2385828 | 2 | 2500 / 5000 | Geen |
| G-BEIDE | 201 | test_ok | 2385828 | 1 | 2500 / 2500 | Glutenvrij 263905, aantal 1, 0 cent |
| ULU-VEGAN | 201 | test_ok | 3278252 | 1 | 1750 / 1750 | Vegan 1307820, aantal 1, 0 cent |
| SASH-VEGAN | 422 | afgekeurd | Geen | — | — | Onbekende of niet toepasselijke extra voor PV-0F623FEC: PVK-319766B2-1 |
| DUBBEL | 422 | afgekeurd | Geen | — | — | Dubbele extra of keuze voor PV-F7B26912 |
| AANTAL2 | 422 | afgekeurd | Geen | — | — | Exacte Hula-koppeling/maatprijs en één gratis keuze vereist |
| VEGANPRIJS | 422 | afgekeurd | Geen | — | — | Exacte Hula-koppeling/maatprijs en één gratis keuze vereist |
| GEENMAAT | 422 | afgekeurd | Geen | — | — | Formaat ontbreekt of is onbekend voor PV-F7B26912 |
| FOUTMAAT | 422 | afgekeurd | Geen | — | — | Formaat ontbreekt of is onbekend voor PV-F7B26912 |
| BASISPRIJS | 422 | afgekeurd | Geen | — | — | Exacte Hula-koppeling/maatprijs en één gratis keuze vereist |
| MAATAANTAL | 422 | afgekeurd | Geen | — | — | Formaat PVK-241B2733-1 moet aantal 1 hebben |

Exacte nieuwe gezamenlijke afkeurtekst voor AANTAL2, VEGANPRIJS en BASISPRIJS: `Hula Vegan vereist de bevestigde Klein/Groot-koppeling, exacte maatprijs en één gratis keuze.`

Onafhankelijke database-readback: alle zes positieve orders hebben één genormaliseerde productregel; alle aangeleverde Vegan-keuzes zijn in oorspronkelijke invoer bewaard. G-ZONDER heeft daar geen Vegan-keuze. Alle acht afgekeurde orders hebben geen genormaliseerde regels. Alle veertien orders: nul verzendpogingen, orderbericht null en Lightspeed-order-ID null. Reguliere livevlag onveranderd false.

## Grenzen
Geen fysieke kassaverwerking of betaling getest/uitgevoerd. Glutenvrij en Uluwatu testontvangst gebruiken de bestaande alleen-lezen cataloguscontrole; de overige Hula-bevestigingen veroorzaken geen modifier/cataloguspad. Geen rate limit waargenomen. Historische afgekeurde Hula-veganproeven zijn niet herhaald of gewijzigd. FR01-plan apart ongewijzigd behouden.