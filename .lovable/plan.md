# Au bain-marie: eigen sticker + nieuwe zak uit de koelcel duidelijk maken

## Wat nu vaag is
1. De sticker leest als een ontdooi-sticker: er staat "Zak ontdooid: …" bovenaan het datumblok, dus het lijkt alsof je iets uit de vriezer stickert.
2. Een nieuwe zak komt uit de **koelcel** (al ontdooid, met eigen ontdooi-sticker). De app vraagt nu "Datum op de zak? (ontdooi-sticker)" — dat voelt als een vriezer-actie.
3. "Nieuwe zak geopend" zit verstopt: je moet eerst op de regel tikken, dan "Klopt deze bak nog?" lezen, dan de knop vinden.

Let op: jouw foto toont nog de oude weergave ("za · dag 1/5"). De nieuwe regel-opmaak staat al klaar maar is nog niet gepubliceerd.

## Wat het wordt

**Sticker (alleen tekst, printer en formaat ongewijzigd)**
```text
BAIN-MARIE
Kip
Open sinds: za 24/10
Gebruiken t/m: wo 28/10
Uit koelcel: do 22/10      (alleen kip, klein)
```
- Kop blijft BAIN-MARIE, "Gebruiken t/m" wordt de grootste datumregel.
- "Zak ontdooid" wordt "Uit koelcel" en staat onderaan, klein — informatie, geen hoofdzaak.

**Nieuwe zak: één zichtbare knop op de regel**
```text
[ ]  Kip                          [ Nieuwe zak ]  [ Sticker ]
     Houdbaar t/m wo  ▓▓▓░░  nog 4 dagen
```
- Naast Sticker staat een rustige knop **Nieuwe zak** (alleen kip; bij vissoep/tomyum/ei heet hij **Nieuwe bak**).
- Tik → klein venster "Nieuwe zak uit de koelcel" met één vraag: **"Welke datum staat op de koelcel-sticker?"** — Vandaag / Gisteren / Eergisteren / Andere datum.
- Daarna staat de regel op dag 1 en print je direct de sticker. Geen tussenstap "Klopt deze bak nog?" meer nodig voor dit geval.
- "Bak is op" en "Weggooien" blijven bereikbaar door op de regel te tikken, zoals nu.
- In de open-lijst wordt de zak-vraag dezelfde tekst ("Welke datum staat op de koelcel-sticker?").

## Wat niet verandert
Houdbaarheid (kip 5, vissoep/tomyum 6, ei 4), historie/archiveren, printroute naar de labelprinter, gewone ontdooi-stickers bij Snel printen.

## In de praktijk
Afsluiter op de iPad ziet meteen of hij een nieuwe zak pakt: één tik, één datum, sticker. Risico: iemand tikt per ongeluk "Nieuwe zak" — dat verlengt de houdbaarheid. Daarom vraagt het venster altijd de koelcel-datum (geen stille actie) en blijft de oude bak gearchiveerd, dus terug te vinden.

## Technisch
- `src/lib/labelZpl.ts`: bain-variant datumblok herschikken — "Open sinds" (was "Bak van"), "Gebruiken t/m" groter, "Uit koelcel" klein onderaan; veld `ontdooidDatum` blijft. Omschrijving in printhistorie ongewijzigd.
- `src/components/foh/BainMarie.tsx`: knop "Nieuwe zak/bak" per rij in `BainMarieSluit` die direct `ZakDatumKiezer` (kip) of `nieuweBak(p, null)` aanroept; tekst `ZakDatumKiezer` → "Welke datum staat op de koelcel-sticker?"; knop in correctie-dialoog verwijderd (blijft: Klopt / Bak is op). Geen database-wijziging.
- Controle: labelvoorbeeld via Labelary, sluitlijst op iPad- en telefoonformaat met Playwright, testbak daarna opruimen.
