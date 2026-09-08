# West-takenlijst: categorieën terug en Samen in beide lijsten

## Wat er nu misgaat

- De tabbladen Bediening en Keuken tonen de taken als één doorlopende lijst zonder kopjes. Daardoor zijn de categorieën (Vitrine, Bar, Koffie enzovoort) verdwenen.
- Samen staat als apart derde tabblad. In de praktijk horen die taken bij allebei: wie op de bediening-iPad of de keuken-iPad werkt, moet ze zien.

## Wat ik ga aanpassen

1. **Categorieën terug.** Bediening en Keuken tonen hun taken weer gegroepeerd per categorie, met de kopjes en de volgorde die in de instellingen is ingesteld — precies zoals eerder.
2. **Samen in beide lijsten.** Zowel op Bediening als op Keuken komt bovenaan "Samen / Opstarten" (bij de openlijst) of "Samen / Start" (bij de sluitlijst), en onderaan "Samen / Laatste loodjes". Daartussen staan de eigen categorieën van die sectie.
3. **Het derde tabblad Samen vervalt.** Er blijven twee tabbladen over: Bediening en Keuken. Die zijn allebei zichtbaar en aanklikbaar, en de iPad-standaardinstelling (Bediening of Keuken) blijft werken zoals hij nu werkt.
4. **Afvinken blijft gedeeld.** Een Samen-taak die op de ene iPad wordt afgevinkt, staat direct ook op de andere afgevinkt. De teller boven de lijst telt de Samen-taken mee in de sectie waar je op dat moment staat.
5. **Bewerkmodus blijft ongewijzigd**: daar zie je alle secties onder elkaar, zoals nu.

## In de praktijk

Een medewerker pakt de bediening-iPad, ziet de openlijst met de opstart-taken bovenaan, daarna de eigen categorieën met kopjes, en de laatste loodjes onderaan. Niemand hoeft nog van tabblad te wisselen om de gedeelde taken te vinden. Risico dat een Samen-taak dubbel wordt gedaan is er niet: hij verdwijnt (doorgestreept) op beide iPads zodra iemand hem afvinkt.

## Technisch

- Alleen `src/components/foh/FohTasks.tsx`.
- `renderDepartmentSection` voor Bediening/Keuken aanroepen met `flat = false` zodat `renderCategoryGroups` weer gebruikt wordt.
- Tabweergave opbouwen als: Samen (startcategorieën) + eigen sectie (per categorie) + Samen (overige) — hergebruik van de bestaande `isStartCat`-filter.
- `VisibleTab` terug naar `'bediening' | 'keuken'`; `WEST_SECTIONS`-tabs filteren op die twee; tellers per tab de Samen-taken laten meetellen.
- Geen database-, RLS-, route- of pakketwijzigingen.
