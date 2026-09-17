# Koelwerkbank per lade in de voorraadronde

De koelwerkbank wordt in de voorraadronde niet meer op categorie gegroepeerd, maar op lade — zoals je er in de praktijk voor staat: lade open, vakje checken, lade dicht. Je kunt de lade-indeling zelf inrichten en producten erheen slepen.

## 1. Lade-indeling instellen

Nieuw beheerscherm "Koelwerkbank indelen" (bij de West-instellingen, alleen manager/owner):

- Visuele weergave van de koelwerkbank: 3 kolommen (Links, Midden, Rechts) met elk 3 lades (boven, midden, onder) = 9 lades.
- Elke lade is een kaart met een naam die je kunt wijzigen (bijv. "Links boven — eiwitten").
- Onder de kast een lijst "Nog niet ingedeeld" met alle koelwerkbank-producten die nog geen lade hebben.
- Producten sleep je van de lijst naar een lade, en tussen lades onderling. Op tablet werkt dit met dezelfde sleepmethode als bij MEP.
- Volgorde binnen een lade bepaal je ook door slepen (dat is de volgorde waarin je telt).
- Lades kun je hernoemen en op inactief zetten als je er niets in bewaart; producten die daarin lagen gaan terug naar "Nog niet ingedeeld".

## 2. De voorraadronde zelf

Binnen het blok "Koelwerkbank" tel je voortaan per lade in plaats van per categorie:

- Elke lade is één inklapbaar blok met de ladenaam en een kleine positie-aanduiding (links/midden/rechts, boven/midden/onder).
- Bevestigen gaat per lade: "Alles ligt er" of losse producten aantikken die te weinig zijn — precies zoals nu per categorie.
- De teller wordt "3/9 lades geteld".
- Producten zonder lade komen in één blok "Nog niet ingedeeld" onderaan, zodat er nooit iets uit de telling verdwijnt.
- Koelcel, vriescel en toppings blijven ongewijzigd op categorie (daar loop je wél langs schappen, niet langs lades).

## 3. Subtiele plekaanduiding bij aanvullen

Op de aanvulbon en bij elke aanvulregel komt achter de productnaam een klein, rustig plaatje/label van de positie: een mini-raster van 3x3 waarin het betreffende vakje oplicht, plus de ladenaam in kleine tekst. Zo zie je in één oogopslag waar het terug moet, zonder dat de bon druk wordt.

## Praktijk en risico's

- Wie gebruikt het: keuken West op de iPad tijdens het sluiten. Een nieuw teamlid ziet de ladenamen die jij hebt ingevuld en hoeft geen categorieën te kennen.
- Wat moet mee veranderen: jij richt de 9 lades één keer in. Zolang producten niet ingedeeld zijn, staan ze in het restblok — de telling blijft dus altijd compleet.
- Verandert de kast? Dan sleep je de producten gewoon om; lopende tellingen en bestellingen worden daar niet door geraakt.
- Geen wijziging aan de aanvulketen, bestelbord, MEP-routing of stickerprint.

## Technisch

- Migratie: nieuwe tabel `voorraad_lades` (id, vestiging, plek, naam, kolom 1-3, rij 1-3, volgorde, actief) met GRANTs + RLS (lezen: ingelogd met vestigingstoegang, schrijven: manager/owner). Kolom `lade_id uuid null references voorraad_lades(id) on delete set null` op `koelcel_check_items`, plus index. Seed van 9 lades voor West met standaardnamen.
- `useKoelcelCheck.ts`: lades ophalen, items joinen op `lade_id`, mutaties voor hernoemen/verplaatsen/volgorde.
- `VoorraadRonde.tsx`: voor `plek === 'werkbank'` groeperen op lade in plaats van `categorieVan`; bevestigingssleutel wordt `werkbank:lade:<id>` (bestaande categorie-sleutels blijven voor de andere plekken). Lokale voortgangsopslag houdt rekening met de nieuwe sleutels.
- Nieuw: `src/pages/instellingen/KoelwerkbankIndeling.tsx` + `src/components/voorraad/LadeGrid.tsx`, drag-and-drop met het al aanwezige `@dnd-kit`.
- Nieuw: `src/components/voorraad/LadePositie.tsx` — het subtiele 3x3 mini-raster, gebruikt op de aanvulbon.
- Geen nieuwe libraries.
