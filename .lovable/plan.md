
# Plan: Bouw /hr/verlof (LeavePage.tsx) - Verlofaanvragen Management

## Overzicht

Een nieuwe pagina voor HR/managers om alle verlofaanvragen te beheren. Toont een tabel met filtermogelijkheden, segmented control voor status, en goedkeur/afwijs acties.

---

## Nieuw bestand: `src/pages/hr/LeavePage.tsx`

### Layout
- SidebarLayout wrapper
- Page header: "Verlofaanvragen" (24px/700 Instrument Sans) + beschrijving "Beheer verlofaanvragen van medewerkers." (14px Inter #636878)

### Toolbar
- Links: zoekbalk (max 320px, radius 16px, search icoon)
- Rechts: segmented control met 4 opties: Alle / Openstaand / Goedgekeurd / Afgewezen
  - Segmented: bg #F8F9FA, border 1px #EAECF0, radius 16px, padding 3px
  - Actief segment: bg white + shadow, radius 14px

### Tabel
- Container: card radius 20px, border 1px #D5D8E0, overflow hidden, bg white
- Header: bg #F8F9FA, 11px uppercase #636878, weight 500, letter-spacing 0.05em
- Kolommen:
  - **Medewerker**: avatar (28px circle) + naam (13px Inter)
  - **Type**: badge pill -- vakantie (#DBEAFE/#1D4ED8 info), ziek (#FEE2E2/#B91C1C error), bijzonder (#FEF3C7/#B45309 warning)
  - **Van**: datum dd-mm-yyyy (Geist Mono 12px)
  - **Tot**: datum dd-mm-yyyy (Geist Mono 12px)
  - **Dagen**: berekend aantal (Geist Mono 12px)
  - **Reden**: tekst 13px, truncated
  - **Status**: badge pill -- pending=warning "Openstaand", approved=success "Goedgekeurd", denied=error "Afgewezen"
  - **Acties**: Goedkeuren (soft button) + Afwijzen (ghost/danger) -- alleen bij pending status
- Rij hover: bg #FCFCFD, 0.08s transition
- Sorteerbaar op Van-datum
- Paginatie: links "1-10 van X", rechts prev/next buttons

### Empty State
- Centered, max-width 320px
- Icoon container: 48x48px, bg #F1F3F5, radius 12px, CalendarDays icoon 22px #8D93A0
- Titel: "Geen verlofaanvragen" (14px/500 #303542)
- Beschrijving: "Er zijn nog geen verlofaanvragen ingediend." (13px #636878)

### Loading State
- Skeleton tabel: 5 rijen met avatar circle + text placeholders

### Data
- Query `leave_requests` via `is_manager_same_location(user_id)` policy (automatisch via RLS)
- Join met `profiles` voor medewerker namen en initialen
- Filter op status (client-side of query param)
- Zoeken op medewerker naam (client-side)
- Update status via supabase: `decided_by = auth.uid()`, `decided_at = now()`
- Berekening aantal dagen: `differenceInCalendarDays(end_date, start_date) + 1`

---

## Wijzigingen in bestaande bestanden

### `src/pages/hr/index.ts`
- Export LeavePage component

### `src/App.tsx`
- Import LeavePage
- Nieuwe route `/hr/verlof` met RoleGuard voor `['owner', 'manager', 'admin', 'hr']`

### `src/components/SidebarLayout.tsx`
- Voeg `'/hr/verlof': 'Verlofaanvragen'` toe aan de `titles` map

---

## Geen database wijzigingen nodig

De `leave_requests` tabel bestaat al met:
- Correcte kolommen (user_id, type, start_date, end_date, status, reason, decided_by, decided_at)
- RLS policies: managers kunnen via `is_manager_same_location` bekijken en updaten
- Status waarden: pending, approved, denied

---

## Technische details

### Design compliance
- Cards: radius 20px, border 1px #D5D8E0
- Tabel header: bg #F8F9FA, 11px uppercase #636878, weight 500, letter-spacing 0.05em
- Inputs/zoekbalk: radius 14px (zoekbalk 16px), border #C1C5CF
- Buttons: primary #E27726, soft #FFF7ED, ghost transparent -- geen gradient, geen hover lift
- Badges: radius 9999px, 12px font, vlakke kleuren per variant
- Typography: Instrument Sans titels, Inter body, Geist Mono datums/getallen
- Spacing: 4px grid
- Segmented control: bg gray-50, border gray-100, radius 16px, actief=white+shadow
- Focus ring: 0 0 0 2px rgba(226,119,38,0.2)

### Responsief
- Desktop: volledige tabel
- Mobile: tabel scrollt horizontaal of wordt omgezet naar cards
