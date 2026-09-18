# Bain-marie: dag bijhouden van teruggezette producten (vissoep, tomyum, ei)

## Het probleem
Aan het einde van de dag gaan vissoep, tomyum en het ei uit de au bain-marie in een plastic bak de koeling in. De volgende dag weet niemand meer van welke dag de bak is — de shifts wisselen, dus opschrijven op papier gaat mis. Twee opties die passen in wat er al is.

## Optie 1 — Datumsticker bij het terugzetten (aanbevolen)
Vissoep, tomyum en ei komen als rijen in de sluitlijst/voorraadronde van West, met één actie: **"Teruggezet in bak"**. Tik je die aan, dan print de labelprinter automatisch een sticker met productnaam + datum van vandaag (+ houdbaarheidsdatum). Dezelfde techniek als de "Ontdooid"-stickers die nu al printen bij de vriescel — die flow werkt al.

- Extra werk: één tik + sticker op de bak plakken. Geen schrijven, geen nieuwe gewoonte.
- De stickerprinter staat er al; er komt niets nieuws bij.
- Betrouwbaar: wie de sluitlijst doet, drukt op de knop — de datum kan niet verkeerd gaan.

## Optie 2 — Dagtelling in de app (zonder sticker)
De bak komt als item in de voorraadronde met een datumbijhouding: de app onthoudt wanneer de bak voor het laatst "vers in de bain-marie" ging. In de open-lijst van de volgende dag staat dan bijvoorbeeld "Vissoep — dag 2", en na een vast aantal dagen (bijv. 2 of 3) wordt de regel oranje: "weg gooien / vervangen".

- Extra werk: geen sticker plakken, maar wél elke dag aangeven "zelfde bak" of "nieuwe bak".
- Foutgevoeliger: als iemand vergeet te tikken, klopt de dagtelling niet meer. En je ziet het alleen in de app, niet op de bak zelf.

## Advies
**Optie 1.** De sticker zit fysiek op de bak — iedereen ziet het, ook wie de app niet open heeft. Het kost één tik extra in een lijst die toch al wordt doorlopen, en gebruikt de printerflow die al werkt. Optie 2 kan er eventueel later bij als controlemiddel, maar is op zichzelf minder betrouwbaar.

## Wat er concreet gebouwd wordt (bij keuze optie 1)
1. Drie rijen in de sluitlijst/voorraadronde van West (bain-marie: vissoep, tomyum, ei) met actie "Teruggezet in bak" → print sticker (naam + datum vandaag + houdbaar tot), hergebruik van de bestaande `printOntdooid`-flow.
2. Per product een instelbare houdbaarheid (aantal dagen) in het voorraadbeheer, zodat "houdbaar tot" klopt.
3. De rijen zijn geen telregels (niets te tellen), alleen een bevestig-taak met sticker — ze verschijnen elke sluitdienst.

## Technisch (kort)
- Hergebruik: `printOntdooid` in `VoorraadRonde.tsx` (datum1/datum2 via print bridge) — geen nieuwe printtechniek.
- `koelcel_check_items`: drie nieuwe rijen, bijv. bron `bain_marie` (of hergebruik bestaande bron + vlag), met houdbaarheid in dagen. Migratie via de databasetool, regel in `migratie_logboek`.
- Geen RLS-wijzigingen nodig (bestaande tabel), geen nieuwe libraries.

## Praktijkcheck
- Wie: wie de sluitlijst doet in West, op de iPad, staand. Eén knop van 44px, geen typen.
- Printer stuk / geen wifi: de bevestiging blijft staan als "niet gesynchroniseerd" (bestaande retry), en de print komt alsnog zodra de bridge weer bereikbaar is — zoals nu bij Ontdooid-stickers.
- Gesloten dag: geen sluitlijst, geen sticker — klopt, want er is dan ook geen bain-marie geweest.
- Risico: als iemand de tik doet maar de sticker niet plakt, is er geen label. Dat is de menselijke stap die bij elke oplossing blijft; de sticker in de hand direct na de tik minimaliseert dat.
