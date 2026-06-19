## Aanbeveling: intern bouwen, n8n loslaten

De n8n-webhook was een doorgeefluik naar Google Sheets. Door het intern te doen ben je niet meer afhankelijk van een externe service, en krijg je een betere audit-trail voor kas-controle.

## Wat ik ga bouwen

### 1. Database — tabel `kassa_afdrachten`

Kolommen:
- `id`, `created_at`, `created_by` (user_id)
- `location` ('Midsland' / 'West')
- `type` ('open' = overdag/dagafrekening, 'sluit' = avond)
- `week_number`, `date`
- `naam` (wie de telling deed — text)
- `kassa_lade_denominations` (jsonb — alle coupures)
- `kassa_lade_total` (numeric)
- `wisselkas_denominations` (jsonb)
- `wisselkas_total` (numeric)
- `total` (numeric)
- `opmerkingen` (text)

**RLS-policies:**
- `authenticated` mag INSERT (eigen locatie, via `current_user_location()`)
- Alleen `admin`, `owner`, `manager` mogen SELECT (kas-controle inzage)
- Niemand mag UPDATE/DELETE (audit-integriteit; alleen service_role)

### 2. Pagina's aanpassen

- `src/pages/KassatellingOverdag.tsx` en `src/pages/Kassa.tsx`: `fetch()` naar n8n vervangen door `supabase.from('kassa_afdrachten').insert(...)`.
- Nette error-handling: bij fout duidelijke toast + data blijft in `localStorage` als backup zodat opnieuw versturen kan zonder over te tellen.
- Succes-dialog alleen bij echt succes.

### 3. Nieuwe pagina — Kas-controle overzicht

`/kas-controle` (alleen admin/owner/manager):
- Filter: locatie, datum-range, type (open/sluit).
- Tabel: datum, week, locatie, type, naam, totaal kassa, totaal wisselkas, totaal, opmerkingen.
- Detail-modal per rij: alle coupures uitgesplitst.
- Knop "Exporteer CSV" (Excel-vriendelijk).
- Toevoegen aan sidebar onder een nieuw kopje (bv. "Kas-controle") voor managers.

### 4. `OrderDashboard.tsx` — inventory-restock webhook

Die n8n-webhook is ook offline. Voor nu: nette foutmelding + de actie direct in onze database loggen (`internal_orders`-flow gebruiken die er al is). Of, als je zegt dat we 'm later in detail bekijken, alleen de foutmelding netter maken en de rest in een aparte stap.

## Wat ik nodig heb van jou

- Akkoord op intern bouwen (geen n8n meer voor kassa-afdracht).
- Wie mag de kas-controle pagina zien: alleen `owner` + `admin`, of ook `manager`? *Default: owner + admin + manager*.
- Wil je later óók nog automatische export naar een Google Sheet (via de Sheets-connector) als backup? *Niet nodig nu — kan later, druk op de knop.*
- `OrderDashboard.tsx` nu meenemen of in een aparte ronde?

## Verificatie

- Telling indienen in UI → rij verschijnt in `kassa_afdrachten`.
- Niet-manager kan niet bij de kas-controle pagina (RLS + UI-guard).
- Manager opent overzicht, filtert op week, exporteert CSV → opent correct in Excel/Numbers.
- Forceer fout (offline) → toast + localStorage-backup, geen valse succes-melding.
- Geen verwijzingen meer naar `jaapies.app.n8n.cloud` in `Kassatelling*`.