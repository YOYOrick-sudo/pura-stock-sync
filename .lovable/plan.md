

# Plan: Bouw /rooster (RoosterPage.tsx) - Management Roosterweergave

## Overzicht

Een nieuwe management-pagina voor het weekrooster, alleen toegankelijk voor managers, owners en admins. Toont alle medewerkers van een locatie in een horizontaal weekgrid met gekleurde dienstblokken.

---

## Nieuw bestand: `src/pages/RoosterPage.tsx`

### Layout
- SidebarLayout wrapper (bestaand patroon)
- Page header: "Rooster" (24px/700 Instrument Sans) + beschrijving "Plan en beheer diensten per week."
- Toolbar:
  - Links: weeknavigatie (ChevronLeft + "Deze week" + ChevronRight) + weeknummer/datumbereik
  - Rechts: locatie filter (select, via user_roles locaties) + "Dienst toevoegen" knop (primary)

### Weekweergave (horizontale tabel/grid)
- Container: card met radius 20px, border 1px #D5D8E0, overflow hidden
- Header rij: bg #F8F9FA, kolommen "Medewerker" + Ma t/m Zo (met datum, 11px uppercase)
- Rijen: per medewerker
  - Eerste kolom: avatar (28px circle, primary bg, initialen) + naam (13px Inter)
  - Dag-kolommen: dienstblokken als gekleurde pills
    - Ochtend: bg #DBEAFE, text #1D4ED8
    - Middag: bg #FEF3C7, text #B45309
    - Avond: bg #FFF7ED, text #A5500D
    - Dubbel: bg #DCFCE8, text #15803D
    - Lege cel: klikbaar (+ icoon, hover bg #F8F9FA), opent modal met datum/medewerker vooringevuld
  - Dienstblok toont: tijden (Geist Mono 11px) + shift_type pill
  - Klik op bestaand blok: opent modal in edit-modus

### "Dienst toevoegen" Modal
- Modal: radius 24px, shadow-xl, max-width 480px
- Header: "Dienst toevoegen" (16px/600), border-bottom
- Body velden (2-kolom grid, gap 16px):
  - Medewerker (select dropdown van profiles in locatie)
  - Datum (date input)
  - Starttijd + Eindtijd (time inputs)
  - Pauze in minuten (number input)
  - Type (select: ochtend/middag/avond/dubbel)
  - Notities (textarea)
- Footer: Annuleren (secondary) + Opslaan (primary, #E27726)
- Labels: 13px/500 Inter, 6px gap boven veld
- Inputs: 36px hoogte, 14px radius

### Empty State
- Wanneer geen medewerkers of schedules: centered empty state
- Icoon: CalendarDays in 48x48 container (bg #F1F3F5, radius 12px)
- Titel: "Geen diensten ingepland"
- Beschrijving: "Voeg diensten toe om het rooster te vullen."
- CTA: "Dienst toevoegen" knop

### Loading State
- Skeleton tabel: 5 rijen met avatar circle + text placeholders per kolom

### Data
- Query `schedules` WHERE location = geselecteerde locatie AND date binnen weekbereik
- Join met `profiles` via user_id voor medewerker namen/initialen
- Query `user_roles` WHERE location = geselecteerde locatie AND is_active = true voor medewerkerlijst
- Insert nieuwe schedules via supabase met created_by = auth.uid()
- Gebruiker's eigen locatie als default locatie filter (via `user_roles`)

---

## Wijzigingen in bestaand bestand: `src/App.tsx`

- Import RoosterPage
- Nieuwe route `/rooster` met RoleGuard voor `['owner', 'manager', 'admin']`

---

## Wijzigingen in bestaand bestand: `src/components/SidebarLayout.tsx`

- Voeg '/rooster': 'Rooster' toe aan de `titles` map in `getPageTitle`

---

## Wijzigingen in bestaand bestand: `src/components/AppSidebar.tsx`

- Voeg "Rooster" nav item toe aan de sidebar met CalendarDays icoon, link naar `/rooster`

---

## Geen database wijzigingen nodig

De `schedules` tabel bestaat al met de juiste kolommen en RLS policies:
- Managers kunnen schedules aanmaken, updaten en verwijderen
- Managers kunnen schedules van hun locatie bekijken via `is_manager_same_location`

---

## Technische details

### Design compliance
- Cards: radius 20px, border 1px #D5D8E0
- Tabel header: bg #F8F9FA, 11px uppercase #636878, weight 500, letter-spacing 0.05em
- Inputs: 36px hoogte, radius 14px, border #C1C5CF, focus ring orange
- Buttons: primary #E27726, hover #C9630E, radius 16px, geen gradient, geen hover lift
- Modal: radius 24px, backdrop blur(4px), rgba(15,19,24,0.5)
- Badges/pills: radius 9999px, 12px font
- Typography: Instrument Sans titels, Inter body, Geist Mono tijden
- Spacing: 4px grid, secties 40px gap
- Tabel rij hover: bg #FCFCFD
- Lege cellen: hover bg #F8F9FA met + icoon

### Responsief
- Desktop: volledige weekweergave
- Tablet: horizontaal scrollbaar
- Mobile: dag-voor-dag cards (vergelijkbaar met EmployeeSchedule)

