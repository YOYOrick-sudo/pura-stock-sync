# Voorraadronde: minder onnodige MEP, Links onder op vrijdag, betere klaar-knop

## 0. Koelcel tellen op maandag
- **Groente & fruit** en **Zuivel & kaas** in de koelcel worden voortaan 1x per week geteld, op **maandag**, samen met het magazijn en de vriescel. Het "om de dag"-ritme voor groente & fruit vervalt.
- Op andere dagen staan die groepen ingeklapt als rustige balk: "Vandaag niet tellen · volgende telling maandag 5 okt". Ze tellen dan niet mee in de voortgang. De weekstrip laat maandag als teldag zien.
- Is maandag een keer niet geteld (of dicht), dan blijven ze de eerstvolgende open dag op de lijst staan tot ze geteld zijn.
- Dit gaat alleen over de koelcel. De lades in de koelwerkbank tel je nog steeds elke dag.
- Let op: tussen twee maandagen ziet de app geen tekort aan verse groente in de koelcel. Bestellingen voor groente en fruit komen dan maar 1x per week op het bestelbord.

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
- Koelcel-ritme: `gfRitme` wordt een algemene weekritme-helper (maandag, met inhaalregel uit de laatste `koelcel_checks`) voor `koelcel:Groente & fruit` en `koelcel:Zuivel & kaas`, net als de bestaande maandagregel voor magazijn en vriescel.
- `koelcel_check_items.vulnorm`: nieuwe waarde `'bodem'` (0,25). `vulnormWaarde`/`vulnormLabel` in `useKoelcelCheck.ts` uitbreiden. Dataupdate: Gesneden paprika en Rode peper (werkbank) krijgen `vulnorm='bodem'`. Archiveren of verwijderen is niet nodig.
- Gember: oorzaak vinden in `VoorraadRonde.tsx` (mepTitels-match, ketenregels) en die gericht oplossen.
- Links onder-ritme: in `categorieGroepen` een `overslaan` voor de lade "Links onder", tenzij het vandaag de teldag is. Teldag = eerstvolgende open vrijdag (via `useMepKalender`), met inhaalregel als vrijdag niet geteld is (laatste `koelcel_checks` van items in die lade).
- Klaar-knop: per groep een knop in `CategorieBlok`/lade-render (`sluitGroep`). De sticky balk wordt een voortgangsbalk die naar de volgende groep scrollt.
- Daarna live testen op 390px en iPad: paprika half (geen MEP), peper bodempje (geen MEP), gember half (geen MEP), Links onder op een andere dag dan vrijdag ingeklapt, en de klaar-knop per lade.
