# Mobiel stap 5 — MT-punt

## Afbakening
- **Categorie: UI.** Alleen mobiele JSX/klassen in `src/pages/MtPunt.tsx`, onder 744px via `useIsMobile`.
- Vanaf 744px blijft de bestaande weergave letterlijk behouden, inclusief alle `md:`/`lg:`-klassen.
- Geen publicatie, database, queries/mutaties, rollen, rechten, navigatie of functieteksten wijzigen.

## Mobiele opbouw
- Eén bestaande hoofdknop: **Verstuur**, minstens 44px en over de beschikbare breedte, ook op grotere telefoons.
- Het formulier blijft direct beschikbaar, zonder extra kop of nieuwe stappen.
- **Mijn punten** krijgt de bestaande Pura-opbouw met `LijstKaart` en `KaartKop`.
- Punten worden compacte, door scheidingslijnen begrensde rijen met tekst, datum en één `StatusLabel`. Lange tekst breekt binnen de rij af zonder informatie te verbergen.
- Geen tabs, filters, rijmenu's of lades toevoegen: dit scherm heeft geen bestaande rijacties en de opdracht verbiedt nieuw gedrag.

## Praktijk en risico's
- MT-leden gebruiken dit op hun telefoon om een punt in te dienen en hun eigen eerdere punten te lezen; geen nieuwe gewoonte nodig.
- Niet ingevuld betekent zoals nu: niet versturen. Bij netwerkproblemen blijven bestaande foutmelding en ingevoerde tekst behouden.
- Langere historie blijft zoals nu bewaard; alleen de presentatie verandert. Geen archivering of extra filtering.
- Voornaamste risico is afgekapt tekst bij lange punten/statussen: controleren op smalle telefoons. Geen impact op bestellingen, printers of automatiseringen.
- MT-leden zonder andere rol houden alleen **Meer** in de onderbalk; toegang en menu blijven onaangeraakt.

## Controle
- `bun test`: volledige uitslag melden, inclusief de twee bekende Deno-fouten.
- Geen handmatige build: de automatische preview-build controleren op fouten.
- Indien een geldige sessie beschikbaar is: MT-punt op telefoon openen, formulier controleren zonder verzending of testdata, en 744px/iPad en desktop vergelijken.
- Alleen het genoemde scherm wijzigen; achteraf gewijzigde bestanden en behoud van >=744px melden.