# Afvalkalender: alle maanden zichtbaar maken

## Onderzoek — wat al werkt (geverifieerd)

**1. Database** ✅ Compleet
- `waste_pickups` Midsland: **265 rijen van 2026-01-02 t/m 2026-12-31**
- Alle data voor juli, augustus, september, oktober, november, december staat erin.

**2. Cron jobs** ✅ Al actief in `cron.job`
- `generate-waste-tasks-0500` → dagelijks 04:00 UTC (= 05:00/06:00 NL) — `mode: "generate"`
- `escalate-waste-tasks-2330` → dagelijks 22:30 UTC — `mode: "escalate"`
- `reset-daily-foh-tasks` → dagelijks 04:00 UTC

**3. Edge function `generate-waste-tasks`** ✅ Bestaat en werkt
- Maakt sluit-taak op laatste open dag vóór pickup
- Maakt tussen-taak op pickup-dag zelf
- Escaleert naar managers als container morgen niet klaar staat
- Houdt rekening met gesloten dagen (ma/di) en uitzonderingen

**4. Frontend kalender `WasteCalendarCard`** ✅ Navigatie werkt
- `weekOffset` state, vorige/volgende week knoppen, weeknummer-label
- Toont TST + Gemeente met juiste styling per bron en fractie

## Probleem — exact één oorzaak

In `src/hooks/useWastePickups.ts`:

```ts
const RANGE_BACK_DAYS = 7;
const RANGE_FORWARD_DAYS = 35;  // ← alleen ~4 weken vooruit vanaf vandaag
```

De query gebruikt een **vast venster vanaf vandaag**, en negeert de `weekOffset` van de kalender. Daardoor zijn juli en verder leeg — niet omdat er geen data is, maar omdat de hook ze nooit ophaalt.

## Wat ik ga doen (één bestand, geen backend-wijzigingen)

**Bestand:** `src/hooks/useWastePickups.ts`

1. Hook accepteert een tweede parameter `weekOffset: number` (default `0`).
2. Query-window wordt berekend rond de **zichtbare week** in plaats van rond vandaag:
   - 30 dagen terug + 90 dagen vooruit ten opzichte van de zichtbare maandag
   - Ruime buffer → soepel doorklikken zonder refetch per week
3. `queryKey` krijgt het week-blok erin (`['waste-pickups', location, blockKey]`) zodat React Query automatisch refetcht bij ver navigeren.

**Bestand:** `src/components/dashboard/WasteCalendarCard.tsx`

4. Geeft `weekOffset` door aan `useWastePickups(userLocation, weekOffset)`.

**`WasteAlertBanner` blijft ongewijzigd** — gebruikt zijn eigen vandaag/morgen-venster.

## Waarom dit 100% klopt

- Backend is af (cron + edge function + data t/m dec 2026).
- Enige reden dat juli–dec leeg waren = frontend haalde ze niet op.
- Met dynamisch window per zichtbare week zie je elke maand zodra je ernaartoe navigeert, en taken worden gewoon dagelijks om 05:00 NL automatisch aangemaakt door de bestaande cron.

## Niet aanraken

- Database, cron-jobs, edge functions, `WasteAlertBanner`, kalender-UI/styling.
