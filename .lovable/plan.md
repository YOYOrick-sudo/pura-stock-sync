# FIFO als vaste regel op de aanvulbon

## Wat de gebruiker ziet
- Bovenaan elke aanvulbon staat voortaan één vaste grijze regel: **"Oudste eerst gebruiken (FIFO) — nieuwe voorraad achteraan zetten."**
- Die regel staat er altijd, ook als er maar één product aangevuld hoeft te worden. Zo hoeft niemand eraan te denken: het is een werkwijze, geen uitzondering.
- De extra benadrukte regel bij **Broodbakken** ("Oudste bakken eerst gebruiken (FIFO)") blijft staan — bij brood is het volgens de eigenaar extra belangrijk.
- Producten met een eigen `bon_notitie` tonen die zoals nu onder het product.

## Praktijk
- Wie: de medewerker die de aanvulbon afwerkt (avonddienst, iPad of telefoon).
- Risico: geen data- of ketenimpact — dit is puur een tekst op de bon. De tellingen, chips en doorzetting blijven exact hetzelfde.
- Later uitzonderingen mogelijk: als een product juist níét FIFO is, kan via `bon_notitie` een afwijkende regel bij dat product.

## Technisch
- `src/components/foh/VoorraadRonde.tsx`, bon-stap (`stap === 'bon'`): onder de kop "Aanvulbon" één vaste regel toevoegen, alleen als er regels op de bon staan (bij een lege bon is FIFO zinloos).
- Geen database-wijziging, geen nieuwe tokens — bestaande `text-muted-foreground` stijl zoals de bestaande bon_notitie-regel.

## Test
- Preview: ronde lopen met minstens één tekort → aanvulbon toont de FIFO-regel bovenaan + bestaande notitie bij brood.
- Bon zonder tekorten: geen FIFO-regel, ongewijzigde lege-tekst.
