

# Plan: Wekelijkse taken (zondag + woensdag)

## Wat wordt er gedaan

Drie taken worden alleen op specifieke dagen gegenereerd:

**Zondag (sluitlijst):**
1. Schrobben achter bar
2. Alles FIFO: Melk, bieren en fris

**Woensdag (openlijst):**
3. Aquafabe verversen en hervullen in het rode flesje
   - Met beschrijving (info-icoon): "Gooi de oude weg, en vul nieuwe aan vanuit de vriezer. Zet de aquafabe dan in de barkoeling en niet erbuiten."

## Aanpak

Er is momenteel geen ondersteuning voor wekelijkse taken. Het systeem kent alleen `repeat_type: 'daily'`. Er moet een `day_of_week` kolom komen zodat templates aan specifieke dagen gekoppeld kunnen worden.

### Stap 1: Database migratie

- Kolom `day_of_week` (integer, nullable) toevoegen aan `foh_daily_templates`
  - 0 = zondag, 1 = maandag, ..., 3 = woensdag, ..., 6 = zaterdag
- Drie templates inserten:

| Taak | Phase | Category | repeat_type | day_of_week | sort_order |
|------|-------|----------|-------------|-------------|------------|
| Schrobben achter bar | sluit | BAR | weekly | 0 | 640 |
| Alles FIFO: Melk, bieren en fris | sluit | BIJVULLEN (FIFO) | weekly | 0 | 650 |
| Aquafabe verversen en hervullen in het rode flesje | open | Deel 3 | weekly | 3 | 370 |

De aquafabe-taak krijgt ook een `description` veld voor het info-icoon.

### Stap 2: Edge function aanpassen (`reset-daily-tasks/index.ts`)

Naast dagelijkse templates ook wekelijkse ophalen:
- Query toevoegen: `repeat_type = 'weekly' AND day_of_week = huidige_dag`
- Beide sets samenvoegen voor taakgeneratie

### Stap 3: Client-side generatie aanpassen (`FohTasks.tsx`)

De `generateDailyTasks()` functie doet dezelfde logica client-side als fallback. Hier ook:
- Wekelijkse templates ophalen gefilterd op de huidige dag van de week
- Samenvoegen met dagelijkse templates

### Stap 4: Template query aanpassen

De admin template-query filtert nu op `repeat_type = 'daily'`. Dit aanpassen zodat wekelijkse templates ook zichtbaar zijn in de template-editor.

## Technische details

### Bestanden die worden aangepast

| Bestand | Wijziging |
|---------|-----------|
| Database migratie | `day_of_week` kolom + 3 nieuwe templates |
| `supabase/functions/reset-daily-tasks/index.ts` | Weekly templates meenemen bij generatie |
| `src/components/foh/FohTasks.tsx` | `generateDailyTasks()` + template query aanpassen |

### Trigger `create_task_from_new_template`

De bestaande trigger maakt automatisch een taak aan bij INSERT van een template. Voor wekelijkse templates moet de trigger checken of het vandaag de juiste dag is. De trigger wordt aangepast:
- Als `repeat_type = 'weekly'`, alleen een taak aanmaken als `day_of_week` overeenkomt met de huidige dag (Amsterdam tijd)

