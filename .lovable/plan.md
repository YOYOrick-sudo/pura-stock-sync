# Eitje-mapping plan (na verkennen-run)

## 1. Verkennen-resultaten (feit, geen aanname)

**Environments (2, beide `active: true`):**
- `id 404` → **Pura Vida - West**
- `id 352` → **Pura Vida - Midsland**

Geen extra environments om te negeren — beide mappen 1-op-1 op onze vestigingen. **Bevestig de naam-mapping** (West → `west`, Midsland → `midsland` in `omzet_uren.vestiging` / `uren_dagen.vestiging`).

**Response-shape (alle endpoints):** top-level `{items: [...], ...}`. Datumfilter dat werkt: `filters[start_date]`, `filters[end_date]`, optioneel `filters[date_filter_type]=resource_date`.

**Sample-velden per endpoint (uit de run):**

| Endpoint | Sleutel-velden |
|---|---|
| `/time_registration_shifts` | `date`, `start`, `end`, `break_minutes`, `user.id`, `environment.id`, `type.name` (bv. `gewerkte_uren`), `approved`, `planning_shift_id` |
| `/planning_shifts` | `date`, `start`, `end`, `break_minutes`, `user.id`, `environment.id`, `team.id`, `published`, `published_at` |
| `/salaries` | `user.id`, `environment.id`, `amount` (EUR/uur, decimaal), `start_date`, `end_date` (nullable = nog geldig) |
| `/revenue_days` | `date`, `environment.id`, `amt_in_cents`, `revenue_group.name` (o.a. `"Totaal"`), `forecast_amt_in_cents` |

## 2. Vestiging-mapping (constant in de edge function)

```ts
const ENV_TO_VESTIGING: Record<number,string> = {
  404: 'west',
  352: 'midsland',
};
// onbekende environment.id → skip + tellen in details.skipped_env_ids
```

## 3. Uren per (vestiging, werkdag)

Bron: `/time_registration_shifts` gefilterd op `filters[start_date/end_date]` + `filters[date_filter_type]=resource_date`.

**Gewerkte uren per shift** (alleen `type.name = 'gewerkte_uren'`):
```
minuten = (end - start) in minuten − break_minutes
gewerkte_uren_shift = minuten / 60
```
Groeperen op `(ENV_TO_VESTIGING[environment.id], date)` → `SUM` = `uren_dagen.gewerkte_uren`.

**Geplande uren** identiek uit `/planning_shifts` (alle rijen, ongeacht `published`) → `uren_dagen.geplande_uren`.

**STOP+ASK 1:** akkoord om óók niet-`approved` time-registrations mee te tellen? (anders missen we shifts die nog niet door manager zijn goedgekeurd — voor dagelijkse T-1 sync praktisch onvermijdelijk).

## 4. Loonkosten per (vestiging, werkdag) — met werkgeverslasten

Nieuwe kolom in `cijfers_instellingen`:
```sql
ALTER TABLE public.cijfers_instellingen
  ADD COLUMN wg_lasten_factor numeric NOT NULL DEFAULT 1.30;
```
Owner-editbaar (RLS-policy: alleen `owner`/`admin` mag `UPDATE`).

**Salaris-lookup per shift-datum:** kies uit `/salaries` de rij per `user.id` (+ evt. `environment.id`) waarvoor
```
start_date <= shift.date AND (end_date IS NULL OR end_date >= shift.date)
```
Bij meerdere matches → hoogste `start_date` wint (meest recent geldige tarief). Geen match → shift telt niet mee voor loonkosten (log in `sync_runs.details.loonkosten.missing_salary_user_days`).

**Berekening per dag:**
```
loonkosten_dag = SUM_over_shifts( gewerkte_uren_shift × amount ) × wg_lasten_factor
```
Schrijven naar `uren_dagen.loonkosten_dag` (of huidige kolomnaam — zie STOP+ASK 2), `uren_dagen.loonkosten_bron = 'eitje'`.

**STOP+ASK 2:** bevestig de exacte kolomnaam in `uren_dagen` voor de loonkosten (schema toont geen samenvatting; ik lees `uren_dagen`-kolommen live vóór de eerste upsert-migratie).

## 5. Omzet — kruischeck-only

Lightspeed blijft leidend (`omzet_uren.omzet_incl`, `v_cijfers_dag`). Eitje's `/revenue_days`:
- filter `revenue_group.name = 'Totaal'` (uit sample). Overige groepen negeren.
- `eitje_omzet_dag_eur = amt_in_cents / 100`
- Schrijf naar `uren_dagen.eitje_omzet_dag` (nieuwe kolom als die nog niet bestaat — STOP+ASK 3).
- Bij ontbrekende `Totaal`-rij: veld leeg laten, geen blokkade.

**STOP+ASK 3:** bevestig kolomnaam `eitje_omzet_dag` (numeric, EUR) of alternatief. Zelfde check voor `uren_dagen`-schema.

## 6. Sync-typen (na akkoord op §2–§5)

- **dagelijks** (cron 05:30 UTC = 06:30 NL, na Lightspeed): venster = gisteren + eergisteren. Doel: `uren_dagen` (gewerkte/geplande/loonkosten) + eventuele `eitje_omzet_dag`.
- **handmatig**: owner-UI, max 31 dagen (bestaande guard).
- **backfill**: 12 mnd default, in 7-daagse windows (`MAX_WINDOW_DAYS`).

Idempotent: `UPSERT ON CONFLICT (vestiging, werkdag)` in `uren_dagen`. Elke run: 1 rij in `sync_runs` met `details = {windows, per_env_stats, skipped_env_ids, missing_salary_user_days}`.

## 7. Verificatiepaden (aantoonbaar doorlopen vóór "klaar")

1. Eén handmatige run over 2026-07-05 → verwacht `uren_dagen` voor 2 vestigingen, `gewerkte_uren` > 0 op West.
2. `SELECT vestiging, werkdag, gewerkte_uren, geplande_uren, loonkosten_dag, eitje_omzet_dag FROM uren_dagen WHERE werkdag = '2026-07-05'`.
3. Spot-check loonkosten: neem 1 user, 1 shift, hand-uitgerekend (`uren × amount × factor`) — moet matchen op de cent.
4. Kruischeck omzet: `uren_dagen.eitje_omzet_dag` vs `v_cijfers_dag.omzet_incl` per vestiging/dag — verschil loggen, niet fixen.

## 8. Wat NIET in deze sprint

- Geen wijzigingen aan `omzet_uren` / `v_cijfers_dag` / Lightspeed-pad.
- Geen UI-changes op cijfers-dashboards.
- Geen automatische salary-inrichting per user (blijft in Eitje beheerd).

---

### Wat ik nodig heb om door te gaan

1. **Ja/nee op naam-mapping** West→`west`, Midsland→`midsland`.
2. **STOP+ASK 1**: niet-`approved` shifts meetellen in dagelijkse sync?
3. **STOP+ASK 2 & 3**: mag ik `uren_dagen`-schema live inlezen en, indien nodig, kolommen (`loonkosten_dag`, `loonkosten_bron`, `eitje_omzet_dag`) via migratie toevoegen? Of bestaan ze al onder andere naam?
4. Akkoord op de `cijfers_instellingen.wg_lasten_factor` migratie (numeric, default 1.30, owner-only UPDATE).

Zodra deze 4 punten binnen zijn: 1 migratie (schema-additions) + edge-function mapping-code + handmatige testrun over 2026-07-05, mét de 4 verificatiestappen uit §7.
