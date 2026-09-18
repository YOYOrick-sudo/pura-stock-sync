# Toppings kloppend maken + magazijn wekelijks op maandag

## Wat er verandert

**1. De toppinglijst wordt de echte lijst (10 producten)**

Zonnebloempitten, seroendeng, gefruite uitjes, kokosschilfers, hennepzaad, broadbeans, cacao nibs, dukkah, dadelstukjes, chipotle. Elk topping-bakje in de keuken telt elke sluitdienst mee zoals nu: vol / half / bodempje / leeg. Is het bakje leeg, dan pakt hij automatisch het magazijn erbij.

Sesamzaad en amandelschaafsel staan nu wel in de lijst maar noemde je niet: die zet ik op inactief (blijven bewaard, niet verwijderd). Zeg het als ze moeten blijven.

**2. Nieuw blok: Magazijn — alleen op maandag**

Net als de vriescel komt er een blok "Magazijn" dat alleen op maandag in de ronde verschijnt. De topping-voorraad in het magazijn hoort daaronder. Op de andere dagen zie je het niet, dus de dagelijkse ronde wordt niet langer.

**3. Niet elk tekort is meteen een opdracht**

Nieuw: per product kun je zeggen vanaf wanneer er iets moet gebeuren. Dat gold al voor inkoop; nu ook voor producten die je zelf roostert of maakt. Zonnebloempitten: halve bak = niets, bodempje = roosteren op de MEP.

## Wat er per product wordt vastgelegd

| Product | Magazijn | Melden vanaf | Als het op is |
|---|---|---|---|
| Zonnebloempitten | 1 bak (geroosterd) | bodempje | MEP: zelf roosteren, 1 bak |
| Seroendeng | 1 zak | halve zak | bestelbord: 1 zak |
| Gefruite uitjes | 1 zak | halve zak | bestelbord: 1 zak |
| Kokosschilfers geroosterd | 1 bak | bodempje | MEP: afbakken, 1 bak |
| Kokosschilfers (zakken) | 2 zakken | onder 2 | bestelbord: aanvullen tot 2 |
| Hennepzaad | 1 bak | bodempje | bestelbord: 1 bestelling |
| Broadbeans | 5 zakken | 2 zakken | bestelbord: 3 zakken |
| Cacao nibs | 1 zak | bodempje | bestelbord: 1 zak |
| Dukkah | 1 bak | onder 1 bak | bestellijst Midsland |
| Dadelstukjes | 1 bak | bodempje | bestelbord: 1 bak |
| Chipotle (kruidenzak) | 1 zak | halve zak | bestelbord: 1 zak |

Het keukenbakje op het werkblad vult altijd eerst bij uit het magazijn; pas als het magazijn ook op is gaat het door naar MEP, bestelbord of Midsland.

## In de praktijk

- Doordeweeks: alleen de toppingbakjes langs, snel afgetikt.
- Maandag: extra blok magazijn, één keer per week doortellen — daar komen de bestellingen en roosterklussen uit.
- Wordt maandag overgeslagen (of is West dicht), dan gaat er niets stuk: de volgende maandag staat het blok er weer. Risico is dat een bestelling een week later komt; daarom staan de drempels (5 zakken broadbeans, 2 zakken kokos) ruim genoeg voor een week.

## Technisch

- Migratie via de databasetool (met regel in `migratie_logboek`):
  - `koelcel_check_items.plek` krijgt waarde `magazijn` (check-constraint uitbreiden).
  - Werkblad-rijen: 10 toppings met `product_sleutel`, `formaat`/eenheid, `bron` passend bij de keten; sesamzaad + amandelschaafsel `actief=false`.
  - Magazijn-rijen per product met `doel_aantal`, `bestelpunt`, `bestel_eenheid`/`bestel_inhoud`, `batch_aantal` (roosteritems).
- `src/hooks/useKoelcelCheck.ts`: `VoorraadPlek` + `PLEK_LABEL` + `HERKOMST_LABEL`/`BESTEMMING_LABEL` uitbreiden met `magazijn`; `NIVEAU_KETEN`: `werkblad: ['magazijn','koelcel','vriezer']`, `magazijn: []`; `bestelpunt` gaat ook gelden als meldpunt voor MEP-bestemmingen (geen taak boven het meldpunt), naast de bestaande prioriteitsregel half/bodempje.
- `src/components/foh/VoorraadRonde.tsx`: `PLEK_VOLGORDE` krijgt Magazijn met `alleenMaandag: true`, na Koelcel en voor/naast Vriescel.
- `src/components/kitchen/VoorraadCheckBeheer.tsx`: `magazijn` in `PLEKKEN`; het bestelpunt-veld wordt ook getoond bij bron `zelf_west`/`vriezer` (label blijft "bestelpunt", uitleg "pas melden vanaf dit aantal of minder").
