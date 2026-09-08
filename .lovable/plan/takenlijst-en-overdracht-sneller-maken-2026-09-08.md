# Takenlijst en overdracht sneller maken

## Wat ik heb gemeten (geen aannames)

- De database-schijf zit op **84% vol**: 6,3 GB daarvan is één logboektabel van de geplande taken (`cron.job_run_details`), die nooit wordt opgeruimd. Alle overige data samen is ongeveer 60 MB. Een volle, zware database maakt álles trager — dus ook de takenlijst en de overdracht.
- De **printbrug vraagt onafgebroken** of er iets te printen valt: 1,7 miljoen aanvragen, samen goed voor ruim 20 minuten pure databasetijd — veruit de zwaarste belasting van het systeem.
- **`foh_tasks` bevat 47.772 regels**, waarvan 47.443 gearchiveerd (vanaf 8 november 2025). Slechts 139 horen bij vandaag. Twee veelgebruikte bevragingen op deze tabel duren gemiddeld 86 ms en 122 ms, met uitschieters tot 780 ms; de opruimactie ("archiveren") piekt op 2,6 seconden.
- De tabel is sinds 23 augustus niet meer schoongemaakt en heeft ~6.000 dode regels; de statistieken zijn verouderd, waardoor de database soms een trage route kiest.
- **Overdracht zelf is niet traag door eigen data**: `handover_memos` heeft 668 regels en een passende index. De traagheid daar komt van de algemene databasedruk hierboven.

Kortom: dit is geen los bug in de takenlijst of de overdracht, maar overbelasting van de gedeelde database. Dat is goed te verhelpen met weinig risico.

## Wat ik ga doen (in deze volgorde, van veilig naar effectief)

1. **Logboek van geplande taken opruimen en automatisch schoonhouden**
   Alles ouder dan 7 dagen weggooien en een dagelijkse opruimtaak toevoegen. Dit zijn puur technische uitvoerlogs, geen bedrijfsdata. Verwacht: schijfgebruik van 84% terug naar enkele procenten.

2. **Takentabel opschonen en bijwerken**
   Dode regels opruimen en statistieken verversen (`VACUUM ANALYZE`). Geen enkele taak verandert, alleen onderhoud.

3. **Oude taken uit de werktabel halen**
   Gearchiveerde taken ouder dan 90 dagen verhuizen naar een geschiedenistabel (`foh_tasks_archief`). Niets wordt hard verwijderd — de historie blijft opvraagbaar. De dagelijkse lijst werkt dan met een paar honderd regels in plaats van bijna 48.000.

4. **Index toevoegen voor de dagelijkse lijst**
   Eén index op locatie + datum + archiefstatus + volgorde, precies passend bij de bevraging die de tablets doen. Maakt lezen sneller, schrijven verwaarloosbaar langzamer.

5. **Printbrug rustiger laten pollen**
   De printbrug hoeft niet elke paar seconden te vragen. Ik verhoog het interval en laat de printstatus in de app alleen verversen wanneer het scherm zichtbaar is. Printen blijft werken; een sticker komt hooguit enkele seconden later uit de printer.

6. **Meten na afloop**
   Ik lees de trage-queryteller opnieuw uit en vergelijk gemiddelde tijden, en doe een klikronde op de takenlijst (beide vestigingen) en het dashboard met overdracht.

## Risico's, eerlijk

- Stap 1 en 2 zijn onderhoud zonder gevolgen voor de app.
- Stap 3 is de enige die data verplaatst. Daarom: alleen gearchiveerde taken ouder dan 90 dagen, kopiëren vóór verwijderen, in één transactie, en de aantallen vóór en na worden gerapporteerd. Vandaag en de recente weken blijven onaangeroerd.
- Stap 5 verandert alleen de frequentie, niet de printflow zelf. Als een sticker traag lijkt, is het interval terug te draaien met één getal.
- Wat dit **niet** oplost: als de app zelf vastloopt op een tablet door een slechte wifi-verbinding. Dat is een apart spoor.

## Techniek

- Migratie: `DELETE FROM cron.job_run_details WHERE end_time < now() - interval '7 days'` + dagelijkse `cron.schedule` opruimtaak.
- `VACUUM (ANALYZE) public.foh_tasks` (buiten transactie, via SQL-run, niet als migratie).
- `CREATE TABLE public.foh_tasks_archief (LIKE public.foh_tasks INCLUDING ALL)` + RLS + GRANT (`authenticated` lezen via managerrol, `service_role` alles), daarna verplaatsing met `WITH moved AS (DELETE ... RETURNING *) INSERT ...`.
- `CREATE INDEX idx_foh_tasks_dag ON public.foh_tasks (location, due_date, archived, sort_order) WHERE archived = false;`
- Frontend: `usePrintStatus` krijgt `refetchIntervalInBackground: false` en een langer interval; printbrug-polling in `supabase/functions/print-bridge` / de Pi-kant alleen in interval aanpassen indien daar aanstuurbaar.
- Geen nieuwe pakketten, geen wijziging aan routes of rollen.
