
# Plan van Aanpak: Restyle Overige Modules naar Pura Vida OS v6.0

## Overzicht

6 modules moeten worden hergestyled om alle legacy kleuren (#1B7867 groen, #FEFFF1 creme, #F6F7DD licht groen, #73747B oud grijs) te vervangen door het v6.0 design system. Elke module krijgt de juiste typografie, radius, spacing en interactieve states.

---

## Fase 1: Kassatelling (HOOG) -- 3 bestanden

### 1.1 `src/pages/Kassatelling.tsx` (106 regels)
- Outer card: `#FFF7ED` wordt `#FFFFFF`, border `#D5D8E0`
- Tab buttons: vervang losse buttons door segmented control (bg `#F8F9FA`, radius 16px, padding 3px, actief=white+shadow)
- maxWidth `1400px` wordt `1200px`

### 1.2 `src/pages/Kassa.tsx` (700 regels) -- Sluit telling
- ~15x `#FEFFF1` wordt `#FFFFFF` (card bg's, input bg's, tabel bg's)
- ~2x `#F6F7DD` wordt `#F1F3F5` (hover states)
- Alle `rgba(197,197,202,0.5)` borders worden `#D5D8E0`
- `#73747B` (labels) wordt `#636878`
- Input bg: `#FEFFF1` wordt `#FFFFFF`
- Tabel header: 11px uppercase `#636878` (was `#73747B`)
- Bedragen: `Geist Mono` font ipv `monospace`
- Submit button disabled kleur: `#D1D5DB` wordt `#C1C5CF`, tekst wit ipv `#FEFFF1`
- maxWidth `1400px` wordt `1200px`
- Success dialog: update bg en kleuren

### 1.3 `src/pages/KassatellingOverdag.tsx` (589 regels) -- Open telling
- Zelfde wijzigingen als Kassa.tsx
- ~10x `#FEFFF1` wordt `#FFFFFF`
- ~6x `#73747B` wordt `#636878`
- Alle `rgba(197,197,202,...)` borders worden `#D5D8E0` / `#EAECF0`
- `monospace` wordt `'Geist Mono', monospace`
- maxWidth `1400px` wordt `1200px`

---

## Fase 2: Interne Bestellingen (HOOG) -- 2 bestanden

### 2.1 `src/pages/kitchen/InternalOrders.tsx` (502 regels)
- ~10x `#1B7867` wordt `#E27726` (active tabs, spinners, status colors, count badges)
- ~8x `#FEFFF1` wordt `#FFFFFF` (card bg's, order item bg's)
- ~5x `#F6F7DD` wordt `#F1F3F5` (hover states, inactive tab bg)
- ~8x `#73747B` wordt `#636878`
- Tab buttons: naar segmented control (bg `#F8F9FA`, radius 16px, actief white+shadow)
- Status `in_transit`/`approved`: kleur `#1B7867` wordt `#3B82F6` (info) of `#E27726` (primary)
- Order card bg: `#FEFFF1` wordt `#FFFFFF`, border `#D5D8E0`
- Spinner: `#1B7867` wordt `#E27726`
- Count badge: `borderRadius 8px` wordt `9999px`, kleuren updaten
- Loading container: `#F6F7DD` wordt `#FFFFFF`
- maxWidth `1400px` wordt `1200px`

### 2.2 `src/components/OrderPreview.tsx` (modal)
- Dialog bg: `#FEFFF1` wordt `#FFFFFF`, radius `20px` wordt `24px`
- ~12x `#1B7867` wordt `#E27726` (table borders, total bg, buttons)
- Gradient `from-[#1B7867]/5 to-[#1B7867]/10` wordt vlakke bg `rgba(226,119,38,0.06)`
- Print button: `border-[#1B7867]` wordt `border-primary`
- Close button: `bg-[#1B7867]` wordt `bg-[#E27726]`, hover `#C9630E`

---

## Fase 3: Keuken - Recepten + MEP (MEDIUM) -- 4 bestanden

### 3.1 `src/components/kitchen/KitchenLayout.tsx` (72 regels)
- Header border: `border-primary/10` wordt `border-[#D5D8E0]`
- Max-width `5xl` wordt `1200px`
- Titel: expliciete `font-display` class, 24px/700

### 3.2 `src/components/kitchen/EmptyState.tsx` (31 regels)
- Icon container: `w-16 h-16 ring-1 ring-primary/10` wordt `w-[52px] h-[52px]` geen ring, bg `#F1F3F5`, border `1px #EAECF0`, radius `20px`
- Icon: `w-8 h-8 text-primary/60` wordt `w-[22px] h-[22px] text-[#8D93A0]`
- Titel: `text-lg` wordt `15px/600 #303542`
- Beschrijving: max-width `300px`, `13px #636878`
- Card padding en shadow aanpassen

### 3.3 `src/pages/kitchen/Recipes.tsx` (77 regels)
- Toolbar card: radius 20px, border `#D5D8E0`
- Zoekbalk: max-width 320px, radius 16px
- Primary button: expliciete `#E27726`, radius 16px
- Recipe cards: radius 20px, border `#D5D8E0`
- Emoji's verwijderen, Lucide iconen gebruiken

### 3.4 `src/pages/kitchen/MepPlanning.tsx` (125 regels)
- Week selector: segmented control style
- Day header: Instrument Sans 18px/600
- Primary button: expliciete kleuren
- Cards: radius 20px, border `#D5D8E0`
- Status badges: pill style (radius 9999px)

### 3.5 `src/pages/kitchen/KitchenTasks.tsx` (116 regels)
- Tabs: segmented control style
- Category badges: v6.0 semantic kleuren
- Emoji's verwijderen
- Cards: radius 20px

### 3.6 `src/pages/kitchen/RecipeDetail.tsx` (81 regels)
- Cards: radius 20px, border `#D5D8E0`
- Stap indicators: radius 12px ipv `rounded-full`, bg `#E27726`
- Badges: pill style

---

## Fase 4: HR Inbox + Sollicitanten (MEDIUM) -- 2 bestanden

### 4.1 `src/pages/hr/HrInbox.tsx` (134 regels)
- Page header: 24px/700 Instrument Sans `#1A1F28`, beschrijving 14px `#636878`
- Stat cards: radius 20px, border `#D5D8E0`, 3px accent bar
- Icon containers: 36x36px radius 12px, vlakke bg
- Tabs: segmented control (bg `#F8F9FA`, radius 16px, actief white+shadow)
- Count badges: pill radius 9999px
- Empty state: v6.0 spec (52x52 icon container)
- max-width naar 1200px, padding 32px/28px

### 4.2 `src/pages/hr/ApplicantDetail.tsx` (186 regels)
- Breadcrumb: 12px met chevronRight separators
- Header: 18px/600 Instrument Sans
- Cards: radius 20px, border `#D5D8E0`, padding 20px
- Icon containers in cards: 36x36px radius 12px
- StatusBadge: pill style
- Content grid: gap 20px

---

## Fase 5: Settings (LAAG) -- 1 bestand

### 5.1 `src/pages/Settings.tsx` (75 regels)
- Page header: 24px/700 Instrument Sans `#1A1F28`
- Cards: radius 20px, border `#D5D8E0`, padding 20px
- Labels: 13px/500 `#636878`
- Values: 13px/500 `#303542`
- Logout button: radius 16px, full danger styling
- max-width `1200px`, padding conform spec

---

## Fase 6: Statistieken/Analytics (LAAG) -- 1 bestand

### 6.1 `src/pages/foh/FohAnalytics.tsx` (367 regels)
- Page header: 24px/700 Instrument Sans
- Periode selector: pill buttons (7D/30D/90D), actief bg `#FFF7ED` text `#A5500D`
- Chart cards: radius 20px, border `#D5D8E0`, header met border-bottom
- Tabel: in card container radius 20px, header bg `#F8F9FA`, 11px uppercase
- Bar chart kleuren: `#E27726` primary, `#8D93A0` secondary
- Badges: pill style
- Export button: secondary style
- Stat cards boven charts: v6.0 stat card spec

---

## Aanvullende bestanden (legacy cleanup)

### `src/pages/MidslandOrders.tsx`
- ~10x `#73747B` wordt `#636878`

### `src/components/polar/Textarea.tsx`
- `#73747B` wordt `#636878`

### `src/components/polar/KPICard.tsx`
- `#73747B` wordt `#636878`

### Diverse polar components (DatePicker, etc.)
- `#73747B` wordt `#636878` waar voorkomend

---

## Technische aanpak

### Per module
1. Volledige rewrite van render output met `// ... keep existing code` voor business logica
2. Kleurvervangingen systematisch: zoek-en-vervang per legacy kleur
3. Typografie: `monospace` wordt `'Geist Mono', monospace`, headings krijgen `font-display`
4. Alle borders: `rgba(197,197,202,0.5)` wordt `#D5D8E0`

### Prioriteitsvolgorde implementatie
1. Kassatelling (Kassa.tsx + KassatellingOverdag.tsx + Kassatelling.tsx)
2. Interne Bestellingen (InternalOrders.tsx + OrderPreview.tsx)
3. Keuken (KitchenLayout, EmptyState, Recipes, MepPlanning, KitchenTasks, RecipeDetail)
4. HR (HrInbox.tsx + ApplicantDetail.tsx)
5. Settings
6. FohAnalytics + MidslandOrders + polar component cleanup

### Geen wijzigingen aan
- Business logica, queries, mutations
- Routing en navigatie
- Data structuren en types
- Supabase integraties
- Hooks en context providers
