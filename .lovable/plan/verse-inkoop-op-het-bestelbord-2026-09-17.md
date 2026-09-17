# Verse inkoop op het bestelbord

## Wat er nu gebeurt
Een tekort gaat één op één naar het bestelbord: 4 van de 5 aubergines geteld, dan staat er "1 aubergine". Dat klopt rekenkundig, maar je bestelt geen 1 aubergine bij een leverancier.

## Hoe we het doen
Per vers product leg je drie dingen vast:

1. **Doel** — wat er normaal moet liggen (bijv. 10 aubergines).
2. **Bestelpunt** — vanaf welk aantal het pas op het bord komt (bijv. 4 of minder). Daarboven meldt hij niks, dus geen ruis.
3. **Besteleenheid** — hoe je inkoopt: kist, doos, bak, kilo of stuks, met hoeveel er in zo'n eenheid zit (bijv. kist = 12 aubergines).

Zodra je onder het bestelpunt telt, rekent de app uit hoeveel er tot het doel ontbreekt en rondt dat naar boven af op hele besteleenheden. Op het bord staat dan geen "1 aubergine" maar **"1 kist aubergines (12 st.)"**.

Zit er geen verpakking op een product (bijv. kilo rode peper), dan vul je alleen een minimum in en wordt daarop afgerond.

### Waarom deze keuze (je vroeg wat ik denk)
Verpakking én bestelpunt samen, maar in één simpel scherm: doel, bestelpunt, en "hoe koop je in". Een los minimum bestelaantal is niet nodig — de verpakkingsinhoud is in de praktijk al het minimum. Minder velden, zelfde resultaat.

### Grondstof en gesneden product apart houden
Je vroeg terecht: dan moet je weten hoeveel aubergines in één bak gaan. Dat wordt inderdaad ingewikkeld en fout­gevoelig (verschilt per formaat, per seizoen). Daarom houden we het gescheiden:

- **Gesneden/bereid product** (bak gegrilde aubergine) → telt zoals nu → MEP-taak.
- **Verse aubergines** → eigen telregel in de koelcel/opslag → bestelbord.

Je telt dus bij de ronde twee regels: "gegrilde aubergine" en "verse aubergines". Eén extra tik, maar altijd kloppend en zonder omrekentabel. Later kan er alsnog een omrekening bovenop als je dat wilt.

## Wat je gaat zien
- In het voorraadbeheer per product: doel, bestelpunt, besteleenheid + inhoud.
- In de voorraadronde: verse producten staan gewoon tussen de rest, met het aantal in stuks/kilo.
- Op de aanvulbon en het bestelbord: hele besteleenheden, bijv. "2 dozen granaatappels (2 × 8)".
- Ligt het aantal boven het bestelpunt: geen bestelregel, regel blijft groen.

## Technisch
- Migratie op `koelcel_check_items`: `bestelpunt numeric`, `bestel_eenheid text` (kist/doos/bak/kilo/stuks), `bestel_inhoud numeric` (aantal per eenheid). Regel in `migratie_logboek`.
- `useKoelcelCheck.ts`: nieuwe helper `bestelOpdracht(item, geteld)` → `{ meld: boolean, eenheden: number, stuks: number, label: string }`. Meldt alleen als `geteld <= bestelpunt` (bestelpunt leeg = huidig gedrag). `eenheden = ceil((doel − geteld) / bestel_inhoud)`. Onderweg blijft van de behoefte af via de bestaande logica.
- `opBestelbord()` schrijft `aantal = eenheden` en `eenheid = bestel_eenheid`, met de stuksberekening in `notitie`.
- `VoorraadRonde.tsx`: bonregel toont het eenheden-label i.p.v. het rauwe tekort.
- `VoorraadCheckBeheer.tsx`: drie velden erbij bij bron inkoop/magazijn, in de stijl van het bestaande batch-veld.
- Vulling-, reserve- en MEP-logica blijven ongewijzigd.

## Daarna nodig van jou
De lijst verse producten met hun doel, bestelpunt en inkoopverpakking (aubergine, granaatappel, rode peper, tomaatjes, en wat er verder bij hoort). Ik zet een eerste voorstel klaar dat je in het beheer kunt bijstellen.
