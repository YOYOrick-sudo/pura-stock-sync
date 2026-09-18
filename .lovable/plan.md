# Bain-marie: dag bijhouden van bakken die meerdere dagen meegaan (kip/vissoep/tomyum/ei)

## Het probleem
Een gevacumeerde zak uit de koelcel wordt verwarmd en gaat in de au bain-marie. Gaat het product niet op, dan gaat de plastic bak 's avonds de koeling in. De volgende dag wordt dezelfde bak weer warm gemaakt — en nu moet je weten van welke dag hij is. Woensdag gestart en donderdag opnieuw warm gemaakt betekent: de bak is van woensdag, niet van donderdag. Wie 's avonds afsluit weet dat niet meer, want de bak wordt overdag niet bewaard met een label.

## Kern van de oplossing
Niemáánaal hoeft de startdatum te onthouden. De app onthoudt per bain-marie-product de **startdatum** (datum waarop de bak voor het laatst vers gevuld werd). Bij het afsluiten beantwoord je alleen één vraag:

**"Is er vandaag nieuwe bij gekomen uit een zak?" → Ja / Nee**

- **Ja** → startdatum wordt vandaag, er print een nieuwe sticker met vandaag als datum.
- **Nee** → startdatum blijft staan; de sticker (opnieuw geprint) toont alsnog de oorspronkelijke dag, bv. "woensdag" terwijl het donderdag is.

De sticker op de bak toont dus altijd de échte startdag — ook al is hij al twee keer opgewarmd. Wie de volgende ochtend de bak pakt, ziet meteen: "van woensdag".

## Twee opties

### Optie 1 — Startdatum in de app + datumsticker (aanbevolen)
Vissoep, tomyum, ei en kip komen als rijen in de sluitlijst/voorraadronde van West met de ja/nee-vraag hierboven. De app onthoudt de startdatum per product; elke avond print de labelprinter een sticker met productnaam + startdag + houdbaar tot (instelbaar, bv. 3 dagen). Dezelfde printtechniek als de bestaande "Ontdooid"-stickers (datum1/datum2 via de print bridge) — die flow werkt al.

- Extra werk: één tik (ja/nee) + sticker plakken. Niemand hoeft een datum te kennen of schrijven.
- Betrouwbaar: de app weet de datum, de mens hoeft alleen te weten of er vandaag een nieuwe zak open ging — dat weet je altijd.
- Sticker op de bak = zichtbaar voor iedereen, ook wie de app niet open heeft.

### Optie 2 — Alleen in de app, zonder sticker
Zelfde startdatum-logica, maar geen sticker: in de open-lijst van de volgende dag staat "Kip — bak van woensdag (dag 2)", en na de instelbare houdbaarheid wordt de regel oranje: "weg gooien".

- Extra werk: iets minder (geen sticker plakken), maar de foutkans is groter: wie de tik vergeet, klopt de dagtelling niet meer, en je ziet het alleen in de app — niet op de bak zelf.

## Advies
**Optie 1.** De sticker zit fysiek op de bak, de app draagt de datum — samen dekt het precies het probleem "je weet niet van welke dag het is". Het kost één tik in een lijst die toch al wordt doorlopen.

## Wat er concreet gebouwd wordt (bij keuze optie 1)
1. Bain-marie-rijen (kip, vissoep, tomyum, ei — lijstje nog even checken) in de sluitlijst van West, elke sluitdienst zichtbaar.
2. Per rij de vraag "Nieuwe zak van vandaag? Ja / Nee":
   - Ja → startdatum = vandaag, nieuwe sticker geprint (product + datum + houdbaar tot).
   - Nee → startdatum blijft, sticker wordt opnieuw geprint met de bestaande startdatum (op de nieuwe bak, want de oude plastic bak blijft niet bewaard met label).
3. Per product een instelbare houdbaarheid in dagen in het voorraadbeheer; na die tijd waarschuwt de ronde: "bak van <datum> is te oud — weggooien".
4. Verbinding met de keten: de zakken kip liggen al in de vriescel/koelcel-check (gevacumeerd, zoals döner). De vraag "nieuwe zak?" kan automatisch het koelcel-aantal verlagen, zodat voorraad en bain-marie niet uit elkaar lopen.

## Technisch (kort)
- Nieuwe kleine tabel `bain_marie_bakken` (product, startdatum, vestiging) of twee kolommen op `koelcel_check_items`; migratie via de databasetool met regel in `migratie_logboek`.
- Stickerprint hergebruikt `printOntdooid`-flow in `VoorraadRonde.tsx` (datum1/datum2, print bridge) — geen nieuwe printtechniek.
- Geen nieuwe libraries, geen RLS-wijzigingen op bestaande tabellen; nieuwe tabel krijgt RLS + GRANT.

## Praktijkcheck
- Wie: wie de keuken afsluit in West, op de iPad. Twee knoppen van 44px (Ja/Nee), geen typen.
- Printer stuk / geen wifi: de tik blijft bewaard en print alsnog zodra de bridge bereikbaar is (bestaand retry-gedrag). De datum in de app blijft sowieso kloppen.
- Vergeten tik: geen tik = geen wijziging; de startdatum blijft dan staan, wat bij "zelfde bak doorwarmen" (het meest voorkomende geval) automatisch correct is.
- Gesloten dag: geen sluitlijst, geen sticker — klopt, want de bain-marie draait dan niet.
- Risico: iemand tikt "Ja" terwijl er geen nieuwe zak open ging — dan verschuift de datum een dag. Dat is het enige foutmoment, en het kost maximaal één dag datumnauwkeurigheid.
