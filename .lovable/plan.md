# Au bain-marie: één sticker per zak, systeem onthoudt de openingsdatum

## Wat nu niet klopt
- Op de sticker staat "Zak ontdooid" en "Bak van". Waar het om gaat is: **wanneer is de zak geopend**, en tot wanneer mag hij.
- Elke avond moet je een nieuwe sticker printen, terwijl de bak niet verandert.
- "Nieuwe zak geopend" zit verstopt achter "Klopt deze bak nog?".
- Je ziet dagen ("do · dag 3/6") in plaats van datums.

## Hoe het wordt

**1. Het systeem onthoudt de openingsdatum**
Per product (kip, vissoep, tomyum, ei) bewaart de app de dag waarop de zak/bak is geopend. Die blijft staan tot je een nieuwe opent, of tot hij op of weg is. Niemand hoeft dat elke dag opnieuw in te vullen.

**2. Eén sticker per zak, niet elke dag**
Je print alleen een sticker als je een nieuwe zak opent. Daarna kijk je bij sluiten alleen nog: klopt het, of is hij over datum.

```text
BAIN-MARIE
Kip
Geopend:        za 24/10
Gebruiken t/m:  wo 28/10
```
- Alleen deze twee datums, groot en duidelijk. "Zak ontdooid" en "Bak van" verdwijnen.
- Zit de sticker eraf of is hij onleesbaar: knop **Opnieuw printen** blijft beschikbaar (zelfde datums).

**3. Datums in plaats van dagen, overal**
Formaat: **do 22/10** — dag én datum in één keer. Op het scherm:
```text
[ ]  Kip                             [ Nieuwe zak ]
     Geopend za 24/10 · t/m wo 28/10   ▓▓░░░  nog 4 dagen
```

**4. Nieuwe zak: één zichtbare knop**
- Per regel een knop **Nieuwe zak** (kip) / **Nieuwe bak** (vissoep, tomyum, ei).
- Tik → kort venster "Wanneer geopend?" met Vandaag (standaard) / Gisteren / Andere datum → sticker rolt er direct uit.
- Op de laatste dag: regel rood, "Vandaag laatste dag", knop **Weggooien**. Na de datum: alleen Weggooien.
- Op de regel tikken geeft nog: "Bak is op".

**5. Wat er in de sluitlijst afgevinkt wordt**
Het vakje links betekent nu: "gecontroleerd — sticker zit erop en klopt". Vinkt zichzelf af als je vandaag een nieuwe zak opende of iets weggooide; anders één tik.

**6. Open-lijst**
De ochtendvraag "Welke dag staat op de bak?" verdwijnt — de app weet het al. 's Ochtends zie je alleen de stand (geopend / t/m) en dezelfde knop Nieuwe zak.

## Wat niet verandert
Houdbaarheid (kip 5, vissoep/tomyum 6, ei 4 dagen, geopend = dag 1), labelprinter en printroute, archiveren (oude zakken blijven in de historie), gewone ontdooi-stickers bij Snel printen.

## In de praktijk
- Minder werk: geen dagelijkse stickers meer, alleen bij een nieuwe zak.
- Gewoonte die mee moet: **wie een zak opent, tikt meteen "Nieuwe zak"**. Vergeet iemand dat, dan blijft de oude datum staan en zegt de app te vroeg "weggooien" — veilig kant, geen te lange houdbaarheid.
- Per ongeluk "Nieuwe zak" verlengt de houdbaarheid; daarom altijd de datumvraag en blijft de oude zak terug te vinden.

## Technisch
- `src/lib/labelZpl.ts`: bain-variant → twee regels "Geopend: {datum1}" en "Gebruiken t/m: {datum2}" (groter font), `ontdooidDatum`-regel weg voor bain. Datumformaat `do 22/10` (weekday short + dd/MM) via helper, ook op scherm.
- `src/components/foh/BainMarie.tsx`: open-lijst dagknoppen vervangen door statusregel + Nieuwe zak; sluit-lijst: vinkje = gecontroleerd (lokaal per dag, zoals nu `geprint`), knoppen Nieuwe zak / Opnieuw printen / Weggooien; `ZakDatumKiezer` → "Wanneer geopend?" en de gekozen datum wordt `start_datum`. Print direct na `useZetBainMarieStart` met `nieuw: true`.
- Database: geen nieuwe kolom; `start_datum` = openingsdatum. `ontdooid_datum` blijft bestaan maar wordt niet meer gevraagd.
- Controle: labelvoorbeeld via Labelary, open- en sluitlijst op iPad- en telefoonformaat, testbak opruimen.
