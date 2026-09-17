# Stickers: snelkeuzes van 9 naar 6

## Doel
Bij Keuken → Snel printen staan nu 9 snelkeuze-producten (de meest geprinte). Dat worden er 6 — nog steeds automatisch de 6 meest gekozen, gesorteerd op aantal keer geprint.

## Aanpassing
- `src/pages/kitchen/SnelPrinten.tsx`: `useTopStickerProducten(9)` → `useTopStickerProducten(6)`. De hook accepteert al een limiet, dus dit is een één-regel-wijziging; de lijst blijft zichzelf vullen op basis van printgeschiedenis.

## Bewust ongewijzigd
- De "Meest gebruikt"-suggesties in het productinvoerveld (combobox) blijven zoals ze zijn.
- Geen database-, print- of routeringswijzigingen.

## Verificatie
- Typecheck + build groen.
- Preview-check: snelkeuzebalk toont maximaal 6 chips, meest geprinte eerst.
