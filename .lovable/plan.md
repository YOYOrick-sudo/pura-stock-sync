

# Warm Gray doorvoeren — DEFINITIEVE volledige lijst

## Alle bestanden met hardcoded kleuren (exclusief ColorPreview die verwijderd wordt)

### Stap 1: CSS tokens (`src/index.css`)
- `--background`: `220 14% 96%` → `40 6% 96%` (#F5F5F4)
- `--muted`: → `40 6% 93%`
- `--sidebar-hover`: afstemmen op warm gray

### Stap 2: Legacy kleuren per bestand

| # | Bestand | Legacy hex | rgba() | Actie |
|---|---------|-----------|--------|-------|
| 1 | `src/components/OrderDashboard.tsx` | ~60 (`#FEFFF1`, `#282E3A`, `#1B7867`, `#E27726`) | 5 (shadows) | Volledig → Tailwind tokens |
| 2 | `src/pages/kitchen/InternalOrders.tsx` | ~48 (`#FEFFF1`, `#F6F7DD`, `#282E3A`, `#73747B`, `#1B7867`) | 12 (`rgba(197,...)`, `rgba(27,...)`, `rgba(217,...)`) | Volledig → theme tokens |
| 3 | `src/pages/StyleGuide.tsx` | ~74 (`#FEFFF1`, `#F6F7DD`, `#282E3A`, `#73747B`, `#1B7867`) | 12 (`rgba(197,...)`, `rgba(255,...)`) | Volledig → theme tokens |
| 4 | `src/pages/DesignPreview.tsx` | ~16 (`#FEFFF1`, `#F6F7DD`, `#282E3A`, `#1B7867`) | 0 | → theme tokens |
| 5 | `src/pages/DesignSystem.tsx` | ~6 (`#1B7867` in swatches) | 0 | Swatch waarden updaten |
| 6 | `src/pages/MidslandOrders.tsx` | 0 | 7 (`rgba(0,0,0,...)` shadows, `rgba(27,120,103,...)`, `rgba(197,...)`, `rgba(217,...)`) | rgba borders → `hsl(var(--border))`, shadows mogen blijven |
| 7 | `src/pages/Kassa.tsx` | 0 | ~13 | rgba borders → tokens, shadows OK |
| 8 | `src/pages/KassatellingOverdag.tsx` | 0 | ~13 | rgba borders → tokens, shadows OK |
| 9 | `src/pages/kitchen/KitchenMenu.tsx` | 4 (`#1B7867`, `#E27726`, `#5BA5C8`, `#9B87B5`) | 0 | → `text-primary` etc. |
| 10 | `src/components/WaveBackground.tsx` | 3 (`#1B7867`) | 0 | → `fill-primary` |
| 11 | `src/components/polar/SetupCard.tsx` | 6 (`#FEFFF1`, `#F6F7DD`, `#282E3A`, `#73747B`, `#1B7867`) | 0 | → theme tokens |
| 12 | `src/components/polar/FormCard.tsx` | 0 | 1 (`rgba(197,...)`) | → `hsl(var(--border))` |
| 13 | `src/components/polar/Tooltip.tsx` | 0 | 1 (shadow) | Mag blijven (shadow) |
| 14 | `src/components/dashboard/AIWeatherAdvisor.tsx` | 0 | 2 (shadows) | Mogen blijven (shadows) |
| 15 | `src/components/maintenance/*.tsx` | 0 | 6 (shadows) | Mogen blijven (shadows) |

### Stap 3: Opruimen
- Verwijderen: `src/pages/ColorPreview.tsx`
- Route `/kleur-preview` uit `src/App.tsx` verwijderen

### Stap 4: Verificatie
- Type-check (`tsc --noEmit`)
- Geen logica-wijzigingen

## Vervangingsregels
- `#FEFFF1` → `hsl(var(--card))` / `bg-card`
- `#F6F7DD` → `hsl(var(--secondary))` / `bg-secondary`
- `#282E3A` → `hsl(var(--foreground))` / `text-foreground`
- `#73747B` → `hsl(var(--muted-foreground))` / `text-muted-foreground`
- `#1B7867` → `hsl(var(--primary))` / `text-primary` / `bg-primary`
- `#E27726` → `hsl(var(--warning))` / `text-warning`
- `rgba(197,197,202,*)` → `hsl(var(--border))`
- `rgba(27,120,103,*)` → `hsl(var(--primary) / opacity)`
- `rgba(0,0,0,*)` in box-shadows → **blijven** (kleur-neutraal)

## Totaal
- **15 bestanden** gecontroleerd
- **12 bestanden** worden aangepast
- **1 bestand** wordt verwijderd
- ~600 kleurwaarden worden gemigreerd
- Puur visueel, geen functionaliteit wijzigt

