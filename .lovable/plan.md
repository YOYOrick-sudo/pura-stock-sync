# Eén stijl voor de hele takenlijst

Doel: geen stijlbreuk meer. Elke afvinkbare regel in de lijst (gewone taak, sluitronde-product, au bain-marie, maandagtelling) gebruikt dezelfde rij: zelfde vakje, inspringing, letter, lijntje, afgevinkt-stijl en knopvorm. Hiervoor komt één gedeelde taakrij die alle blokken gebruiken, zodat ze ook later niet meer uit elkaar lopen.

## Wat nu nog anders is (uit jouw screenshots)
- Vinkvakje is groter en dikker (28px, zwarte rand) dan bij taken (20px, lichte rand).
- Rijen staan verder naar rechts ingesprongen dan de taken.
- Rijen zijn hoger (twee regels + grote knop), taken zijn rustige enkele regels.
- Grote omlijnde knoppen "Bron op" / "Naar MEP" vallen veel meer op dan alles in de takenlijst.
- Afgevinkt ziet er anders uit (groen vol vakje) dan bij taken (grijs vakje, grijs doorgestreept).

## Wat er verandert
- **Zelfde vakje**: exact het vakje van de taken — 20px op iPad/desktop, 24px op telefoon, lichte rand, afgevinkt grijs met grijs vinkje. Tikvlak blijft 44px (onzichtbaar).
- **Zelfde inspringing en ruimte**: vakje begint op dezelfde lijn links als bij taken, zelfde tussenruimte en rijhoogte, zelfde lijntje ertussen.
- **Zelfde letter**: naam 15px, gewicht zoals taken; afgevinkt grijs + doorgestreept zoals taken.
- **Uitlegregel kleiner en rustiger** ("hoort vol · uit het magazijn") blijft, maar in kleine grijze letter direct onder de naam, zonder extra hoogte.
- **Knoppen rustiger**: "Bron op" en "Naar MEP" worden kleine tekstknoppen (grijs, met icoon, geen dikke rand), tikvlak blijft 44px. Ze vallen niet meer op dan de taak zelf.
- **Lade-kopjes** (Rechts onder, Toppings) gelijk aan de categoriekopjes in de takenlijst.

## Wat niet verandert
Afvinken, Bron op, Naar MEP, Herstel, wifi-melding, maandagtelling en de database blijven precies hetzelfde. Alleen opmaak.

## Technisch
- `AfvinkRonde.tsx`: rij-opmaak overnemen uit de taakrij in `FohTasks.tsx` (checkbox-span 20/24px, `border 2px hsl(var(--border))`, completed-stijl muted; flex gap 6/12px; 15px/500 Inter; padding gelijk aan taakrij). Knoppen naar `variant="ghost"` compact met 44px min-hoogte. Groepkop-stijl gelijk aan categoriekop uit `renderCategoryGroups`.
- Verificatie: screenshots naast elkaar van Keuken-taken en Sluitronde op telefoon (402px) en desktop (1351px), linkerlijn en vakjesmaat meten; één keer afvinken + Bron op proberen en testdata opruimen.
