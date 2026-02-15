

# Plan: Bouw /mijn/profiel en /mijn/rooster pagina's

## Overzicht

Twee nieuwe pagina's bouwen voor de personeelsapp, volledig conform het Pura Vida OS v6.0 design system. Beide vervangen de huidige placeholder pagina's.

---

## Pagina 1: EmployeeProfile.tsx (/mijn/profiel)

### Layout
- SidebarLayout wrapper (bestaand patroon)
- Page header: "Mijn Profiel" (24px/700 Instrument Sans)
- 2-kolom grid: `grid-template-columns: 2fr 1fr`, gap 24px
- Responsive: 1 kolom op mobile

### Linker kolom - Profiel bewerken
- **Avatar sectie**: 80px circle avatar met camera-icoon upload overlay
- **Formulier** met 6 velden in 2-kolom grid (gap 16px):
  - Voornaam, Achternaam (rij 1)
  - Telefoon, Geboortedatum (rij 2)
  - Nationaliteit, Noodcontact (rij 3)
- Labels: 13px/500 Inter, 6px gap boven veld
- Inputs: 36px hoogte, 14px radius, border 1px #C1C5CF, focus ring orange
- Opslaan knop: rechts uitgelijnd, bg #E27726, hover #C9630E, radius 16px

### Rechter kolom - Info cards
- **Contract info card** (radius 20px, border #D5D8E0):
  - Rijen: Contract type, Startdatum, Locatie, Rol
  - Data uit `user_roles` tabel (contract_type, hired_date, location, role)
- **Documenten card**:
  - Lijst van `employee_documents` voor huidige user
  - Per document: file_name + type badge + download link (ExternalLink icoon)
  - Empty state als geen documenten

### Data
- Profiel laden/opslaan via `profiles` tabel (user_id = auth.uid())
- Contract info via `user_roles` tabel
- Documenten via `employee_documents` tabel
- INSERT policy ontbreekt op profiles -- migratie nodig om `Users can insert own profile` toe te voegen

---

## Pagina 2: EmployeeSchedule.tsx (/mijn/rooster)

### Layout
- SidebarLayout wrapper
- Page header: "Mijn Rooster" (24px/700 Instrument Sans)

### Weeknavigatie
- Flex row: Vorige week (chevron left) + "Deze week" reset knop + Volgende week (chevron right)
- Huidige weeknummer en datumbereik als subtitel

### Weekweergave
- Verticale lijst van 7 dagen (Ma t/m Zo)
- Elke dag is een card (radius 20px, border #D5D8E0):
  - **Datum header**: "Maandag 17 feb" -- bold + primary kleur als vandaag
  - **Dienst blok**: start-eind tijd, shift_type badge (pill), locatie, pauze info
  - **Vrij**: lichtgrijze tekst "Vrij"
  - **Verlof**: badge met type verlof (vakantie/ziek/bijzonder)

### Dienst Ruil
- "Ruil aanvragen" knop bij elke dienst
- Modal: selecteer collega (dropdown van schedules op zelfde dag/locatie)
- Maakt swap request aan (schedule status -> 'swapped' met status 'pending')

### Verlof Aanvragen
- "Verlof aanvragen" knop bovenaan
- Modal met: type (select: vakantie/ziek/bijzonder), van datum, tot datum, reden (textarea)
- Insert in `leave_requests` tabel

### Data
- Query `schedules` WHERE user_id = auth.uid() voor geselecteerde week
- Query `leave_requests` WHERE user_id = auth.uid() voor dezelfde periode
- Join met `profiles` voor collega-namen bij ruil

---

## Wijzigingen in bestaande bestanden

### App.tsx
- Import EmployeeProfile en EmployeeSchedule
- Vervang MijnPlaceholder op `/mijn/profiel` route door EmployeeProfile
- Vervang MijnPlaceholder op `/mijn/rooster` route door EmployeeSchedule

### Database migratie
- Voeg INSERT policy toe op `profiles` tabel zodat users hun eigen profiel kunnen aanmaken:
  ```sql
  CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  ```

---

## Technische details

### Nieuwe bestanden
1. `src/pages/mijn/EmployeeProfile.tsx` -- profiel pagina
2. `src/pages/mijn/EmployeeSchedule.tsx` -- rooster pagina

### Design compliance checklist
- Inputs: 36px, radius 14px, border #C1C5CF, focus ring rgba(226,119,38,0.2)
- Cards: radius 20px, border 1px #D5D8E0, bg white
- Buttons: primary #E27726, hover #C9630E, radius 16px, geen gradient, geen hover lift, press scale(0.97)
- Badges: pill radius 9999px, 12px font
- Labels: 13px/500 Inter boven velden, 6px gap
- Typography: Instrument Sans voor titels, Inter voor body, Geist Mono voor data
- Spacing: 4px grid, secties 40px gap
- Empty states conform design system
- Loading: skeleton states voor content

