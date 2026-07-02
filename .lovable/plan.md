## Doel
Alleen `buildStickerZpl` in `src/lib/labelZpl.ts` aanpassen — drie wijzigingen, geen andere code.

## Wijzigingen

### 1. Zwarte kop-balk met witte tekst (behalve type `vrij`)
- Boven het label een gevuld zwart blok van 448×36 dots via `^GB448,36,36^FS`.
- Kop-tekst ("ONTDOOID" / "BEREID") daaroverheen, gecentreerd en wit via reverse:
  - `^FO0,6^A0N,26,26^FB448,1,0,C^FR^FD{kop}^FS`
- Bij `type === 'vrij'`: geen balk, naam start bovenaan (y=20).

### 2. THT-regel prominenter
- Nieuw formaat voor "Gebruiken t/m: …": font **32** (was 26). `^A0N` is al bold-uitstraling; regel wordt zwaarder puur door grotere font.
- "Uit vriezer: …" / "Bereid: …" blijft **font 24** en staat erboven.

### 3. Verticale ruimte netjes verdelen (256 dots totaal)
Nieuwe indeling met balk:

```
y=0    ┌─────────────────────────┐
       │ ZWARTE BALK (36 hoog)   │  kop wit
y=36   ├─────────────────────────┤
y=52   │ NAAM (max 2 regels,     │
       │        font 22–40)      │  budget 112 dots
y=164  ├─────────────────────────┤
y=170  │ Uit vriezer/Bereid (24) │
y=202  │ Gebruiken t/m: … (32 b) │
y=240  └─────────────────────────┘
```

Zonder balk (`vrij`):
- Naam vanaf y=20 (2 regels budget behouden)
- "Datum: …" op y=210, font 28 (huidig)

### Budget-check naam-wrap
`fontForStickerName` levert max 40. 2 regels × 40 = 80 dots, ruim binnen de 112 dots tussen y=52 en y=164. Geen wijziging aan de font-tabel nodig.

## Bestand
- `src/lib/labelZpl.ts` — alleen de body van `buildStickerZpl` (regels ~87-118). Rest van het bestand ongemoeid.
