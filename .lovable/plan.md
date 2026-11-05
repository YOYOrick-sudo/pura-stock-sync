# Sjabloonwijzigingen direct zichtbaar in de takenlijst van vandaag

## Wat er nu gebeurt
Alleen een **nieuw** sjabloon zet meteen een taak voor vandaag klaar. Wijzig je een bestaand sjabloon (titel, volgorde, categorie, fase, minuten, uitleg, afdeling) of zet je het uit, dan verandert de lijst van vandaag niet; dat gebeurt pas bij de nieuwe lijst van morgen 05:00.

## Wat er verandert
Bij elke aanpassing in Templates Beheren wordt de lijst van **vandaag** (zelfde locatie) direct bijgewerkt, alleen voor **onvoltooide** taken:
- Gewijzigd sjabloon: de open taak van vandaag krijgt de nieuwe titel, volgorde, categorie, fase, minuten, uitleg en afdeling.
- Sjabloon uitgezet of gearchiveerd: de open taak van vandaag wordt gearchiveerd (niet verwijderd).
- Sjabloon weer aangezet, of verschoven naar de weekdag van vandaag, terwijl er vandaag nog geen taak bestaat: de taak wordt alsnog voor vandaag klaargezet.
- Weekdag verschoven weg van vandaag: de open taak van vandaag wordt gearchiveerd.

Afgevinkte taken blijven altijd ongemoeid (historie). Periodieke taken zonder fase en andere dagen worden niet aangeraakt. Realtime zorgt dat alle tablets het meteen zien.

## Praktijk en risico's
- Je ziet je aanpassing direct als open taak; geen herladen of wachten tot morgen.
- Risico: een taak die een collega net aan het afvinken is, kan van titel veranderen. Laag risico, de afvinkstatus blijft.
- Bestaande geplande generatie (05:00) en reset blijven ongewijzigd.

## Technisch
- Migratie: nieuwe trigger `AFTER UPDATE ON foh_task_templates` met SECURITY DEFINER functie; match op `template_id`, `location`, `due_date = vandaag (Europe/Amsterdam)`, `completed = false`, niet gearchiveerd.
- Insert-pad hergebruikt de logica van `create_task_from_new_template` (incl. weekdagcheck), met bestaanscheck om duplicaten te voorkomen.
- Eerst schema-check van `foh_tasks`/`foh_task_templates` kolommen (completed/archived) vóór schrijven.
- Test via transactie met rollback; geen testregels in echte tabellen. Niet publiceren.
