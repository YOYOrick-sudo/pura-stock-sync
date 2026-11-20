# Eilandbezorger -> Lightspeed L-Series: beveiligde bestelkoppeling

## Wat het doet (in de praktijk)
Eilandbezorger stuurt een betaalde bestelling naar ons. Wij slaan hem op, controleren hem en sturen hem pas door naar de kassa van Midsland of West als die bestelling live is én live verzending voor die vestiging aan staat. Standaard staat live verzending uit. Managers zien op een overzichtspagina wat binnen is, wat vastzit en waarom; problemen worden ook actief gemeld.

## Wat gebouwd wordt
1. Ontvangfunctie `eilandbezorger-bestelling` met twee aparte sleutels: `EILANDBEZORGER_SLEUTEL_TEST` en `EILANDBEZORGER_SLEUTEL_LIVE` (via invulveld, nooit in chat). De gebruikte sleutel legt bij ontvangst vast of een bestelling test of live is. Testbestellingen gaan nooit naar Lightspeed, ook niet als live aan staat. Daarnaast een statusopvraag op bestelnummer. Karins sleutels kunnen alleen aanleveren en status opvragen, geen beheeracties.
2. Opslag: `externe_bestellingen` (uniek op bron + modus + vestiging + bestelnummer, ruwe invoer, inhoudsvingerafdruk, gecontroleerde regels, gewenste ophaaltijd, status, reden, Lightspeed-order-ID en -antwoord) plus `externe_bestelling_log` voor statusgeschiedenis. Niets wordt verwijderd.
3. Productkoppeling `externe_product_koppeling` (vestiging, Eilandbezorger-code -> Lightspeed product-ID/PLU, verwachte prijs, toegestane extra's). Leeg tot jullie hem vullen.
4. Controle: vestiging 36864 of 41121 met actieve koppeling; producten en extra's gekoppeld; regelprijzen kloppen (1 cent marge); betaalwijze "vooraf betaald". Bedragen gescheiden: restaurantbedrag (regels + extra's) wordt gecontroleerd en naar de kassa gestuurd; bezorgkosten, fooi en korting van Eilandbezorger worden apart opgeslagen en niet als kassaregel meegestuurd tot jullie anders beslissen.
5. Dubbele aanlevering: identieke herhaling geeft de bestaande status terug (200). Zelfde bestelnummer met andere inhoud geeft 409 en wordt niet verwerkt; wijzigingen lopen voorlopig handmatig.
6. Vooruitbestellingen: een bestelling met ophaaltijd verder dan een instelbaar venster (standaard 45 minuten) krijgt `gepland` en wordt pas binnen dat venster verstuurd (geplande ronde elke 5 minuten, alleen zolang er geplande live-bestellingen zijn). Een gewijzigde ophaaltijd vóór verzending mag via een aparte, versiegebonden aanroep; ná verzending geeft dat 409 en een melding voor handmatige afhandeling in de kassa.
7. Doorsturen via een losse ordermodule (`POST /rest/onlineordering/customer/{customerId}/order`), met één bewust gekozen generieke klant per vestiging waarvan de gegevens niet overschreven worden; gastnaam en telefoon in de bestelnotitie. Gebruikt het bestaande tokenbeheer.
8. Schakelaar `eilandbezorger_live` per vestiging (bestaande Fase 2-vlaggen), standaard uit. Live-bestelling terwijl de schakelaar uit staat: status `geblokkeerd` met melding, nooit `test_ok`.
9. Overzichtspagina `/cijfers/eilandbezorger` (alleen manager/eigenaar): compacte tabel, filter "Aandacht nodig", detaillade met regels en geschiedenis. "Opnieuw proberen" alleen bij een zekere fout (Lightspeed weigerde expliciet). Beheeracties lopen via een server-functie die zelf de rol controleert.
10. Actieve meldingen: bij `uitkomst_onbekend`, `geblokkeerd`, of `verzenden` langer dan 2 minuten komt een melding in de bestaande notificaties voor managers van die vestiging.
11. Aansluitinstructie voor Karin als document.

## Statussen
`ontvangen` -> `afgekeurd` | `test_ok` | `geblokkeerd` | `gepland` -> `verzenden` -> `verzonden` | `geweigerd` | `uitkomst_onbekend`.
- `verzonden` betekent alleen: Lightspeed heeft de order aangenomen en een order-ID gegeven. Het bewijst geen correcte keukenbon of betaling; daarvoor is de proefbestelling op de kassa nodig.
- `uitkomst_onbekend`: timeout, afgebroken verbinding of opslagfout na verzending. Geen herhaalknop; de manager controleert in de kassa en markeert "Staat in kassa" of "Niet in kassa, opnieuw versturen".
- Antwoorden aan Eilandbezorger: 201 nieuw, 200 identieke herhaling, 400 ongeldig, 401 sleutel fout, 409 conflict, 422 afgekeurd met reden.

## Wat ik test
- Twee gelijktijdige identieke bestellingen: één verwerking.
- Zelfde bestelnummer, andere inhoud: 409.
- Lightspeed verwerkt, antwoord gaat verloren (gesimuleerd): `uitkomst_onbekend`, geen herverzending.
- Testsleutel terwijl live aan staat: `test_ok`, niets verstuurd.
- Live-sleutel terwijl live uit staat: `geblokkeerd`.
- Vooruitbestelling met gewijzigde ophaaltijd, vóór en na verzending.
- Tokenvernieuwing gelijktijdig vanuit omzetophaling en orderverwerking (gesimuleerd): één vernieuwing, beide gebruiken de nieuwste tokens.
- Controles op bedragen, producten, extra's, betaalwijze, vestiging.
- Functietest zonder sleutel (401) en met testsleutel (TEST-bestelnummer, opruimen pas na jouw OK). Overzichtspagina ingelogd bekeken.

## Wat nog ontbreekt (blokkeert echte verzending, niet de bouw)
- Bevestiging welke orderroute bij onze accounts hoort (gewoon of establishment) en de werkelijke Lightspeed-bedrijfsidentiteit per koppeling. Rechten: Mark bevestigde dat alle scopes standaard zijn toegekend; echte orderinvoer moet nog getest worden.
- Generieke klant-ID per vestiging (aanmaken in Lightspeed).
- Betaalwijze-ID "vooraf betaald Eilandbezorger" per vestiging.
- Actuele producten/PLU's en bezorgprijzen voor de koppeltabel.
- Of en hoe Lightspeed een orderstatus terug laat opvragen; tot die tijd blijft `verzonden` het eindpunt.
- Gecontroleerde proefbestelling op de echte kassa met iemand die keukenbon en bedrag controleert.
- Van Karin: bestelnummer-formaat, productcodes, ophaaltijdafstemming en handmatige werkwijze voor wijzigen/annuleren.

## Technische details
- Tokenlogica wordt gekopieerd naar `supabase/functions/_shared/lightspeedToken.ts`; `lightspeed-sync`, `lightspeed-oauth` en de callback blijven ongewijzigd. Zelfde lease-bron `lightspeed`; na het verkrijgen van de lease worden tokens opnieuw gelezen en de nieuwe refresh-token direct opgeslagen.
- Overgang naar `verzenden` via atomaire update op status; verzendingen die >2 min op `verzenden` blijven worden door de geplande ronde naar `uitkomst_onbekend` gezet.
- Vingerafdruk = SHA-256 van genormaliseerde bestelinhoud; sleutelvergelijking in constante tijd; nooit loggen.
- RLS met `has_role`; select voor managers/eigenaren, schrijven alleen via service_role. Beheerfunctie controleert rol via `auth.getUser()`.
- Geplande ronde via pg_cron elke 5 minuten (288 runs per dag); stopt direct als er niets gepland of vastgelopen is.
- Geen publicatie van de app; de functies worden gedeployed zodat Karin in testmodus kan aansluiten.
