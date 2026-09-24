# Spreads en mayo in de koelcel: duidelijker tellen

## Wat er nu misgaat
In de koelcel staan bij tomatenrelish, tomatenjam en wortelspread het doel "6 pakjes" (8 op drukke dagen). Dat klopt niet met de praktijk. Mayo in bakken en de spreads in pakjes staan door elkaar, en de regels zeggen niet wat je telt.

## Wat het wordt
- **Doel: 1 van alles in de koelcel**, ook op drukke dagen. Het extra drukke-dag-doel valt weg.
- **Vaste eenheid per regel:**
  - Mayo's (chimichurri, zeewier-algen, knoflook-kurkuma): **bak**
  - Tomatenrelish, tomatenjam, wortelspread: **vacuümpakje**
  - Avocado spread: **pakje** (zelfde regel als hierboven)
- **Tellen gaat simpel:** ligt er 1, dan is het goed; ligt er 0, dan moet hij worden aangevuld. Je tikt het aantal aan zoals nu.
- **Te weinig bij spreads uit de vriescel:** er komt een regel op de aanvulbon: "1 pakje tomatenrelish uit de vriescel halen om te ontdooien". Er komt geen regel op het bestelbord vanuit de koelcel. Of er besteld moet worden, blijft de vriescelteling op maandag bepalen, zoals nu.
- **Te weinig bij zelfgemaakte mayo:** blijft zoals het is: hij gaat op de MEP.
- Hummus staat nog als actieve koelcelregel, terwijl je die eerder hebt laten weghalen. Die regel wordt gearchiveerd.

## Wat het team merkt
- In de koelcel zie je alleen "0 of 1" per product, met de juiste eenheid erbij. Aantallen raden is niet meer nodig.
- Op de aanvulbon staat precies wat er uit de vriescel naar de koelcel moet.

## Risico's
- Oude tellingen met 6 pakjes blijven gewoon in de historie staan. Alleen de doelen veranderen.
- Er ligt in de koelcel echt maar 1 buffer. Is een pakje op een drukke dag halverwege de dienst op, dan moet er ontdooid worden. Als dat te krap blijkt, zet ik het drukke-dag-doel voor één product op 2.

## Technisch
- Update `koelcel_check_items` (West, plek koelcel, categorie Spreads & mayonaises): `doel_aantal=1`, `doel_aantal_druk=null`, eenheid `bak` / `vacuümpakje`. De hummusregel zet ik op `actief=false`.
- Controleren dat bron `vriezer` op de aanvulbon uitkomt als "uit de vriescel ontdooien" en niet op het bestelbord. Waar nodig pas ik de tekst in VoorraadRonde / aanvulbon aan.
- Live testen op telefoonformaat: relish op 0 tellen, dan controleren dat de aanvulbon de vriescelregel toont en dat er geen bestelbordregel bijkomt.
