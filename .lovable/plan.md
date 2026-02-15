
# Plan: EmployeeSidebar + EmployeeLayout voor /mijn/* routes

## Overzicht

Een aparte, compactere sidebar voor de personeelsapp (/mijn/* routes) met eigen navigatie-items, plus een EmployeeLayout wrapper die de huidige SidebarLayout vervangt voor alle /mijn/* routes.

---

## Nieuw bestand: `src/components/EmployeeSidebar.tsx`

Compactere sidebar gebaseerd op het PolarSidebar patroon, maar met eigen navigatie:

### Navigatie items
- Mijn Dashboard (`/mijn/dashboard`) - Home icoon
- Mijn Rooster (`/mijn/rooster`) - Calendar icoon
- Mijn Taken (`/mijn/taken`) - ListChecks icoon
- Documenten (`/mijn/documenten`) - FileText icoon
- Mijn Profiel (`/mijn/profiel`) - User icoon

### Design (identiek aan bestaande sidebar)
- Breedte: 240px, bg white, border-right 1px #D5D8E0, sticky top, z-50
- Pura Vida logo bovenaan (hergebruik `pura-vida-logo-dark.png`)
- Search bar met Command+K shortcut
- Nav items: height 36px, padding 8px 10px, radius 12px, 13px Inter font
- Actief: bg #FFF7ED, icoon #E27726 stroke-2, tekst #A5500D weight-500
- Inactief: icoon #636878 stroke-1.5, tekst #4A4F5E
- Hover: bg #F8F9FA
- Collapsed state: 64px breed, tooltips, icoon-only
- Geen gradients, geen hover lift
- Gebruikersinfo: ophalen uit profiles tabel (naam + rol) onderaan de sidebar met avatar

---

## Nieuw bestand: `src/components/EmployeeLayout.tsx`

Layout wrapper die EmployeeSidebar + main content combineert:

- Dezelfde structuur als SidebarLayout maar met EmployeeSidebar in plaats van AppSidebar
- PolarHeader met juiste page titels voor /mijn/* routes
- Mobile: hamburger menu met Sheet component
- Main content area: bg #F8F9FA, flex-1, padding responsive
- Titels mapping: `/mijn/dashboard` -> "Mijn Dashboard", `/mijn/rooster` -> "Mijn Rooster", etc.

---

## Wijzigingen in bestaande bestanden

### `src/App.tsx`
- Import EmployeeLayout
- Vervang de individuele /mijn/* route elementen zodat ze EmployeeLayout gebruiken in plaats van SidebarLayout
- De /mijn/* pagina-componenten (MijnDashboard, EmployeeProfile, EmployeeSchedule, MijnPlaceholder) worden gewrapped in EmployeeLayout in plaats van hun eigen SidebarLayout
- Voeg route toe voor `/mijn/documenten` (MijnPlaceholder)

### Pagina's die aangepast worden:
- `src/pages/mijn/MijnDashboard.tsx` -- verwijder SidebarLayout wrapper (wordt door EmployeeLayout afgehandeld)
- `src/pages/mijn/EmployeeProfile.tsx` -- verwijder SidebarLayout wrapper
- `src/pages/mijn/EmployeeSchedule.tsx` -- verwijder SidebarLayout wrapper
- `src/pages/mijn/MijnPlaceholder.tsx` -- verwijder SidebarLayout wrapper als aanwezig

---

## Technische details

### EmployeeSidebar implementatie
- Hergebruikt het PolarSidebar component (dezelfde props interface)
- Hardcoded navigatie items specifiek voor de personeelsapp
- useLocation voor active state detectie
- useNavigate voor navigatie

### EmployeeLayout implementatie
- Vergelijkbaar met SidebarLayout maar met EmployeeSidebar
- Eigen getPageTitle functie voor /mijn/* routes
- Mobile responsive: Sheet met EmployeeSidebar voor hamburger menu
- PolarHeader met titel + optionele menu click handler

### Geen database wijzigingen nodig
Alle benodigde tabellen en policies bestaan al.
