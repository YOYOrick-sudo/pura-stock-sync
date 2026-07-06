# C4 — Loonkosten & productiviteit in /cijfers

Alle data (`uren_dagen`: `gewerkte_uren`, `geplande_uren`, `loonkosten`, `loonkosten_bron`, `eitje_omzet_dag`) staat er, wordt dagelijks gesynct via `eitje-sync`, maar is nergens zichtbaar. Doel: zichtbaar maken zonder aanraking van bestaand Lightspeed-pad of bestaande `rpc_cijfers_*`.

## Scope (in)
1. 1 DB-migratie: 2 nieuwe RPC's + 1 profielveld `mag_loonkosten_zien` + protect-trigger
2. 3 nieuwe UI-componenten onder `src/components/cijfers/`
3. 1 hook `useMagLoonkostenZien`
4. Integratie in `src/pages/Cijfers.tsx` (grid + conditional render)
5. Verificatiepad met exacte queries en spot-checks

## Scope (uit)
- Geen wijzigingen aan `omzet_uren`, `v_cijfers_dag`, Lightspeed-sync
- Geen wijziging aan bestaande `rpc_cijfers_samenvatting/_tijdreeks/_heatmap/_weekdag_vergelijk`
- Geen wijziging aan `eitje-sync` edge function
- Geen forecast, alerting, backfill-UI (dat is C5)

---

## 1. DB-migratie

### 1a. Profielveld + protect-trigger (zelfde pattern als `mag_cijfers_zien`)
```sql
ALTER TABLE public.profiles
  ADD COLUMN mag_loonkosten_zien boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.protect_mag_loonkosten_zien()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path='public' AS $$
BEGIN
  IF NEW.mag_loonkosten_zien IS DISTINCT FROM OLD.mag_loonkosten_zien THEN
    IF NOT (public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin')) THEN
      RAISE EXCEPTION 'Alleen owners kunnen mag_loonkosten_zien wijzigen';
    END IF;
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_protect_mag_loonkosten_zien
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_mag_loonkosten_zien();
```

### 1b. Helper-functie
```sql
CREATE OR REPLACE FUNCTION public.mag_loonkosten_zien(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path='public' AS $$
  SELECT public.has_role(_uid,'owner')
      OR public.has_role(_uid,'admin')
      OR EXISTS (SELECT 1 FROM public.profiles p
                 WHERE p.user_id=_uid AND COALESCE(p.mag_loonkosten_zien,false));
$$;
```

### 1c. Twee nieuwe RPC's (STABLE, guard bovenaan)

**`rpc_cijfers_uren_samenvatting(p_vestigingen text[], p_van date, p_tot date)`** → `jsonb`
- Guard: `IF NOT public.mag_loonkosten_zien(auth.uid()) THEN RAISE EXCEPTION 'geen toegang'; END IF;`
- Join `uren_dagen` (per vestiging/werkdag) met `v_cijfers_dag` op omzet
- Returns per vestiging + totaal:
  - `gewerkte_uren`, `geplande_uren`, `loonkosten`
  - `omzet` (uit `v_cijfers_dag.omzet_incl`)
  - `loonkosten_pct_omzet` = `loonkosten/omzet*100` (NULL bij omzet=0)
  - `omzet_per_gewerkt_uur` = `omzet/gewerkte_uren` (NULL bij uren=0)
  - `bron_mix`: `{eitje: n, berekend: n}` (COUNT per `loonkosten_bron`)
- Zelfde vorige-periode-vergelijking als `rpc_cijfers_samenvatting` (venster = `p_tot-p_van`, `v_prev_van = p_van - (len+1)`)

**`rpc_cijfers_uren_tijdreeks(p_vestigingen text[], p_van date, p_tot date, p_granulariteit text)`** → `TABLE(bucket timestamptz, vestiging text, gewerkte_uren numeric, geplande_uren numeric, loonkosten numeric, omzet numeric)`
- Guard idem
- `p_granulariteit`: `'dag'|'week'|'maand'` (geen `'uur'` — Eitje levert dag-niveau)
- Voor `week`: `date_trunc('week', werkdag)` (ISO-week, ma=start)

---

## 2. UI-componenten

### 2a. `src/hooks/useMagLoonkostenZien.ts`
```ts
export function useMagLoonkostenZien() {
  const { data } = useQuery({
    queryKey:['mag-loonkosten-zien'],
    queryFn: async () => {
      const { data:{user} } = await supabase.auth.getUser();
      if(!user) return false;
      const [role, prof] = await Promise.all([
        supabase.rpc('get_user_role',{uid:user.id}),
        supabase.from('profiles').select('mag_loonkosten_zien').eq('user_id',user.id).single(),
      ]);
      return role.data==='owner'||role.data==='admin'||!!prof.data?.mag_loonkosten_zien;
    }
  });
  return !!data;
}
```

### 2b. `CijfersLoonkostenBar.tsx`
3 KPI-kaartjes (`PolarKPICard`, compact) in dezelfde stijl als `CijfersMetricsBar`:
- **Loonkosten** — `€ x` totaal, subtitel `x% van omzet`, delta-pijl vs vorige periode
- **Omzet / gewerkt uur** — `€ x/u`, delta
- **Uren gewerkt vs gepland** — `x u / y u`, delta = over/onder-planning in %
- Voetnoot als `bron_mix.berekend > 0`: `"⚠ n dagen berekend met vangnet-uurloon"` (linkt naar `/settings/cijfers` — bestaat mogelijk niet, dan tekst-only)

### 2c. `CijfersLoonkostenGrafiek.tsx`
- Recharts `ComposedChart` met dubbele Y-as (zelfde stijl als `CijfersHoofdgrafiek`)
- Links: **omzet** (area, primary)
- Rechts: **loonkosten** (line, warning-color) + **loonkosten%** (line, muted, gestippeld)
- Data: `rpc_cijfers_uren_tijdreeks`, granulariteit auto-bepaald uit periode-lengte:
  - `≤ 31 dagen` → `dag`
  - `≤ 180 dagen` → `week`
  - `> 180 dagen` → `maand`
- Tooltip: hergebruik `CijfersTooltip` pattern

### 2d. `CijfersUrenVergelijk.tsx`
- Recharts `BarChart`: geplande (muted) vs gewerkte (primary) uren per dag/week
- Kleine badge boven grafiek: "gemiddelde afwijking: +x%" (over > 0 = onder-planning gewerkt, onder < 0 = over-planning)

### 2e. Integratie in `src/pages/Cijfers.tsx`
```tsx
const magLoon = useMagLoonkostenZien();
// ...
{magLoon && <CijfersLoonkostenBar {...rangeProps}/>}
<div className="grid grid-cols-1 lg:grid-cols-[1.85fr_1fr] gap-5">
  <CijfersHoofdgrafiek .../>
  <CijfersWeekdagVergelijk .../>
</div>
{magLoon && (
  <div className="grid grid-cols-1 lg:grid-cols-[1.85fr_1fr] gap-5">
    <CijfersLoonkostenGrafiek {...rangeProps}/>
    <CijfersUrenVergelijk {...rangeProps}/>
  </div>
)}
```
Geen filter-toggle: als `magLoon=false` verschijnt niks; als `true` staat het altijd aan (versimpelt spec).

---

## 3. Verificatiepad (aantoonbaar doorlopen vóór "klaar")

1. **RPC-guard**: als testuser zonder vlag `SELECT public.rpc_cijfers_uren_samenvatting(...)` → moet exceptie geven. Owner → returnt jsonb.
2. **Getalscheck 2026-07-05**:
   ```sql
   SELECT vestiging, gewerkte_uren, loonkosten, loonkosten_bron
     FROM public.uren_dagen WHERE werkdag='2026-07-05';
   ```
   Vergelijk met `rpc_cijfers_uren_samenvatting(ARRAY['west','midsland'],'2026-07-05','2026-07-05')` — totaal-loonkosten moet **€ 1.302,63** zijn (matcht laatste retest van C3).
3. **Loonkosten-%**: handmatig `loonkosten/omzet_incl*100` per vestiging → moet exact matchen met RPC-output (op 0,1%).
4. **Omzet/gewerkt uur**: `v_cijfers_dag.omzet_incl / uren_dagen.gewerkte_uren` per vestiging op 2026-07-05 → matcht RPC op cent.
5. **Bron-mix**: 3 Midsland-users hebben `bron='berekend'` → `bron_mix.berekend >= 3` in output, waarschuwings-voetnoot zichtbaar in UI.
6. **UI-check** (`/cijfers` als owner): Loonkosten-bar rendert, grafiek toont dual-axis, delta-pijl klopt met vorige-week-berekening.
7. **RLS-check**: uitloggen, inloggen als `staff`-user zonder `mag_loonkosten_zien` → componenten renderen niet, RPC's callen niet (netwerk-tab check).

---

## 4. Technische details / risico's

- **`loonkosten` kolom heet niet `loonkosten_dag`** — bestaande schema-naam gerespecteerd (bevestigd via `information_schema`).
- **Vorige-periode-berekening**: identieke offset-logica als `rpc_cijfers_samenvatting` — geen nieuw pattern.
- **`v_cijfers_dag` in RPC**: view is `SECURITY INVOKER`; RPC is `SECURITY DEFINER` maar leest alleen aggregaties, geen PII → veilig.
- **Delta-pijltjes**: `null` als vorige periode 0 uren had (avoid Infinity).
- **Empty state**: als geen enkele `uren_dagen`-rij in range → toon skeleton + "Nog geen uren-data gesynct" (geen crash).
- **Performance**: `uren_dagen` heeft `(vestiging, werkdag)` als PK → range-query is trivial. Grote periode (12mnd × 2 vestigingen = 730 rijen) is <5ms.

## 5. Bestandslijst (delta)

**Nieuw:**
- `supabase/migrations/<ts>_c4_loonkosten_rpcs.sql`
- `src/hooks/useMagLoonkostenZien.ts`
- `src/components/cijfers/CijfersLoonkostenBar.tsx`
- `src/components/cijfers/CijfersLoonkostenGrafiek.tsx`
- `src/components/cijfers/CijfersUrenVergelijk.tsx`

**Aangepast:**
- `src/pages/Cijfers.tsx` (2 conditionele blokken toevoegen, ~15 regels)

**Ongewijzigd** (expliciet): `eitje-sync/index.ts`, alle bestaande `rpc_cijfers_*`, `omzet_uren`, `v_cijfers_dag`, `lightspeed-sync`, Lightspeed-cron.

## 6. Wat NIET in C4 (bewust uitgesteld)

- Eitje vs Lightspeed omzet-kruischeck (→ C5a)
- Forecast-lijn uit `/revenue_days.forecast_amt_in_cents` (→ C5b)
- Loonkosten-% alert cron (→ C5c)
- Owner-UI voor `mag_loonkosten_zien` toggle per user — voor nu handmatig via SQL (`UPDATE profiles SET mag_loonkosten_zien=true WHERE ...`) omdat er nog geen users-beheer-pagina bestaat die dit veld toont. Toevoegen kan later in `/settings/team`.
