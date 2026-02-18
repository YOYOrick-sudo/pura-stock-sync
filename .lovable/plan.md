

# Plan: Drie Aanpassingen aan Taken Bediening

## 1. Sidebar opschonen

Design System en HR Inbox worden verwijderd uit de navigatie in `AppSidebar.tsx`.

## 2. Nummering toevoegen aan dagelijkse taken (Open, Tussen, Sluit)

Elke taak in de dagelijkse lijsten krijgt een volgnummer (1, 2, 3...) voor de titel, zodat medewerkers de volgorde weten. Het nummer wordt gebaseerd op de positie binnen de categorie (Deel 1, Deel 2, etc.) en volgt de bestaande `sort_order`.

Dit wordt toegevoegd in het `SortableTaskItem` component of bij de render van de dagelijkse taken, als een subtiel grijs nummer voor de taaknaam.

## 3. Periodieke taken blijven altijd staan (niet archiveren)

**Probleem nu:** De client-side reset en de edge function archiveren alle taken waarvan `due_date < vandaag`. Periodieke taken (phase = null) worden daardoor ook verwijderd de dag erna.

**Oplossing:**

Periodieke taken moeten alleen verdwijnen als ze:
- Handmatig worden verwijderd (trash/swipe)
- Worden afgevinkt (completed)

Als de `due_date` verstreken is en de taak niet is afgevinkt, moet deze blijven staan met een subtiel "overtijd" visueel signaal (bijv. een oranje/rode datum-indicator).

### Technische wijzigingen

**A. `performClientSideReset()` in FohTasks.tsx (regel 930-935)**
- Archiveer alleen taken die een `phase` hebben (dagelijkse taken), niet periodieke taken (phase = null)
- Wijziging: voeg `.not('phase', 'is', null)` toe aan de archiveer-query

**B. Edge function `reset-daily-tasks/index.ts` (regel 42-49)**
- Zelfde aanpassing: archiveer alleen taken met een phase, niet periodieke taken
- Wijziging: voeg `.not('phase', 'is', null)` toe

**C. `fetchExtraTasks()` in FohTasks.tsx (regel 860-876)**
- Haal nu ook taken op met `due_date` in het verleden (verwijder geen filter op datum, alleen `archived: false`)
- Dit is al zo: de query filtert alleen op `archived: false` en `phase: null`, geen datum-filter. Dus dit is al correct.

**D. Visuele overtijd-indicator in periodieke taken-weergave (regel 2237+)**
- Als `due_date < vandaag` en `completed = false`: toon een subtiel overtijd-label (bijv. "2 dagen over" in een zachte rode/oranje kleur)
- De `formatDayHeader` functie en `getDateLabelColor` worden aangepast om verleden datums duidelijk te markeren

### Bestanden die worden aangepast

| Bestand | Wijziging |
|---------|-----------|
| `src/components/AppSidebar.tsx` | Design System en HR Inbox verwijderen |
| `src/components/foh/FohTasks.tsx` | Nummering toevoegen, archivering periodieke taken uitsluiten, overtijd-indicator |
| `supabase/functions/reset-daily-tasks/index.ts` | Archivering periodieke taken uitsluiten |

