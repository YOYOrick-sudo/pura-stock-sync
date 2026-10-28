# MEP: kop compacter, lijst begint hoger (West en Midsland)

## Wat verandert
De ruimte boven de lijst gaat van vier blokken naar twee regels:

```text
Woensdag 28 okt · Midsland · 0/0 klaar      [<] Vandaag [>] [⚙]
[ Taak toevoegen…                    ] [Alle | Persoon | Handeling]
⚡ Shitake  ⚡ ...   (snelknoppen, alleen als het zoekveld leeg is)
```

- Het losse voortgangsbalkje in een eigen kaart verdwijnt. In plaats daarvan komt er een dun balkje onder de datumregel, dat alleen verschijnt als er taken zijn.
- Het toevoegveld staat niet meer in een grote eigen kaart, maar vlak in de pagina, zonder extra rand eromheen.
- Op de iPad en desktop staan de tabs (Alle taken / Per persoon / Per handeling) naast het zoekveld. Op de telefoon staan ze eronder.
- De snelknoppen (zoals Shitake) staan direct onder het veld, met minder ruimte.
- Het venster na het toevoegen (Wie / Wat / Wanneer / Hoeveel) werkt hetzelfde als nu.

Resultaat: de eerste taak staat ongeveer 250px hoger, en op de iPad zie je zo'n 3 à 4 taken meer zonder te scrollen.

## In de praktijk
- Alle knoppen blijven minstens 44px groot.
- Er verandert niets aan opslaan, slepen of toewijzen. Het gaat alleen om de opmaak.

## Technisch
- `src/pages/kitchen/MepDag.tsx`: aparte Progress-Card weg, dun `Progress h-1` onder de kop als totaal > 0. Kopregel en tabs samenvoegen in een flex-rij met `MepTaakToevoegen`.
- `src/components/kitchen/MepTaakToevoegen.tsx`: buitenste `Card` → gewone `div` (`space-y-2`). Prop `rechts?: ReactNode` toevoegen, zodat de tabs naast het zoekveld komen (`flex-col md:flex-row`).
