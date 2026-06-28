## Doel
De sidebar (links, `PolarSidebar`) een strakkere, rustigere uitstraling geven zonder functionaliteit te wijzigen. Eén consistent visueel ritme met de rest van de app (grijze achtergrond, zachte accenten, groene `--primary`).

## Wijzigingen (uitsluitend `src/components/polar/Sidebar.tsx`)

### 1. Naadloos met de body
- Achtergrond `bg-card` → `bg-background` (zelfde grijs als de header en main, geen kleurverschil bij de scheidingslijn).
- Rechter `border-r border-border` weghalen; in plaats daarvan een subtiele inset shadow rechts (`shadow-[inset_-1px_0_0_hsl(var(--border)/0.6)]`) zodat de scheiding fluisterend is i.p.v. een harde lijn.

### 2. Header rustiger
- Hoogte 84 → **72px** (matcht header van content).
- Onderste border weghalen — de hele sidebar is één rustig vlak.
- Logo iets kleiner schalen (53px → 44px) zodat er meer ademruimte ontstaat.
- **Het belletje (notificatie-icoon) verwijderen uit de header.** De header toont alleen het logo en de inklap-knop.
- Collapse-knop subtieler: `hover:bg-muted/60`, icon-stroke 1.5.

### 3. Nav-items: minimaal, hoog signaal
- Item-hoogte 48 → **44px**, font 17 → **15px** met `font-medium` op actief, `font-normal` op rest.
- Border om actief item weg (`border border-border` → géén border). Actieve staat wordt:
  - lichte `bg-primary/8` achtergrond
  - **2px verticaal accent-streepje links** in `bg-primary` (rounded-full), 18px hoog, gecentreerd — dat is het herkenningspunt
  - tekst in `text-foreground`, icoon in `text-primary`
- Hover op niet-actief: `hover:bg-muted/50` (geen border-shift), 150ms transition.
- Icon stroke 1.5 → **1.75** voor iets meer presence; size 20px (collapsed 22px) blijft.
- Padding tussen items 8 → **4px** (rustiger ritme).

### 4. Sectie-label (optioneel maar aanbevolen)
- Klein uppercase labeltje "Menu" boven de navigatie (`text-[11px] tracking-wider text-muted-foreground/70 font-medium`, 12px margin-bottom). Geeft structuur zonder zwaarte. Alleen tonen wanneer niet-collapsed.

### 5. Footer
- `border-t` weghalen, vervangen door 16px padding-top + dezelfde sidebar-bg. Theme-toggle blijft op z'n plek.

### 6. Collapsed-modus
- Breedte 64 → **68px** (iets meer ademruimte rond iconen).
- Actief item in collapsed: alleen het 2px linker-accent-streepje + zachte `bg-primary/8`, geen border.
- Tooltips: huidige `bg-foreground text-background` vervangen door `bg-card text-foreground border border-border shadow-md` — past beter bij de lichte UI.

## Wat NIET verandert
- Geen wijziging in `AppSidebar.tsx` (behalve het niet meer doorgeven van `headerSlot`), geen wijziging in `SidebarLayout.tsx`, geen routing.
- Geen wijziging in tokens (`index.css`, `tailwind.config.ts`) — alles via bestaande semantic tokens (`bg-background`, `bg-primary/8`, `text-muted-foreground`, etc.).
- Geen nieuwe deps, geen animaties anders dan de bestaande 150–200ms transitions.
- Donkere modus blijft automatisch werken (alle waarden via tokens).

## Rollback
Pure CSS-refactor in één bestand. Bij twijfel revert van `src/components/polar/Sidebar.tsx` is voldoende.