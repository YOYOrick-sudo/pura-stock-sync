# Au bain-marie stickers weer zichtbaar maken

## Wat er misgaat
Het stickerblok wordt in West → Sluiten → Keuken direct onder de taak "au bain-marie" geplaatst. Zodra alle taken in die groep afgevinkt zijn, vervangt de app de hele groep door "Alle taken voltooid!" — en daarmee verdwijnt ook het stickerblok. Omdat de app denkt dat het blok al bij die taak staat, toont hij het ook niet onderaan. Resultaat: het blok is nergens te zien.

## Oplossing
- Het stickerblok krijgt een vaste plek: in Sluiten → Keuken, direct onder **Bijvullen**, altijd zichtbaar (ook als alle taken klaar zijn).
- De oude "plak onder de au bain-marie-taak"-constructie vervalt, zodat dit niet opnieuw kan gebeuren.
- Printen, houdbaarheid (kip 5, vissoep/tomyum 6, ei 4 dagen) en weggooien blijven exact hetzelfde.
- Open-lijst (BainMarieOpen) blijft ongewijzigd.

## Testen
- Sluiten → Keuken in West met alle taken afgevinkt: stickerblok staat onder Bijvullen.
- Met open taken: blok staat er één keer, niet dubbel.
- Controle op iPad- en telefoonformaat.

## Technisch
- `FohTasks.tsx`: `bainMarieSluitInline` en `insertion` niet meer meegeven; `bainMarie` in sluit-fase altijd `BainMarieSluit` renderen en in `sections` direct na `voorraad` (SluitRondeWest) plaatsen.
- `heeftBainMarieTaak` vervalt.
