# Waarschuwing bij direct-verkoop-methode zonder receptregels

## Punt 1 — de twee keuzes die ik zelf maakte (alsnog expliciet)

1. **Recepten-bron in de Methodes-tab**: de tab was artikel-gestuurd (alleen recepten met een halffabricaat-artikel). Ik heb hem omgezet naar `useRecipes('', null)` — dus alle actieve recepten, plus een aparte lijst met methodes die geen voorraadartikel hebben. Reden: zonder die wijziging kon je voor een ingekochte croissant nooit een methode aanmaken; het addendum zegt "methode mag bij elk recept".
2. **Artikel-synchronisatie bij direct-verkoop**: bij `output_gaat_op_voorraad = false` werk ik de basis-eenheid van het gekoppelde artikel niet bij en rond ik de bijbehorende logboekregel niet af. Reden: die logboekregel gaat over "basis-eenheid van een voorraadartikel ontbreekt"; bij een methode zonder voorraadoutput is dat geen antwoord op die vraag en zou je stilzwijgend een openstaand punt afvinken dat nog echt open is.

Beide keuzes horen in het plan gemeld te worden; dat is niet gebeurd. Vanaf nu meld ik ze vooraf.

## Punt 2 — wat ik nu ga doen

### Architectuurdocument (project knowledge)
Ontwerp-eis stap 2 toevoegen aan `voorraadketen-datamodel-v2`:
- Bij uitvoering van een methode wordt **altijd** input-verbruik geboekt via de receptregels (`productie_verbruik`), ook als `output_gaat_op_voorraad = false`.
- Alleen de `productie_in`-boeking van de output vervalt bij direct verkoop.
- Voorbeeld: 20 croissants afbakken = `productie_verbruik` van 20 diepvries-croissants; geen `productie_in`.
- Gevolg: een direct-verkoop-methode bij een recept zonder receptregels boekt straks niets — dat is een datagat dat vooraf zichtbaar moet zijn.

### Zachte waarschuwing in de UI (niet blokkerend)
1. **Methode-dialog** (`MethodeDialog.tsx`): bij `output gaat op voorraad = uit` én 0 receptregels een gele inline-melding tonen: "Dit recept heeft nog geen ingrediëntregels — het verbruik kan straks niet geboekt worden." Opslaan blijft gewoon mogelijk.
2. **Methodes-tab** (`MethodesTab.tsx`): bij elke rij met een Direct-badge en 0 receptregels een klein waarschuwingsicoon met dezelfde tekst als tooltip/regel eronder.

### Technisch
- `useRecipes` levert al `ingredient_count`; de Methodes-tab gebruikt die lijst al, dus daar is geen extra query nodig.
- Voor de dialog (die alleen een `receptId` kent) komt er een kleine hook `useReceptRegelCount(receptId)` in `useHalffabricaatMethodes.ts` of `useRecipes.ts`: `count`-query op `recept_ingredienten` per recept, alleen actief als de dialog open is.
- Styling via bestaande waarschuwings-tokens (`bg-warning/10`, `text-warning`), geen nieuwe kleuren.
- Geen databasemigratie nodig.

### Verificatie
- Build groen.
- Klikronde: recept zonder ingrediëntregels → methode op Direct zetten → waarschuwing zichtbaar, opslaan werkt; recept mét regels → geen waarschuwing; Methodes-tab toont het icoon alleen bij Direct + 0 regels.
