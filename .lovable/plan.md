## Categorieën per takenlijst (Openen / Tussen / Borrel / Sluiten)

### Gekozen aanpak (meest intuïtief + veilig, geen data verdwijnt)

- **Volledig apart per lijst.** Elke fase (Openen, Tussen, Borrel, Sluiten) krijgt zijn eigen set onderdelen met eigen volgorde. "Bar" in Openen is los van "Bar" in Sluiten — hernoemen/verwijderen raakt alleen die ene lijst.
- **Migratie behoudt alles.** Iedere bestaande volgorde-rij in `foh_category_order` wordt gekopieerd naar álle 4 de fasen, met dezelfde sort_order. Zo blijven de huidige 17 Midsland-onderdelen én de West-onderdelen zichtbaar in élke lijst. Jij ruimt daarna per lijst op wat je in die specifieke lijst niet wil.
- **Beheer verhuist naar de detailpagina van de lijst.** In `/taken/beheer?phase=…` komt onder de takenlijst het blok "Onderdelen van deze lijst". Overzichtspagina `/taken/admin` verliest het gedeelde onderdelen-blok (want dat is nu misleidend — het suggereert dat het voor alles geldt).

### Wat er verandert in de database

1. Kolom `phase text` toevoegen aan `foh_category_order`.
2. Backfill: voor elke bestaande rij → 4 nieuwe rijen (open/tussen/borrel/sluit) met dezelfde sort_order. Originele rij (phase = NULL) daarna verwijderen.
3. `phase NOT NULL` + nieuwe unique index `(location, department, phase, category)`.
4. RPC `foh_rename_category` uitbreiden met `_phase text` parameter. De rename update alleen `foh_tasks` en `foh_daily_templates` van díe fase, en alleen de order-rij van díe fase.

### Wat er verandert in de code

- `src/lib/foh-category-order.ts` — types en helpers krijgen een `phase`-dimensie. Queries in `FohTasks.tsx` en `TakenBeheer.tsx` filteren op de actieve fase.
- `src/components/foh/FohTasks.tsx` (7 raakpunten rond `foh_category_order`) — alle reads/writes krijgen `phase` erbij. Auto-seed van nieuwe categorie (bij aanmaken van een taak) gebeurt in de fase van die taak.
- `src/pages/TakenBeheer.tsx` — leest fase uit URL, dus filter meteen op `phase`. Voegt onderaan een blok "Onderdelen van deze lijst" toe (verplaatst uit `TakenAdmin`). Hernoemen/verwijderen/volgorde is per lijst.
- `src/pages/TakenAdmin.tsx` — het huidige "Onderdelen beheren"-blok wordt verwijderd. Op iedere lijstkaart komt een klein tellertje "N onderdelen" naast "N taken".

### Wat NIET verandert

- Geen bestaande taken worden aangeraakt, verplaatst of verwijderd.
- Geen templates worden aangepast.
- Categoriewaarden zelf (de tekst "Bar", "Keuken", enz.) blijven letterlijk staan; alleen de volgorde/aanwezigheid wordt per fase apart bijgehouden.
- Andere modules (Kassatelling, Onderhoud, HR, enz.) blijven ongemoeid.

### Risico's / bewuste keuzes

- Na migratie zie je in élke lijst dezelfde 17 (of 8 voor West) onderdelen — dat is expres, zodat niks "verdwijnt". Pas als jij ergens op "verwijderen" klikt, gaat het weg uit die specifieke lijst.
- Als in een lijst een taak bestaat met een categorie die daar (nog) niet in de order-tabel staat, wordt hij automatisch aangevuld op basis van gebruik (bestaande auto-seed-logica, nu per fase).
- Volgorde-wijzigingen in de ene lijst hebben géén effect op de andere lijsten.

### Verificatie na uitvoering

1. `/taken/admin` toont geen apart onderdelen-blok meer, per lijstkaart staat "X taken · Y onderdelen".
2. `/taken/beheer?phase=open` toont onderaan alleen de onderdelen van Openen; volgorde wijzigen daar → alleen Openen in `/taken-bediening` verandert.
3. In elke fase zijn de 17 Midsland-onderdelen initieel aanwezig, in dezelfde volgorde als nu.
4. Bestaande taken hebben nog steeds hun categorie; niks is doorgeschoven of gewist.
