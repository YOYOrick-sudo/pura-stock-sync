# Halve bakken, begrijpelijke bakjes en de voorraadronde in de takenlijst

Vier dingen die nu extra nadenken kosten bij de sluitlijst van West.

## 1. Tellen in halve bakken

Nu: plus/min per heel stuk. In de praktijk is een bak half, of ligt er een bodempje.

Nieuw: bij "hoeveel ligt er?" kies je per bak wat je ziet, in drie vaste stappen:

```text
[ vol ]   [ half ]   [ bodempje ]
```

- Heeft een product een doel van meerdere bakken (bijv. 3 bakken forel), dan tel je eerst het aantal volle bakken met plus/min, en geef je daarnaast aan hoe de laatste, aangebroken bak erbij staat.
- Voorbeeld: 2 volle bakken + laatste half = "2,5 bak". Dat is wat er geteld wordt.
- "Bodempje" telt als een kwart en betekent altijd: aanvullen.

Wat er daarna gebeurt met de aanvulbon:
- Het tekort wordt altijd naar boven afgerond naar hele bakken, potten of pakken — je kunt geen halve bak uit de vriescel halen. Doel 3, geteld 1,5 → 2 bakken halen.
- Op de bon staat waarom: "3 nodig · 1,5 geteld".
- Alleen aanvullen als het tekort na afronding minstens 1 is.

## 2. Bakjes in gewone taal

Nu staan er dingen als "GN 1/9 midden, vol" en "GN 1/6 hoog". In de data staan 30 verschillende schrijfwijzen, deels met de vulgraad erin.

Nieuw: één vaste woordenlijst, met de GN-code als klein grijs bijschrift voor wie ermee werkt:

| Wat je ziet | Bijschrift |
|---|---|
| klein bakje, ondiep / diep | GN 1/9 |
| standaard bakje, ondiep / diep | GN 1/6 |
| breed bakje | GN 1/4 |
| groot bakje | GN 1/3 |
| zwarte bak, broodbak, lade, pot, fles, zak, pakje | blijft zoals het is |

- "midden" en "hoog" worden "ondiep" en "diep" — twee opties in plaats van drie namen.
- De vulgraad ("vol", "half vol", "1/3 vol") gaat uit de formaatnaam; dat is juist wat je telt. Het doelaantal drukt dat voortaan uit (bijv. doel 0,5 bak).
- Eenmalige opschoning in de database zodat elk product één nette formaatnaam heeft.

## 3. De voorraadronde hoort bij de lijst, niet ernaast

Nu hangt de ronde als los blok onderaan de sluitlijst. Voortaan zit hij erin:

- De ronde wordt een blok binnen de sectie **Keuken** van de sluitlijst, op dezelfde plek in de volgorde als de andere keukencategorieën — dezelfde kop-opmaak, dezelfde breedte, dezelfde randen als een taakcategorie.
- Hij telt mee in de voortgang van Keuken: zolang de ronde niet is afgerond, staat de sluitlijst niet op 100%. In de teller telt de ronde als één taak.
- Ingeklapt zolang je er niet mee bezig bent: één regel "Voorraadronde — 0/8 categorieën", tikken opent hem. Na afronden klapt hij dicht met een groen vinkje, net als een afgevinkte taak.
- Geen dubbele kop meer: de losse witte kaart met eigen titel verdwijnt.

## 4. De plek moet net zo duidelijk zijn als de categorie

Nu is "Koelwerkbank" een klein grijs regeltje boven de categorieblokken, terwijl de categorieën (Eiwitten, Zoet) dikgedrukt zijn. De plek is juist waar je naartoe loopt.

- De plek wordt de duidelijkste kop: grote vette tekst met een icoon (koelwerkbank, toppings, koelcel, vriescel) en een eigen band over de volle breedte, plus de teller "3/5 categorieën".
- De categorieën staan daar duidelijk ondergeschikt onder, ingesprongen.
- Boven elke plek staat kort waar je staat: "Loop nu langs: Koelcel".
- De plek-kop plakt bovenaan tijdens het scrollen, zodat je nooit kwijt bent in welke kast je telt.

## Technisch

- `src/lib/voorraad-formaat.ts`: mapping GN-code → gewone naam + bijschrift; `aantalLabel` schrijft halve waarden ("1,5 bak").
- `src/components/foh/VoorraadRonde.tsx`: `TelRegel` krijgt vol/half/bodempje (44px tikdoelen) naast plus/min; plek-koppen herontworpen met sticky gedrag; component krijgt een ingeklapte/uitgeklapte modus en meldt via callback of hij klaar is.
- `src/components/foh/FohTasks.tsx` (regel ~3684): `VoorraadRonde` verplaatsen van onderaan de lijst naar binnen de keuken-sectie van de sluitfase, en meenemen in de voortgangsberekening van Keuken.
- Tekort in de bon: `Math.ceil(doel - geteld)`, minimaal 1 voor er een regel ontstaat.
- Controleren dat `koelcel_checks.geteld_aantal` numeriek is (halve waarden).
- Migratie over `koelcel_check_items` (West, actief): vulgraad uit `formaat` halen en in `doel_rustig`/`doel_druk` verwerken, formaatnamen normaliseren, logregel in `migratie_logboek`.

## Risico's

- Doelaantallen van producten met "half vol" in de naam veranderen mee (van 1 naar 0,5). Die lijst lever ik apart op zodat je hem kunt nakijken.
- De voortgang van de sluitlijst verandert: Keuken staat pas op 100% als de ronde af is. Dat is bedoeld, maar het team ziet dat de eerste dag.

## Testen

Voorraadronde West → Sluiten → keuken-sectie toont de ronde als ingeklapt blok → openen → forel op "half" → aanvulbon toont 1 bak halen met "3 nodig · 2,5 geteld" → doorzetten zonder fout → Keuken op 100%.
