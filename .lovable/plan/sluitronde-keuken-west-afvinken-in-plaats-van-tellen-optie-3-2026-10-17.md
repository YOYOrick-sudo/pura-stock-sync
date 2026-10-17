# Sluitronde keuken West: afvinken in plaats van tellen (optie 3)

Uitgangspunt: wat je kunt pakken, pak je meteen en vink je af. Wat gesneden of gemaakt moet worden, stuur je met één tik naar de MEP. Alleen als de hele keten leeg is, gaat het naar het bestelbord of Midsland. Tellen gebeurt alleen op maandag.

## Hoe de ronde eruitziet

Per product één regel met één vinkje en, alleen waar het zin heeft, één extra knop. Welke knop je ziet, hangt af van het soort product:

```text
Soort              Voorbeeld                     Vinkje betekent          Extra knop
Pakken uit keten   zoetzure gember, mayo, saus   "aangevuld / ligt er"    [Bron op]
Vers snijwerk      paprika, komkommer, rode peper "genoeg voor morgen"    [Naar MEP]
Zelf maken         falafel, döner, granaatappel  "genoeg voor morgen"     [Naar MEP]
```

- Onder elk product staat één korte regel: wat genoeg is en waar je het pakt ("halve bak · uit de koelcel").
- "Bron op" vraagt niets meer: het systeem kent de keten (lade → koelcel → magazijn) en zegt in één zin wat er gebeurt: "Pak een nieuwe zak uit het magazijn" of, als dat ook leeg is, "Gaat naar het bestelbord".
- "Naar MEP" maakt direct een MEP-taak voor de eerstvolgende open dag, met het aantal dat al per product is ingesteld (bijv. 3 granaatappels, 2 bloemkool). Nooit dubbel: staat er al een open taak, dan komt er geen tweede.

## Gewone dag en maandag

- Gewone dag (ook vrijdag): lades, Flessen en koelcel-producten die je naar de lades haalt. Vriescel en magazijn sla je over. Doel: 3 minuten.
- Maandag: eerst de telling van koelcel (zuivel, kaas, groente, fruit), vriescel en magazijn, zoals nu. Daaruit komt de bestelling voor Midsland. Daarna dezelfde afvinklijst.
- De app kiest zelf of het maandag is, en volgt de openingsdagen: is maandag gesloten, dan schuift de telling naar de eerstvolgende open dag.
- Au bain-marie stickeren en de ontdooisticker blijven zoals ze zijn.

## Instellingen van de keten (Instellingen → Koelwerkbank indelen)

Per product stel je in, zonder dat ik iets hoef te doen:
- Soort: "Pakken uit keten", "Vers snijwerk" of "Zelf maken" (bepaalt de extra knop).
- Waar je het vandaan haalt: koelcel, magazijn, vriescel (ontdooien) of Midsland.
- Wat genoeg is (vol / half / bodempje) en het MEP-aantal.
- Aan/uit, lade en volgorde (bestaat al).
- Bovenaan een kort overzicht per product: "Lade → koelcel → magazijn → bestelbord", zodat je in één blik ziet of de keten klopt. Producten zonder bron krijgen een oranje melding "keten niet compleet".

Ik zet voor alle huidige West-producten een voorstel klaar (bijv. gember = pakken uit keten via koelcel en magazijn; paprika, komkommer, rode peper = vers snijwerk). Jij kunt alles daarna wijzigen.

## In de praktijk
- Wie: wie de keuken sluit, op iPad of telefoon, met het keukenaccount. De lijst is dus voor iedereen in West zichtbaar; de instellingen blijven alleen voor managers.
- Afspraak voor het team: vinkje = "het ligt er of ik heb het aangevuld". Op maandag zie je terug als iemand blind heeft afgevinkt.
- Vergeten: open regels verdwijnen de volgende dag; MEP-taken die wel gemaakt zijn blijven staan. Niets stapelt op.
- Wifi weg: vinkjes blijven staan en worden later verstuurd, met een melding wat nog niet is opgeslagen.
- Risico: een verkeerd ingesteld soort product geeft de verkeerde knop. Daarom het voorstel vooraf en de ketenmelding in de instellingen.

## Wat weggaat
- Het tellen op gewone dagen in de huidige sluitlijst.
- De proefpagina "Sluitronde proef" en de twee andere voorbeelden.
- Er wordt niets uit de historie verwijderd.

## Testen (alles, vóór ik "klaar" zeg)
1. Gewone dag, telefoon- en iPad-formaat, met het West-keukenaccount: alles afvinken, voortgang klopt.
2. Gember "Bron op" met magazijn gevuld → opdracht magazijn; met magazijn leeg → bestelbord.
3. Paprika "Naar MEP" → één MEP-taak voor morgen met juist aantal; nog eens tikken → geen tweede taak.
4. Maandag (datum nagebootst) → telling verschijnt eerst, bestelling Midsland klopt; gesloten maandag → schuift door.
5. Instellingen als manager: soort wijzigen → knop in de ronde wijzigt mee; keukenaccount ziet instellingen niet.
6. Wifi uit tijdens afvinken → vinkje blijft, wordt na herstel opgeslagen.
7. Midsland: niets veranderd. Printer, au bain-marie en bestaande bestellingen werken nog.
Alle testdata wordt na afloop weer opgeruimd.

## Technisch
- Eerst nagaan welke velden de bestaande producttabel (koelcel_check_items) al heeft voor keten en MEP-aantal; alleen wat mist komt erbij als nieuw, optioneel veld met standaardwaarde (geen bestaande velden aanpassen).
- Opslaan van een vinkje gebruikt het bestaande opslagmodel van de sluitronde ("aanwezig"); "Bron op" en "Naar MEP" hergebruiken de bestaande ketenroute en MEP-functies, met een controle op een al openstaande taak.
- Maandag-detectie via de bestaande openingsdagen-functies.
- Proefpagina, route en menu-item worden verwijderd. Beveiliging per tabel blijft ongewijzigd.
