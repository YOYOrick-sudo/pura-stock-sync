# Au bain-marie: houdbaarheid per product, weggooien als actie bij sluit

## Wat verandert

### 1. Houdbaarheid per product
- Kip: maximaal **5 dagen**
- Tomyum: maximaal **6 dagen**
- Vissoep: maximaal **6 dagen**
- Ei: maximaal **4 dagen**

De app rekent per product met zijn eigen aantal dagen (dag 1 = startdag, laatste dag = startdag + max − 1).

### 2. Laatste dag = weggooien bij sluit, niet nog een sticker
De sluitlijst krijgt per product een duidelijke actie:

| Status van de bak | Sluitlijst toont |
|---|---|
| Dag 1 t/m voorlaatste | Knop "Sticker" (zoals nu) |
| Laatste dag | **Rode knop "Weggooien"** (prullenbak-icoon) — géén sticker meer |
| Te oud (over de datum) | **Rode knop "Weggooien"** — géén sticker |

Weggooien is één tik (met korte bevestiging): de bak wordt afgesloten in de app. De sluiter hoeft niets te onthouden — de app vertelt wat ermee moet gebeuren.

### 3. Ochtend ziet dat de bak weg is
Staat er geen bak meer omdat hij gisteren is weggegooid, dan toont de open-lijst bij dat product een rustig grijs chipje met prullenbak-icoon: **"weggegooid"** (verdwijnt zodra er weer een dag is aangetikt). Geen lange teksten — één beeld zegt genoeg: er is nu géén bak, en dat is bewust zo afgerond. Nieuwe bak starten blijft één tik op "Vandaag".

### 4. Ontdooid-datum van de zak (alleen Kip)
De kip komt uit een gevacumeerde zak uit de vriezer met een eigen ontdooi-sticker. Die datum komt mee op de bak-sticker:

- Alleen bij **"Vandaag (nieuw)"** verschijnt één vervolgvraag: **"Datum op de zak?"** met dezelfde dagknoppen. Eén tik, klaar.
- Bij gewone dagen (ma, di, …) géén extra vraag — de zak blijft dezelfde.
- Nieuwe zak later? Tik opnieuw "Vandaag (nieuw)" en geef de nieuwe zak-datum op; de oude registratie wordt overschreven.
- Alleen voor Kip. Vissoep, Tomyum en Ei krijgen de vraag nooit.

## Hoe ziet de sticker eruit
Eigen stickertype op de bestaande labelprinter (57×32 mm), zelfde familie als de ontdooi- en bereid-stickers:

```text
┌──────────────────────────────┐
│ ▓▓▓▓▓  BAIN-MARIE  ▓▓▓▓▓▓▓ │  ← zwarte balk
│                              │
│ Kip                          │  ← productnaam, groot
│                              │
│ Zak ontdooid: ma 15/09       │  ← alleen als er een zak-datum is
│ Bak van: wo 17/09            │
│ Gebruiken t/m: di 22/09      │
└──────────────────────────────┘
```

- Géén "Bereid"-sticker: herkenbare eigen kop "BAIN-MARIE".
- "Bak van" = de startdag van de bak; "Gebruiken t/m" = startdag + houdbaarheid van dat product.
- "Zak ontdooid" verschijnt alleen bij producten met een vriezer-zak (Kip).
- Met drie datumregels worden de regels iets compacter zodat alles netjes past.

## Technisch
- Migratie op `bain_marie_bakken`: kolommen `ontdooid_datum date null` en `weggegooid_op date null`. Bestaande RLS en grants blijven ongewijzigd; niets wordt hard verwijderd (afsluiten = `actief = false` + `weggegooid_op = vandaag`).
- `src/hooks/useBainMarie.ts`: houdbaarheid per product als constante (kip 5, tom-yum 6, vissoep 6, ei 4 — kolom `houdbaarheid_dagen` blijft als toekomstige override); vlag `heeftVriesZak` (alleen kip); nieuwe mutatie `useGooiBainMarieWeg`; `useZetBainMarieStart` accepteert optioneel `ontdooidDatum` en zet `weggegooid_op` weer op null bij een nieuwe bak.
- `src/components/foh/BainMarie.tsx`:
  - Status houdt rekening met houdbaarheid per product.
  - `BainMarieOpen`: vervolgvraag "Datum op de zak?" alleen na "Vandaag" bij zak-producten; grijs "weggegooid"-chipje bij producten zonder actieve bak die recent zijn afgevoerd.
  - `BainMarieSluit`: printknop alleen vóór de laatste dag; op laatste dag / te oud een rode "Weggooien"-knop (destructief, met bevestiging) die de bak afsluit.
- `src/lib/labelZpl.ts`: type `bain` krijgt labels "Bak van" en optioneel "Zak ontdooid"; datumregels iets compacter voor drie regels.
- Infoteksten achter de info-iconen bijgewerkt.
- Geen nieuwe libraries; bestaande printflow (print jobs + bridge) blijft onaangeroerd.

## Verificatie
- Tomyum van maandag ingetoetst op vrijdag: sluitlijst toont rode "Weggooien"-knop, géén sticker.
- Na weggooien: open-lijst toont grijs "weggegooid"-chipje bij dat product.
- Kip op dag 3: sluitlijst print sticker met "Zak ontdooid", "Bak van", "Gebruiken t/m".
- Ei van 4 dagen geleden: laatste dag; op dag 5 "te oud".
- "Vandaag (nieuw)" bij Kip toont de zak-vraag; bij Vissoep/Tomyum/Ei niet.
