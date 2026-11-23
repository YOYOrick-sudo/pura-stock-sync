# Midsland: Bietenburger Vegan en Saté-glutenvrijblokkade

## Bevestigde bron en afbakening
- Laatste besluit Bietenburger: 29 oktober 2026 16:52:33 UTC; `kaart_codes_na` én huidige `gerechten.kaart_codes` zijn VG/GLO. Gewone burger is vegan; GLO vereist apart glutenvrij brood. Friet is VG, niet GL vanwege gedeelde frituur.
- Laatste besluit Saté Spicy Tahoe: 29 oktober 2026 15:05:39 UTC; beide kaartcodes zijn VG/P. GL verwijderd, geen goedgekeurde GLO.
- De oude Saté-extra blijkt bij controle nog **actief**, anders dan gemeld. Geen configuratiemutatie: de koppeling wordt in de bestaande validatie zelfstandig geblokkeerd, ook als deze actief staat.
- Alleen Midsland 36864. Geen menu-, ingrediënten-, database-, prijs-, printer-, live- of publicatiewijzigingen. Historische ontvangsten en eerdere resultaten blijven intact.

## Wat verandert in de praktijk
Eilandbezorger kan de gewone Bietenburger met het gratis Vegan-vinkje aanleveren: één soloartikel (€15,50) of één compleet burger-frietartikel (€22,50), zonder tweede friet of modifier. Een teamlid hoeft daarvoor niets extra te bereiden of in te vullen.
Saté met Glutenvrij wordt afgekeurd en komt niet in de kassa; gewone Saté blijft mogelijk. Het team mag deze afkeur niet omzeilen met een oude website of eerder geslaagde test. Bij een onderbroken ontvangst blijven de bestaande duplicaatbeveiliging en test/live-scheiding gelden; geen automatische retry of nieuwe verzendpoging.

## Gerichte wijzigingen
1. Bietenburger `PV-CE0EF3F3` + `PVK-319766B2-1`: dezelfde bevestigingsstructuur als Hula/Hummus. Alleen BPB4/4499170 als solo of BPB6/4499175 via de bestaande €7-frietkeuze; aantal 1 en €0 per keuze, gewone prijscontrole, rauwe keuze bewaren, geen modifier/toeslag.
2. Verkeerde codes/IDs/PLUs, dubbele/betaalde/meervoudige Vegan-keuzes en ongeldige frietkeuzes blokkeren. Glutenvrij op het gewone broodje niet toestaan. Betaald brood niet veranderen en friet niet als glutenvrij behandelen.
3. Saté `PV-51FDF8F3` + `PVK-456C0BDC-1` expliciet afkeuren vóór algemene extra-validatie. De eerdere Saté-glutenvrijtoestemming en automatische uitjestekst vervallen voor nieuwe verwerking. Ook lokale bonopbouw met de oude Saté-glutenvrijmetadata/modifier blokkeren, zonder historische JSON te herschrijven.
4. Hula, Hummus/bloemkool, bestaande echte toegestane modifiers en betaald-broodbeveiliging behouden. Aubergine Glutenvrij blijft geblokkeerd voor beoordeling; kaarticoon alleen is onvoldoende.

## Verificatie en oplevering
- Netwerkloze regressies: Bietenburger solo zonder/met Vegan; friet zonder/met Vegan; concrete IDs, aantallen, €15,50/€22,50 en geen extra modifier; rauwe invoer onveranderd. Negatieve codes, IDs/PLUs, dubbele/betaalde/meervoudige vinkjes, gewone-bun-Glutenvrij en friet-Glutenvrij.
- Saté zonder vinkje toegestaan; Glutenvrij afgekeurd bij actieve én inactieve oude mapping. Lokale bonopbouw weigert oude Saté-glutenvrijregels; toegestane Hula- en bloemkoolregels blijven goed.
- Alleen `eilandbezorger-bestelling` en `eilandbezorger-beheer` uitrollen indien geraakt.
- Nieuwe fictieve nummers via bestaande server-side fixture en normale POST/status-GET in `modus=test`; geen directe inserts, sleutels uitlezen of externe order. Lees opgeslagen regels/bedragen en rauwe keuzes terug; bevestig per ontvangst nul pogingen/kassaberichten/order-ID en reguliere live uit.
- Exacte referenties, HTTP/status en afkeurreden vastleggen; eerdere resultaten niet aanpassen.

## Technische scope en risico
- Bestanden: `_shared/eilandbezorgerLogica.ts`, bestaande dieet-/burgerregressies; `AGENTS.md` en `roadmap.md` alleen gericht bijwerken. Geen nieuwe library, tabel, migratie of autorisatieregel.
- Categorie: backend-validatiewijziging met alleen-lezen broncontrole en bestaande testontvangst; geen RLS-/rolwijziging.
- Operationeel risico: de oude Saté-modifier kan anders onterecht glutenvrij doorgeven; daarom een expliciete blokkade los van mappingstatus en een berichtopbouwtest. Bietenburger mag niet een tweede friet of fictieve modifier krijgen; daarom exact eindproduct en bestaande combo-opbouw controleren.
- Geen nieuwe lijsten of groeiende beoordelingstaken; alleen bestaande ontvangsthistorie groeit door unieke, herkenbare testontvangsten.