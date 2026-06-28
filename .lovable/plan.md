Compacte ChatGPT-stijl zwevende card-rail bouwen voor `PolarSidebar`.

## Wijzigingen — alleen `src/components/polar/Sidebar.tsx`

**Container**
- Breedte 230px (collapsed 60px), niet meer 280px
- App-rand: 12px marge rondom (`m-3`) → losse card-look
- Witte achtergrond, `border border-border`, `rounded-lg`, `shadow-sm`
- Geen `inset shadow` border-right meer

**Header (44px)**
- Compacter: 44px hoog, klein logo links, collapse-knop rechts (`PanelLeft`, 14px)
- Subtiele `border-b border-border` + lichte `bg-muted/30`

**Nav rows (28px hoog)**
- `text-[12px] font-medium`
- Icon 16px, `text-muted-foreground/60`
- Hover: `bg-muted/50` full-row, `rounded`
- Active: `bg-muted` + icoon krijgt `text-primary` (groen accent), tekst `text-foreground`
- Geen pill, geen linkerstreepje meer
- Sectiekopjes: `text-[9px] uppercase tracking-widest text-muted-foreground/60`, gegroepeerd in "Overzicht" (Dashboard, Taken) en "Beheer" (Kassatelling, Onderhoud, Settings, Statistieken)

**Footer**
- Compacte 28px-rij voor ThemeToggle in dezelfde stijl
- `border-t border-border bg-muted/30`

## Wat blijft

- Alle props, alle items, collapse-gedrag, tooltips in collapsed-state
- `AppSidebar.tsx` ongewijzigd (sectiegroepering wordt in `PolarSidebar` zelf bepaald op basis van item-titel — Settings/Statistieken/Kassatelling/Onderhoud naar "Beheer", rest naar "Overzicht")
- Dark mode via bestaande tokens (`bg-card`, `border-border`, `bg-muted`) → werkt automatisch

## Niet aangeraakt

- `AppSidebar.tsx`, code-dialogs, routing, auth, ThemeToggle component zelf