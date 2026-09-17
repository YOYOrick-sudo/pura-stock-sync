# Voorraadcheck West opnieuw: overzichtelijk, per categorie, één ophaallijst

## Wat er nu misgaat (gecontroleerd in de data)

- **Alles staat door elkaar.** In de koelcel staan 44 actieve producten in één raster: vis, mayonaises, groente en 16 zoete producten door elkaar. Er is geen categorie in de database (`koelcel_check_items` heeft wel `plek`, geen categorie).
- **Aantallen zijn een zootje.** Er zijn 14 verschillende eenheden ("stuks", "bak", "bakken", "zak", "zakken", "pakje", "pakjes", "stuks per soort") en 30 verschillende maat-teksten ("hoge 1/9e", "midden 1/9, 1/3 gevuld", "bak (maat nog bepalen)"). Daardoor leest geen enkele regel hetzelfde.
- **Tikken op wat er níét ligt voelt vaag.** Een product aantikken betekent nu "klopt niet", maar dat zie je niet aan de tegel; hij ziet er hetzelfde uit als een gewone knop.
- **Aanvullen uit de vriescel is versnipperd.** Je loopt nu per product heen en weer naar de vriescel in plaats van één keer met één lijst.

## Vaste afspraken (gelden in beide opties)

**Categorieën** (nieuw veld per product, jij kunt ze beheren):
Vis & vlees · Zuivel & kaas · Spreads & mayonaises · Groente & fruit · Brood · Zoet · Droog & overig.
Zoet staat altijd als apart blok onderaan, nooit meer tussen de rest.

**Eenheden gestandaardiseerd** naar één vaste lijst: stuks · zwarte bak · GN-bak · zak · pot · pak · pakje · fles · doos · kilo.
Elke regel leest identiek: **naam** — *aantal + eenheid + maat*, bijvoorbeeld "Gerookte zalm — 2 pakjes" en "Forel — 1 GN ½ (hoog)". Enkelvoud/meervoud wordt automatisch gevormd, niet meer per product ingetypt. De losse maat-teksten worden omgezet naar een vaste GN-maatlijst (1/9, 1/6, 1/4, 1/3, 1/2 + hoog/midden/laag) plus vulgraad (vol / halfvol / ⅓).

**Eén ophaallijst uit de vriescel.** Tijdens de check verzamelt de app alle tekorten die uit de vriescel gehaald moeten worden. Aan het eind krijg je één scherm: *"Haal dit in één keer uit de vriescel"* met alle producten en aantallen. Je bevestigt in één tik, en dan printen de Ontdooid-stickers in één reeks. Alles wat níét uit de vriescel kan, gaat automatisch door naar MEP (zelf maken), de Midsland-bestellijst of het bestelbord — zonder dat je daar nog iets voor hoeft te doen. Je krijgt aan het eind één korte samenvatting: "3 uit de vriescel · 2 naar MEP · 1 naar Midsland".

## Optie A — Categorieblokken met duidelijke Ontbreekt-knop

Per sectie (Koelcel / Koelwerkbank / Toppings) staan de producten gegroepeerd in categoriekaarten met een kop en teller ("Zoet 0/16"). Elke productregel staat op een eigen rij met links de naam, rechts het aantal, en één duidelijke knop **Ontbreekt** aan de rechterkant. Niets aantikken = het ligt er. Een categorie kun je in één tik afdoen met **Categorie compleet**, waarna hij dichtklapt tot een groene balk.

- Voordeel: je ziet alles in één blik, je kunt snel scrollen, het is dicht bij wat er nu staat.
- Nadeel: bij 44 producten blijft het een lange pagina.

## Optie B — Telronde per categorie, één scherm tegelijk

Je loopt de check als een korte ronde: de app toont één categorie tegelijk, groot en rustig, in de volgorde waarin je door de koelcel loopt. Bovenaan een voortgangsbalk ("Categorie 3 van 7"). Per categorie twee grote knoppen: **Alles ligt er** of **Er ontbreekt iets** — en pas dan verschijnt de lijst met die paar producten om aan te tikken. Daarna schuift hij door naar de volgende categorie. Aan het eind het ophaalscherm.

- Voordeel: één beslissing per scherm, niets kan over het hoofd worden gezien, snelste route voor iemand die het niet dagelijks doet, laagste kans op fouten.
- Nadeel: je moet doorklikken om iets op te zoeken; daarvoor blijft de zoekbalk bovenaan staan.

Mijn advies: **Optie B** voor de dagelijkse sluitronde (minste denkwerk, minste tijd), met Optie A's overzicht als "Alles bekijken"-knop erbij.

## In de praktijk

- Wie: keukenmedewerker West, eind van de dienst, staand op de iPad. Grote knoppen, geen typwerk.
- Wat verandert er: de ronde loopt in vaste volgorde en de vriescel bezoek je nog één keer aan het eind in plaats van tien keer tussendoor.
- Als iemand halverwege stopt: voortgang staat al opgeslagen per product, de volgende pakt hem op waar hij was.
- Risico: de eenheden-opschoning raakt bestaande regels. Die gebeurt via een migratie met logboek, per product nagekeken, zonder historie te verwijderen.

## Technisch

1. Migratie: kolommen `categorie`, `gn_maat`, `vulgraad` op `koelcel_check_items`; alle 109 actieve West-regels krijgen categorie + genormaliseerde eenheid/maat (bestaande vrije teksten omgezet, gelogd in `migratie_logboek`). Geen deletes.
2. `koelcel_check_items` beheerscherm uitbreiden met categorie en de vaste eenheid/maat-keuzes.
3. Nieuwe helper `voorraad-formaat.ts`: één functie die naam + aantal + eenheid + maat consistent rendert.
4. `KoelcelCheckBlok.tsx` (nu 851 regels) opsplitsen in: `VoorraadRonde.tsx` (flow), `CategorieStap.tsx`, `OphaallijstDialog.tsx`, `ProductRegel.tsx`.
5. `useKoelcelCheck.ts` krijgt `verzamelOphaallijst()` (alle vriescel-tekorten van deze ronde) en `bevestigOphaallijst()` — bulk-aanvullen, bulk Ontdooid-stickers, en de rest automatisch routeren naar MEP / interne order / bestelbord (bestaande routeringslogica hergebruikt).
6. Bestaande keten (`product_sleutel`, drukte-modus, "besteld nog niet geleverd") blijft ongewijzigd.
