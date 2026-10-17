# Au bain-marie stickers duidelijker maken (Sluiten → Keuken, West)

## Wat nu onduidelijk is
- "do · dag 3/5" is een raadsel: wat is do, wat is 3/5, wanneer moet het weg?
- Het blok lijkt niet op de rest van de lijst: geen vinkvakje links, grote losse ruimte, de knop staat ver weg rechts.
- Twee keer "Keuken" boven elkaar (grijze balk + KEUKEN 0/16).

## Wat het wordt
Elke regel gaat eruitzien als een gewone taakregel, met dezelfde vakjes en lettergrootte:

```text
[ ]  Kip                                  [ Sticker ]
     Houdbaar t/m za  ▓▓▓▓▓▓░░░░  nog 2 dagen
```

- **Links een vakje** zoals bij de andere taken; het vinkt zichzelf af zodra de sticker geprint is (of de bak weggegooid). Zo telt het zichtbaar mee als taak.
- **Eén heldere regel eronder**: "Houdbaar t/m za" plus een dunne houdbaarheidsmeter (zelfde rustige stijl als de vulmeter) en "nog 2 dagen".
- **Laatste dag**: meter rood, tekst "Vandaag laatste dag", knop **Weggooien** in plaats van Sticker.
- Op de regel tikken opent nog steeds "Klopt deze bak nog?" (nieuwe bak / zelfde bak).
- Knop **Sticker** blijft rechts, zelfde zachte kaartstijl als "Naar MEP".
- Dubbele kop "KEUKEN 0/16" onder de grijze Keuken-balk verdwijnt in West.

## Wat niet verandert
Printen, houdbaarheidsregels (kip 5, vissoep/tomyum 6, ei 4), weggooien en historie blijven precies hetzelfde. Alleen de weergave.

## Technisch
- `src/components/foh/BainMarie.tsx`: rij-opmaak, `statusRegel` vervangen door houdbaar-t/m-tekst + meter; checkbox-stijl delen met AfvinkRonde.
- Dubbele categoriekop in de West-keukensectie verbergen waar de SectieBalk al "Keuken" toont.
- Controleren op iPad- en telefoonformaat met Playwright.
