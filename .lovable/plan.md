
# Afvalkalender Midsland — volledige correctie

3 onafhankelijke fixes in deze volgorde. Geen schema-wijzigingen, geen impact op West.

---

## Fix 1 — Dag-labels in kalenderkaart

**Bug:** `WasteCalendarCard.tsx` r.8 heeft `DAY_NAMES = ['Maa','Din',...,'Zon']` maar gebruikt `getDay()` (0 = zondag). Resultaat: zondag krijgt label "Maa", maandag "Din", enz.

**Fix:** array zondag-eerst:
```ts
const DAY_NAMES = ['Zon', 'Maa', 'Din', 'Woe', 'Don', 'Vri', 'Zat'];
```
Kolomvolgorde (Ma→Zo) blijft ongewijzigd.

---

## Fix 2 — Sluit-taak op gesloten dagen

**Regel:** Midsland is gesloten ma + di (uitzondering: 15 + 16 juni 2026 wél open). Sluit-taak "container aan de weg" moet op laatste open dag vóór ophaal.

| Ophaaldag | Sluit-taak op |
|---|---|
| Maandag | zondag ervoor |
| Dinsdag | zondag ervoor |
| Woensdag | zondag ervoor (di gesloten) |
| Donderdag | woensdag |
| Vrijdag | donderdag |
| Zaterdag | vrijdag |
| Zondag | zaterdag |

**Implementatie** in `supabase/functions/generate-waste-tasks/index.ts`:
- Helper `previousOpenDayMidsland(pickupDate)` die terugloopt tot een open dag (gesloten = ma/di, behalve `2026-06-15` en `2026-06-16`).
- Sluit-taak generatie zoekt nu pickups in de komende 7 dagen, en plaatst de taak op `previousOpenDayMidsland(pickup_date)` i.p.v. altijd `today` voor `pickup_date = tomorrow`.
- Idempotent: alleen inserten als `sluit_task_id IS NULL` voor die pickup.
- Tussen-taak (container terug) blijft ongewijzigd — wordt aangemaakt op de ophaaldag zelf; valt de ophaal op gesloten dag, dan komt er die week geen tussen-taak (correct: er is niemand om container terug te halen).

---

## Fix 3 — Pickup-data Midsland vervangen (vandaag t/m 31‑12‑2026)

**Verificatie uitgevoerd:**
- TST-data (Bedrijfsafval ma/wo/vr, Glas di, Papier do): klopt al → niet aanraken.
- Gemeente-data: structureel ~6 dagen te vroeg in DB. Volledig vervangen.

### Nieuwe gemeente-pickups (uit jouw 3 schema's)

**Restafval** (di): 21 mei · 4+18 jun · 2+16+30 jul · 13+27 aug · 10+24 sep · 8+22 okt · 5+19 nov · 3+17+31 dec

**GFT** (di, klein tuinafval + zomervariant samengevoegd): 26 mei · 2+9+16+23+30 jun · 7+14+21+28 jul · 4+11+18+25 aug · 1+8+15+22+29 sep · 6+13+20+27 okt · 10+24 nov · 8 dec

**Papier** (wo): 27 mei · 24 jun · 22 jul · 19 aug · 16 sep · 14 okt · 11 nov · 9 dec

### Uitvoering (in deze volgorde, 1 transactie per stap)
1. **DELETE** `waste_pickups WHERE location='Midsland' AND source='gemeente' AND pickup_date >= CURRENT_DATE` — alleen gemeente, TST blijft staan.
2. **INSERT** alle nieuwe gemeente-pickups hierboven (43 records).
3. **Trigger** `generate-waste-tasks` (mode=generate) zodat sluit-taken opnieuw worden geplaatst volgens nieuwe data + Fix 2 logica.
4. **Verificatie-query** die per maand telt: gemeente vs TST pickups, en pickups zonder bijbehorende sluit-taak.

---

## Volgorde van uitvoering
1. Fix 1 (1-regel UI-wijziging) — direct zichtbaar
2. Fix 2 (edge function + deploy) — sluit-taken kloppen voortaan
3. Fix 3 (DELETE + INSERT + regenerate) — data klopt voortaan

Daarna pak ik (apart) de andere dashboard-aanpassingen op (kaarten kleiner).

## Technische notities
- Geen migrations nodig — alleen data-mutaties en functie-update.
- Bestaande sluit-taken die nu op verkeerde datum staan, worden door regenerate-stap NIET automatisch verplaatst voor TST (die data is correct). Voor gemeente verdwijnen ze impliciet via DELETE → CASCADE op pickup. Edge function maakt nieuwe sluit-taken aan op de juiste datum.
- 2027 staat los; valt onder bestaand "Afvalschema 2027 sync" geheugen.
