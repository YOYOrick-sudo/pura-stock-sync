# Regel onder elk product: hoe vol het minstens moet zijn, en wat je doet als het te weinig is

## Idee
De kok kijkt naar de bak, vergelijkt die met hoe vol hij minstens moet zijn, en doet dan één van drie dingen:
- Genoeg? Dan vink je af.
- Te weinig en te pakken? Vul aan uit de koelcel of het magazijn en vink af.
- Te weinig en moet gesneden of gemaakt worden? Tik op Naar MEP.

## Nieuwe weergave
```text
Zoetzure gember
[▮▮▯ Minstens half vol]   Te weinig: aanvullen uit koelcel

Gesneden paprika
[▮▯▯ Bodempje is genoeg]  Te weinig: Naar MEP (snijden)

Mayonaise
[▮▮▮ Moet vol zijn]       Te weinig: aanvullen uit koelcel

Spread
[▮▮▮ Moet vol zijn]       Te weinig: ontdooien uit vriescel
```

1. **Hoe vol het minstens moet zijn**, met het peilstreepje (de blokjes kloppen nu met de tekst):
   - vol: 3 blokjes, "Moet vol zijn"
   - half: 2 blokjes, "Minstens half vol"
   - bodem: 1 blokje, "Bodempje is genoeg"
2. **Wat je doet als het te weinig is**, als één korte opdracht: "Aanvullen uit koelcel", "Aanvullen uit magazijn", "Ontdooien uit vriescel", "Bestellen bij Midsland", "Naar MEP (snijden)" of "Naar MEP (maken)".
3. Na een actie blijft de uitkomst staan zoals nu: "Op de MEP voor morgen", "Op het bestelbord", "Op de bestellijst Midsland".
4. Uitleg achter het info-icoon: "Kijk of de bak minstens zo vol is als aangegeven. Genoeg of aangevuld: vink af. Moet gesneden of gemaakt worden: Naar MEP. Is het ook in de koelcel of het magazijn op: Bron op."

## Wat niet verandert
De knoppen, de keten, de instellingen en wat er wordt opgeslagen blijven hetzelfde. Alleen de tekst en het peilstreepje veranderen.

## Technisch
- `src/lib/sluitronde.ts`: `aanvulTekst` wordt een minimum-tekst (vol/half/bodem). `peilBlokjes` wordt 3/2/1. `herkomstLabel` wordt een actietekst ("Aanvullen uit koelcel", "Naar MEP (snijden)", enz.).
- `sluitronde.test.ts`: de verwachte teksten en blokjes aanpassen, één test per vulnorm en per bron.
- `AfvinkRonde.tsx`: label "Te weinig:" in muted vóór de actie; de InfoKnop-tekst bijwerken.
- Verificatie: tests draaien en screenshots maken van de Sluiten-tab, Keuken West, op iPad en telefoon.
