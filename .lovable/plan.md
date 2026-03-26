

# Dashboard cards upgraden en gelijktrekken

## Probleem

De cards op het dashboard hebben nu inconsistente styling:
- KPI cards: `rounded-polar-lg`, geen border, inline shadow
- Weather widget: eigen inline styles met border
- Handover card: `rounded-polar-lg`, geen border
- Ideeënbus: `rounded-[20px]`, geen border

## Aanpak

Eén uniforme card-stijl voor alle dashboard widgets:

| Eigenschap | Nieuw |
|-----------|-------|
| Background | `#F6F7DD` |
| Border | `1px solid rgba(27, 120, 103, 0.12)` (subtiel groen) |
| Border-radius | `20px` (consistent) |
| Shadow | `0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)` |
| Hover (klikbare cards) | `shadow-md`, `-translate-y-0.5`, border naar `rgba(27,120,103,0.22)` |
| Padding | `20px` uniform |
| Transition | `all 200ms ease` |

## Bestanden

1. **`src/components/polar/KPICard.tsx`** — Compact variant: border + hover transition toevoegen, radius naar 20px
2. **`src/components/dashboard/WeatherWidget.tsx`** — Zelfde card-stijl, border unificeren
3. **`src/components/HandoverCard.tsx`** — Border toevoegen, radius consistent
4. **`src/components/dashboard/IdeaBox.tsx`** — Border toevoegen, radius consistent
5. **`src/pages/Dashboard.tsx`** — Eventueel wrapper div cleanup

Geen functionele wijzigingen, puur visuele consistentie.

