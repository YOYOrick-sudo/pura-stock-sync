# Recepten toevoegen aan West

Drie halffabricaten uit de aangeleverde screenshots worden als recept in de keukenmodule gezet, met locatie West.

## Wat er komt

**1. Kokosmakroon** — categorie Sweets, halffabricaat, 4 dagen houdbaar, 50 stuks
- 400 gr kokos geraspt gedroogd gemalen
- 400 gr suiker
- 260 gr eiwit scharrel
- Bereiding: alles in een pan, rustig op laag vuur; blijven roeren tot het mengsel plakkerig genoeg is; met kleine ijslepel bolletjes op bakplaat met bakpapier; afbakken 160-170 °C, 10-20 min.

**2. Döner** — categorie Vega, halffabricaat, 3 dagen houdbaar, 1 kg
- 1 kg döner kebab
- 1 1/2 el shoarma kruiden
- 1 el komijn
- zonnebloemolie
- Bereiding: alles door elkaar hussellen; in braadslee; oven 60/170 5 min; daarna 30/170 5 min. Opslag: koel af, in bak, sticker erop.

**3. Kruidenbus** — categorie Kruiden, halffabricaat, 3 dagen houdbaar, 1 kg
- 1 el Suprasel fijn zout
- 1 el paprikapoeder hon.
- 1 el kerriepoeder massala
- 1 el peper wit gemalen (Kooyman)
- Bereiding: meng alle ingrediënten.

## Aandachtspunt

Er staat al een recept "Döner kebab" (categorie Vega) in de lijst zonder locatie. Ik voeg de West-versie toe als apart recept; het oude blijft ongewijzigd staan. Wil je liever dat het bestaande recept naar West wordt gezet in plaats van een tweede regel, laat het weten.

## Technisch

- Rijen in `recipes` (type `halffabricaat`, `location = 'West'`, `tht_dagen`, `porties`, `bereiding`) plus bijbehorende regels in `recept_ingredienten` (naam, hoeveelheid, eenheid, sort_order).
- Data-invoer via de insert-tool, geen schema- of codewijzigingen nodig.
