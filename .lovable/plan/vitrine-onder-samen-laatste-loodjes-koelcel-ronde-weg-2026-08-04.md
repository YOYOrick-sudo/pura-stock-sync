# Vitrine onder "Samen / Laatste loodjes", Koelcel-ronde weg

## Wat er verandert

- De 5 vitrine-taken (3 koelcel + 2 vitrine) verhuizen naar de sectie **Samen / Laatste loodjes**, onderaan de lijst.
- De categorie **Koelcel-ronde** verdwijnt: die 3 taken komen onder de categorie **Vitrine** te staan, in de bestaande volgorde:
  1. Alle bakken die op de grond staan in de koelcel mee naar binnen
  2. Grijze bak met potten mee naar binnen
  3. Deksels van de potten halen en schoonmaken — potten zelf indien nodig
  4. Vitrine vullen
  5. Bar boven vitrine vullen
- De aparte sectiekop "Vitrine (samen)" verdwijnt; Vitrine wordt gewoon de laatste categorie binnen Samen / Laatste loodjes.

## Technisch

- Data (templates + taken van vandaag): `department` van 'vitrine' naar 'samen', `category` 'Koelcel-ronde' naar 'Vitrine', `sort_order` zo dat de koelcel-taken vóór de twee vitrine-taken blijven.
- `foh_category_order`: rijen voor department 'vitrine' verwijderen; één rij `samen / Vitrine` met de hoogste sort_order (na Algemeen/Extra) toevoegen.
- `src/lib/foh-category-order.ts`: 'vitrine' uit `WEST_SECTIONS` en uit het `Department`-type halen.
- `src/components/foh/FohTasks.tsx`: vitrine-specifieke rendering/sortering verwijderen; "Samen / Laatste loodjes" toont nu ook Vitrine als laatste categorie.
- `TakenBeheer.tsx` volgt automatisch dezelfde bron van waarheid; controleren dat er geen vitrine-sectie meer getoond wordt.

## Verificatie

- Live lijst West open-fase: Vitrine-taken staan onderaan binnen Samen / Laatste loodjes, geen "Koelcel-ronde"-kop meer.
- Admin/instellingen tonen dezelfde categorieën en volgorde.
