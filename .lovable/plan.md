## Sidebar Redesign

Fix de schaal-mismatch en lege ruimte in de sidebar zodat deze professioneel en consistent oogt.

### Problemen
1. Logo (44px) is te groot ten opzichte van compacte nav-tekst (12px)
2. Grote leegte tussen laatste item en footer
3. Header voelt zwaar door groot groen logo boven ijle body
4. Rij-hoogte (28px) is té compact voor touch en oogt krap

### Wijzigingen — `src/components/polar/Sidebar.tsx` + `src/components/AppSidebar.tsx`

**Logo**
- Terug naar de crop met subtitel (Pura Vida Terschelling)
- Hoogte: **28px** max (in plaats van 44px)
- Lichtere kleur, minder dominerend

**Header-rij**
- Hoogte: **52px** (nu 44px)
- Padding: 14px horizontaal
- Collapse-knop: 16px icoon, niet 14px (huidige is te klein)
- Background: `bg-muted/20` in plaats van `bg-muted/30`
- Geen border-bottom meer — subtiele schaduw onder de header

**Nav-rijen**
- Hoogte: **36px** (nu 28px)
- Tekst: **13px**, font-medium (nu 12px)
- Iconen: **18px** (nu 16px)
- Padding: 10px horizontaal
- Gap tussen items: **4px** (nu 0.5 = ~2px)
- Hover: `bg-muted/40`, `rounded-lg`
- Active: `bg-muted` + icoon **primary** + tekst **foreground**

**Sectiekopjes**
- Tekst: 10px (nu 9px), uppercase, tracking-wider
- Kleur: `text-muted-foreground/50` (iets lichter)
- Margin-top boven sectie: 12px in plaats van 0

**Footer (ThemeToggle)**
- Terug naar compacte rij-stijl in dezelfde 36px-hoogte als nav items
- Padding: 10px horizontaal
- Geen losse border-top meer — subtiele `border-t border-border/50`
- Icoon + label "Auto/Licht/Donker" in 13px

**Container**
- Margin blijft `12px` rondom
- `rounded-lg` blijft
- `shadow-sm` iets zichtbaarder maken zodat de card wel "los" staat van de achtergrond

**Wat niet aangeraakt wordt**
- Alle routing, auth, dialogs
- Sectiegroepering (Overzicht / Beheer)
- Collapse-gedrag en tooltips
- ThemeToggle logica zelf

### Technisch
- Aanpassingen puur in presentatie-componenten
- Geen nieuwe dependencies
- Geen database-wijzigingen
- Dark mode blijft werken via bestaande tokens