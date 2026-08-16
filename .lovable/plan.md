# Sluittaak West: afwasmeuk door de vaat (met foto)

## Wat er komt

Eén nieuwe taak in de sluitlijst van West, sectie **Samen / Laatste Loodjes**:

- **Titel:** `Afwasmeuk door de vaat`
- **Info-tekst:** "Het bakje met klein afwasgerei (schuursponsjes, borstels, rasp, doseerdoppen) bij de spoelbak leegmaken en alles door de vaatwasser halen. Bakje zelf ook schoonmaken."
- **Foto:** de geüploade foto van het witte bakje, aanklikbaar vanuit het info-icoon.

Suggestie voor volgorde: onderaan Laatste Loodjes, samen met de andere afsluitende schoonmaakacties.

## Foto in taken

Taken hebben nu alleen een tekstuele omschrijving (info-icoon → popup met tekst). Dit wordt uitgebreid:

- Info-popup toont bovenaan de foto (indien aanwezig) en daaronder de tekst.
- Klik/tik op de foto opent hem groot (full-screen overlay), zodat het team detail kan zien.
- Taken met foto krijgen een klein camera-icoontje naast het info-icoon, zodat zichtbaar is dat er beeld bij zit.

## Technisch

- Nieuwe kolom `foto_url text` op `foh_daily_templates` en `foh_tasks` (nullable, geen impact op bestaande taken).
- De foto wordt als CDN-asset opgeslagen (lovable-assets) en die URL komt in `foto_url` — geen storage-bucket of uploadflow nodig voor deze eerste taak.
- `FohTasks.tsx`: `foto_url` meenemen in select/insert/update-paden en in de info-popup renderen; nieuwe lichtgewicht lightbox-component.
- Template-editor: `foto_url` blijft behouden bij bewerken/opslaan (nog geen upload-UI in de admin — dat kan later als er meer foto-taken komen).
- Data: template invoegen voor West/sluit/samen/Laatste Loodjes én de taak voor vandaag aanmaken, zodat hij vanavond al in de lijst staat.

## Later (niet nu)

Upload-knop in de template-editor met een `foh-task-photos` bucket, zodat managers zelf foto's aan taken kunnen hangen.
