# Voorraadronde: minder onnodige MEP, Links onder op vrijdag, betere klaar-knop

## Antwoord op je vraag: wanneer tellen in de koelcel?
- **Groente & fruit:** om de dag (vanaf de laatste telling + 2 dagen, gesloten dinsdag schuift door). De weekstrip laat de teldag zien.
- **Zuivel & kaas:** nu **elke open dag**.
- **Magazijn en vriescel:** 1x per week, op maandag.

Zuivel & kaas laat ik dus elke dag staan. Wil je die ook om de dag of 1x per week, zeg het dan, dan neem ik dat mee.

## 1. Paprika, rode peper, gember: minder snel op de MEP
| Product (lade links boven) | Nu | Straks |
|---|---|---|
| Gesneden paprika | hoort vol: half of bodempje = MEP | half en bodempje = goed, alleen **leeg** = MEP |
| Rode peper | hoort half: bodempje = MEP | bodempje = goed, alleen **leeg** = MEP |
| Zoetzure gember | hoort half | half = goed (zo staat het al ingesteld) |

Voor paprika en rode peper komt er een nieuwe norm: **"tot bodempje"**. Dan staat er "hoort: bodempje" in plaats van "hoort vol". Bij gember staat de norm al op half, dus dan zou half geen MEP moeten geven. Ik zoek bij het bouwen uit waarom er toch een MEP-taak kwam: een al bestaande MEP-taak met dezelfde naam (chip "op de MEP"), of de koelcel- of magazijnregel van gember die erachter zit. Dat los ik dan op.

## 2. Reservelade links onder alleen op vrijdag
- Op vrijdag tel je Links onder zoals nu.
- Op andere dagen staat de lade ingeklapt als rustige balk: "Vandaag niet tellen · volgende telling vrijdag 9 okt". Hij telt dan niet mee in de voortgang en maakt geen MEP- of bestelregels. Dit werkt net als bij Groente & fruit.
- Is vrijdag een keer dicht, dan schuift de telling door naar de eerstvolgende open dag.

## 3. Klaar-knop onderaan
Nu staat er onder de hele ronde één grote knop met de naam van de lade, bijvoorbeeld "Links onder klaar". Dat voelt los van waar je net telde. Straks:
- **Onderaan elke lade** komt een eigen knop "Lade klaar ✓" (44px+), precies waar je duim al is na het laatste product. Daarna klapt die lade in en opent de volgende.
- De vaste balk onderaan wordt alleen nog een voortgangsbalk: "7/12 geteld · volgende: Links midden". Tik je erop, dan spring je naar die lade. Zijn alle lades geteld, dan wordt het de knop **"Naar de aanvulbon"**.

## Praktijk
- Minder MEP-taken voor paprika, peper en gember betekent dat het bakje echt leeg moet zijn voordat er iets gebeurt. Wie sluit moet dus wel eerlijk "leeg" tikken.
- Wordt er op vrijdag niet geteld, dan blijft Links onder de volgende open dag op de lijst staan tot hij wel geteld is.

## Technisch
- `koelcel_check_items.vulnorm`: nieuwe waarde `'bodem'` (0,25). `vulnormWaarde`/`vulnormLabel` in `useKoelcelCheck.ts` uitbreiden. Dataupdate: Gesneden paprika en Rode peper (werkbank) krijgen `vulnorm='bodem'`. Archiveren of verwijderen is niet nodig.
- Gember: oorzaak vinden in `VoorraadRonde.tsx` (mepTitels-match, ketenregels) en die gericht oplossen.
- Links onder-ritme: in `categorieGroepen` een `overslaan` voor de lade "Links onder", tenzij het vandaag de teldag is. Teldag = eerstvolgende open vrijdag (via `useMepKalender`), met inhaalregel als vrijdag niet geteld is (laatste `koelcel_checks` van items in die lade).
- Klaar-knop: per groep een knop in `CategorieBlok`/lade-render (`sluitGroep`). De sticky balk wordt een voortgangsbalk die naar de volgende groep scrollt.
- Daarna live testen op 390px en iPad: paprika half (geen MEP), peper bodempje (geen MEP), gember half (geen MEP), Links onder op een andere dag dan vrijdag ingeklapt, en de klaar-knop per lade.
