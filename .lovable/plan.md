# Login-stijl doortrekken naar Dashboard, Sidebar & Achtergrond

Doel: dezelfde rustige, "Notion/Linear"-stijl van de inlogpagina consistent maken op het hele hoofdscherm. **Geen bewegende cards of knoppen** (geen `hover:-translate-y`, geen `hover:scale`, geen tilt). Alleen subtiele veranderingen in schaduw, achtergrond of ring op hover — puur voor feedback, zonder verplaatsing.

## De stijl-DNA van de inlogpagina (referentie)
- Achtergrond: warm off-white `#EBEAE6`
- Cards: `bg-card`, `border border-border/60`, `rounded-[20px]`, zachte gelaagde shadow (`0 20px 40px -12px rgba(0,0,0,0.08)` + subtiele tweede laag)
- Chips/knoppen: `bg-white/60`, `border border-border/30`, `rounded-[16px]`, hele lichte shadow
- Selected/active: `bg-primary/10 text-primary ring-1 ring-primary/20`
- Labels: `text-[11px] font-medium text-foreground/45` (geen uppercase, geen tracking)
- Radii: 20px cards, 14-16px knoppen/inputs
- Groen blijft exact zoals nu (`#16A34A`)

---

## Stap 1 — Achtergrond & app-shell (fundament)
Zorg dat het canvas onder alles hetzelfde ademt als de inlogpagina.

- App-achtergrond in `SidebarLayout.tsx` (en Dashboard-wrapper) van huidige `bg-muted`/soft-gray naar **warm off-white `#EBEAE6`**, met dark-mode fallback via bestaande tokens.
- Optioneel: token `--app-canvas` toevoegen in `index.css` zodat we niet hardcoden.
- Border tussen sidebar en content verzachten: `border-border/50` i.p.v. harde `border-border`.
- Top-header (indien aanwezig) transparant maken zodat de canvas doorloopt; alleen een subtiele onderlijn bij scroll.

**Verificatie:** login → dashboard: achtergrondkleur voelt identiek, geen "sprong" bij transitie.

---

## Stap 2 — Sidebar in inlog-stijl (rustig, statisch)
Sidebar krijgt de zachte kaartlook, zonder bewegingen.

- Sidebar-oppervlak: `bg-card` met dezelfde zachte gelaagde shadow als de inlogcard (of alleen rechterrand `border-border/60`), radius alleen aan de binnenkant waar zinvol.
- Menu-items:
  - Inactief: transparante achtergrond, `text-foreground/70`, icon `text-foreground/50`
  - Hover: **alleen** `bg-white/60` + `text-foreground` (geen translate, geen scale)
  - Actief: `bg-primary/10 text-primary ring-1 ring-primary/20 rounded-[14px]` — exact de "selected chip" look van de inloggerknoppen
- Groep-labels ("MAIN", "BEHEER", …): `text-[11px] font-medium text-foreground/45`, **niet** uppercase/tracked.
- Icons: 20px, inline uitgelijnd, `text-current` zodat ze meekleuren met actief-groen.
- Collapse-trigger: subtiele ghost-button, geen shadow-lift.

**Verificatie:** hover over menu-items → geen enkel item beweegt; actieve route toont zachte groene chip identiek aan "Daily" op de inlogpagina.

---

## Stap 3 — Dashboard-cards & KPI's polish
Cards krijgen exact de inlog-cardstijl. **Statisch** — hover geeft hoogstens een iets diepere shadow, geen verplaatsing.

- Alle dashboard-cards (`src/components/dashboard/*`, `HandoverCard`, KPI-tegels):
  - `bg-card border border-border/60 rounded-[20px]`
  - Shadow: `0 20px 40px -12px rgba(0,0,0,0.08), 0 8px 16px -8px rgba(0,0,0,0.04)` (dezelfde token als inlogcard — één keer definiëren als `--shadow-card`)
  - Interne padding ruim: `p-6` minimaal
  - Verwijder alle `hover:-translate-y-*`, `hover:scale-*`, `transition-transform` op cards en knoppen op het dashboard
- Titels binnen cards: `text-[13px] font-medium text-foreground/60` (mini-label boven getal), waarde `text-3xl font-semibold text-foreground`
- Status-badges (success/warning/error): behoud kleuren, maar radius `rounded-[10px]` en `bg-*/10 ring-1 ring-*/20` in plaats van gevulde blokken
- Knoppen op het dashboard: primaire actie `bg-primary text-primary-foreground rounded-[14px]` **zonder** hover-lift (alleen `hover:opacity-90` of `hover:bg-primary/90`); secundaire acties in dezelfde chip-stijl als de inloggerkeuze-buttons (`bg-white/60 border border-border/30`)
- Iconen in cards: 20px voor cardheader, 24px voor grote KPI, altijd inline uitgelijnd met tekst

**Verificatie (screenshots):**
1. Login-pagina naast dashboard: cards, radius, shadow, kleur — visueel identiek DNA.
2. Hover over elke card & knop op dashboard: **geen enkele beweging**, alleen subtiele shadow/opacity feedback.
3. Sidebar actief-item: identieke groene chip als "Daily" selected.

---

## Technische notities
- Nieuwe tokens toevoegen in `src/index.css`:
  - `--app-canvas: 40 20% 94%;` (≈ `#EBEAE6`)
  - `--shadow-card: 0 20px 40px -12px rgba(0,0,0,0.08), 0 8px 16px -8px rgba(0,0,0,0.04);`
  - `--shadow-card-hover: 0 24px 48px -12px rgba(0,0,0,0.10), 0 10px 20px -8px rgba(0,0,0,0.05);` (alleen diepere shadow, geen translate)
- Geraakte bestanden (verwacht): `src/index.css`, `src/components/AppSidebar.tsx`, `src/components/SidebarLayout.tsx`, `src/pages/Dashboard.tsx`, `src/components/HandoverCard.tsx`, `src/components/dashboard/*`.
- Categorie: **UI-only** (geen data/RLS). Groen `#16A34A` blijft exact ongewijzigd.
- Geen framer-motion toevoegen; bestaande motion op deze schermen wordt verwijderd waar het cards/knoppen verplaatst.

Na akkoord voer ik Stap 1 → 2 → 3 uit met screenshot-verificatie na elke stap.
