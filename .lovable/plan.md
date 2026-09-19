# Toppings: werkblad tellen als vulling, magazijn per zak of bak

## Wat er nu misgaat
De toppings op de pas (het werkblad) vraagt de ronde nu om hele bakken te tellen, terwijl je daar net als bij de koelwerkbank kijkt hoe vol het bakje nog is. In het magazijn staan kokosschilfers dubbel (een bak en zakken).

## Wat er verandert

### 1. Toppings op het werkblad — vol / half / bodempje / leeg
De tien topping-bakjes op de pas (zonnebloempitten, seroendeng, gefruite uitjes, kokosschilfers, hennepzaad, broadbeans, cacao nibs, dukkah, dadelstukjes, chipotle) krijgen dezelfde telknoppen als de koelwerkbank: vol, half, bodempje, leeg. Niets aantikken betekent "ligt er vol bij".

Staat een bakje onder vol, dan komt precies dat bakje op de aanvulbon voor dezelfde dienst, met de herkomst erbij: bijvullen uit het magazijn (of uit de koelcel/vriescel als het daar ligt). Is die voorraad ook op, dan rolt het door naar het bestelbord of Midsland — zoals bij de andere producten.

### 2. Toppings in het magazijn — per zak of per bak
Per zak tellen: seroendeng, gefruite uitjes, broadbeans, cacao nibs, chipotle, kokosschilfers.
Per bak tellen: zonnebloempitten, hennepzaad, dukkah, dadelstukjes.

De dubbele kokosschilfers-regel (de "bak") wordt gearchiveerd, niet verwijderd; kokosschilfers tel je in het magazijn voortaan alleen per zak.

## In de praktijk
- Wie: keukenteam West bij de sluitronde op de iPad, dezelfde knoppen als bij de koelwerkbank — geen uitleg nodig.
- De magazijnronde (maandag) blijft ongewijzigd qua moment; alleen de eenheid per topping klopt nu.
- Risico: bakjes die vroeger op 1 bak stonden tellen nu als "vol". Oude tellingen blijven gewoon bewaard, alleen de nieuwe rondes gebruiken de nieuwe knoppen.

## Technisch
- `isVulItem()` in `src/hooks/useKoelcelCheck.ts`: ook `plek === 'werkblad'` als vulling behandelen (naast werkbank zonder reserve-doel), zodat `telModus`, `telDoel` en `tekortVoor` in `VoorraadRonde.tsx` automatisch de vul-knoppen en het vultekort gebruiken.
- `VoorraadRonde.tsx`: de vervolgactie-chip voor werkblad-regels op `bijvullen` laten uitkomen wanneer er een lager niveau bestaat (`NIVEAU_KETEN.werkblad` is al `['magazijn','koelcel','vriezer']`); alleen de aanroep bij `tekortActie` hoeft de niveau-uitkomst te volgen, net als bij de werkbank.
- Migratie op `koelcel_check_items` (West, plek `magazijn`): eenheid `zak` voor kokosschilfers-zakken (blijft), `bak` voor zonnebloempitten, hennepzaad, dukkah, dadelstukjes; `actief = false` op de dubbele kokosschilfers-bak-regel (`541c7b24-...`), plus een regel in `migratie_logboek`.

## Verifiëren na het bouwen
Voorraadronde op West openen, blok "Toppings": vol/half/bodempje/leeg zichtbaar; bij bodempje op seroendeng verschijnt een aanvulregel met herkomst magazijn. In de magazijnronde staat kokosschilfers één keer, in zakken.
