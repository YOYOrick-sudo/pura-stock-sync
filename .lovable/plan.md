

# Plan: Verbeter /mijn/rooster (EmployeeSchedule.tsx) met Dienst Ruil

## Overzicht

De bestaande EmployeeSchedule pagina heeft al weeknavigatie, dag-cards met dienst/verlof info, en een verlof aanvraag modal. Wat nog ontbreekt is de **Dienst Ruil** functionaliteit. Dit plan voegt die feature toe en verwijdert de dubbele wrapper div.

---

## 1. Database: Nieuwe `shift_swap_requests` tabel

Een nieuwe tabel om ruilverzoeken op te slaan:

```text
shift_swap_requests
- id (uuid, PK)
- requester_id (uuid, ref profiles.user_id)
- target_user_id (uuid, ref profiles.user_id)
- schedule_id (uuid, ref schedules.id)
- target_schedule_id (uuid, nullable, ref schedules.id)
- status (text, default 'pending') -- pending/approved/rejected
- message (text, nullable)
- created_at (timestamptz)
- decided_at (timestamptz, nullable)
- decided_by (uuid, nullable)
```

RLS policies:
- Medewerkers kunnen hun eigen swap requests lezen en aanmaken
- Target user kan de request zien
- Managers kunnen alles lezen en status updaten

---

## 2. Wijzigingen aan `src/pages/mijn/EmployeeSchedule.tsx`

### Bug fix
- Verwijder de dubbele `<div style={{ maxWidth: '1200px' }}>` wrapper (regel 144-145)

### Nieuwe feature: "Ruil aanvragen" knop
- Per dag-card met een dienst: toon een kleine ghost button `ArrowLeftRight` icoon + "Ruil" tekst
- Alleen zichtbaar als de dag in de toekomst is
- Knop opent een **Ruil Modal**

### Ruil Modal
- Design system modal: radius 24px, backdrop blur, z-310
- Header: "Dienst ruilen" (16px/600 Instrument Sans)
- Body:
  - Toon de geselecteerde dienst info (datum, tijd, type)
  - Query `schedules` voor dezelfde datum + locatie, exclusief eigen user
  - Toon lijst van collega's met hun dienst als selectable items
  - Optioneel: bericht textarea
- Footer: Annuleren (secondary) + "Ruil aanvragen" (primary)
- Insert in `shift_swap_requests` tabel

### Swap request status indicatie
- Als er een pending swap request is voor een dienst, toon een kleine "Ruil aangevraagd" pill badge (warning kleur) naast de dienst info

---

## 3. Geen wijzigingen aan routing of layout

De route `/mijn/rooster` en EmployeeLayout wrapper bestaan al en werken correct.

---

## Technische details

### Componenten
- Ruil modal: inline in EmployeeSchedule.tsx, zelfde patroon als bestaande verlof modal
- Ghost button voor ruil: 28px hoogte, radius 14px, tekst #4A4F5E, hover bg #F1F3F5
- Collega selectie: radio-style lijst met avatar + naam + diensttijd
- Badge "Ruil aangevraagd": pill, bg #FEF3C7, text #B45309, 12px

### Data queries
- Bestaande queries voor schedules en leave_requests blijven ongewijzigd
- Nieuwe query: `shift_swap_requests` WHERE requester_id = auth.uid() voor pending swaps
- Nieuwe query (in modal): `schedules` WHERE date = selected_date AND user_id != auth.uid(), join profiles voor namen
- Mutation: insert shift_swap_request

### Design compliance
- Modal: radius 24px, backdrop rgba(15,19,24,0.5) + blur(4px), z-310
- Buttons: primary #E27726, secondary white + border, ghost transparent
- Badges: pill radius 9999px, 12px font
- Inputs: radius 14px, height 36px
- Cards: radius 20px, border 1px #D5D8E0
- Focus ring: 0 0 0 2px rgba(226,119,38,0.2)
- Geen gradients, geen hover lift

