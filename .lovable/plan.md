# Bain-marie: dag bijhouden van bakken die meerdere dagen meegaan (kip/vissoep/tomyum/ei)

## Het probleem
Een gevacumeerde zak uit de koelcel wordt 's ochtends verwarmd en gaat in de au bain-marie. Gaat het product niet op, dan gaat de inhoud 's avonds in een plastic bak de koeling in. De volgende ochtend wordt die bak weer warm gemaakt — en dan moet je weten van welke dag hij is. Woensdag gestart en donderdag opnieuw warm gemaakt betekent: de bak is van woensdag, niet van donderdag.

Er zijn twee diensten in de keuken (start en sluit): wie sluit weet niet wanneer de bak is gestart, want de datum hangt nergens aan de plastic bak. Mondelinge overdracht is geen oplossing — dit moet standaard.

## Kern van de oplossing: niemand hoeft de datum te weten — de app weet hem en print hem
De app onthoudt per product de **startdatum** (de dag waarop de bak voor het laatst vers gevuld werd). Twee momenten:

**1. 's Ochtends (Open-lijst West, Keuken-sectie) — datum zetten, géén printer nodig:**

**"Kip — wat gaat er vandaag in de bain-marie?"** met twee knoppen:
- **"Nieuwe zak (van vandaag)"** → startdatum = vandaag.
- **"Opgewarmd van gisteren"** → startdatum blijft staan (bv. woensdag).

Wie de bak vult weet altijd of er een nieuwe zak open ging — daarom staat deze vraag in de ochtend. Er wordt 's ochtends niets geprint; dit is alleen het zetten van de datum.

**2. 's Avonds (sluitlijst, Keuken-sectie) — sticker printen voor de plastic bak:**

Een kopje **"Au bain-marie — sticker printen"** met per product één rij en één grote print-knop. De app vult de juiste datum in op de sticker; de afsluiter hoeft de datum niet te weten, hij plakt hem alleen op de plastic koelbak.

Daarmee is de dienstwisseling gedekt: de plastic bak in de koeling draagt altijd een sticker met de échte startdag. Niemand draagt iets mondeling over.

## Zo ziet het eruit

### 's Ochtends — Open-lijst, Keuken-sectie (West)
```text
┌──────────────────────────────────────────────────────┐
│ Au bain-marie — wat gaat er vandaag in?              │
│                                                      │
│ Kip                                                  │
│  [ Nieuwe zak (van vandaag) ]  [ Opgewarmd van gisteren ]
│  bak is nu van: woensdag                             │
│                                                      │
│ Vissoep                                              │
│  [ Nieuwe zak (van vandaag) ]  [ Opgewarmd van gisteren ]
│  bak is nu van: gisteren                             │
│  ⚠ bak van maandag is te oud — eerst weggooien       │
│                                                      │
│ Tomyum        (niets tikken = vandaag geen bak)      │
│ Ei            (niets tikken = vandaag geen bak)      │
└──────────────────────────────────────────────────────┘
```

### 's Avonds — Sluitlijst, Keuken-sectie (West)
```text
┌──────────────────────────────────────────────────────┐
│ Au bain-marie — sticker printen                      │
│ Sticker op de plastic bak plakken (koeling).         │
│                                                      │
│ Kip          bak van woensdag   [ Sticker printen ]  │
│ Vissoep      bak van dinsdag    [ Sticker printen ]  │
│ Tomyum       bak van vandaag    [ Sticker printen ]  │
│ Ei           vandaag niet gebruikt — geen sticker    │
│                                                      │
│ ✓ geprinte producten krijgen een vinkje              │
└──────────────────────────────────────────────────────┘
```

- Elke rij toont productnaam + de startdag die de app heeft (controle voor de afsluiter).
- Eén knop per rij van min. 44px: "Sticker printen". Na het printen een vinkje.
- Sticker inhoud: productnaam + startdag + houdbaar tot (bv. "Kip · van woensdag · houdbaar t/m vrijdag").
- Rij zonder bak vandaag ("Ei") toont dat neutraal — geen sticker, geen foutmelding.
- Is een bak te oud (buiten de houdbaarheid), dan staat dat in rood op de rij: "bak van maandag is te oud — weggooien".

## Twee opties (locatie van de info)

### Optie 1 — Ochtendvraag (datum) + sluitlijst-kopje (stickers) — aanbevolen
Zoals hierboven. Eén tik 's ochtends, één knop per product 's avonds. Stickerprint via de bestaande print bridge (dezelfde techniek als de "Ontdooid"-stickers, datum1/datum2).

- Betrouwbaar: wie vult weet of er een nieuwe zak open ging; wie afsluit plakt alleen een sticker die de app al heeft ingevuld.
- Zichtbaar: de datum hangt fysiek op de plastic bak — ook voor de volgende dienst.

### Optie 2 — Alleen in de app, geen sticker
Zelfde logica, maar geen print: de open-lijst van de volgende dag toont "Kip — bak van woensdag, dag 2", oranje na de houdbaarheid.

- Extra werk: iets minder, maar de plastic bak in de koeling is ongelabeld — precies het gat dat nu speelt bij dienstwisseling.

## Advies
**Optie 1.** De ochtendvraag is het betrouwbare moment om de datum te zetten; het sluitlijst-kopje maakt de sticker tot een vast, herkenbaar onderdeel van het afsluiten.

## Wat er concreet gebouwd wordt (bij keuze optie 1)
1. Bain-marie-producten (kip, vissoep, tomyum, ei) als rijen in de **Open-lijst** van West, Keuken-sectie, met de ochtendvraag (twee knoppen, geen typen).
2. Kopje **"Au bain-marie — sticker printen"** in de **sluitlijst** van West, Keuken-sectie, met per product: startdag + print-knop + vinkje na printen.
3. Per product een instelbare houdbaarheid in dagen in het voorraadbeheer; te oude bak krijgt een rode waarschuwing in ochtend én avond.
4. Verbinding met de keten: de zakken kip liggen al in de vriescel/koelcel-check (gevacumeerd, zoals döner). "Nieuwe zak" kan automatisch het koelcel-aantal verlagen, zodat voorraad en bain-marie niet uit elkaar lopen.

## Technisch (kort)
- Nieuwe kleine tabel `bain_marie_bakken` (product, startdatum, vestiging) of kolommen op `koelcel_check_items`; migratie via de databasetool met regel in `migratie_logboek`.
- Stickerprint hergebruikt de bestaande print-sticker-flow (datum1/datum2, print bridge) in `VoorraadRonde.tsx` / FohTasks — geen nieuwe printtechniek.
- Geen nieuwe libraries, geen RLS-wijzigingen op bestaande tabellen; nieuwe tabel krijgt RLS + GRANT.

## Praktijkcheck
- Wie: de ochtenddienst tikt één keer; de sluitdienst print en plakt. Op de iPad, grote knoppen, geen typen, geen hover.
- Printer stuk / geen wifi: de printopdracht blijft bewaard en print alsnog zodra de bridge bereikbaar is (bestaand retry-gedrag). De datum in de app blijft sowieso kloppen.
- Vergeten ochtendtik: geen tik = startdatum blijft staan — bij "zelfde bak doorwarmen" (het meest voorkomende geval) automatisch correct.
- Vergeten avondsticker: de ochtenddienst kan de sticker altijd opnieuw printen; de app weet de datum nog.
- Gesloten dag: geen open- of sluitlijst, geen sticker — klopt, want de bain-marie draait dan niet.
- Risico: iemand tikt "Nieuwe zak" terwijl de bak nog van gisteren was — dan verschuift de datum een dag. Dat is het enige foutmoment en kost maximaal één dag datumnauwkeurigheid; de ochtendcontext (zak open of niet) maakt deze fout onwaarschijnlijk.
