# Zoet-lijst West uitdunnen

## Wat je krijgt
De zoet-lijst in de voorraadronde (West) wordt kleiner. Alleen dit blijft en verandert:

- **Wortel-walnoot** — blijft, doel wordt **2 bakken** (nu 1).

Deze producten verdwijnen uit de ronde (gearchiveerd, niet verwijderd — later weer aan te zetten via Instellingen → Koelwerkbank indelen):

- Witte chocolade-kokos
- Madeleine (special)
- Muffin banaan-amandel
- Kleine kokosmakroon
- Muffin vanille-wortel-kaneel
- Appeltaart (special)

Per product worden beide regels gearchiveerd: de Midsland-regel (aanvoer) én de vriescel-regel (reserve), zodat ze nergens meer opduiken — ook niet op de aanvulbon of in de vriesceltelling.

Blijven ongemoeid: bananenpannenkoeken, choco bounty, koffiebrownie, notenbar, sinaasappelcheesecake, vegan boterkoek en de overige zoet-items.

## Technisch
- `koelcel_check_items`: `actief=false` op de 12 regels (6 producten × midsland+vriezer), `doel=2` op beide wortel-walnoot-regels. Alles gelogd in `migratie_logboek`.
- Geen code-wijziging nodig; geen historie verwijderd.

## Test
- Live op telefoonformaat (390px) met het West-testaccount: zoet-lijst bevat geen van de zes verwijderde producten meer; wortel-walnoot toont doel 2. Testaccount daarna weer uit.
