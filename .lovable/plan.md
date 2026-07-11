
# Plan: Vier verbeteringen aan de cijfers-analyse

Volgorde: 1 → 2 → 3 → 4. Elke stap eindigt met een korte verificatie voor jou (steekproef of screenshot van de curve/labels). Pas na jouw "OK" op stap 4 sluit ik af.

---

## 1. Ritme-basis vast op laatste 12 weken (loze-uren)

**Probleem:** `rpc_cijfers_loze_uren_v2` berekent het ritme (`ritme` CTE) over de aangevraagde periode zelf. Bij 1-dag-selectie is er dan maar 1 observatie per (weekdag, uur), waardoor `n_obs >= 2` alles wegfiltert → "geen loze uren".

**Fix:** ritme wordt altijd berekend over `[p_tot - 84 dagen, p_tot]` (12 wkn t/m eindatum), onafhankelijk van `p_van`. De `dure_dagen`-CTE (welke dagen tonen we) blijft filteren op `[p_van, p_tot]`. Zelfde split voor `ritme_team` en de vangnet-berekening blijft op de selectieperiode.

**Migratie:** `CREATE OR REPLACE FUNCTION public.rpc_cijfers_loze_uren_v2(...)` — alleen de twee ritme-CTE's krijgen een eigen datumvenster.

**Verificatie (rapporteer):** roep de RPC aan voor {do 9 jul 2026} enkel — moet nu wél het do-cluster tonen dat we in de week-steekproef zagen.

---

## 2. Gelijkmatig-dure dagen apart tonen (loze-uren)

**Probleem:** dag boven doel+marge zonder uitschieter-uur (bv. Midsland do 9 jul, 42,7%) verschijnt nergens.

**Fix:** RPC krijgt tweede resultaattype "dag-signaal". Aanpak: zelfde functie, extra kolom `signaal_type text` met waarden `'uur'` (bestaand cluster) of `'dag'` (dag boven doel+marge, géén enkel uur haalt de laag-B drempel). Voor `'dag'`-rijen: `uur_van/uur_tot = NULL`, `verspilling = (dag_loonkosten - dag_omzet * doel_pct/100)`, geen team-breakdown (of alleen totaal-team-delta over hele dag als goedkoop toevoegsel — houd ik simpel: leeg `[]`).

**UI (`CijfersLozeUren.tsx`):** apart lijstitem met ander icoon (bv. `TrendingUp` grijs i.p.v. rode `AlertTriangle`), tekst: *"Dag op 42,7% (doel 30%) — geen specifiek dagdeel wijkt af, gelijkmatige overbezetting."* Sortering: uur-clusters eerst (op verspilling), dag-signalen daaronder (op dag-loon%).

**Loonkosten-doelgrafiek check:** ik lees `CijfersLoonkostenDoelGrafiek.tsx` en bevestig in het rapport of dure dagen daar al als rode staaf zichtbaar zijn (verwacht: ja, want die grafiek werkt op dag-niveau — maar ik verifieer het echt in code, niet op aanname).

**Verificatie:** ik toon de nieuwe rijen voor week 6-10 juli 2026 in een platte tabel — jij toetst herkenning.

---

## 3. Omzetverloop over de dag ook bij meerdaagse selectie

**Probleem (`CijfersUurverloop.tsx`):** bij `periode !== 'vandaag'` gebruikt de component `p_van` direct; RPC `rpc_cijfers_heatmap` retourneert per (isodow, uur) rijen; de aggregatie in de component middelt correct per uur — dus **de curve zou al moeten werken** bij meerdaagse selectie. Ik verifieer eerst waarom hij toch leeg lijkt (mogelijk toont hij een andere kaart, of er is een conditie die hem verbergt).

**Actie:**
1. Grondig inlezen wat de "Omzetverloop over de dag"-kaart in de huidige `/cijfers` layout doet bij een meerdaagse selectie (kijk in `Cijfers.tsx` welke component daar rendert en met welke props).
2. Zorg dat bij elke selectie (1 dag t/m jaar) een gemiddelde-uurcurve over alle geselecteerde dagen wordt getoond, piek-markering behouden.
3. Subtiel label eronder: *"gemiddelde per uur over N dagen"*.

**Verificatie:** ik run de flow voor 1-10 juli 2026 en toon de curve + piek in het rapport (getallen per uur), zodat je 't herkent zonder screenshot af te wachten.

---

## 4. Vergelijking standaard = vorig jaar (vervangt sprint-D-regel)

**Kern:** `f_vorige_periode(p_van, p_tot, p_mode)` — de enige plek waar de vergelijkingsperiode wordt bepaald — wordt herzien:

| Mode          | Nieuw gedrag                                            |
| ------------- | ------------------------------------------------------- |
| `dag`         | zelfde datum vorig jaar (**keuze: datum, niet weekdag** — zie hieronder) |
| `week`        | zelfde ISO-week vorig jaar (p_van/p_tot -1 jaar, verschoven naar dezelfde ISO-weekdagen) |
| `maand`       | al -1 jaar (blijft)                                     |
| `jaar`        | al -1 jaar (blijft)                                     |
| `custom`      | -1 jaar (was: periode-ervoor)                           |

**Keuze bij `dag` — datum i.p.v. weekdag:** seizoensbedrijf → toerisme volgt kalender (bouwvak, schoolvakantie, feestdagen), niet weekdag. Za 10 aug 2025 zegt méér over za 10 aug 2026 dan do 14 aug 2025 (zelfde weekdag) zou zeggen. Uitzondering: als de datum vorig jaar > 3 dagen van dezelfde weekdag afwijkt (bv. zon vs woe) is de vergelijking scheef; dan schuif ik ±3 dagen naar dichtstbijzijnde zelfde weekdag. **Rapporteer:** ik bevestig deze regel expliciet en toon voor {vandaag=vr 10 jul 2026} welke datum uit 2025 wordt gekozen.

**Guard bij ontbrekende historie:** als `prev_van < (min(werkdag) uit uren_dagen)` of `< '2025-07-01'` (afhankelijk van welke eerder is) → RPC's retourneren `NULL` voor vorige-periode-velden. Frontend toont "—" met tooltip *"geen vergelijkbare periode vorig jaar"*.

**Shortcuts uitzonderen:** de knoppen "Gisteren / Vorige week / Vorig weekend" moeten zelf hun p_mode niet triggeren via `f_vorige_periode` als vorig-jaar-vergelijker. Ik voeg een nieuwe mode toe: `dag_prev_week` / `week_prev_week` / `weekend_prev` die de oude "periode-ervoor"-logica behouden. Frontend (waar deze shortcuts periode zetten) geeft die mode expliciet mee.

**Labels:** overal waar nu "t.o.v. vorige periode" of vergelijkbaar staat, wordt het label opgebouwd uit `prev_van/prev_tot`:
- 1-dag: *"t.o.v. 10 jul 2025"*
- Maand: *"t.o.v. juli 2025"*
- Jaar: *"t.o.v. 2025"*
- Custom range: *"t.o.v. 1-10 jul 2025"*
- Ontbrekend: *"— (geen vergelijkbare periode vorig jaar)"*

Locaties waar labels leven: `CijfersMetricsBar.tsx`, `CijfersVestigingSplit.tsx`, `CijfersHoofdgrafiek.tsx`, `BijgewerktRegel.tsx` — ik lees ze alle vier vóór ik schrijf.

**Verificatie (rapporteer):** roep `rpc_cijfers_samenvatting` aan voor drie cases en toon `periode` + `vorige_periode` + totaal-omzet-vergelijk:
1. Custom 1-10 jul 2026 → moet prev = 1-10 jul 2025
2. Mode maand, juli 2026 → prev = juli 2025
3. Mode jaar, 2026 → prev = 2025
4. Custom 1-5 jun 2025 → moet NULL (buiten historie: 1-5 jun 2024 hebben we niet)

Plus: de sprint-D-preferentie in `mem://` update ik zodat toekomstige sessies de nieuwe regel kennen.

---

## Rapportage-volgorde naar jou

1. Stap 1 uitgevoerd → 1-dag-steekproef do 9 jul.
2. Stap 2 uitgevoerd → nieuwe lijst week 6-10 juli met uur-clusters én dag-signalen, jij herkent.
3. Stap 3 uitgevoerd → uurcurve 1-10 juli, getallen per uur + piek.
4. Stap 4 uitgevoerd → 4 vergelijkingscases + label-check + geheugen-update.

Geen UI-swap tussendoor die jouw akkoord nodig heeft — de UI-swap voor de v2-loze-uren-lijst uit de vorige sprint blijft afhankelijk van jouw eerdere "herken je dit?"-oordeel; die staat los.

## Technische details (voor referentie, niet-technische lezer mag overslaan)

- Migratie 1: nieuwe versie `rpc_cijfers_loze_uren_v2` — ritme-CTE's krijgen `WHERE werkdag BETWEEN (p_tot - 84) AND p_tot`; rest ongewijzigd.
- Migratie 2: zelfde functie krijgt tweede tak (UNION ALL) voor `signaal_type='dag'` op basis van `dure_dagen`-CTE met `NOT EXISTS (uur_sig ...)`. Return-signatuur uitbreiden met `signaal_type text`.
- Migratie 3: `f_vorige_periode` uitbreiden met nieuwe modes en `custom` naar -1 jaar sturen; guard toevoegen (`prev_van := NULL` als vóór historie-min).
- Frontend: `Cijfers.tsx` moet bij shortcut-clicks de juiste `_prev_week`-modes doorgeven; alle RPC-callers labels aanpassen.
- Types-file wordt automatisch geregenereerd na migraties.
