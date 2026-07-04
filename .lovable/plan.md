# Lichte "Auth-page" achtergrond doorvoeren – 3 fases

Doel: overal de frisse lichte tint (#F5F4F2 canvas, #FAFAF8 cards) gebruiken die nu al op de Auth-pagina en het Dashboard staat, en zorgen dat sidebar, cards én invoervelden goed op elkaar aansluiten (geen "clay" gevoel meer, geen spierwitte contrasten).

## Fase 1 – Design tokens & globale basis
Eén bron van waarheid in `src/index.css` zodat de rest automatisch meebeweegt.

- `--background` / `--app-canvas`: `45 8% 95%` (#F5F4F2) – bevestigen.
- `--card` / `--popover`: `40 5% 98%` (#FAFAF8) – iets warmer dan puur wit, past bij canvas.
- `--muted`: `40 5% 95%` afstemmen op canvas zodat hover/secondary vlakken niet "vuil" ogen.
- `--sidebar-bg`: van puur wit (`0 0% 100%`) naar `40 5% 98%` (#FAFAF8) zodat sidebar dezelfde toon krijgt als de cards.
- `--sidebar-hover`: iets warmer grijs dat matcht met canvas (`45 8% 93%`).
- `--border`: iets warmer/zachter (`40 6% 88%`) zodat lijnen niet blauwig ogen tegen de warme achtergrond.
- Shadow tokens ongewijzigd houden (blijven subtiel, werken op deze tint).

Resultaat: 90% van de app trekt automatisch bij, want overal worden `bg-background`, `bg-card`, `bg-sidebar` etc. gebruikt.

## Fase 2 – Hardcoded kleuren opsporen en vervangen
Alle plekken waar puur wit, `#FFFFFF`, `bg-white`, `#EBEAE6` of oude clay-tinten hardcoded staan vervangen door tokens (`bg-card`, `bg-background`, `bg-muted`).

Te controleren gebieden:
- `src/pages/Auth.tsx` – al #F5F4F2, controleren of alles token-based kan.
- `src/components/polar/Sidebar.tsx` – header toggle knop (`hover:bg-white/60`) → `hover:bg-muted`.
- `src/components/polar/*` (KPICard, FormCard, Header, Dialog, Table, Tooltip, Alert) – witte vlakken naar `bg-card`.
- `src/components/dashboard/*` (HandoverCard, WasteCalendarCard, IdeaBox, TerschellingEventsCard, WasteAlertBanner, WeatherWidget) – controleren op `bg-white` / hex.
- `src/components/SidebarLayout.tsx`, `src/components/AppSidebar.tsx`, `src/components/NotificationsDropdown.tsx`.
- HR / Personeel / Kitchen / Maintenance / FOH modules (`src/components/hr/*`, `src/components/personeel/*`, `src/components/kitchen/*`, `src/components/maintenance/*`, `src/components/foh/*`, `src/components/service/*`).
- Pagina's onder `src/pages/*` (Kassa, Kassatelling, KasControle, Voorraad, Settings, TakenAdmin, TakenBeheer, HomeHub, personeel/*, kitchen/*, hr/*, foh/*, service/*, maintenance/*).

## Fase 3 – Invoervelden, dialogen & afstemming
De formulier- en overlay-laag laten matchen zodat inputs niet fel wit "gaten" worden.

- `src/components/ui/input.tsx` en `src/components/ui/textarea.tsx`: `bg-background` → `bg-card` (of nieuw `bg-input-surface` token) zodat inputs subtiel oplichten tegen canvas maar niet spierwit zijn.
- `src/components/ui/select.tsx`, `command.tsx`, `dropdown-menu.tsx`, `popover.tsx`, `dialog.tsx`, `sheet.tsx`, `drawer.tsx`, `calendar.tsx`, `alert-dialog.tsx`: controleren dat ze `bg-popover` / `bg-card` gebruiken en niet hardcoded wit.
- `src/components/polar/DatePicker.tsx`, `TimePicker.tsx`, `Dialog.tsx`, `Textarea.tsx`.
- Focus-ring en border kleuren van inputs iets zachter (`--input` afstemmen op nieuwe border-tint).
- Visuele controle via Playwright screenshots op: Dashboard, Auth (referentie), FOH Taken, Kassatelling, Personeel > Wonen, Kitchen > Recepten, HR Inbox, Maintenance. Vergelijken dat sidebar, cards en inputs dezelfde familie vormen.

## Technische aanpak
- Fase 1 = alleen `src/index.css` (light mode; dark mode ongemoeid).
- Fase 2 = `rg -n "bg-white|#FFFFFF|#EBEAE6|#F7F6F4|bg-\[#"` om hardcoded gevallen te vinden, per module vervangen door tokens.
- Fase 3 = `src/components/ui/*` en `src/components/polar/*` inputs/overlays; daarna Playwright verificatie.
- Na elke fase build + snelle visuele check voordat we door naar de volgende gaan.

Laat me weten of ik zo mag starten met **Fase 1**.
