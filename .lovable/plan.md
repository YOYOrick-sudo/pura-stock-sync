## Diagnose

De kassa-afdracht wordt verstuurd naar een externe **n8n webhook** (`https://jaapies.app.n8n.cloud/webhook/kassa-afdracht`), niet via onze eigen backend. Daarom staat er niets in onze logs.

Live getest vanuit de sandbox:

```
POST  /webhook/kassa-afdracht        →  HTTP 404  "No workspace here"
POST  /webhook/kassa-afdracht-sluit  →  HTTP 404
OPTIONS (CORS preflight)             →  HTTP 405
```

De hele n8n-workspace `jaapies.app.n8n.cloud` is **niet meer bereikbaar** (account verlopen, gepauzeerd, of verwijderd). De browser doet eerst een CORS-preflight; die faalt → `fetch()` gooit een netwerkfout → toast "Verzenden mislukt".

Dit geldt voor **beide locaties** (Midsland én West) en voor **zowel "Open" als "Sluit"**. Dezelfde n8n-host wordt ook gebruikt door `OrderDashboard.tsx` (`/webhook/inventory-restock`) — dus die werkt waarschijnlijk óók niet meer.

Er is **niets mis met onze code of database**. De externe automation is offline.

## Wat ik nodig heb van jou (buiten de code)

Eén van deze twee, anders blijft het kapot:

1. **n8n workspace herstellen** — inloggen op n8n.cloud onder het `jaapies`-account, workspace reactiveren en de workflows `kassa-afdracht` en `kassa-afdracht-sluit` weer aanzetten (incl. "Available in MCP" / actief). De URL hoeft dan niet te veranderen.
2. **Of**: de afhandeling intern doen via Lovable Cloud (eigen edge function die de telling in de database opslaat en eventueel mailt). Dan zijn we niet meer afhankelijk van n8n.

## Wat ik wél in de code wil fixen (los van bovenstaande keuze)

Onafhankelijk van welke optie je kiest, fix ik nu de **stille-fout-bug**:

- In `src/pages/KassatellingOverdag.tsx` en `src/pages/Kassa.tsx`: na `fetch(...)` controleren of `response.ok` is. Nu wordt een HTTP 404/500 niet als fout herkend → bij sommige browsers verschijnt zelfs het succes-dialog terwijl de telling nooit is aangekomen.
- Bij een fout: duidelijke toast tonen mét reden (`"Versturen mislukt (404) — neem contact op met beheer"`) i.p.v. de generieke melding, en het succes-dialog **niet** openen.
- De telling-data tijdelijk opslaan in `localStorage` als backup zodat een mislukte afdracht opnieuw verstuurd kan worden zonder alles over te tellen.
- Idem voor `OrderDashboard.tsx` → `/webhook/inventory-restock`.

## Stappen

1. Bevestig welke route je wil (n8n herstellen óf intern via Lovable Cloud).
2. Ik pas de drie fetch-aanroepen aan met nette error-handling + localStorage-backup.
3. Bij keuze "intern": ik bouw een edge function `kassa-afdracht-submit`, tabel `kassa_afdrachten` met RLS, en wijzig de drie pagina's om die te gebruiken i.p.v. de n8n-webhook.

## Verificatie

- Sandbox-curl naar webhook → HTTP 200 (na n8n-herstel) of edge-function-test → 200.
- In de UI: telling invullen, versturen, succes-dialog verschijnt alléén bij echt succes.
- Bij geforceerde fout (offline): nette toast + data blijft in localStorage staan.