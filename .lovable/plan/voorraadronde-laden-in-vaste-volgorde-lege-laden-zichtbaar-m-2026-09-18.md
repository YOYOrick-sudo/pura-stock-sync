# Voorraadronde: laden in vaste volgorde, lege laden zichtbaar, Midden boven niet meer tellen

## Wat er nu misgaat

- **Volgorde.** De telronde zet reservelades eerst en daarna pas de rest. Daardoor begint de koelwerkbank met "Links onder" in plaats van linksboven.
- **Midden onder ontbreekt.** Die lade bestaat wel (reservelade, middenkolom onder), maar er ligt nog geen product in — en lege laden worden in de telronde overgeslagen. Vandaar dat hij "weg" leek.
- **Midden boven telt nu 9 aangebroken bakjes** (cranberry compote, avocado spread, tomatenrelish, tomatenjam, wortelspread, de drie mayonaises en hummus), allemaal als "1 bakje vol". Dat zijn de werkbakjes waar je uit schept — die hoef je niet te tellen; de reservebakjes liggen midden onder.

## Wat er verandert

1. **Vaste looproute door de werkbank**, altijd dezelfde: Links boven → Links midden → Links onder → Midden boven → Midden midden → Midden onder → Rechts boven → Rechts midden → Rechts onder. De voorrang voor reservelades vervalt; het label "reservelade" blijft staan.
2. **Die 9 producten verhuizen naar Midden onder** en blijven daar als reservebakjes geteld — precies waar de reserve echt ligt. Er gaat niets verloren: dezelfde producten, dezelfde doelen, dezelfde aanvulketen.
3. **Midden boven wordt een lade die je niet telt.** Hij staat wel in de ronde, maar ingeklapt op één regel: naam, positie en het grijze label "wordt niet geteld · aangebroken bakjes". Tik je hem open, dan zie je één zin: "Hier staan de bakjes waar je uit schept. De reserve tel je bij Midden onder." Geen telregels, geen bevestigknop, telt niet mee in de voortgang.
4. **Lege laden verdwijnen niet meer.** Een lade zonder producten (nu Midden midden) staat ingeklapt in de ronde met "nog niets ingedeeld" en een verwijzing naar Koelwerkbank indelen. Ook die blokkeert de voortgang niet.
5. **Links onder blijft de reservelade voor de opzetkoeling** (lente-ui, peterselie, tomaatjes, kiemen).

## Vooruitkijken

De ronde wordt korter: negen tellingen minder per keer, terwijl je de reserve wél telt — dat is de telling die bestellingen en MEP stuurt. Een lade die je niet telt blijft zichtbaar, zodat een nieuw teamlid niet denkt dat er een lade ontbreekt of overgeslagen is. Blijft Midden midden lang leeg, dan is dat een zichtbare herinnering om hem in te delen. Aan de aanvulbon, MEP-taken en bestellingen verandert niets.

## Technisch

- Data (migratie): de 9 items van Midden boven krijgen `lade_id` van Midden onder, met een volgorde die hun huidige rij aanhoudt. Midden boven krijgt `rol = 'niet_tellen'` (nieuwe waarde naast `werk` en `reserve`).
- `src/hooks/useVoorraadLades.ts`: rol-type uitbreiden met `niet_tellen`; `LadeGrid.tsx` krijgt die keuze in het rol-menu.
- `src/components/foh/VoorraadRonde.tsx`: in `categorieGroepen` de sortering "reserve eerst" weghalen (alleen `volgorde`), lege laden als groep meenemen en per groep een vlag meegeven voor "leeg" of "niet tellen". `CategorieBlok` krijgt die ingeklapte weergave (één regel, uitklapbaar, geen bevestigknop) in de bestaande grijze chip-stijl.
- Lege en niet-getelde groepen tellen niet mee in de voortgang (`X/Y onderdelen geteld`) en niet in "alles bevestigd".
- Verificatie: typecheck + build, en in de preview de ronde doorlopen: volgorde linksboven eerst, Midden boven ingeklapt, Midden onder met de 9 reservebakjes, Midden midden leeg, voortgang blijft kloppen, aanvulbon identiek.
