# Allergenen: tekstregel weg + slim invullen bij nieuwe recepten

## 1. Antwoord op je vraag

Het systeem weet wél per ingrediënt welke allergenen erin zitten: dat staat opgeslagen op de ingrediëntenlijst (Keuken → Ingrediënten), waar we alle 63 producten hebben ingevuld (45 bevestigd, 18 nog als voorstel). Een recept telt die allergenen automatisch op via de gekoppelde ingrediënten.

De valkuil: dat werkt alleen als je bij een nieuw recept een ingrediënt uit de lijst kiest. Typ je een losse naam die nog niet in de lijst staat, dan weet het systeem niets en telt het recept stil "niets" mee. Dat moet zichtbaar en oplosbaar worden in het receptformulier zelf.

## 2. Tekstregel weghalen

In het receptdetail vervalt de zin "Automatisch afgeleid uit de ingrediënten. Controleer bij twijfel altijd het productetiket." De badges blijven; de waarschuwing "x ingrediënten niet gecontroleerd" blijft ook, want die is functioneel.

## 3. Slim invullen bij nieuwe/bewerkte recepten

In het receptformulier komt een blok "Allergenen" dat live meebeweegt met de ingrediënten die je toevoegt:

- Bovenaan de afgeleide allergenen als badges, direct bijgewerkt bij elke ingrediëntwijziging (nog vóór opslaan).
- Per ingrediënt in de lijst een klein signaal:
  - grijs/geen markering = gekoppeld en gecontroleerd;
  - oranje "check" = gekoppeld maar status is nog voorstel;
  - rood "onbekend" = niet gekoppeld aan de ingrediëntenlijst, allergenen tellen niet mee.
- Bij een onbekend of ongecontroleerd ingrediënt: knop "Allergenen instellen" die dezelfde dialoog opent als op de ingrediëntenpagina. Vul je het daar in, dan telt het meteen mee in het recept én in alle andere recepten met dat ingrediënt.
- Nieuw ingrediënt intypen maakt (zoals nu) een master aan; direct daarna verschijnt de vraag om de allergenen te zetten, met een AI-voorstel als startpunt dat jij bevestigt.
- Onderin een handmatige correctie per recept: "extra allergeen toevoegen" (bijv. kruisbesmetting) en "allergeen uitsluiten" plus een notitieveld. Die overrides bestaan al in de database.

Opslaan blijft altijd mogelijk; een recept met ongecontroleerde ingrediënten toont gewoon de waarschuwing.

## 4. Wat is wijsheid

Ingrediënt = bron van waarheid, recept = optelsom. Eén keer per product goed invullen scheelt herhaald werk en voorkomt dat twee recepten met hetzelfde product verschillende allergenen tonen. AI mag voorstellen doen, jij bevestigt — allergeneninfo is wettelijk.

## Technisch

- `RecipeDetail.tsx`: disclaimer-regel verwijderen.
- `RecipeForm.tsx`: allergenenblok dat client-side afleidt uit de geselecteerde `ingredient_id`s via `useIngredientAllergenen()`; per rij een statusindicator; override-velden schrijven naar `recipes.allergenen_extra` / `allergenen_uitgesloten` / `allergenen_notitie` (bestaande kolommen, via `useUpdateReceptAllergenenOverride`).
- `IngredientCombobox.tsx`: statusbadge per optie en een "allergenen instellen"-actie die `AllergenenEditDialog` opent.
- Hergebruik `AllergenenBadges`, `AllergenenEditDialog`, `useAllergenen`. Geen databasemigratie nodig; de AI-suggestie in het formulier gebruikt de bestaande gateway-aanpak.
