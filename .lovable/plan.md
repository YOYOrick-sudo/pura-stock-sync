# Kastweergave koelwerkbank in de voorraadronde

Bovenaan het koelwerkbank-blok komt een klein kastje: 3 kolommen x 3 lades, precies zoals de kast in de keuken staat. Je ziet in één oogopslag welke lades je al hebt gehad en waar nog een tekort zit. Tik je een lade aan, dan springt de lijst naar die lade toe. De lijst per lade blijft leidend — er opent geen apart scherm en er komt geen extra tik bij het tellen.

## Wat je ziet

Elk vakje toont de ladenaam en een status:

```text
   Links        Midden       Rechts
 [ Boven  v ] [ Boven  ! ] [ Boven    ]
 [ Midden   ] [ Reserve v ] [ Midden  ]
 [ Onder  v ] [ Onder    ] [ Onder    ]
```

- Grijs/rustig: nog te tellen
- Groen met vinkje: geteld en bevestigd, alles compleet
- Amber met uitroepteken: geteld en bevestigd, maar er gaat iets op de aanvulbon
- Gestreept en niet aantikbaar: lade niet in gebruik of leeg

Reservelades krijgen een klein label, zodat duidelijk blijft waar de reservebakjes horen. Onder het kastje staat een teller: "3 van 7 lades geteld". Staan er producten zonder vaste lade, dan verschijnt daaronder een smal balkje "Overige reserve" dat net zo werkt.

## In de praktijk

Gebruikt door de keuken van West op de iPad tijdens de sluitronde, met natte handen en haast. Daarom: vakjes minimaal 44px hoog, één tik, geen sleep- of hover-gedrag, geen dubbele bevestiging. Wie het kastje negeert en gewoon doorscrollt, mist niets — het is een hulpmiddel, geen extra stap.

Risico's: klein. Het kastje leest alleen bestaande gegevens (lades, telling, bevestigingen) en verandert niets aan de telling, de aanvulbon of de routing naar MEP, Midsland, bestelbord of vriescel. Bij een nieuwe indeling in Beheer volgt het kastje vanzelf. Ontbreekt de indeling helemaal, dan blijft alles werken zoals nu.

## Technisch

- Nieuw bestand `src/components/voorraad/KastOverzicht.tsx`: raster van `voorraad_lades` (kolom 1-3, rij 1-3) voor plek `werkbank`, met per lade de status afgeleid uit de bestaande `telling`- en `bevestigd`-state en het aantal openstaande tekorten.
- `src/components/foh/VoorraadRonde.tsx`: rendert `KastOverzicht` bovenaan het werkbank-blok, geeft `groepen`, `telling`, `bevestigd` en `telDoel` door. Tik op een lade doet `scrollIntoView({ behavior: 'smooth', block: 'start' })` op de sticky kop van die groep via een refs-map op `groep.sleutel`, met korte highlight-puls.
- Statusberekening hergebruikt `telDoel`, `tekortVan` en `onderwegMap`; geen nieuwe query's, geen migratie, geen nieuwe libraries.
- Alleen wanneer plek `werkbank` groepen per lade heeft; koelcel, vriescel en toppings blijven ongewijzigd.
