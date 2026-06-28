
## Doel
Voorkomen dat de iPad telkens opnieuw moet inloggen en niet meer in een 429 "Request rate limit reached"-loop terechtkomt.

## Oorzaak (uit auth-logs)
- iPad doet ~20 refresh-token requests in enkele seconden → Supabase blokkeert met **429**.
- Daarvoor: `refresh_token_not_found` → opgeslagen sessie is weg (Safari/iPadOS wist localStorage, of meerdere PWA/Safari-instances gebruiken hetzelfde token tegelijk).
- Geen lock op refresh + geen back-off bij 429 → storm blijft hangen tot de app wordt afgesloten.

## Wijzigingen

### 1. Refresh-lock + robuustere Supabase-client
**File:** `src/integrations/supabase/client.ts`
- Toevoegen aan `auth`-config:
  - `lock: navigator.locks ? supabaseClientLock : undefined` — gebruikt Web Locks API zodat maar één tab/PWA tegelijk een refresh doet.
  - `storageKey: 'puravida-auth'` (stabiele key).
  - `flowType: 'pkce'`.
  - `storage`: custom adapter (zie punt 3) die schrijft naar IndexedDB met localStorage-fallback.
- `global.fetch` vervangen door een wrapper (zie punt 2).

> Let op: dit bestand is normaal auto-generated maar is in dit project al handmatig uitgebreid met auth-opties — we breiden die uitbreiding uit.

### 2. 429 back-off fetch-wrapper
**Nieuw bestand:** `src/integrations/supabase/fetchWithBackoff.ts`
- Wrap `fetch`: bij respons `429` of `5xx` op een Supabase auth-URL: exponentiële back-off (start 1s, max 30s), max 3 retries, respecteert `Retry-After` header.
- Bij meerdere parallelle calls naar `/token?grant_type=refresh_token` binnen 2s: dedupliceren via in-memory promise-cache.

### 3. Sessie-persistentie via IndexedDB
**Nieuw bestand:** `src/integrations/supabase/sessionStorage.ts`
- `SupabaseStorageAdapter` implementeert `{ getItem, setItem, removeItem }` (async).
- Primair: IndexedDB (overleeft Safari's "Prevent Cross-Site Tracking"-cleanup veel beter dan localStorage).
- Schrijft tegelijk naar localStorage als snelle synchrone fallback.
- Bij `getItem`: probeer IndexedDB → val terug op localStorage als IDB leeg/onbeschikbaar.

### 4. PWA-installatie-hint voor iPad
**Nieuw bestand:** `src/components/PWAInstallHint.tsx`
- Detecteert iPad-Safari (UA + `'standalone' in navigator`) die nog niet is geïnstalleerd.
- Toont eenmalig (dismiss in localStorage) een rustige banner onderaan de loginpagina: "Tip: tik op Delen → 'Zet op beginscherm' voor een stabielere sessie."
- Geen banner als de app al als PWA draait (`window.matchMedia('(display-mode: standalone)').matches`).
- Inhaken in `src/pages/Auth.tsx`.

### 5. Nette 429-foutmelding
**File:** `src/pages/Auth.tsx` (login-flow)
- Detecteer `error.status === 429` of message bevat `rate limit` → toon: "Te veel inlogpogingen kort na elkaar. Wacht 30 seconden en probeer opnieuw."
- Knop disabled houden tijdens een 30s countdown.

### 6. Manifest-check
**File:** `public/manifest.json`
- Controleren dat `display: "standalone"` en `start_url: "/"` aanwezig zijn (zodat de "Zet op beginscherm"-PWA goed start). Alleen aanpassen indien ontbrekend.

## Niet in scope
- Geen service-worker / offline-modus (zou bestaande PWA-installaties juist kunnen breken).
- Geen wijziging van Supabase JWT/refresh-expiry-instellingen (server-side, valt buiten app).
- Geen andere routes of UI dan login-banner.

## Verificatie
- TypeScript build moet schoon zijn.
- Handmatig test op iPad: inloggen → app naar achtergrond → 1 dag wachten → nog ingelogd. Twee tabs tegelijk openen mag geen `refresh_token_not_found` triggeren.
- Console: bij geforceerde 429 (door snel reloaden) zien we de back-off i.p.v. een burst.
