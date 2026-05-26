## Doel
Tussenlijst volledig verbergen voor West, met behoud van Midsland's open/tussen/sluit en West's open/sluit. Bestaande West-tussen-data wordt veilig opgeruimd.

## Wijzigingen

### 1. Data-cleanup (insert tool — geen schema-wijziging)
- **Verhuis actieve tussen-taken West naar sluit** (zodat geen werk verloren gaat):
  ```sql
  UPDATE foh_tasks
     SET phase = 'sluit'
   WHERE location = 'West'
     AND phase = 'tussen'
     AND completed = false
     AND archived = false;
  ```
- **Deactiveer de West tussen-template** (1 stuk) zodat de DB-trigger geen nieuwe tussen-taken meer aanmaakt:
  ```sql
  UPDATE foh_daily_templates
     SET is_active = false
   WHERE location = 'West' AND phase = 'tussen';
  ```
- Voltooide historische West-tussen-taken (~80) blijven ongemoeid — niet zichtbaar in de UI maar bewaard voor analytics.

### 2. `src/components/foh/FohTasks.tsx` — UI per locatie
- Helper toevoegen:
  ```ts
  const getPhasesForLocation = (loc: string): PhaseType[] =>
    loc === 'West' ? ['open', 'sluit'] : ['open', 'tussen', 'sluit'];
  ```
- Render fasenknoppen (regel ~1713) op basis van `getPhasesForLocation(currentUserLocation)`.
- `getFirstPhaseWithOpenTasks`: itereer over locatie-specifieke fases (zodat West nooit op `tussen` belandt).
- `useEffect` toevoegen: als `currentUserLocation === 'West'` en `activePhase === 'tussen'`, reset naar `'open'` (vangt oude localStorage).
- **Niet aanraken**: `getCurrentPhaseByTime` (auto-switch staat uit per memory) en de `PhaseType` union — blijven 3 waarden, alleen UI filtert.
- `groupTasksByPhase` blijft 3 buckets — Midsland gebruikt alle 3, West alleen 2.

### 3. Template-editor (Templates Beheren-tab)
- In de phase-selector binnen FohTasks.tsx (regels ~2729 en ~2905, alsook eventuele aparte template-tab): gebruik dezelfde `getPhasesForLocation()` om de Tussen-optie weg te filteren voor West. Voorkomt dat een admin per ongeluk nieuwe West-tussen-templates aanmaakt.

### 4. Edge function `supabase/functions/generate-waste-tasks/index.ts`
- Tussen-taak-blok (regels 116–151) inkapselen in `if (loc === 'Midsland') { ... }`. West genereert dus geen "container ophalen" tussen-taak meer.
- Sluit-taak-blok (regels 78–114) blijft ongewijzigd → "container aan de weg" landt op West-sluitlijst (maandag vóór dinsdagpickup) en op Midsland-sluitlijst (zoals nu).
- Escalate-mode blijft per locatie ongewijzigd (alleen sluit_task_id-gebaseerd).

### 5. Memory
- Update `mem://features/waste-calendar-multi-location`: West heeft geen tussenlijst; container-aan-de-weg taak verschijnt direct in West's sluitlijst.
- Nieuwe memory `mem://ui/fohtasks-west-no-tussen` (kort): West gebruikt alleen open + sluit fases.

## Verificatie na implementatie
1. Login als West-gebruiker op `/taken-bediening`: alleen Open + Sluit knoppen zichtbaar, geen Tussen.
2. Login als Midsland-gebruiker: Open + Tussen + Sluit alle drie zichtbaar.
3. Edge function handmatig triggeren met `mode: 'generate'`: West krijgt alleen sluit_inserted (geen tussen), Midsland krijgt zowel sluit als tussen zoals voorheen.
4. DB-check: `SELECT phase, count(*) FROM foh_tasks WHERE location='West' AND archived=false GROUP BY phase` — alleen `open`, `sluit`, en `NULL` (periodiek).
5. Templates beheren als West-admin: phase-selector toont alleen Open en Sluit.

## Bug-preventie
- `PhaseType` union ongewijzigd → geen TS-breaking changes.
- Midsland-flow volledig ongemoeid (alle wijzigingen guarded met `loc === 'West'` of `loc === 'Midsland'`).
- Auto-fase-tijdswitch wordt niet aangeraakt (staat uit).
- Periodieke taken (phase=NULL) niet geraakt.