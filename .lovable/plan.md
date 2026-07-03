# Snel-print stickers verbeteren

Vier gerichte wijzigingen in twee bestanden. Geen andere flows worden geraakt.

## A. `src/lib/labelZpl.ts` — `buildStickerZpl` en helpers

### 1. Nieuwe font-tiers voor de naam
`fontForStickerName(len)` wordt:
- ≤ 8 → **72**
- ≤ 14 → **56**
- ≤ 24 → **40**
- ≤ 34 → **30**
- anders → **26**

Word-wrap blijft `^FB408,2,4,L` (max 2 regels).

### 2. Dynamische verticale verdeling
Nieuwe helper `fitsOnOneLine(len, font)` schat de breedte:
`len × 0.55 × font ≤ 408` → past op 1 regel.

Voor `ontdooid` / `bereid`:
- Kop-balk: y=8, hoogte 36 (zie punt 4), dus eindigt op y=44.
- Datumblok onderaan: 2 regels font 30 (zie punt 3), samen ~72 dots hoog inclusief line-gap. Blok start op y=178, eindigt rond y=250 (binnen `^LL256`).
- Naam-zone: van y=52 tot y=170 (118 dots beschikbaar).
- Als naam op 1 regel past → verticaal gecentreerd in die zone (bv. `^FO20,<midY - font/2>`).
- Als naam 2 regels nodig heeft → start bovenaan de zone (`^FO20,52`), FB met 2 regels.

Voor `vrij`:
- Geen kop-balk, naam-zone van y=20 tot y=170.
- Één datumregel font 30 onderaan (y ≈ 210).
- Zelfde 1-regel-centrering / 2-regels-bovenin logica.

Implementatie: bereken `oneLine = fitsOnOneLine(naam.length, naamFont)`; kies dan `naamY` op basis daarvan. Concreet:

```text
zone_top    = 52 (of 20 voor vrij)
zone_bottom = 170
if oneLine:
   naamY = zone_top + ((zone_bottom - zone_top) - naamFont) / 2
else:
   naamY = zone_top
```

### 3. Datumregels gelijkwaardig
Voor `ontdooid` / `bereid`: beide regels font **30**, zelfde `^A0N,30,30`, links uitgelijnd op x=20:
- `^FO20,178^A0N,30,30^FD<bronLabel>: <d1>^FS`
- `^FO20,214^A0N,30,30^FDGebruiken t/m: <d2>^FS`

(36 dots lijnafstand = font 30 + 6 gap; past ruim binnen 256.)

### 4. Marge boven de kop-balk
- Balk: `^FO0,8^GB448,36,36,B,0^FS` (start y=8 i.p.v. 0).
- Kop-tekst: `^FO0,14^A0N,26,26^FB448,1,0,C^FR^FD<KOP>^FS` (4 dots lager t.o.v. balk-top, blijft gecentreerd verticaal in de balk).

## B. `src/pages/kitchen/SnelPrinten.tsx`

### 5. Stepper-max naar 30
`THT_RANGE` wordt:
```ts
ontdooid: { min: 1, max: 30 },
bereid:   { min: 1, max: 30 },
vrij:     { min: 0, max: 0 },
```
Defaults (`DEFAULT_THT`) blijven 2 en 3.

## Verificatie
Ik render drie ZPL-varianten via Labelary in de sandbox en maak screenshots:
1. **"Feta"** — type `ontdooid` (korte naam → font 72, verticaal gecentreerd, twee gelijke datumregels).
2. **Lange naam** die wrapt naar 2 regels (bv. "Gemarineerde geitenkaas met tijm en honing") — type `bereid`.
3. **Type `vrij`** met een middellange naam.

Bekijk de PNG's, controleer dat: kop niet meer tegen bovenrand plakt, datumregels dezelfde grootte hebben, en korte namen daadwerkelijk groot zijn.

## Bestanden
- `src/lib/labelZpl.ts` — `fontForStickerName`, `buildStickerZpl` (+ kleine helper `fitsOnOneLine`).
- `src/pages/kitchen/SnelPrinten.tsx` — `THT_RANGE`.
