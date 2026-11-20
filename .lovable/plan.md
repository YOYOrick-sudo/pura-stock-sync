# Eilandbezorger -> Lightspeed L-Series: beveiligde bestelkoppeling

## Wat het doet (in de praktijk)
Eilandbezorger stuurt een betaalde bestelling naar ons. Wij slaan hem op, controleren hem (vestiging, producten, extra's, bedragen, betaalwijze) en sturen hem pas door naar de kassa van Midsland of West als echte verzending aan staat. Standaard staat alles in testmodus: er gaat niets naar Lightspeed. Managers zien op een overzichtspagina welke bestellingen binnen zijn, wat afgekeurd is en waarom.

Wat er gebeurt als het misgaat:
- Dubbel verstuurd door Eilandbezorger: herkend op hun bestelnummer, geen tweede kassabon.
- Lightspeed traag of fout: bestelling blijft staan als "fout", zichtbaar in het overzicht, opnieuw proberen met de hand. Geen automatische herhaling naar de kassa (risico op dubbele keukenbon).
- Onbekend product of afwijkend bedrag: afgekeurd met reden, Eilandbezorger krijgt dat direct terug.

## Wat gebouwd wordt
1. Ontvangfunctie `eilandbezorger-bestelling` (server). Eigen sleutel voor Eilandbezorger in kop `x-eilandbezorger-sleutel`, vergeleken met nieuw geheim `EILANDBEZORGER_SLEUTEL` (jij vult het in via een invulveld; nooit in chat). Ook een statusopvraag op bestelnummer.
2. Opslag: tabel `externe_bestellingen` (bestelnummer Eilandbezorger uniek per vestiging, ruwe invoer, gecontroleerde regels, status, foutreden, Lightspeed-antwoord, tijden) plus `externe_bestelling_log` voor statusgeschiedenis. Alleen leesbaar voor manager/eigenaar; schrijven alleen door de server. Niets wordt verwijderd.
3. Productkoppeling: tabel `externe_product_koppeling` (vestiging, Eilandbezorger-code -> Lightspeed product-ID/PLU, verwachte prijs, toegestane extra's). Bestellingen met niet-gekoppelde producten worden afgekeurd. Vullen gebeurt later bewust door jullie.
4. Controle: vestiging moet 36864 of 41121 zijn en een actieve koppeling hebben; producten en extra's gekoppeld; regelbedragen kloppen met koppelprijs (afwijking 1 cent toegestaan); totaal = som regels; betaalwijze moet "vooraf betaald" zijn.
5. Doorsturen: aparte module die het L-Series orderbericht opbouwt (`POST /rest/onlineordering/customer/{customerId}/order`). Gebruikt hetzelfde tokenbeheer en dezelfde vergrendeling als de omzetophaling, zodat er nooit twee tokenvernieuwingen tegelijk lopen. De huidige callback en omzetophaling worden niet aangeraakt.
6. Schakelaars: `eilandbezorger_live` per vestiging (bestaande Fase 2-vlaggen), standaard uit. Uit = testmodus: volledige controle en opslag, het orderbericht wordt opgebouwd en bewaard, maar niet verstuurd. Status wordt dan `test_ok`.
7. Overzichtspagina `/cijfers/eilandbezorger` (alleen manager/eigenaar): compacte tabel met tijd, vestiging, bestelnummer, bedrag, één statuslabel; filter "Fout / onverwerkt"; detaillade met reden, regels en geschiedenis; knop "Opnieuw proberen" alleen bij fout en alleen als live aan staat.
8. Aansluitinstructie voor Karin als document (ontvangadres, sleutel-methode, voorbeeldbestelling, statuscodes en wat te doen per status).

## Statussen
`ontvangen` -> `afgekeurd` (controle faalt) | `test_ok` (testmodus) | `verzenden` -> `verzonden` | `fout`.
Antwoorden aan Eilandbezorger: 201 nieuw, 200 al bekend (zelfde status terug), 400 ongeldig, 401 sleutel fout, 422 afgekeurd met reden.

## Wat ik test
- Unit-tests: controle (bedragen, onbekend product, extra's, betaalwijze, vestiging), dubbele aanlevering, opbouw orderbericht, statusbepaling.
- Functietest: zonder sleutel 401; met sleutel een TEST-bestelling in testmodus -> `test_ok`, niets naar Lightspeed. Testregels krijgen TEST-nummer en worden pas na jouw OK opgeruimd.
- Overzichtspagina ingelogd bekijken.

## Wat nog ontbreekt (blokkeert echte verzending, niet de bouw)
- Bevestiging van Lightspeed welke orderroute bij onze accounts hoort (gewoon of establishment) en of onze koppeling bestelrechten heeft; onze autorisatie vraagt geen expliciete rechten aan.
- Lightspeed klant-ID (of hoe een klant aangemaakt moet worden) per vestiging.
- Betaalwijze-ID voor "vooraf betaald Eilandbezorger" per vestiging.
- Actuele producten/PLU's en bezorgprijzen voor de koppeltabel.
- Een gecontroleerde proefbestelling op de echte kassa, met iemand erbij die keukenbon en bedrag controleert.
- Van Karin: haar bestelnummer-formaat, productcodes en hoe zij annuleringen en wijzigingen wil doen (die bouw ik nu niet; annuleren gebeurt in de kassa).

## Technische details
- Tokenlogica (`readConnection`, `getValidToken`, `refreshAtLightspeed`, lease `lightspeed`) wordt gekopieerd naar `supabase/functions/_shared/lightspeedToken.ts`; `lightspeed-sync` en `lightspeed-oauth` blijven byte-gelijk. Zelfde lease-bron, dus serialisatie met de omzetsync blijft gegarandeerd.
- Sleutelvergelijking in constante tijd; sleutel nooit gelogd of teruggegeven. Zod-validatie, CORS, veilige foutmeldingen.
- Uniek: (`vestiging`, `extern_id`); insert met conflictafhandeling. Overgang naar `verzenden` via atomaire update (`where status in ('ontvangen','fout')`) zodat twee aanroepen nooit tegelijk verzenden.
- Ordermodule losgemaakt zodat veldnamen na Lightspeed-bevestiging op één plek aangepast worden; tot die bevestiging blijft de live-vlag uit.
- RLS met `has_role` voor manager/owner/admin; GRANT alleen select voor authenticated, alles voor service_role.
- Route toevoegen aan getPageTitle; pagina volgt Pura-lijstrecept en designregels.
- Geen publicatie; functie wordt gedeployed omdat Karin anders niet kan testen.
