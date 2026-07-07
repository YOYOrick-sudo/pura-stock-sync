## Verkenning

### 1. Waar zit de vorige-periode-berekening?
**In de RPC's**, op één plek per functie, altijd volgens hetzelfde patroon:
```sql
v_len      := p_tot - p_van;
v_prev_van := p_van - (v_len + 1);   -- direct daarvoor, zelfde lengte
v_prev_tot := p_van - 1;
```
Aanwezig in drie RPC's die de metric-bars voeden:
- `rpc_cijfers_samenvatting` — MetricsBar (omzet, bonnen, gem/bon)
- `rpc_cijfers_uren_samenvatting` — LoonkostenBar (loonkosten €/%, uren, omzet/uur)
- (`rpc_cijfers_tijdreeks` en `rpc_cijfers_uren_tijdreeks` gebruiken `v_prev_van/tot` niet voor delta's — die geven alleen huidige reeks)

Elke RPC retourneert `vorige_periode: { van, tot }` in de JSON, dus het label dat de frontend toont volgt automatisch.

De frontend berekent zelf géén prev_periode — hij toont alleen wat de RPC teruggeeft. **Fix landt dus in de SQL** (één helper + drie call-sites).

### 2. Componenten met gekleurde delta's
| Component | Metrics + delta | Kleurregel nu |
|---|---|---|
| `CijfersMetricsBar` | omzet, bonnen, gem/bon | ↑groen / ↓rood |
| `CijfersLoonkostenBar` | loonkosten €, loon-%, uren gewerkt, omzet/uur, uren gepland vs gewerkt | ↑groen / ↓rood (overal gelijk — fout voor loon-%/uren) |
| `CijfersVestigingSplit` | omzet per vestiging vs vorige | ↑groen / ↓rood |
| `CijfersTooltip` (chart-tooltips) | `deltaPct` in hoofd/uur/heatmap-tooltips | ↑groen / ↓rood |
| `CijfersWeekdagVergelijk` | periode-gem vs referentie-gem per weekdag | eigen logica — buiten scope (dit is geen vorige-periode, maar periode-vs-referentie) |

## Aanpak (na akkoord bouwen)

### A. SQL — weekdag-eerlijke prev-periode
Nieuwe helper-functie in `public`:
```sql
CREATE FUNCTION f_vorige_periode(p_van date, p_tot date)
RETURNS TABLE(prev_van date, prev_tot date)
```
Logica:
- **1 dag** (`p_van = p_tot`) → -7 dagen (zelfde weekdag vorige week)
- **volledige kalendermaand** (p_van = 1e van maand, p_tot = laatste van diezelfde maand) → zelfde maand vorig jaar
- **volledig kalenderjaar** (1 jan – 31 dec zelfde jaar) → vorig jaar
- **anders** (week, custom range) → zelfde lengte, 7 dagen eerder (i.p.v. `v_len+1`)

Vervang in `rpc_cijfers_samenvatting` en `rpc_cijfers_uren_samenvatting` de twee-regel-berekening door `SELECT * FROM f_vorige_periode(p_van, p_tot) INTO v_prev_van, v_prev_tot;`. Rest van de RPC's onaangeraakt — ze retourneren nog steeds `vorige_periode: {van, tot}`, alleen met eerlijke waarden.

Frontend hoeft niks te veranderen voor label-tekst: `fmtRange(s?.vorige_periode.van, .tot)` toont automatisch de juiste weekdag / maand / jaar. Wel: label "T.o.v. vorige periode" vervangen door dynamisch label ("T.o.v. zo 28 jun" / "T.o.v. juli 2025" / "T.o.v. 2025" / "T.o.v. 30 jun – 6 jul") — één helper `prevLabel(periode, prev)` in `types.ts`, hergebruikt in alle delta-componenten.

### B. Frontend — kleur per metric-intent
Nieuwe helper `src/components/cijfers/deltaKleur.ts`:
```ts
type Intent = 'hoger-is-goed' | 'lager-is-goed' | 'neutraal' | 'afwijking-signaal';
export function deltaClass(pct: number | null, intent: Intent): string
```
Regels:
- `hoger-is-goed` → ≥0 groen, <0 rood (huidige gedrag)
- `lager-is-goed` → ≤0 groen, >0 rood
- `neutraal` → altijd grijs (pijltje blijft)
- `afwijking-signaal` → |pct| >15% amber, anders grijs

Toewijzing per delta:
| Metric | Intent |
|---|---|
| Omzet, omzet/uur, gem/bon, bonnen | hoger-is-goed |
| Loonkosten-% van omzet | lager-is-goed |
| Loonkosten € absoluut | neutraal |
| Uren gewerkt | neutraal |
| Uren gewerkt vs gepland | afwijking-signaal |
| Chart-tooltip `deltaPct` (omzet-context) | hoger-is-goed |
| Vestiging-split omzet | hoger-is-goed |

Update: `CijfersMetricsBar`, `CijfersLoonkostenBar`, `CijfersVestigingSplit`, `CijfersTooltip` — vervang hardcoded ↑groen/↓rood door `deltaClass(pct, intent)`.

### C. Verificatie
1. Selecteer "vandaag" op zondag → label "T.o.v. zo {vorige zondag}", data uit die dag.
2. Selecteer "deze maand" (juli 2026) → label "T.o.v. juli 2025".
3. Selecteer "week" → label "T.o.v. {vorige ma}–{vorige zo}".
4. Loonkosten-% delta bij hogere kosten → rood. Bij lagere → groen.
5. Uren gewerkt delta → altijd grijs.
6. Uren gepland vs gewerkt bij +20% → amber.
7. Custom periode van 3 dagen → label "T.o.v. {3 dagen ervoor - 7d}".

## Buiten scope
- `CijfersWeekdagVergelijk` (andere vergelijkings-as: periode vs vaste referentie, blijft zoals is).
- Chart-lijnen zelf (hoofdgrafiek toont geen delta-kleur, alleen tooltip — die valt onder B).
