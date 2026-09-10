# MEP: van drie prioriteiten naar twee

## Mijn advies
Twee niveaus is genoeg. MEP is een dagzaak: iets moet vandaag af, of het is gewoon werk van de dag. Een middenniveau wordt in de praktijk nooit consequent gekozen en maakt de lijst alleen drukker. Voorstel:

- **Normaal** (standaard, geen label in de lijst)
- **Belangrijk** (valt op, staat bovenaan)

Alles wat nu "Als er tijd is" heet wordt Normaal; "Moet vandaag" wordt Belangrijk.

## Wat je gaat zien
- Bij het toevoegen van een taak: één knop "Belangrijk" die je aan- en uitzet. Niets kiezen = normaal.
- In de lijst: alleen bij belangrijke taken een gekleurd label. Normale taken blijven rustig.
- Belangrijke taken staan bovenaan, daarna de rest in dezelfde volgorde als nu.
- In het bewerkscherm dezelfde twee keuzes in plaats van drie.
- Weekweergave blijft belangrijke taken markeren zoals nu.

## Wat er niet verandert
Bestaande taken blijven staan, niets wordt verwijderd. Afvinken, stickers, personen en handelingen blijven precies hetzelfde.

## Technisch
- Kolom `mep_taken.prioriteit` blijft numeriek: 1 = belangrijk, 2 = normaal. Geen schemawijziging.
- Eenmalige opschoning: bestaande rijen met `prioriteit = 3` worden `2`.
- `MepTaakToevoegen.tsx`: toggle "Belangrijk" in het paneel na toevoegen (44px), schrijft 1 of 2 via de bestaande bijwerk-actie.
- `MepTaakBewerken.tsx`: `PRIO`-lijst terug naar twee opties.
- `MepDag.tsx`: `PRIO_LABEL`/`PRIO_CLASS` naar twee waarden; badge alleen tonen bij prioriteit 1.
- Sortering in `useMepTaken.ts` blijft ongewijzigd (prioriteit oplopend).
- Geen RLS-, route- of pakketwijzigingen.

## Controle
Taak toevoegen zonder keuze (wordt normaal), taak op Belangrijk zetten en herladen, controleren dat belangrijke taken bovenaan staan en dat oude "Als er tijd is"-taken nu normaal zijn.
