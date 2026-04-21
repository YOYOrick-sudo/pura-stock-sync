

# Fix: Personeel pagina te breed / horizontaal scrollend

## Probleem
De Tijdlijn rendert intern een ~10.000px brede track-area. Die zou alleen binnen de Tijdlijn-card moeten scrollen, maar nu duwt hij de hele pagina breder. Oorzaak: flex-children krijgen default `min-width: auto`, waardoor de scroll-container van de Tijdlijn zijn parents (main, wrapper-div, layout-flex) laat uitdijen in plaats van zelf te scrollen.

## Oplossing — 3 kleine fixes

**1. `src/components/SidebarLayout.tsx`** — main-content kolom moet kunnen krimpen en mag zelf niet horizontaal scrollen:
- Op de wrapper `<div className="flex flex-col flex-1">` toevoegen: `min-w-0 overflow-x-hidden`
- Op `<main>` toevoegen: `min-w-0`

**2. `src/pages/personeel/PersoneelLayout.tsx`** — outer wrapper en outlet-container clampen:
- Buitenste div: `min-w-0 overflow-hidden` toevoegen
- Outlet wrapper: `min-w-0` toevoegen

**3. `src/pages/personeel/Tijdlijn.tsx`** — root van de timeline-card moet de beschikbare breedte respecteren:
- Root: `w-full max-w-full min-w-0` toevoegen aan de bestaande classes

Resultaat: de hele pagina is exact even breed als het content-gebied (geen page-level horizontale scroll). De Tijdlijn-tracks scrollen netjes intern binnen hun eigen card, zoals bedoeld.

## Omvang
3 bestanden, alleen className-aanpassingen. Geen logica-wijzigingen.

