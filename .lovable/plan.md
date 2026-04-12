

# Fix: Logo dark mode + zachter wit + FohTasks rgba cleanup

## Samenvatting
De takenmodule werkt correct — taken laden goed (Open 0/36, Tussen 0/55, Sluit 0/65, Periodiek 5/10 bevestigd via browser). Er zijn drie visuele verbeteringen nodig.

## Wijzigingen

### 1. Logo wisselen in dark mode
**Bestand:** `src/components/AppSidebar.tsx`
- Import `useTheme` uit `@/contexts/ThemeContext`
- Import tweede logo: `pura-vida-logo.png` (lichte variant voor donkere achtergrond)
- Conditioneel renderen: `isDark ? logoLight : logoDark`

### 2. Zachter light mode achtergrond
**Bestand:** `src/index.css`
- `--background` van `210 20% 98%` → `220 14% 96%` (Gray-100, zachter voor de ogen)
- `--muted` eventueel 1 stap donkerder zodat er nog verschil is met background

### 3. Laatste 90 `rgba()` waarden in FohTasks opruimen
**Bestand:** `src/components/foh/FohTasks.tsx`

Batch-vervanging:
- `rgba(27, 120, 103, 0.04-0.08)` → `hsl(var(--primary) / 0.04-0.08)`
- `rgba(0, 0, 0, 0.04-0.15)` → `hsl(var(--foreground) / 0.04-0.15)`
- `rgba(115, 116, 123, 0.08)` → `hsl(var(--muted-foreground) / 0.08)`
- `rgba(197, 197, 202, 0.5-0.7)` → `hsl(var(--border))`
- `rgba(255, 255, 255, 0.2-0.25)` → `hsl(var(--primary-foreground) / 0.2-0.25)`
- Shadow `rgba(0,0,0,0.06-0.15)` mogen blijven — schaduwen zijn kleur-agnostisch

## Omvang
3 bestanden, puur visueel, geen logica-wijzigingen.

