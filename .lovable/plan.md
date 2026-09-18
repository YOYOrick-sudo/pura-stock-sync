# Bain-marie: dag bijhouden van bakken die meerdere dagen meegaan (kip/vissoep/tomyum/ei)

## Het probleem
Een gevacumeerde zak uit de koelcel wordt 's ochtends verwarmd en gaat in de au bain-marie. Gaat het product niet op, dan gaat de plastic bak 's avonds de koeling in. De volgende ochtend wordt dezelfde bak weer warm gemaakt — en nu moet je weten van welke dag hij is. Woensdag gestart en donderdag opnieuw warm gemaakt betekent: de bak is van woensdag, niet van donderdag. Niemand onthoudt dat betrouwbaar.

## Kern van de oplossing — de vraag staat in de ochtend
De bak krijgt zijn datum op het moment dat hij gevuld wordt, niet 's avonds. In de **Open-lijst van West (Keuken-sectie)** staat per bain-marie-product één vraag met twee grote knoppen:

**"Kip — wat gaat er vandaag in de bain-marie?"**
- **"Nieuwe zak (van vandaag)"** → de app zet de startdatum op vandaag en print meteen een sticker: product + echte startdag + houdbaar tot.
- **"Opgewarmd van gisteren"** → de startdatum blijft staan; de sticker toont alsnog de oorspronkelijke dag, bv. "woensdag" terwijl het donderdag is.

De app onthoudt per product de startdatum (de dag waarop de bak voor het laatst vers gevuld werd). Niemand hoeft een datum te onthouden of op te schrijven. De sticker zit op de bak, dus ook iemand die de app niet open heeft, ziet meteen van welke dag hij is.

**Geen avondstap meer.** De sluitlijst verandert niet; 's avonds is er niets extra te doen. Als er 's ochtends niets in de bain-marie gaat, tik je niets — dan verandert er ook niets.

## Twee opties (locatie van de info)

### Optie 1 — Ochtend-vraag + datumsticker (aanbevolen)
Zoals hierboven: één tik in de ochtend-lijst, sticker print direct mee via de bestaande print bridge (dezelfde techniek als de "Ontdooid"-stickers, datum1/datum2).

- Extra werk: één tik + sticker plakken, 's ochtends, op het moment dat je er toch mee bezig bent.
- Betrouwbaar: wie de bak vult weet altijd of er een nieuwe zak open ging — 's avonds is dat twijfelachtig.
- Zichtbaar: de datum hangt fysiek op de bak, voor iedereen.

### Optie 2 — Ochtend-vraag, alleen in de app
Zelfde logica, maar geen sticker: de open-lijst van de volgende dag toont "Kip — bak van woensdag (dag 2)", en na de instelbare houdbaarheid wordt de regel oranje: "weg gooien".

- Extra werk: iets minder (geen sticker plakken), maar de foutkans is groter: je ziet de datum alleen in de app, niet op de bak zelf.

## Advies
**Optie 1.** De ochtend is het natuurlijke moment (bak vullen = bak dateren), en de sticker maakt de datum zichtbaar buiten de app. De app draagt de datum, de sticker toont hem.

## Wat er concreet gebouwd wordt (bij keuze optie 1)
1. Bain-marie-rijen (kip, vissoep, tomyum, ei — lijstje nog even checken) in de **Open-lijst** van West, Keuken-sectie, elke ochtend zichtbaar.
2. Per rij de vraag met twee knoppen (min. 44px tikdoelen, geen typen):
   - "Nieuwe zak (van vandaag)" → startdatum = vandaag, nieuwe sticker geprint.
   - "Opgewarmd van gisteren" → startdatum blijft, sticker opnieuw geprint met de bestaande startdatum (op de bak die nu gevuld wordt).
   - Niets tikken = geen bak vandaag, geen sticker, startdatum blijft staan.
3. Per product een instelbare houdbaarheid in dagen in het voorraadbeheer; als de startdatum ouder is dan die termijn waarschuwt de ochtendvraag: "bak van <dag> is te oud — eerst weggooien".
4. Verbinding met de keten: de zakken kip liggen al in de vriescel/koelcel-check (gevacumeerd, zoals döner). "Nieuwe zak" kan automatisch het koelcel-aantal verlagen, zodat voorraad en bain-marie niet uit elkaar lopen.

## Technisch (kort)
- Nieuwe kleine tabel `bain_marie_bakken` (product, startdatum, vestiging) of kolommen op `koelcel_check_items`; migratie via de databasetool met regel in `migratie_logboek`.
- Stickerprint hergebruikt de bestaande print-sticker-flow (datum1/datum2, print bridge) in `VoorraadRonde.tsx` / FohTasks — geen nieuwe printtechniek.
- Geen nieuwe libraries, geen RLS-wijzigingen op bestaande tabellen; nieuwe tabel krijgt RLS + GRANT.

## Praktijkcheck
- Wie: wie 's ochtends de bain-marie vult in West, op de iPad in de open-lijst. Twee knoppen, geen typen, geen hover.
- Printer stuk / geen wifi: de tik blijft bewaard en print alsnog zodra de bridge bereikbaar is (bestaand retry-gedrag). De datum in de app blijft sowieso kloppen.
- Vergeten tik: geen tik = geen wijziging; de startdatum blijft staan — bij "zelfde bak doorwarmen" (het meest voorkomende geval) automatisch correct.
- Gesloten dag: geen open-lijst, geen sticker — klopt, want de bain-marie draait dan niet.
- Risico: iemand tikt "Nieuwe zak" terwijl de bak nog van gisteren was — dan verschuift de datum een dag. Dat is het enige foutmoment en kost maximaal één dag datumnauwkeurigheid; de ochtendcontext (zak open of niet) maakt deze fout onwaarschijnlijk.
