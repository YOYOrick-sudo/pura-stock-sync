# Bakmaten duidelijk en overal hetzelfde

## Wat er nu misgaat

Bij Zuivel & kaas (en overal elders) staat er bijvoorbeeld "1 stuks · klein bakje, diep (GN 1/9)". Drie problemen:

- "stuks" zegt niets — het gaat om een bakje.
- De hoogte klopt niet: in de database staan laag, midden en hoog, maar het scherm maakt daar maar twee woorden van (ondiep/diep). "GN 1/9 midden" wordt dan onterecht "diep" of "ondiep" genoemd.
- De schrijfwijze is niet afgedwongen: van 116 actieve West-regels staat bij 58 de eenheid op "stuks" terwijl er een GN-bakje bedoeld wordt, en sommige formaten hebben helemaal geen hoogte.

## Eén vaste schrijfwijze

Altijd in deze volgorde: **aantal — maat — hoogte — code**.

```text
1 bakje    klein, hoog    GN 1/9 hoog
2 bakjes   standaard, midden    GN 1/6 midden
1 bak      breed, laag    GN 1/4 laag
```

Maatwoorden (vast, niet meer vrij in te typen):

| Maat | Woord |
|---|---|
| GN 1/9 | klein bakje |
| GN 1/6 | standaard bakje |
| GN 1/4 | breed bakje |
| GN 1/3 | groot bakje |
| GN 1/2 | halve bak |
| GN 1/1 | hele bak |

Hoogtes blijven de drie woorden die het team al gebruikt: **laag, midden, hoog**. De eerdere vertaling naar ondiep/diep vervalt — die maakte van drie hoogtes er twee.

Op het scherm: de naam dik, daaronder één grijze regel met de maat en de GN-code als kleine chip. Geen "stuks" meer bij iets wat een bakje is.

## Het systeem dat het zo houdt

- **Eenheid volgt de maat.** Staat er een GN-formaat, dan is de eenheid automatisch "bakje" (of "bak" vanaf GN 1/2). Niemand hoeft dat nog te kiezen; "stuks" kan alleen nog bij dingen die echt los geteld worden (eieren, broden).
- **Kiezen in plaats van typen.** In Koelwerkbank indelen en in het voorraadbeheer kies je de maat en de hoogte met knoppen. Vrije tekst in het maatveld verdwijnt, dus er kan geen nieuwe schrijfwijze bij komen.
- **Hoogte is verplicht bij een GN-bakje.** Ontbreekt hij nu (bijvoorbeeld bij forel en gerookte zalm), dan zet de eenmalige opschoning hem op "midden" en staat het product in een korte lijst die ik je oplever, zodat je de paar uitzonderingen kunt nakijken.
- **Overal dezelfde tekst.** Voorraadronde, aanvulbon, kastweergave en het indeelscherm halen de tekst uit dezelfde plek, dus het kan niet meer uit elkaar lopen.

## Wat verandert er voor het team

Niets in de handeling — alleen wat je leest. Iemand die voor het eerst meeloopt ziet nu meteen "standaard bakje, hoog" in plaats van "1 stuks". De afspraak die meeverandert: een nieuwe maat kiezen kan alleen nog uit de lijst; past iets echt niet, dan melden in plaats van zelf iets typen.

## Risico's

- De opschoning raakt 58 regels waar "stuks" naar "bakje" gaat. Aantallen en doelen blijven gelijk, alleen het woord verandert.
- GN-formaten zonder hoogte krijgen "midden" toegewezen. Bij forel en zalm gaat het om een hoog 1/6 bakje — die zet ik op "hoog" tenzij je iets anders zegt; de rest lever ik als lijst.
- Producten die echt in stuks geteld worden (broodbakken, eieren, flessen, potten, zakken) blijven ongemoeid.

## Technisch

- `src/lib/voorraad-formaat.ts`: `HOOGTE_NAAM` terug naar laag/midden/hoog; `bakjeLabel` geeft `{ maat, hoogte, code }`; nieuwe `eenheidUitFormaat()` leidt bakje/bak af; `formaatLabel` schrijft "aantal — maat, hoogte (GN x/y hoogte)".
- `src/components/foh/VoorraadRonde.tsx`: kopregel toont maat als grijze tekst met GN-code in een kleine chip; bon en kastweergave gebruiken dezelfde helper.
- `src/components/voorraad/LadeGrid.tsx` en `src/components/kitchen/VoorraadCheckBeheer.tsx`: maat- en hoogtekeuze met knoppen (44px), geen vrij tekstveld meer.
- Migratie over `koelcel_check_items` (West, actief): formaat normaliseren naar `GN x/y <hoogte>`, ontbrekende hoogte → `midden` (1/6 bij forel en zalm → `hoog`), eenheid `stuks` → `bak` bij GN-formaten, logregel in `migratie_logboek`. Niets verwijderen.
- Geen nieuwe libraries.

## Testen

West → Sluiten → Keuken → Voorraadronde → Zuivel & kaas: Hüttenkäse toont "1 bakje · klein, hoog (GN 1/9 hoog)". Koelwerkbank indelen: maat en hoogte kiezen met knoppen, keuze staat direct in de ronde. Aanvulbon toont dezelfde schrijfwijze.
