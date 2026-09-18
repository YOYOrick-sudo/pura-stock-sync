# Nieuwe bak tussendoor: corrigeren bij het afsluiten

## Het gat
Nu leg je 's ochtends per product de dag van de bak vast, en print je 's avonds de sticker met díe datum. Gaat de vissoep tussendoor op en maak je een nieuwe zak open, dan klopt de ochtendregistratie niet meer. De afsluiter ziet dan "do · dag 2/6" terwijl de bak van vandaag is, en print een sticker met een te oude datum. Corrigeren kan technisch al wel (naar Openen gaan en "Vandaag" tikken), maar dat weet niemand en het is twee schermen verder — dus het gebeurt niet.

## Wijsheid: corrigeren waar je staat, via het patroon dat het systeem al heeft
De correctie hoort in de sluitlijst, op precies het moment dat je de sticker print. En hij krijgt dezelfde vorm als de koelwerkbank: **rustig chipje tonen, tik erop en er opent een net venster met de instellingen.** Geen extra tekstregels of verstopte linkjes in de lijst.

Concreet: het statuschipje bij elk product ("do · dag 2/6") wordt aantikbaar. Tik je het, dan opent een klein venster **"Klopt deze bak nog?"** met drie keuzes:

- **Ja, zelfde bak** — venster sluit, niets verandert.
- **Nieuwe bak van vandaag** — de teller start opnieuw op vandaag; daarna print je gewoon de sticker met de juiste datum. Bij Kip vraagt hij in hetzelfde venster de datum op de zak (dezelfde snelknoppen en kalender als 's ochtends).
- **Bak is op** — er is niets meer; de registratie wordt afgesloten (niet weggegooid, gewoon op) en er komt geen sticker. Morgenochtend staat dit product schoon in de lijst.

Verder verandert er niets aan de flow: staat de bak gewoon door, dan tik je alleen Sticker, precies zoals nu. De uitleg hierover komt achter het bestaande info-icoon bij de kop — geen tekst in beeld.

## Waarom zo
- Eén plek, één moment: wie afsluit ziet de bakken toch al langs komen en beslist daar of hij klopt.
- Geen mondelinge overdracht nodig: de sticker die eruit rolt is altijd de waarheid.
- Geen extra handeling voor het normale geval — de correctie zit achter één tik en is standaard niet zichtbaar.
- De ochtendlijst blijft onveranderd; "Vandaag" tikken daar werkt gewoon ook nog.

## In de praktijk
Wie: de keukenmedewerker die afsluit, op de iPad, aan het eind van de dienst. Vergeet iemand het? Dan print hij een sticker met de oude datum — dat gebeurt nu al, dit maakt corrigeren juist mogelijk in plaats van onmogelijk. Risico op misbruik is klein: "Nieuwe bak van vandaag" verlengt de houdbaarheid, dus we noemen de knop expliciet "Nieuwe bak" (niet "datum aanpassen") en registreren wie het doet, zoals bij elke registratie.

## Technisch
- `src/components/foh/BainMarie.tsx` (`BainMarieSluit`): het statuschipje wordt een `button` (44px tikdoel, ongewijzigd uiterlijk) die een `Dialog` opent — zelfde patroon en maatvoering als `ProductInstellingenDialog` in `LadeGrid.tsx` (24px radius, max 650px). In het venster: kop met productnaam, de huidige stand als regel, en drie knoppen van 44px — "Ja, zelfde bak" (neutraal), "Nieuwe bak van vandaag" (primair-licht), "Bak is op" (neutraal). Geen enkele knop vooraf gekleurd. Bij `heeftVriesZak` verschijnt na "Nieuwe bak van vandaag" hetzelfde zak-datumblok als in `BainMarieOpen` (snelknoppen Vandaag/Gisteren/Eergisteren + `Popover` met `Calendar`); die code wordt uit `BainMarieOpen` gelicht naar een klein gedeeld intern component `ZakDatumKiezer`.
- "Nieuwe bak van vandaag" → bestaande `useZetBainMarieStart` met `nieuw: true`, `startDatum = datum` (archiveert de oude bak, zoals nu). Daarna staat de rij weer op dag 1 en verschijnt de gewone Sticker-knop; de eerder gezette "geprint"-markering voor dat product wordt gewist zodat de nieuwe sticker nog gevraagd wordt.
- "Bak is op" → bestaande `useGooiBainMarieWeg` (zet `actief = false`, `weggegooid_op = vandaag`). Het grijze "weggegooid"-chipje in de ochtendlijst dekt dit al; de tekst wordt "afgesloten" wanneer de bak op is in plaats van weggegooid — daarvoor komt er één extra kolom `reden` (`op` | `weggegooid`) op `bain_marie_bakken`, met standaardwaarde `weggegooid` voor bestaande regels.
- Geen wijziging aan de sticker zelf, aan de houdbaarheidsregels of aan de takenlijst eromheen.
- Verificatie: typecheck + build, en in de preview de sluitlijst doorlopen — vissoep vervangen door een nieuwe bak (status terug naar dag 1/6), sticker printen met de datum van vandaag, en bij Kip controleren dat de zak-datum wordt gevraagd en op de sticker komt.
