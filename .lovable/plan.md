

# Plan: /hr/medewerkers (EmployeesPage.tsx) - Medewerkersoverzicht

## Overzicht

Een nieuwe pagina voor managers/owners om alle medewerkers te bekijken, zoeken, filteren en uit te nodigen. Bevat een tabel met profiel- en rolgegevens, een uitnodigingsmodal, en een edge function voor het aanmaken van nieuwe gebruikers.

---

## 1. Edge Function: `invite-employee`

Een nieuwe backend functie die veilig een gebruiker aanmaakt met de Supabase admin API (service role key):

- **Pad**: `supabase/functions/invite-employee/index.ts`
- **Config**: `verify_jwt = false` (we valideren de JWT handmatig in de code)
- **Functionaliteit**:
  1. Valideert dat de aanvrager een manager/owner/admin rol heeft (via service role query op `user_roles`)
  2. Maakt een nieuwe gebruiker aan via `supabase.auth.admin.createUser({ email, password, email_confirm: true })`
  3. Maakt automatisch een `user_roles` record aan (locatie, rol, contract_type, hired_date)
  4. Het `profiles` record wordt automatisch aangemaakt door de bestaande `handle_new_user` trigger
  5. Update het profiel met voornaam/achternaam via een update op `profiles`
  6. Retourneert success of error

- **Beveiliging**: Alleen managers/owners/admins kunnen deze functie aanroepen (gevalideerd server-side)

---

## 2. Database: RLS Policy toevoeging

Profiles tabel heeft momenteel geen SELECT policy voor reguliere users om andere profielen te zien. Managers kunnen al profielen in hun locatie zien via `is_manager_same_location`. Dit is voldoende voor de medewerkerspagina.

Geen extra migratie nodig - de bestaande policies dekken de use case:
- `profiles`: managers zien locatie-profielen via `is_manager_same_location`
- `user_roles`: managers zien rollen in dezelfde locatie

---

## 3. Nieuw bestand: `src/pages/hr/EmployeesPage.tsx`

### Toolbar
- Zoekbalk (max 320px, radius 16px, search icoon links)
- Segmented control: Alle / West / Midsland (bg gray-50, radius 16px, actief=white+shadow)
- Rol filter: dropdown select
- Primary button: "Medewerker uitnodigen" (#E27726, radius 16px, UserPlus icoon)

### Tabel
- Container: card met radius 20px, border 1px #D5D8E0, bg white
- Header: bg #F8F9FA, 11px uppercase #636878, weight 500, tracking 0.05em
- Kolommen: Naam (met 28px avatar circle bg #E27726 + initialen), Email (mono 12px), Locatie, Rol (badge), Contract, Status (success/gray badge), Acties
- Rij hover: bg #FCFCFD
- Acties: pencil icoon (alleen zichtbaar op hover)
- Sorteerbaar op naam, email, locatie
- Paginatie: "1-10 van X" links, prev/next buttons rechts

### Uitnodigen Modal
- Radius 24px, backdrop blur, z-310
- Header: "Medewerker uitnodigen" (16px/600)
- Velden: email, voornaam, achternaam, locatie (select: West/Midsland), rol (select: employee/team_lead/manager/kitchen_staff), contract type (select), startdatum
- Labels boven velden, 6px gap, verplicht = rode asterisk
- Footer: Annuleren (secondary) + Uitnodigen (primary)
- Bij submit: roept de `invite-employee` edge function aan
- Genereert een tijdelijk wachtwoord dat wordt getoond na succesvolle aanmaak

### Loading State
- Skeleton tabel: 5 rijen met avatar circle + text lines

### Empty State
- 52x52 icoon container (Users icoon), bg #F1F3F5, radius 12px
- Titel: "Geen medewerkers gevonden"
- Beschrijving: "Nodig je eerste medewerker uit"
- CTA knop: "Medewerker uitnodigen"

### Data
- Query `profiles` met join op `user_roles` (via user_id)
- Client-side filtering op zoekterm, locatie, rol
- Paginated (10 per pagina)

---

## 4. Routing: `src/App.tsx`

- Nieuwe route: `/hr/medewerkers` met `RoleGuard` voor `['owner', 'manager', 'admin']`
- Wrapped in `SidebarLayout` (zelfde als andere HR pagina's)
- Import en registreer `EmployeesPage`

---

## 5. Barrel export: `src/pages/hr/index.ts`

- Exporteer `EmployeesPage`

---

## Technische details

### Edge function architectuur
- Gebruikt `SUPABASE_URL` en `SUPABASE_SERVICE_ROLE_KEY` (beide al geconfigureerd als secrets)
- CORS headers standaard patroon
- JWT validatie: extract token uit Authorization header, verifieer via `supabase.auth.getUser(token)`
- Admin operatie via service role client

### Query strategie
- Twee queries: `profiles` (voor namen) en `user_roles` (voor rollen/locatie)
- Join client-side op `user_id`
- Filter op `is_active = true` standaard, met optie om inactieve te tonen

### Wachtwoord generatie
- Edge function genereert een random wachtwoord (12 chars, letters+cijfers)
- Wordt eenmalig getoond in een success-state van de modal
- Medewerker kan het later wijzigen via wachtwoord reset

