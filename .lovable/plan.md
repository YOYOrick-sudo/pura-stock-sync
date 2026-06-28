## Probleem
De sidebar scrollt mee met de pagina-content. Dit komt doordat de `sticky`-positionering op de `<aside>` zit, maar de parent-wrapper in `SidebarLayout.tsx` zelf meescrollt binnen de flex-container. Sticky werkt alleen binnen de scroll-context van de directe parent.

## Oplossing

### 1. Sidebar sticky/fixeren (hoofdfix)
In `SidebarLayout.tsx`: de wrapper `<div>` om `AppSidebar` krijgt:
- `position: sticky`
- `top: 0`
- `height: 100vh`
- `align-self: flex-start`

Dit zorgt dat de hele sidebar-colom vast blijft staan terwijl de rechtercontent (`<main>`) scrolt.

### 2. Logo groter
- `AppSidebar.tsx`: logo van `h-[28px]` naar `h-[36px]`
- `PolarSidebar.tsx`: header van `52px` naar `60px` zodat het niet krap staat

### 3. Navigatie-rijen groter
- `PolarSidebar.tsx`: rij-hoogte `h-9` (36px) → `h-10` (40px)
- Tekst `text-[13px]` → `text-[14px]`
- Iconen `18px` → `20px`
- Ruimere padding tussen rijen

### 4. Sectie-kopjes leesbaarder
- Headers "Overzicht"/"Beheer" van `10px` → `11px`
- Iets meer ruimte boven de headers

## Bestanden
- `src/components/SidebarLayout.tsx` — sticky wrapper fix
- `src/components/AppSidebar.tsx` — logo hoogte
- `src/components/polar/Sidebar.tsx` — rijen, tekst, iconen, header

## Niet in scope
- Geen functionaliteit wijzigen
- Geen kleuren of thema-tokens aanpassen
- Geen mobile sheet-gedrag wijzigen