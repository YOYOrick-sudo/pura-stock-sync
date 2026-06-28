## Plan

### 1. Nieuwe taak in West (openen, di+vr)
- Voeg toe aan `foh_daily_templates`: **"Plantjes water geven"**
  - `location` = West, `phase` = open, `department` = voorkant
  - `repeat_type` = weekly met **twee rijen** (één voor `day_of_week = 2` dinsdag, één voor `day_of_week = 5` vrijdag) — schema ondersteunt geen array, dus 2 templates is de schone oplossing
  - `category` = passende bestaande categorie (Bijvullen of Algemeen — kies bij implementatie de logisch passende voor West open voorkant)
  - `sort_order` = einde van categorie
- Als vandaag (zondag 28 juni) géén di/vr is wordt er niets voor vandaag aangemaakt — de bestaande `create_task_from_new_template` trigger respecteert dat al.

### 2. Stylish "herhalend"-badge door de hele app
Eén herbruikbare component `RepeatBadge` (`src/components/foh/RepeatBadge.tsx`):

```
┌─────────────────────┐
│ ↻  di · vr          │   ← subtiele pill
└─────────────────────┘
```

- Stijl: `bg-muted` (≈ #F3F4F6), `text-muted-foreground` (≈ #6B7280), kleine `Repeat` lucide-icon, primary-green accent op het icoon bij hover.
- Toont:
  - bij `repeat_type = 'weekly'` + `day_of_week` → korte dagcode (`ma di wo do vr za zo`)
  - bij meerdere templates met dezelfde titel (zoals di+vr) → samenvoegen tot `di · vr`
  - bij `repeat_type = 'daily'` → tekst "dagelijks"
- Wordt gebruikt in:
  - `SortableTaskItem` (dagelijkse takenlijst) — naast taaktitel
  - Template-editor lijst in Admin (West én Midsland)
  - Periodieke takenlijst (waar nu al een datum staat)

### 3. Aggregatie-logica
Omdat di+vr nu twee aparte templates worden, voeg in `FohTasks.tsx` een helper toe die templates/tasks met dezelfde titel + zelfde phase + zelfde department samenvoegt **alleen voor de badge** (taken zelf blijven los per dag). Voor `foh_tasks` van vandaag is dit niet nodig (er is maar één per dag).

### Technische details
- Migration: 2× `INSERT` in `foh_daily_templates` voor West.
- Nieuw component `RepeatBadge` met props `{ repeatType, daysOfWeek: number[] }`.
- Helper `groupRepeatDays(templates)` in `FohTasks.tsx` om di+vr-paar te detecteren.
- Geen breaking changes; alle bestaande taken zonder repeat blijven exact zoals nu.