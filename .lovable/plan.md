## Doel
iPad voelt traag bij (1) afvinken van taken en (2) verdwijnend toetsenbord bij taken toevoegen/bewerken. Beide fixen zonder nieuwe bugs.

## Wat ik ga doen

### 1. Afvinken direct laten reageren (FohTasks.tsx)
- **Optimistic update via React Query**: `onMutate` zet de taak lokaal meteen op `completed`, met rollback bij fout.
- **Geen refetch na toggle** — alleen invalidate op de achtergrond zodat realtime/andere devices bijblijven.
- Vinkje en doorstreping verschijnen binnen 1 frame ipv na DB-roundtrip.

### 2. Toetsenbord stabiel houden (ListManager.tsx + TakenBeheer.tsx)
Drie oorzaken van remount tijdens typen, alle drie aanpakken:

- **Auto-seed idempotent maken**: `ensureCategoryOrder` in `foh-category-order.ts` alleen upserten als er écht ontbrekende categorieën zijn. Nu draait de seed ook als alles al klopt → refetch → re-render.
- **Stabiele React keys**: categorie- en taak-items keyen op `id` (niet op index of naam). Voorkomt dat een sort een input laat unmounten.
- **Lokale input-state**: taaktitel-input houdt eigen `useState` + debounced save (400ms). Externe refetches overschrijven niet meer wat je aan het typen bent, en de input blijft in de tree staan.
- **`useLayoutEffect` focus-restore** als laatste vangnet: bij onvermijdbare remount de focus + cursorpositie herstellen.

### 3. Verificatie
- Playwright: simuleer snelle taps op checkbox, verwacht directe `aria-checked`.
- Playwright: type in nieuwe taak-input, trigger een parallelle refetch, verwacht dat focus behouden blijft en waarde niet reset.
- Handmatig testen op iPad na deploy.

## Wat blijft hetzelfde
- DB-schema, edge functions, category-order logica, drag-and-drop, wachtwoorden, layout.

## Risico's die ik heb doordacht
- **Optimistic + realtime**: als realtime een oude snapshot terugstuurt kan het vinkje "knipperen". Oplossing: `queryClient.setQueryData` in de realtime handler mergen met pending mutations (React Query doet dit standaard mits we `onMutate` correct returnen).
- **Debounced save + snel wisselen tussen inputs**: bij blur meteen flushen zodat niets verloren gaat.
- **Sub-categorieën volgorde**: idempotent seed mag geen bestaande `sort_order` overschrijven — alleen inserten wat ontbreekt.
- **Undo bij toggle-fout**: rollback moet ook de "Opgeslagen ✓" pill onderdrukken zodat je geen valse bevestiging ziet.

Na deze drie ingrepen zou het op iPad écht smooth moeten voelen. Als er ná deploy nog een specifiek scherm hikt, pak ik dat gericht aan.
