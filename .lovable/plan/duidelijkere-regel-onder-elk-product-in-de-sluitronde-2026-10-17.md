# Duidelijkere regel onder elk product in de sluitronde

## Probleem
"hoort half · uit de koelcel" en "bodempje is genoeg" zijn vaag: je weet niet of je nu moet aanvullen, en "op? maken via MEP" leest als een vraag.

## Nieuwe weergave: zeg wanneer je iets doet, en waar je het pakt
De regel onder de productnaam wordt een vaste formule van twee kleine stukjes:

```text
Gesneden paprika
[▮▯▯ Vullen onder ½]  [→ MEP: snijden]

Zoetzure gember
[▮▯▯ Vullen onder ½]  [↻ Koelcel]

Tahinidressing
[▯▯▯ Vullen als leeg] [↻ Magazijn]

Mayonaise
[▮▮▮ Altijd vol]      [↻ Koelcel]
```

1. **Aanvulmoment** met een klein peilstreepje (drie blokjes, zoals een batterij):
   - vulnorm vol → "Altijd vol"
   - vulnorm half → "Vullen onder ½"
   - vulnorm bodem → "Vullen als leeg"
   Het streepje laat in één oogopslag zien hoe vol het minstens moet zijn.
2. **Herkomst** als klein label met de plek: "Koelcel", "Magazijn", "Vriescel" (= ontdooien), "Midsland", of "MEP: snijden" / "MEP: maken" voor snijwerk en zelfgemaakte producten.
3. Na een actie vervangt de regel zich door de uitkomst: "Op de MEP voor morgen", "Op het bestelbord", "Op de bestellijst Midsland".

Waarom: de kok leest één werkwoord ("vullen") en één plek, geen zin. Werkt ook voor nieuwe teamleden zonder uitleg. Het info-icoon bovenaan legt de drie peilstanden één keer uit.

## Wat niet verandert
Instellingen, keten, knoppen en database blijven hetzelfde. Alleen de tekst en het kleine peilstreepje.

## Technisch
- Nieuw klein onderdeel `VulPeil` in `src/components/foh/` (3 blokjes, tokens `bg-primary` / `bg-muted-foreground/25`).
- `src/lib/sluitronde.ts`: pure helpers `aanvulTekst(vulnorm)` en `herkomstLabel(item, items)` (vriezer → "Vriescel", snijden → "MEP: snijden", zelf_west → "MEP: maken"), met tests in `sluitronde.test.ts` per vulnorm.
- `AfvinkRonde.tsx`: uitlegregel vervangen door de twee labels (13px, muted, kleine pil voor herkomst); uitkomstteksten aanpassen; InfoKnop-tekst bijwerken.
- Verificatie: tests draaien, screenshot iPad en telefoon van Sluiten-tab Keuken West.
