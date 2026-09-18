# Voorraadronde: één actie per lade, altijd onder de duim

## Het probleem
Nu moet je per lade helemaal naar beneden scrollen om op "Klopt, ligt er" te tikken, en daarna weer terug naar de volgende lade. Dat voelt als een dubbele actie per lade.

Volledig automatisch inklappen kan niet veilig: als je in een lade niets hoeft aan te passen (alles ligt er), ziet de app geen enkele tik — hij kan dan niet weten of je de lade gezien hebt. Automatisch wegklappen zonder actie = misgrijprisico.

## De oplossing
De losse knop onderaan elke lade verdwijnt. In plaats daarvan komt één vaste balk onderin het scherm ("sticky bottom bar"):

1. **Vaste afsluitbalk onderin** — altijd zichtbaar tijdens het tellen, nooit meer scrollen naar een knop. De balk noemt de lade waar je mee bezig bent: "Links boven klaar →". Eén tik: de lade klapt in, krijgt zijn groene vinkje, en het scherm schuift automatisch naar de eerstvolgende lade die nog open staat.
2. **Automatisch klaar** — heb je in een lade bij elk product iets ingetikt of aangepast? Dan telt de app die lade zelf als klaar en klapt hij vanzelf in. De balk springt dan direct door naar de volgende lade. De meeste lades ben je dus helemaal geen extra tik kwijt.
3. **Terugkijken blijft** — een ingeklapte lade tik je gewoon weer open om iets aan te passen; de voortgangsbalk past zich mee aan.
4. **Laatste lade** — is alles klaar, dan verandert de balk in "Naar de aanvulbon →" (de grote knop onderaan verdwijnt; de balk neemt die rol over).

Zo is het per lade maximaal één tik, vaak nul, en ligt die ene tik altijd op dezelfde plek — het patroon dat voorraad-apps als standaard gebruiken.

## Wat verandert er niet
- Tellen zelf, de aanvulbon, bestellingen, MEP-taken en printen blijven exact hetzelfde.
- Ingeklapte lades zien er hetzelfde uit als nu (groen vinkje, "3 op peil").
- Laden die je overslaat (reservelade, niet-tellen-lade) blijven zoals nu.

## Technische details
- Alleen `src/components/foh/VoorraadRonde.tsx`.
- De bevestig-knop in `CategorieBlok` verdwijnt; `bevestigd`-logica, voortgangsbalk en `onHeropen` blijven bestaan.
- Nieuw: `klaarVanZelf` per groep = elk telbaar item heeft een expliciete telling (`telling[id] !== undefined`). Effect: auto-bevestigen zodra `klaarVanZelf` waar wordt.
- Nieuwe vaste balk onderaan (sticky, veilige iPad-ondermarge, min. 52px hoog): toont naam van de eerste onbevestigde lade; tik bevestigt die lade en scrollt de volgende onbevestigde lade in beeld (`scrollIntoView`, met respect voor de sticky plek-kop).
- De eindknop "Naar de aanvulbon" verhuist naar diezelfde balk zodra `allesBevestigd`.
- Geen database-, RLS- of migratiewerk.

## Verificatie
- Typecheck + build schoon.
- In de preview op tabletbreedte: een lade volledig intikken → klapt vanzelf in; een lade open laten en via de balk sluiten → inklappen + auto-scroll naar de volgende; ingeklapte lade heropenen en iets wijzigen → voortgang klopt; laatste lade → balk wordt "Naar de aanvulbon".
