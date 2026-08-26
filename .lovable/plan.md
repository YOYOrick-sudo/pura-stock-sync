# MEP in de gewone app-shell (met zijbalk)

De MEP-schermen gebruiken nu `KitchenLayout`: een kiosk-header met logo, terugknop en uitlogknop, zonder zijbalk. De rest van de app (Recepten, Ingrediënten, Cijfers, Instellingen) gebruikt `SidebarLayout` met de vaste zijbalk en de Polar-header. MEP gaat mee naar die shell, met exact dezelfde tokens en componenten als nu — geen nieuwe kleuren, radii of fonts.

## Wat er verandert

**Dagweergave `/kitchen/mep`**
- `KitchenLayout` vervangen door `SidebarLayout`; titel komt uit de bestaande route-titels ("Mise-en-place").
- De regel die nu in de kiosk-header stond (vestiging + datum) verhuist naar een pagina-kop bovenin de content, in dezelfde stijl als de kop op Recepten: naam links, acties (dagnavigatie, weekweergave-knop, tandwiel naar `/settings/mep`) rechts.
- Taakkaarten, voortgangsbalk, tabs, afrond-dialog en batch-historie blijven ongewijzigd.

**Weekweergave `/kitchen/mep/week`**
- Zelfde omzetting; de "Vandaag"-terugknop uit de kiosk-header wordt een knop in de pagina-kop naast de weeknavigatie.

**Oude schermen**
- `/kitchen/mep/oud` en `/kitchen/mep/beheer` blijven staan zoals ze zijn (nergens gelinkt). Optioneel meenemen als je ze nog gebruikt.

`/settings/mep` staat al in `SidebarLayout` en verandert niet.

## Praktijk
Op de keuken-iPad staand betekent de zijbalk minder breedte voor de takenlijst. `SidebarLayout` klapt op smalle schermen al naar een hamburger-sheet, dus staand blijft de volle breedte beschikbaar; liggend en op desktop zie je de zijbalk. Tikdoelen blijven 44px+, geen hover-afhankelijke interactie.

## Techniek
- Bestanden: `src/pages/kitchen/MepDag.tsx`, `src/pages/kitchen/MepWeek.tsx`.
- Alleen presentatie: import van `KitchenLayout` → `SidebarLayout`, wrapper vervangen, header-props omzetten naar een kop-blok in de content. Geen wijziging aan hooks, RPC's, realtime of data.
- Route-titels in `SidebarLayout` zijn al aanwezig voor `/kitchen/mep` en `/kitchen/mep/week`.
- Verificatie: build groen + beide routes in de preview op desktop- en tabletbreedte bekijken.
