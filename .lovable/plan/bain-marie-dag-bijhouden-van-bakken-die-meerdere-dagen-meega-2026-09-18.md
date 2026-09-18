# Bain-marie: dag bijhouden van bakken die meerdere dagen meegaan (kip/vissoep/tomyum/ei)

## Het probleem
Een gevacumeerde zak uit de koelcel wordt verwarmd en gaat in de au bain-marie. Gaat het product niet op, dan gaat de inhoud 's avonds in een plastic bak de koeling in. De volgende dag wordt die bak weer warm gemaakt — en dan moet je weten van welke dag hij is. Woensdag gestart en donderdag opnieuw warm gemaakt betekent: de bak is van woensdag, niet van donderdag.

Er zijn twee diensten in de keuken (start en sluit): wie sluit weet niet wanneer de bak is gestart, want de datum hangt nergens aan de plastic bak. Mondelinge overdracht is geen oplossing — dit moet standaard.

## Kern van de oplossing — zo simpel mogelijk
1. **Bij openen noteer je alleen welke datum op de bak staat** (die lees je van de sticker van gisteravond). Tikken, geen typen, geen vragen beantwoorden.
2. **Bij sluiten print je de sticker voor de plastic koelbak** — de app zet de juiste datum erop, de afsluiter hoeft hem niet te weten.
3. **Alles is maximaal 5 dagen houdbaar.** De app rekent mee: dag 1 = startdag, dag 5 = laatste dag. Op dag 5 waarschuwt de app oranje ("vandaag laatste dag"), daarna rood ("weggooien"). Dus: 4 keer opgewarmd kan nog een 5e keer, en daarna moet hij weg.

De app onthoudt de startdatum per product. Niemand hoeft een datum te onthouden, opschrijven of doorschrijven naar de volgende dienst — de sticker op de bak draagt hem.

## Zo ziet het eruit

### Bij openen — Open-lijst West, Keuken-sectie
```text
┌──────────────────────────────────────────────────────────────┐
│ Au bain-marie — welke datum staat op de bak?                 │
│                                                              │
│ Kip          [ Vandaag (nieuw) ] [ do ] [ wo ] [ di ] [ ma ] │
│              bak van woensdag · dag 2 van 5                  │
│                                                              │
│ Vissoep      [ Vandaag (nieuw) ] [ do ] [ wo ] [ di ] [ ma ] │
│              bak van maandag · ⚠ te oud — weggooien          │
│                                                              │
│ Tomyum       [ Vandaag (nieuw) ] [ do ] [ wo ] [ di ] [ ma ] │
│              vandaag geen bak — niets tikken is ook prima    │
│                                                              │
│ Ei           [ Vandaag (nieuw) ] [ do ] [ wo ] [ di ] [ ma ] │
└──────────────────────────────────────────────────────────────┘
```

- Per product één rij dag-knoppen: "Vandaag (nieuw)" of de dagnaam die op de sticker staat (gisteren, 2 dagen geleden, ...). De app rekent de dagnaam om naar de echte datum.
- Eén tik per product — of niets tikken als er vandaag geen bak is.
- Direct zichtbaar: "bak van woensdag · dag 2 van 5 · houdbaar t/m zondag".
- **Dag 5**: oranje "vandaag laatste dag". **Ouder dan 5 dagen**: rood "te oud — weggooien", met daarnaast de knop "Vandaag (nieuw)" om te herstellen.

### Bij sluiten — Sluitlijst West, Keuken-sectie
```text
┌──────────────────────────────────────────────────────────────┐
│ Au bain-marie — sticker printen                              │
│ Sticker op de plastic bak plakken (koeling).                 │
│                                                              │
│ Kip          bak van woensdag   [ Sticker printen ]          │
│ Vissoep      bak van dinsdag    [ Sticker printen ]          │
│ Tomyum       bak van vandaag    [ Sticker printen ]          │
│ Ei           vandaag niet gebruikt — geen sticker            │
│                                                              │
│ ✓ geprinte producten krijgen een vinkje                      │
└──────────────────────────────────────────────────────────────┘
```

- Kopje "Au bain-marie — sticker printen" met alle vier de producten eronder, elk met één grote print-knop (min. 44px).
- Elke rij toont de startdag die de app heeft (controle voor de afsluiter); na printen een vinkje.
- Sticker inhoud: productnaam + startdag + houdbaar tot, bv. "Kip · van woensdag · houdbaar t/m zondag".
- Rij zonder bak vandaag toont dat neutraal — geen sticker, geen foutmelding.

## Twee opties

### Optie 1 — Datum noteren bij openen + sticker printen bij sluiten (aanbevolen)
Zoals hierboven. Stickerprint via de bestaande print bridge (dezelfde techniek als de "Ontdooid"-stickers, datum1/datum2).

- Extra werk: één tik per product 's ochtends, één knop per product 's avonds. Geen vragen, geen typen.
- Zichtbaar: de datum hangt fysiek op de plastic bak — ook voor de volgende dienst.

### Optie 2 — Alleen in de app, geen sticker
Zelfde logica, maar geen print: de open-lijst van de volgende dag toont "Kip — bak van woensdag, dag 2 van 5", oranje op dag 5.

- Extra werk: iets minder, maar de plastic bak in de koeling is ongelabeld — precies het gat dat nu speelt bij dienstwisseling.

## Advies
**Optie 1.** De sticker maakt de datum zichtbaar buiten de app en is het startpunt van de volgende ochtend (je leest hem gewoon af). De app rekent de 5-daagse houdbaarheid door.

## Wat er concreet gebouwd wordt (bij keuze optie 1)
1. Bain-marie-blok (kip, vissoep, tomyum, ei) in de **Open-lijst** van West, Keuken-sectie: per product dag-knoppen om de datum op de bak te noteren.
2. Kopje **"Au bain-marie — sticker printen"** in de **sluitlijst** van West, Keuken-sectie: per product startdag + print-knop + vinkje na printen.
3. Vaste houdbaarheid van **5 dagen** (per product overschrijfbaar in het voorraadbeheer); oranje waarschuwing op de laatste dag, rood "weggooien" erna.
4. Verbinding met de keten: de zakken kip liggen al in de vriescel/koelcel-check (gevacumeerd, zoals döner). "Vandaag (nieuw)" kan automatisch het koelcel-aantal verlagen, zodat voorraad en bain-marie niet uit elkaar lopen.

## Technisch (kort)
- Nieuwe kleine tabel `bain_marie_bakken` (product, startdatum, vestiging) of kolommen op `koelcel_check_items`; migratie via de databasetool met regel in `migratie_logboek`.
- Stickerprint hergebruikt de bestaande print-sticker-flow (datum1/datum2, print bridge) in `VoorraadRonde.tsx` / FohTasks — geen nieuwe printtechniek.
- Geen nieuwe libraries, geen RLS-wijzigingen op bestaande tabellen; nieuwe tabel krijgt RLS + GRANT.

## Praktijkcheck
- Wie: de ochtenddienst tikt één keer per product; de sluitdienst print en plakt. Op de iPad, grote knoppen, geen typen, geen hover.
- Printer stuk / geen wifi: de printopdracht blijft bewaard en print alsnog zodra de bridge bereikbaar is (bestaand retry-gedrag). De datum in de app blijft sowieso kloppen.
- Vergeten ochtendtik: geen tik = startdatum blijft staan — bij "zelfde bak doorwarmen" (het meest voorkomende geval) automatisch correct.
- Vergeten avondsticker: de ochtenddienst kan de sticker altijd opnieuw printen; de app weet de datum nog.
- Gesloten dag: geen open- of sluitlijst; de app rekent de houdbaarheid door over gesloten dagen heen (kalenderdagen, geen open-dagen) — een bak van woensdag is op maandag dag 5, ook als het weekend dicht was. Dit is bewust: koudbewaring stopt niet met tellen.
- Risico: iemand tikt een verkeerde dagknop — de getoonde dag ("bak van woensdag") maakt dat meteen zichtbaar en corrigeerbaar met één tik.
