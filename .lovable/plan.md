# Afvalkalender Pura Midsland — Compleet Plan

Automatisch genereren van afval-taken (TST + Gemeente) in FohTasks, met dashboard-overzicht, 7-daagse strip, en 3-laagse escalatie als een container vergeten wordt.

## 1. Database

**Nieuwe tabel `waste_pickups`**
- `pickup_date` (date) — dag dat container wordt opgehaald
- `source` (text) — `'tst'` | `'gemeente'`
- `fraction` (text) — `'restafval'` | `'gft'` | `'papier'` (voor TST: `'restafval'`)
- `location` (text, default `'Midsland'`)
- `sluit_task_id` (uuid, nullable) — verwijst naar gegenereerde "aan de weg" taak
- `tussen_task_id` (uuid, nullable) — verwijst naar "container ophalen" taak
- `escalation_sent_at` (timestamptz, nullable) — idempotency voor 23:30 melding
- `acknowledged_at` (timestamptz, nullable) — wie/wanneer banner heeft weggeklikt
- `acknowledged_by` (uuid, nullable)
- `acknowledged_reason` (text, nullable) — verplicht bij wegklikken
- `created_at`, `updated_at`
- UNIQUE(`pickup_date`, `source`, `fraction`, `location`)

**RLS:** view voor iedereen op Midsland (`location = current_user_location()`); insert/update alleen managers/owners/admin; service_role volledig (voor edge function).

**Index:** `(pickup_date, location)` voor dashboard-query's.

## 2. Data-import

Eenmalige insert van alle pickups voor 2026:
- **Gemeente Midsland** — restafval (grijs), gft (groen, incl. zomer-extra), papier (blauw) — exacte data uit aangeleverde kalender
- **TST Midsland** — restafval, exacte data Apr–Dec 2026

(Wacht op bevestiging Jan/Feb/Mar TST data of starten vanaf april.)

## 3. Edge function `generate-waste-tasks`

Draait via cron op **05:00 NL-tijd** (ná de 04:00 daily reset, zo blijven gegenereerde taken niet weg-archiveren).

**Per run, 3 taken:**

a) **Genereer Sluit-taak voor morgen** (per pickup waar `pickup_date = vandaag + 1`)
   - Insert in `foh_tasks`: `phase='sluit'`, `category='Algemeen'`, `due_date=vandaag`, `location='Midsland'`, `title='🗑️ {Source} {Fractie}-container aan de weg zetten'`, `priority=1`, `estimated_minutes=5`
   - Source label: TST → "TST (grote)", Gemeente → "Gemeente"
   - Save `sluit_task_id` op pickup-row
   - Idempotent: skip als `sluit_task_id IS NOT NULL`

b) **Genereer Tussen-taak voor vandaag** (per pickup waar `pickup_date = vandaag`)
   - `phase='tussen'`, `title='♻️ Lege {Source} {Fractie}-container ophalen'`
   - Save `tussen_task_id`, idempotent

c) **23:30 escalatie-check** (zelfde function, time-aware OF aparte cron)
   - Voor pickups van morgen waarbij `sluit_task_id` bestaat én `foh_tasks.completed = false` én `escalation_sent_at IS NULL`:
     - Insert `notifications` row voor alle Midsland managers/owners (`title: "⚠️ Container niet aan de weg gezet"`, `message`, `link='/foh-tasks'`)
     - Set `escalation_sent_at = now()`

**Cron:** twee schedules via `pg_cron` + `pg_net` (geen migration; gebruik `supabase--insert`):
- `0 5 * * *` (Europe/Amsterdam) — generatie
- `30 23 * * *` — escalatie

**Critical bugfix:** `location='Midsland'` (hoofdletter), exact zoals `current_user_location()` retourneert.

## 4. Dashboard UI

### A. `WasteAlertBanner` (nieuw, bovenaan dashboard)
- Zichtbaar wanneer: een Sluit-taak voor morgen niet completed is **na 22:00**, OF een gisteren-Sluit-taak die nooit is afgevinkt
- Style: `bg-destructive/10`, border-left 4px destructive, ⚠️ icoon, korte tekst, knoppen "✓ Alsnog gedaan" / "Niet meer nodig (reden)"
- Klik → dialog met verplichte reden → schrijft `acknowledged_at`, `acknowledged_by`, `acknowledged_reason` op pickup
- Persistent: blijft tot expliciet weggeklikt, geen auto-dismiss, geen toast

### B. `WasteCalendarCard` (nieuw, in dashboard-grid)
- Header: "Afvalkalender Midsland"
- 7-daagse strip (vandaag + 6 dagen)
- Per dag: container-icoon(en), gekleurd op fractie:
  - Restafval grijs (`bg-muted`)
  - GFT groen (`bg-success/20` of `--primary/20`)
  - Papier blauw (`bg-info/20`)
- TST = groot icoon (`w-6 h-6`), Gemeente = klein (`w-4 h-4`) — visueel onderscheid grote vs kleine container
- Vandaag: ring-2 ring-primary
- Gemiste dag (open Sluit-taak verleden): rode border + ⚠️ overlay
- Hover/tap → tooltip met source + fractie
- Realtime subscription op `waste_pickups` + `foh_tasks` (filtered op waste task ids)
- Alleen tonen op locatie Midsland

### C. NotificationsDropdown
- Geen UI-wijziging nodig — bestaande bell-badge toont automatisch de 23:30 escalatie-notificaties

## 5. Integratie bestaande systemen

- **04:00 reset** (`reset-daily-tasks`): waste-taken zijn gewone `foh_tasks` met `phase IN ('sluit','tussen')` → archiveren automatisch mee. Generatie op 05:00 maakt nieuwe taken voor de nieuwe dag. ✓ geen aanpassing nodig.
- **Periodic-tasks** (phase NULL) blijft ongewijzigd — afval is bewust gekoppeld aan dagdeel-fase, niet periodiek.
- **FohTasks numbering**: bestaand systeem nummert door — afval-taken krijgen vanzelf een nummer.

## 6. Bug-preventie checklist

- ✅ `location = 'Midsland'` exact (matcht `current_user_location()` en RLS)
- ✅ Cron-volgorde: 04:00 reset → 05:00 waste-generatie (geen race)
- ✅ Idempotency via `sluit_task_id`/`tussen_task_id`/`escalation_sent_at` checks
- ✅ Edge function: `verify_jwt = false` in `config.toml`, gebruik `SUPABASE_SERVICE_ROLE_KEY`
- ✅ UNIQUE constraint voorkomt dubbele pickups bij data-import
- ✅ Banner-condities tijdzone-aware (`Europe/Amsterdam`)
- ✅ Realtime: `ALTER PUBLICATION supabase_realtime ADD TABLE waste_pickups`
- ✅ Notifications RLS: alleen admin kan inserten → edge function gebruikt service_role (bypass) ✓

## 7. Bestanden (executie-volgorde)

1. **Migration**: `waste_pickups` tabel + RLS + index + realtime publication
2. **Insert** (`supabase--insert`): alle 2026 pickup-data
3. **Edge function**: `supabase/functions/generate-waste-tasks/index.ts` + `config.toml` block
4. **Insert** (`supabase--insert`): twee `cron.schedule` calls
5. **Frontend**:
   - `src/components/dashboard/WasteAlertBanner.tsx`
   - `src/components/dashboard/WasteCalendarCard.tsx`
   - `src/components/dashboard/WasteAcknowledgeDialog.tsx`
   - `src/hooks/useWastePickups.ts` (React Query + realtime)
   - Mount in `src/pages/Dashboard.tsx` (alleen Midsland)

## Open vraag

TST data Jan/Feb/Mar 2026 — meesturen of starten vanaf april? Anders compleet en bug-vrij.
