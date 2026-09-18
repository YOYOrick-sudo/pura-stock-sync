# Voorraadronde: laden in vaste volgorde, ook de lege

## Wat er nu misgaat

- **Volgorde.** De telronde zet reservelades eerst en pas daarna de rest op volgorde. Daardoor begint de koelwerkbank nu met "Links onder" in plaats van linksboven.
- **Midden onder ontbreekt.** De lade bestaat wel (reservelade, middenkolom, onderste rij), maar er ligt nog geen product in — en laden zonder producten worden in de telronde overgeslagen. Vandaar dat hij "weg" leek.
- Ook "Midden midden" is nu leeg en daardoor onzichtbaar tijdens het tellen.

## Wat er verandert

1. **Vaste looproute door de werkbank**, altijd dezelfde, kolom voor kolom van boven naar beneden:
   Links boven → Links midden → Links onder → Midden boven → Midden midden → Midden onder → Rechts boven → Rechts midden → Rechts onder.
   De voorrang voor reservelades vervalt; de reservelade is nog steeds herkenbaar aan het label "reservelade" onder de naam.
2. **Lege laden staan er ook in.** Een lade zonder producten toont een rustig blokje met de naam, de positie en de regel "nog niets ingedeeld", plus een verwijzing dat je dit op "Koelwerkbank indelen" vult. Hij telt niet mee in de voortgang (X/Y onderdelen) en hoeft niet bevestigd te worden — zo blokkeert een lege lade de ronde niet, maar zie je wel meteen dat er iets mist.
3. **De reserveladen blijven zoals ze zijn:** Links onder is de reservelade voor de opzetkoeling (lente-ui, peterselie, tomaatjes, kiemen); Midden onder is de reservelade van de koelwerkbank en wacht op producten.

## Vooruitkijken

Zolang Midden onder en Midden midden leeg zijn, zie je tijdens elke ronde twee lege blokjes. Dat is de bedoeling: het is een zichtbare "nog in te vullen", en zodra jij die laden vult verdwijnt de melding vanzelf. Aan de telling, de aanvulbon, MEP of bestellingen verandert niets.

## Technisch

- `src/components/foh/VoorraadRonde.tsx`: in `categorieGroepen` de sortering `reserve eerst` verwijderen, alleen nog op `volgorde`; lege laden niet meer overslaan maar als groep met `items: []` opnemen.
- `CategorieBlok` krijgt een lege-staat: geen telregels en geen bevestigknop, maar één regel "nog niets ingedeeld" in de grijze informatiestijl (hetzelfde chip-model als de rest).
- Lege groepen tellen niet mee in `alleSleutels` (voortgang en "alles bevestigd" blijven kloppen).
- Geen database-, RLS- of migratiewerk; laden en volgorde staan al goed in de database (10 t/m 90).
- Verificatie: typecheck + build en in de preview de ronde doorlopen — volgorde controleren en de twee lege laden zien staan zonder dat de voortgang blokkeert.
