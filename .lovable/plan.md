# Halve bakken tellen en bakjes zonder GN-codes

Twee dingen die nu extra nadenken kosten bij de voorraadronde: je kunt alleen hele stuks tellen, en je moet weten wat een GN 1/6 midden is.

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
- Bij "bodempje" of "half" wordt alleen aangevuld als het tekort na afronding minstens 1 is. Een product dat vol-genoeg is geeft geen bestelling.

## 2. Bakjes in gewone taal

Nu staan er dingen als "GN 1/9 midden, vol" en "GN 1/6 hoog". In de data staan 30 verschillende schrijfwijzen, deels met de vulgraad erin verwerkt.

Nieuw: één vaste woordenlijst, met de GN-code als klein grijs bijschrift voor wie ermee werkt:

| Wat je ziet | Bijschrift |
|---|---|
| klein bakje, ondiep / diep | GN 1/9 |
| standaard bakje, ondiep / diep | GN 1/6 |
| breed bakje | GN 1/4 |
| groot bakje | GN 1/3 |
| zwarte bak, broodbak, lade, pot, fles, zak, pakje | blijft zoals het is |

- "midden" en "hoog" worden "ondiep" en "diep" — twee opties in plaats van drie namen.
- De vulgraad ("vol", "half vol", "1/3 vol") gaat uit de formaatnaam. Dat is nu een vaste tekst terwijl het juist het ding is dat je telt; het doelaantal drukt dat voortaan uit (bijv. doel 0,5 bak).
- De opschoning gebeurt eenmalig in de database, zodat elk product één nette formaatnaam heeft.

## Technisch

- `src/lib/voorraad-formaat.ts`: mapping GN-code → gewone naam + bijschrift, en `aantalLabel` die halve waarden netjes schrijft ("1,5 bak").
- `src/components/foh/VoorraadRonde.tsx`: `TelRegel` krijgt de vol/half/bodempje-keuze naast de plus/min-stepper; tikdoelen minimaal 44px, drie knoppen naast elkaar passen op de iPad.
- Tekortberekening in de bon: `Math.ceil(doel - geteld)`, minimaal 1 voordat er een regel ontstaat.
- `koelcel_checks.geteld_aantal` is al numeriek en kan halve waarden aan; controleren dat het geen integer-kolom is voordat we opslaan.
- Migratie over `koelcel_check_items` (West, actief): vulgraad uit `formaat` halen en waar nodig in `doel_rustig`/`doel_druk` verwerken, formaatnamen normaliseren, logregel in `migratie_logboek`.

## Risico's

- De doelaantallen van producten die nu "half vol" in de naam hebben veranderen mee (bijv. van 1 naar 0,5). Ik lever die lijst apart op zodat je hem kunt nakijken voordat het live gaat.
- Lopende rondes op de iPad: de tussenstand in het geheugen blijft werken, halve waarden verschijnen pas bij een nieuwe ronde.

## Testen

Voorraadronde West → Sluiten → forel op "half" zetten → aanvulbon toont 1 bak halen met "3 nodig · 2,5 geteld" → doorzetten zonder fout.
