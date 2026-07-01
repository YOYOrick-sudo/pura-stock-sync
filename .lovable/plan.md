# Borrel-prep fase — Midsland

Nieuwe fase `borrel` naast `open`, `tussen`, `sluit`. Alleen zichtbaar voor Midsland; West blijft ongewijzigd (alleen open + sluit). Eén losse lijst zonder categorieën, geen automatische tijd-selectie — medewerker kiest de tab handmatig.

## Wat er verandert

**Database**
- Check-constraints op `foh_tasks.phase` en `foh_daily_templates.phase` uitbreiden met `'borrel'`.
- Bestaande dagelijkse-reset / template-triggers werken al generiek per phase, dus geen extra triggers nodig.
- Geen seed-taken; jij vult borrel-prep lijst zelf via de admin.

**Takenlijst UI (`FohTasks.tsx`)**
- `getPhasesForLocation('Midsland')` → `['open','tussen','borrel','sluit']`. West blijft `['open','sluit']`.
- Tab-label "Borrel-prep" met eigen icoon (wijnglas).
- Geen categorie-groepering voor borrel: alle taken als één platte lijst (zoals West nu al kan).
- Auto-phase-selectie op basis van tijd: borrel wordt overgeslagen (jij tikt handmatig). Openen blijft default.
- Progress-teller, admin-wachtwoord (2017), dag-navigator werken automatisch mee.

**Admin / Beheer (`TakenBeheer.tsx` + `ListManager.tsx`)**
- Phase-selector krijgt "Borrel-prep" optie voor Midsland.
- `phaseLabel('borrel') → 'Borrel-prep'`.
- Voor borrel: categorie-veld verborgen/optioneel (default `'Borrel'` zodat sortering werkt maar er geen groepskoppen tonen).
- Actieve-lijst-trigger (`foh_enforce_single_active_template`) werkt al per phase — geen wijziging.

**Niet aangeraakt**
- West UI, waste-generator, edge functions, kassa, recepten.

## Technisch

```text
phase enum uitbreiding
 ├─ foh_tasks_phase_check       → open | tussen | borrel | sluit | NULL
 └─ foh_daily_templates_phase_check → open | tussen | borrel | sluit

PHASE_WINDOWS: geen entry voor borrel (auto-select skipt hem)
PhaseType = 'open' | 'tussen' | 'borrel' | 'sluit'
phaseLabel('borrel') = 'Borrel-prep'
getPhasesForLocation('Midsland') = ['open','tussen','borrel','sluit']
```

Na goedkeuring migratie: TS-types worden geregenereerd, dan front-end edits in `FohTasks.tsx`, `ListManager.tsx`, `TakenBeheer.tsx` (+ eventuele phase-label helpers).
