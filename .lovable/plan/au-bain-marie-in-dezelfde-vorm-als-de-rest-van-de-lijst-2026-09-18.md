# Au bain-marie in dezelfde vorm als de rest van de lijst

## Wat er nu niet klopt
De voorraadronde en de takenblokken zijn nette, inklapbare balken: rond icoontje, vette titel, kleine regel eronder met voortgang ("0/15 onderdelen geteld"), pijltje rechts. Au bain-marie hangt daar los tussen: een klein grijs kopje in hoofdletters, altijd open, zonder voortgang. Daardoor voelt het als een vreemd blok in plaats van een onderdeel van de lijst.

## Wat er komt
Beide bain-marie-blokken (openen en sluiten) krijgen exact dezelfde balk als de voorraadronde:

- Rond icoontje links (soeppan bij openen, printer bij sluiten); is alles gedaan, dan een groen vinkje en een licht groene balk — net als bij de voorraadronde.
- Titel "Au bain-marie" (openen) en "Au bain-marie — stickers" (sluiten), in dezelfde vette letter.
- Regel eronder met de stand: "2/4 bakken genoteerd" bij openen, "1/4 stickers geprint" bij sluiten, en bij alles klaar "Afgerond".
- Pijltje rechts om in en uit te klappen. Standaard open zolang er nog iets te doen is; is alles gedaan, dan klapt het blok in, zoals de rest.
- Het info-icoon verhuist mee naar binnen, boven de productenlijst, zodat de balk zelf rustig blijft.

De productrijen zelf blijven zoals ze zijn (dagknoppen, statuschip, sticker- en weggooiknop) — alleen de omlijsting wordt gelijk aan de rest.

## Wat er niet verandert
Niets aan de werking: dagregistratie, zak-datum, houdbaarheid, stickers, weggooien en de takenlijst eromheen blijven identiek. Geen database- of instellingenwijziging.

## Technisch
- `src/components/foh/BainMarie.tsx`: nieuw intern component `SectieBalk` (kopie van het kop-patroon in `VoorraadRonde.tsx`, regels 962–991: `rounded-[14px] border px-3.5 py-3`, `minHeight 52`, icoonbol 28px, `ChevronDown` met rotate). `Kop` vervalt; `InfoKnop` komt binnen het uitgeklapte deel.
- `BainMarieOpen`: voortgang = aantal producten met een actieve bak (of recent weggegooid) / totaal.
- `BainMarieSluit`: voortgang = aantal producten dat geprint óf weggegooid is / aantal producten met een bak; producten zonder bak tellen niet mee.
- Lokale `open`-state per blok, initieel `!afgerond`, handmatig te wisselen.
- Verificatie: typecheck + build, en in de preview de West-keukenlijst (openen en sluiten) visueel naast de voorraadronde leggen.
