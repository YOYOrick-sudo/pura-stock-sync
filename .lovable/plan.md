# Taak "Schoonmaakgerei door de vaat" verplaatsen naar de spoelkeuken

De taak staat nu onder **Samen / Laatste loodjes → categorie Vitrine**. Dat klopt niet: hij hoort bij het spoelkeuken-blok, vóór het schoonmaken van de vaatwasser.

## Nieuwe plek

Sectie **Samen / Laatste loodjes**, categorie **Laatste Loodjes**, direct vóór de vaatwas-taken:

```text
30  Prullenbakken schoonmaken
35  Schoonmaakgerei door de vaat        <- hierheen
40  Vaatwas-hoek schoon & leeg — alles opgeborgen?
50  Binnen- en buitenkant vaatwasser schoonmaken
60  Onderkant aan- en afvoertafel schoonmaken
70  Zeep & naglans vaatwasser checken
80  Vloer vegen en schrobben
```

## Wat er gebeurt

- Template (`foh_daily_templates`, id `ddd9be7c…`): `category` van `Vitrine` naar `Laatste Loodjes`, `sort_order` 35. Department blijft `samen`, foto en omschrijving blijven staan.
- De taak van vandaag/openstaande taken in `foh_tasks` krijgen dezelfde categorie en sort_order, zodat het meteen zichtbaar is.
- Categorie **Vitrine** blijft bestaan (heeft nog andere taken), er verandert daar verder niets.

Geen code-wijzigingen nodig — alleen data.
