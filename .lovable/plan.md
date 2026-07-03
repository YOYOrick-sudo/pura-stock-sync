
# Plan — Stap 2: iPad-accounts naar `staff`

**Voorwaarde:** dit plan wordt pas uitgevoerd nadat jij de 8 verificatiestappen van de Team-sprint groen hebt gemeld. Tot dan: niet bouwen.

## Doel

De twee gedeelde tablet-accounts afwaarderen van hun huidige rol naar `staff`, zonder dat de dagelijkse iPad-workflows breken (afvinken FohTasks, stickers printen, recepten bekijken, storing melden).

- `puramidsland@puravidafoodbar.nl` → `staff` op locatie **Midsland**
- `purawestkeuken@puravidafoodbar.nl` → `staff` op locatie **West**

## Schema-check (verplicht vóór DB-werk)

Bevestigen vóór de migratie:

1. `user_roles`-rijen voor beide accounts — huidige `role`, `location`, `is_active`.
2. Enum `app_role` bevat `staff` (zou moeten sinds de Team-sprint-migratie — dubbelcheck).
3. Of `owner`-rol elders nog vereist is (mag niet — er blijven twee owner-rijen voor Yorick over West+Midsland; check dat we geen laatste owner van een locatie afhalen).
4. RLS-policies op de tabellen die de iPad gebruikt (foh_tasks, foh_daily_templates, sticker_producten, recipes, maintenance_tickets) — check dat `staff` daar minimaal read/insert heeft waar nodig.

Bevindingen rapporteren, **STOP + ASK** bij twijfel, pas daarna migratie.

## Wijziging

Eén migratie: update van de twee `user_roles`-rijen naar `role='staff'`. Geen schemawijziging, geen policy-wijziging in deze stap.

## Smoke-test (aantoonbaar, niet alleen benoemen)

Per account uitvoeren, screenshots/logs terug:

| # | Account | Actie | Verwacht |
|---|---------|-------|----------|
| 1 | puramidsland | Login → landing | `/mijn/dashboard` (staff-view), géén Settings in sidebar |
| 2 | puramidsland | FohTasks: taak afvinken + uitvinken | Werkt, sort_order behouden |
| 3 | puramidsland | Sticker printen (sticker_producten bump) | Print-job aangemaakt |
| 4 | puramidsland | Recept openen | Zichtbaar, read-only |
| 5 | puramidsland | Storing melden (maintenance ticket) | Ticket aangemaakt |
| 6 | puramidsland | Poging /settings te openen | Redirect / 403 |
| 7 | purawestkeuken | 1–6 herhalen op locatie West | Idem |

Als één stap faalt → **STOP + ASK**, geen workaround erin frommelen.

## Buiten scope

- Deel B (PINs → has_role) — komt daarna, apart plan.
- Overige rol-toewijzingen.
- HR-rol integratie in rollen-UI (blijft zoals nu, per jouw beslissing).

## Werkwijze

1. Wachten op jouw "verificatie groen"-signaal.
2. Schema-check uitvoeren en terugkoppelen.
3. Migratie voorleggen ter goedkeuring.
4. Na akkoord: uitvoeren + smoke-test met bewijs.
5. Volledige rapportage terug voordat we deel B openen.
