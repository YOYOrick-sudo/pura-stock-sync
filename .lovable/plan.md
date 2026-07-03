# Polish: Theme toggle + Sidebar (enterprise finish)

Scope: puur UI/presentatie in `src/components/ThemeToggle.tsx` en `src/components/polar/Sidebar.tsx`. Geen navigatie/logica wijzigingen, geen data/RLS.

## 1. ThemeToggle als 3-segment pill (Auto / Licht / Donker)

Vervang de losse "Auto / Licht / Donker" cycle-knop door een strakke segmented control (zoals Linear / Vercel):

- Container: `inline-flex` pill met `bg-muted/60`, `rounded-full`, `p-0.5`, `border border-border/60`.
- Drie iconen-knoppen naast elkaar: `Monitor` (Auto), `Sun` (Licht), `Moon` (Donker), elk 28×28, `rounded-full`.
- Actief segment: `bg-card`, `text-foreground`, subtiele `shadow-sm` + `ring-1 ring-border/40`.
- Inactieve segmenten: `text-muted-foreground` → hover `text-foreground`.
- Tooltip per segment met label ("Automatisch volgen", "Lichte modus", "Donkere modus").
- Klik zet direct de mode (geen cycle meer) — sneller en duidelijker.

Compacte variant (voor als sidebar smaller wordt): props `compact?: boolean` waarmee alleen iconen tonen; niet-compact toont icoon + kort label voor actief segment.

## 2. Sidebar collapsed state — betere verhoudingen

Huidig: 64px breed, iconen 20px, items 44×44 gecentreerd. Voelt te smal en "krap" bij een 84px header.

Wijzigingen in `src/components/polar/Sidebar.tsx`:

- Collapsed breedte: **64 → 76px** (betere verhouding t.o.v. 230px expanded en 84px header).
- Icon items collapsed: `h-11 w-11` → `h-12 w-12`, iconen 20 → 22px, `rounded-xl`.
- Actief item collapsed: linker accent-bar (3px, `bg-primary`, `rounded-r-full`) links van het item, plus `bg-primary/10`. Geeft directe visuele hiërarchie zoals Linear/Notion.
- Header collapsed: PV-monogram vervangen door **cropped logo-mark** (gebruik hetzelfde logo maar `h-8 w-8 object-cover object-left`), gecentreerd. Consistenter dan tekst "PV".
- Header hoogte gelijk in beide states (84px) — nu al zo, laten staan.
- Collapsed toggle-rij: verwijder de losse border-b rij; verplaats toggle naar de **footer** (net als bij Vercel/Linear) zodat de collapsed sidebar één rustige kolom is. Expanded: toggle blijft rechtsboven.
- Groepen-scheiding collapsed: dunne `border-t border-border/40` met 8px marge tussen `overzicht / keuken / beheer` (nu geen visuele scheiding meer als labels verborgen zijn).
- Tooltip collapsed: iets meer padding (`px-3 py-2`), `text-[13px]`, `font-medium`, +8px offset naar rechts.

## 3. Sidebar expanded — kleine finish

- Item hoogte 44 → 42px voor iets rustiger ritme.
- Actief item: linker accent-bar (3px `bg-primary`, `rounded-r-full`, `absolute left-0`) i.p.v. alleen kleurvlak → strakker, enterprise.
- Section-labels: letter-spacing `tracking-[0.08em]`, 10px, `text-muted-foreground/60`.
- Footer met ThemeToggle: `py-2.5` i.p.v. vaste `h-9`, `justify-between` zodat pill netjes past + collapse-knop rechts.

## 4. Footer layout (beide states)

Expanded footer:
```
[ ⚙ Auto | ☀ | 🌙 ]              [ ⇤ ]
```
Collapsed footer:
```
       [ ⇥ ]
```
(Theme toggle verborgen in collapsed; icon-only variant zou te druk zijn in 76px.)

## Techniek / bestanden

- `src/components/ThemeToggle.tsx` — rewrite naar segmented pill met `compact` prop.
- `src/components/polar/Sidebar.tsx` — width/heights/actief-bar/collapsed-header/toggle-positie.
- `src/components/AppSidebar.tsx` — footerSlot geeft `<ThemeToggle />` (expanded) door; toggle-knop naar footer verhuizen gebeurt binnen `PolarSidebar` zelf.
- Geen nieuwe deps, alleen bestaande shadcn `Tooltip` + Tailwind tokens (respecteert dark/light).

## Verificatie

- Preview op desktop (1440) en tablet (1024) checken: expanded 230px, collapsed 76px, geen layout-shift bij toggle.
- Dark mode + light mode: actief accent-bar, pill contrast, tooltip.
- Klik op elk segment van de pill → thema wijzigt direct; hover states zichtbaar.
- Toggle in collapsed footer werkt en uitklappen keert terug naar 230px.
