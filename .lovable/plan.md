# Bain-marie: dag bijhouden van bakken die meerdere dagen meegaan (kip/vissoep/tomyum/ei)

## Het probleem
Een gevacumeerde zak uit de koelcel wordt 's ochtends verwarmd en gaat in de au bain-marie. Gaat het product niet op, dan gaat de inhoud 's avonds in een plastic bak de koeling in. De volgende ochtend wordt die bak weer warm gemaakt — en dan moet je weten van welke dag hij is. Woensdag gestart en donderdag opnieuw warm gemaakt betekent: de bak is van woensdag, niet van donderdag.

Er zijn twee diensten in de keuken (start en sluit): wie sluit weet niet wanneer de bak is gestart, want de datum hangt nergens aan de plastic bak. Mondelinge overdracht is geen oplossing — dit moet standaard.

## Kern van de oplossing: niemand hoeft de datum te weten — de app weet hem en print hem
De app onthoudt per product de **startdatum** (de dag waarop de bak voor het laatst vers gevuld werd). Er zijn maar twee momenten, en op beide momenten weet de persoon ter plekke alleen het antwoord op één simpele vraag:

**1. 's Ochtends (Open-lijst West, Keuken-sectie) — bij het vullen:**

**"Kip — wat gaat er vandaag in de bain-marie?"**
- **"Nieuwe zak (van vandaag)"** → startdatum = vandaag, sticker print meteen mee.
- **"Opgewarmd van gisteren"** → startdatum blijft staan; sticker toont alsnog de oorspronkelijke dag, bv. "woensdag" terwijl het donderdag is.

**2. 's Avonds (sluitlijst, Keuken-sectie) — bij het wegzetten in de plastic bak:**

Eén knop: **"Sticker voor de koelbak"**. De app print een sticker met de startdatum die hij al weet — de afsluiter hoeft de datum niet te weten, hij plakt hem alleen op de plastic bak.

Daarmee is de dienstwisseling gedekt: de plastic bak in de koeling draagt altijd een sticker met de échte startdag. De ochtenddienst leest hem gewoon af. Niemand draagt iets mondeling over.

## Twee opties (locatie van de info)

### Optie 1 — Ochtend-vraag + avondsticker + datumsticker op de bak (aanbevolen)
Zoals hierboven: één tik in de ochtend, één knop in de avond, stickerprint via de bestaande print bridge (dezelfde techniek als de "Ontdooid"-stickers, datum1/datum2).

- Extra werk: één tik 's ochtends + één knop 's avonds (sticker plakken). Geen datums onthouden of opschrijven.
- Betrouwbaar: wie de bak vult weet altijd of er een nieuwe zak open ging; wie afsluit hoeft alleen een sticker te plakken die de app al heeft ingevuld.
- Zichtbaar: de datum hangt fysiek op de bak — ook voor de volgende dienst, ook voor iemand die de app niet open heeft.

### Optie 2 — Ochtend-vraag, sticker alleen 's ochtends
Zelfde logica, maar 's avonds geen sticker: de ochtenddienst ziet de datum alleen in de app ("Kip — bak van woensdag, dag 2", oranje na de houdbaarheid).

- Extra werk: iets minder, maar de plastic bak in de koeling is dan ongelabeld — precies het gat dat nu speelt bij dienstwisseling.

## Advies
**Optie 1.** De ochtend is het natuurlijke moment om te dateren (bak vullen = bak dateren), de avondsticker zorgt dat de datum met de plastic bak meereist naar de volgende dienst. De app draagt de datum, de stickers tonen hem.

## Wat er concreet gebouwd wordt (bij keuze optie 1)
1. Bain-marie-rijen (kip, vissoep, tomyum, ei — lijstje nog even checken) in de **Open-lijst** van West, Keuken-sectie, elke ochtend zichtbaar.
2. Per rij de ochtendvraag met twee knoppen (min. 44px tikdoelen, geen typen):
   - "Nieuwe zak (van vandaag)" → startdatum = vandaag, nieuwe sticker geprint.
   - "Opgewarmd van gisteren" → startdatum blijft, sticker opnieuw geprint met de bestaande startdatum.
   - Niets tikken = geen bak vandaag, geen sticker, startdatum blijft staan.
3. In de **sluitlijst** (Keuken-sectie) één knop per product: "Sticker voor de koelbak" — print de sticker met de opgeslagen startdatum, voor op de plastic bak die de koeling in gaat.
4. Per product een instelbare houdbaarheid in dagen in het voorraadbeheer; als de startdatum ouder is dan die termijn waarschuwt de ochtendvraag: "bak van <dag> is te oud — eerst weggooien".
5. Verbinding met de keten: de zakken kip liggen al in de vriescel/koelcel-check (gevacumeerd, zoals döner). "Nieuwe zak" kan automatisch het koelcel-aantal verlagen, zodat voorraad en bain-marie niet uit elkaar lopen.

## Technisch (kort)
- Nieuwe kleine tabel `bain_marie_bakken` (product, startdatum, vestiging) of kolommen op `koelcel_check_items`; migratie via de databasetool met regel in `migratie_logboek`.
- Stickerprint hergebruikt de bestaande print-sticker-flow (datum1/datum2, print bridge) in `VoorraadRonde.tsx` / FohTasks — geen nieuwe printtechniek, ochtend én avond gebruiken dezelfde flow.
- Geen nieuwe libraries, geen RLS-wijzigingen op bestaande tabellen; nieuwe tabel krijgt RLS + GRANT.

## Praktijkcheck
- Wie: de ochtenddienst vult en tikt; de sluitdienst drukt één knop en plakt. Op de iPad, grote knoppen, geen typen, geen hover.
- Printer stuk / geen wifi: de tik blijft bewaard en print alsnog zodra de bridge bereikbaar is (bestaand retry-gedrag). De datum in de app blijft sowieso kloppen.
- Vergeten avondsticker: de app weet de datum nog — de ochtenddienst kan hem altijd opnieuw printen. Geen data verloren.
- Vergeten ochtendtik: geen tik = geen wijziging; de startdatum blijft staan — bij "zelfde bak doorwarmen" (het meest voorkomende geval) automatisch correct.
- Gesloten dag: geen open- of sluitlijst, geen sticker — klopt, want de bain-marie draait dan niet.
- Risico: iemand tikt "Nieuwe zak" terwijl de bak nog van gisteren was — dan verschuift de datum een dag. Dat is het enige foutmoment en kost maximaal één dag datumnauwkeurigheid; de ochtendcontext (zak open of niet) maakt deze fout onwaarschijnlijk.
