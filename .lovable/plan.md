# Koelwerkbank: visueel voorbeeld van de bakhoogtes

## Waarom
"Laag, midden, hoog" is nu alleen een woord in een keuzelijst. Wie nieuw is weet niet welk bakje bedoeld wordt en kiest de verkeerde maat, waardoor de telling en de aanvulbon niet kloppen. Eén blik op een zijaanzicht lost dat op.

## Wat de gebruiker ziet
Op de pagina "Koelwerkbank indelen" komt naast de kop een rustige knop **"Bakmaten bekijken"** (liniaal-icoon, zelfde stijl als het info-icoon). Tikken opent een venster:

- **Zijaanzicht**: drie GN-bakjes naast elkaar op één vloerlijn, op schaal ten opzichte van elkaar — laag, midden, hoog. Onder elke bak: het woord, de diepte in cm en waar je het aan herkent.
  - laag — 6,5 cm — plat, voor garnituur en toppings
  - midden — 10 cm — standaard, de meeste bakjes
  - hoog — 15 cm — diep, voor natte of grote producten
- **Bovenaanzicht (tweede rijtje)**: de maten GN 1/9, 1/6, 1/4, 1/3, 1/2, 1/1 als rechthoeken op schaal binnen één GN 1/1-kader, met het gewone woord erbij (klein, standaard, breed, groot, halve, hele). Zo is meteen duidelijk dat maat en hoogte twee losse keuzes zijn.
- Sluiten met één grote knop; geen tekstblok, alleen korte labels bij de tekeningen.

Hetzelfde venster is ook bereikbaar vanuit het instellingenvenster van een product (naast de maat-/hoogtekeuze), want daar maak je de keuze echt.

## Praktijk
Gebruikt op de iPad in de keuken, staand: tekeningen groot genoeg om vanaf een halve meter te lezen, knoppen minstens 44px, geen hover-interactie. Het venster toont alleen uitleg — er verandert niets aan data, dus fout intikken kan niet. Verandert er niets aan de werkwijze van het team; het is puur een naslag op het moment dat de vraag opkomt.

## Technisch
- Nieuw: `src/components/voorraad/BakmaatUitleg.tsx` — knop + `Dialog`, tekeningen als inline SVG (geen afbeeldingen, geen nieuwe libraries), kleuren uit de bestaande tokens (`primary`, `muted`, `border`), hoeken 20/24px volgens het design system.
- Maten en hoogtes uit `GN_MATEN` / `HOOGTES` in `src/lib/voorraad-formaat.ts`; de cm-waardes komen als constante in het nieuwe bestand.
- Aangeroepen in `src/pages/settings/KoelwerkbankIndeling.tsx` (naast de kop) en in het product-instellingenvenster in `src/components/voorraad/LadeGrid.tsx`, naast `BakmaatKiezer`.
- Geen database-, RLS- of migratiewerk; geen wijziging aan tellen, bestellen of printen.

## Verificatie
Typecheck en build, daarna in de preview `/settings/koelwerkbank` openen, het venster openen en controleren dat de drie hoogtes en de zes maten kloppen en leesbaar zijn op tabletbreedte.
