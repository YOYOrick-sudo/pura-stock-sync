

# Plan: Bouw /mijn/dashboard (Employee Dashboard)

## Overzicht

Vervang de huidige placeholder MijnDashboard pagina met een volledig persoonlijk dashboard dat de medewerker welkomt en relevante informatie toont: dienst vandaag, weekoverzicht, open taken, en verlofsaldo.

---

## Bestand: `src/pages/mijn/MijnDashboard.tsx` (volledig herschrijven)

### 1. Welkomst Header
- Dynamische begroeting op basis van tijd: "Goedemorgen", "Goedemiddag", of "Goedenavond" + voornaam uit `profiles` tabel
- Subtitel: locatie naam (uit `user_roles`) + huidige datum in Nederlands formaat (bijv. "maandag 17 februari 2026")
- Typography: 24px/700 Instrument Sans titel, 14px Inter #636878 subtitel

### 2. "Mijn dienst vandaag" Card
- Card met radius 20px, border 1px #D5D8E0, shadow-xs
- Query `schedules` WHERE user_id = auth.uid() AND date = vandaag
- **Dienst gevonden**: toon start_time - end_time (Geist Mono 12px), shift_type badge (kleur per type: ochtend=info, middag=warning, avond=primary), locatie
- **Geen dienst**: relaxed icoon (Coffee) in 48x48 container (bg #F1F3F5, radius 12px), "Je hebt vandaag geen dienst" tekst
- **Klok in/uit knop**: Primary button (#E27726), alleen zichtbaar als er een dienst vandaag is
  - Query `time_registrations` WHERE user_id = auth.uid() AND date = vandaag
  - Niet ingeklokt: "Klok in" knop, insert time_registration met clock_in = now()
  - Wel ingeklokt maar niet uitgeklokt: "Klok uit" knop, update clock_out = now()
  - Al uitgeklokt: toon ingeklokte tijden als tekst (geen knop)

### 3. "Deze week" Card
- Mini weekoverzicht: 7 dagen (Ma-Zo) in een horizontale rij
- Per dag: dagnaam (11px uppercase), datum (12px mono), gekleurde dot als er een dienst is
  - Dot kleuren: ochtend=#3B82F6, middag=#F59E0B, avond=#E27726, geen dienst=#EAECF0
  - Vandaag: border ring rond de dag cell
- Onderaan: "Totaal uren deze week" met berekening (Geist Mono, 28px/700 display)
- Query `schedules` WHERE user_id = auth.uid() AND date binnen huidige week (ma-zo)

### 4. "Open taken" Card
- Card titel: "Open taken" (14px/600)
- Query `foh_tasks` WHERE assigned_employee_id IN (foh_employees met matching naam/user) AND completed = false, LIMIT 5
- Per taak: checkbox + titel (13px Inter) + categorie badge (pill, 12px)
- Checkbox: klik = update completed = true, completed_at = now()
- Onderaan: "Bekijk alle taken" link (tekst #E27726, hover underline) naar /mijn/taken
- Empty state als geen taken: "Geen open taken" met check-circle icoon

### 5. "Verlofsaldo" Card (optioneel blok)
- Query `leave_requests` WHERE user_id = auth.uid() AND status = 'approved' AND type = 'vakantie'
- Tel opgenomen dagen (som van date ranges)
- Hardcoded totaal van 25 dagen (standaard NL vakantiedagen)
- Progress bar: height 4px, bg #D5D8E0, fill #E27726, radius full
- Tekst: "X van 25 dagen opgenomen" (13px Inter)
- Als geen verlofdata: toon "Geen verlofgegevens beschikbaar"

### Layout
- 2-kolom grid op desktop: linker kolom (dienst vandaag + weekoverzicht), rechter kolom (open taken + verlofsaldo)
- 1-kolom op mobile
- Gap 16px tussen cards
- Max-width 1200px, margin 0 auto

### Loading State
- Skeleton cards met pulse animatie voor elk blok
- Avatar circle + text lines voor welkomst header

### Data hooks
- `useQuery` voor profile data (voornaam)
- `useQuery` voor user_role (locatie)
- `useQuery` voor schedules vandaag + deze week
- `useQuery` voor open taken
- `useQuery` voor verlof saldo
- `useMutation` voor klok in/uit en taak afvinken

---

## Geen andere bestanden hoeven gewijzigd

De route en layout zijn al geconfigureerd:
- `/mijn/dashboard` route bestaat in App.tsx met EmployeeLayout wrapper
- EmployeeLayout bevat de sidebar en header

## Geen database wijzigingen nodig

Alle benodigde tabellen bestaan al:
- `profiles` (first_name, user_id)
- `user_roles` (location, user_id)
- `schedules` (date, start_time, end_time, shift_type, user_id)
- `foh_tasks` (assigned_employee_id, completed, title, category)
- `leave_requests` (user_id, type, status, start_date, end_date)
- `time_registrations` (user_id, clock_in, clock_out, schedule_id)

