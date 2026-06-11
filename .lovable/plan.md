## Doel
Toevoegen van een dag-navigator boven de takenlijst zodat je 7 dagen terug door open/tussen/sluit kunt scrollen. Verleden is read-only. Vandaag-functionaliteit blijft 100% gelijk.

## UX

Boven de fasen-knoppen (Open / Tussen / Sluit) komt een datum-strip:

```
‹  za 5  zo 6  ma 7  di 8  wo 9  do 10  Vandaag (vr 11)  ›
```

- 8 chips: 7 dagen terug + vandaag. Geen toekomst.
- Active chip = donkergroen (`bg-primary text-primary-foreground`), vandaag-chip = blauw rand-accent, overige = wit met grijze rand.
- Pijltjes ‹ › verspringen 1 dag (links uitgeschakeld bij dag -7, rechts uitgeschakeld bij vandaag).
- Klik op "Vandaag" snel-knop rechts om terug te springen.
- Boven de fasen-knoppen verschijnt een banner als je in het verleden zit: `📅 Geschiedenis – vrijdag 4 juni · alleen lezen` met sluit-knop "Terug naar vandaag".

### Gedrag per dag
- **Vandaag**: alles werkt als nu (afvinken, swipe-delete, drag/drop, taak toevoegen, "Opslaan als template", generatie).
- **Verleden**: 
  - Checkboxes disabled, donkergrijs met vinkje-icoon (`Check`) of leeg vierkant.
  - Geen swipe-delete, geen drag, geen "+ Taak toevoegen"-knop.
  - "Opslaan als template" en "Templates Beheren" verborgen.
  - Voltooide taken tonen `completed_by` naam + tijd.
- **Periodieke taken + afvaltaken**: alleen tonen op vandaag-view (intuïtiefst — verleden is een dagelijkse momentopname per fase; periodiek/afval is geen "deze-dag" concept). In de verleden-view zie je dus uitsluitend de drie dagelijkse template-fases.

## Technische aanpak

### 1. State & data
- Nieuwe state `selectedDate: string` in `FohTasks.tsx`, default `getAmsterdamDateString()`.
- Helper `isViewingToday = selectedDate === getAmsterdamDateString()`.
- `useQuery` (of bestaande `fetchDailyTasks`) parametrisch op `selectedDate`. Query include `archived` filter:
  - Vandaag: `archived=false` (huidig gedrag).
  - Verleden: `archived=true OR archived=false` (laat beide zien — voltooid werk wordt 's nachts gearchiveerd door `reset-daily-tasks`).
- Periodieke taken (`phase IS NULL`) en afvaltaken (`template_id IS NULL`) niet meenemen in verleden-fetch — eenvoudige filter `template_id IS NOT NULL AND phase IS NOT NULL` bij historie.
- Geen generatie/insert calls in verleden-view (read-only).

### 2. Component-aanpassingen `src/components/foh/FohTasks.tsx`
- **Nieuwe component bovenin** (na `<Header>`, voor fase-knoppen): `<DaySelector selectedDate={...} onChange={...} />`. Lokale subcomponent in hetzelfde bestand om bundle-overhead te beperken.
- **Disable-gating**: één boolean `readOnly = !isViewingToday` doorgegeven aan checkbox-render, swipe handlers, drag-handlers, add-knop, "Opslaan als template", "+ Taak toevoegen".
- **Banner**: bovenaan render wanneer `readOnly`, met `Calendar` icon + datum + "Terug naar vandaag"-knop.
- **Realtime subscription** alleen actief als `isViewingToday` (anders zou je gisteren's view per ongeluk verspringen).
- **`generateDailyTasks` / `useEffect`-trigger**: alleen draaien als `isViewingToday`. Anders skip.
- **Progress bar**: blijft per fase tonen op de geselecteerde dag (voltooid / totaal van die historische snapshot).

### 3. Edge cases & bug-preventie
- **04:00 reset**: archiveert taken met `due_date < today`. Verleden-view leest met `archived=true` filter, dus historie blijft zichtbaar.
- **Lege historie-dag**: als er geen taken zijn voor die dag (bv. dag dat nog niemand de app had), toon empty state: "Geen taken geregistreerd op deze dag".
- **Niet-actuele template**: historische taken horen bij een `template_id` dat misschien intussen inactief is. Geen probleem — we tonen de `foh_tasks` rij zelf, niet de template.
- **Mutaties geblokkeerd op DB**: niet nodig — UI gating + RLS is voldoende, en `readOnly` voorkomt elke schrijfactie aan de client-kant.
- **Categorie-filter / sort/groep**: blijven werken; werken alleen op de huidige `dailyTasks` array die nu per dag wordt gefetcht.
- **Localstorage `activePhase`**: blijft per gebruiker, niet per dag.
- **Templates Beheren tab**: ongewijzigd — toont altijd templates (geen dag-context).
- **Optimistic updates** (`useToggleTaskCompletion` etc.): alleen aanroepbaar via UI; in `readOnly` worden handlers niet meer gerenderd → geen race.
- **Sluiten-context bij dagwissel**: bij switch naar verleden zet `activePhase` op `'sluit'` als gisteren (intuïtief voor "wat is gisteravond gesloten"). Of: behoud huidige fase. → **Behoud huidige fase** (minder verrassing). Gebruiker klikt zelf op Sluit.

### 4. Performance
- Per-dag fetch is goedkoop (≤ 100 rijen).
- Cache via `queryKey: ['foh-tasks', userLocation, selectedDate]` zodat heen-en-weer scrollen instant is.
- Geen prefetch nodig.

### 5. Verificatie
1. **Vandaag-view**: alles werkt zoals voor de wijziging (afvinken, drag, add, save-template).
2. **Verleden-view (-1 dag)**: zie Sluit-lijst van gisteren met voltooide checkboxen, naam en tijd. Checkbox is disabled, geen swipe.
3. **Lege dag**: empty state zichtbaar.
4. **Banner "Terug naar vandaag"** klik → terug op vandaag, alle interacties weer enabled.
5. **Realtime**: open in 2 tabs op vandaag → wijziging direct zichtbaar. In gisteren-tab géén realtime updates (verwacht).
6. **04:00 reset simulatie / dag-rollover**: vandaag wordt automatisch de nieuwe `getAmsterdamDateString()`.
7. **Periodieke/afvaltaken**: alleen op vandaag-view.
8. **Templates Beheren tab**: ongewijzigd functioneel.

## Bug-preventie samenvatting
- Single source of truth `selectedDate`; alle huidige logica wordt achter `isViewingToday` gegated.
- Geen DB-schema wijzigingen, geen migrations.
- Geen impact op `foh_daily_templates`, single-active-trigger, afval edge function, West-no-tussen logica.
- Read-only UI = geen schrijfacties mogelijk in verleden.
