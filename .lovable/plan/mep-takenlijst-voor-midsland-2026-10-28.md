# MEP-takenlijst voor Midsland

## Wat je krijgt
- Midsland krijgt dezelfde MEP-lijst als West, met een eigen lijst (West en Midsland zien elkaars taken niet).
- **Alle taken**: dagblokken (Te laat / Vandaag / Morgen / datum), alles sleepbaar — volgorde binnen een dag, of naar een andere dag met "Ongedaan maken".
- **Per persoon**: elke taak kan aan iemand van het Midsland-team gekoppeld worden; per persoon zie je zijn eigen lijst. Taken zonder naam staan onder "Iedereen".
- Ook in "Per persoon" kun je slepen: naar iemand anders slepen = taak aan die persoon geven.
- **Geen stickers**: in Midsland verschijnt nergens een printknop of sticker-stap; afvinken is alleen afvinken.
- In het menu van Midsland komt "Mise-en-place" onder Keuken.

## In de praktijk
- Wie: koks in Midsland op iPad/telefoon, bij start dienst eigen lijst openen via "Per persoon".
- Vergeten afvinken: open taken schuiven door naar "Te laat", zoals in West.
- Risico: West verandert niet; printflow West blijft exact gelijk.

## Technisch
- Route `/kitchen/mep`: `RequireWest` vervangen door guard die West én Midsland toelaat; `vestiging` komt al uit `userLocation`, data in `mep_taken` is al per vestiging gefilterd.
- Midsland-medewerkers via bestaande `useKeukenMedewerkers(vestiging)`.
- "Per persoon": DndContext met droppable persoonsblokken; drop → `bijwerken({ id, toegewezen_aan })`.
- Sticker/batch-printen verbergen wanneer `vestiging === 'Midsland'` (vlag `printenAan`).
- RLS `mep_taken` controleren of Midsland-gebruikers lezen/schrijven op eigen vestiging.
- Menu-item toevoegen in Midsland-sidebar. Week/Beheer blijven voorlopig West-only.
