
# Finaal Plan: HR & Huisvesting Systeem

## Verwerkte Aanpassingen

1. **Status model vereenvoudigd** - `first_contact_done` verwijderd, contact-acties gaan naar log
2. **Owner en next_action_at verplicht** - Database constraints + UI validation
3. **Housing aan candidate gekoppeld** - Niet aan application
4. **Capacity trigger met overlap check** - Periode-aware constraint
5. **Document generatie uitgebreid** - Channel en content snapshot toegevoegd
6. **Inbox definities aangescherpt** - Null next_action bij niet-final = achterstallig
7. **Styling details verwijderd** - Geen hex codes, Polar design system wordt hergebruikt
8. **Auth per gebruiker** - Supabase auth met admin/hr rollen

---

## Database Architectuur

### Tabellen

```text
CANDIDATES (persoon - blijft bestaan over seizoenen)
├── id                 uuid, PK
├── first_name         text, NOT NULL
├── last_name          text, NOT NULL
├── email              text
├── phone              text
├── date_of_birth      date, nullable
├── nationality        text, nullable
├── cv_url             text, nullable
├── notes              text, nullable
├── created_at         timestamptz
└── updated_at         timestamptz

APPLICATIONS (proces per seizoen/locatie/functie)
├── id                 uuid, PK
├── candidate_id       uuid, FK -> candidates, NOT NULL
├── season             text
├── position           text, NOT NULL
├── target_location    text (West / Midsland)
├── source             text
├── status             application_status enum, NOT NULL
├── priority           integer, default 2
├── ─────────────────────────────────────────────────
├── WORKFLOW VELDEN
├── owner_user_id      uuid, FK -> auth.users (verplicht bij niet-final status)
├── next_action_type   text
├── next_action_at     timestamptz (verplicht bij niet-final status)
├── last_contact_at    timestamptz
├── ─────────────────────────────────────────────────
├── ONBOARDING CHECKLIST
├── housing_required   boolean, default false
├── housing_arranged   boolean, default false
├── onboarding_docs_sent boolean, default false
├── house_rules_sent   boolean, default false
├── contract_signed    boolean, default false
├── start_date         date, nullable
├── ─────────────────────────────────────────────────
├── created_at         timestamptz
├── updated_at         timestamptz
└── created_by         uuid, FK -> auth.users

APPLICATION_STATUS_LOG
├── id                 uuid, PK
├── application_id     uuid, FK -> applications
├── previous_status    text, nullable
├── new_status         text
├── action_type        text (call, whatsapp, email, interview_scheduled, etc.)
├── notes              text, nullable
├── changed_by         uuid, FK -> auth.users
└── created_at         timestamptz

ACCOMMODATIONS
├── id                 uuid, PK
├── name               text, NOT NULL
├── address            text
├── location           text (West / Midsland)
├── capacity           integer, NOT NULL
├── description        text, nullable
├── amenities          text[], nullable
├── house_rules_template_id  uuid, FK, nullable
├── is_active          boolean, default true
├── created_at         timestamptz
└── updated_at         timestamptz

ACCOMMODATION_ASSIGNMENTS (gekoppeld aan CANDIDATE, niet application)
├── id                 uuid, PK
├── accommodation_id   uuid, FK -> accommodations
├── candidate_id       uuid, FK -> candidates (GEWIJZIGD)
├── start_date         date, NOT NULL
├── end_date           date, nullable
├── status             text (active / ended), default 'active'
├── notes              text, nullable
├── created_at         timestamptz
└── created_by         uuid, FK -> auth.users

DOCUMENT_TEMPLATES
├── id                 uuid, PK
├── name               text, NOT NULL
├── type               text (onboarding / house_rules / contract)
├── location           text, nullable
├── accommodation_id   uuid, FK, nullable
├── content            text (Markdown met placeholders)
├── is_active          boolean, default true
├── created_at         timestamptz
└── updated_at         timestamptz

SENT_DOCUMENTS (uitgebreid)
├── id                 uuid, PK
├── application_id     uuid, FK -> applications
├── template_id        uuid, FK -> document_templates
├── channel            text (email / whatsapp / download) (NIEUW)
├── generated_content  text (snapshot van gegenereerde tekst) (NIEUW)
├── document_url       text, nullable
├── sent_at            timestamptz
├── sent_by            uuid, FK -> auth.users
└── acknowledged_at    timestamptz, nullable
```

### Application Status Enum (Vereenvoudigd)

```sql
CREATE TYPE application_status AS ENUM (
  'received',              -- Sollicitatie ontvangen (initieel)
  'screening',             -- CV wordt beoordeeld
  'interview_scheduled',   -- Interview ingepland
  'trial_scheduled',       -- Proefdienst ingepland
  'offer_sent',            -- Voorstel verstuurd
  'hired',                 -- FINAL: Aangenomen
  'rejected',              -- FINAL: Afgewezen
  'reserve'                -- FINAL: Reserve lijst
);
```

Contact-acties (bellen, WhatsApp, mail) worden NIET als status opgeslagen maar alleen gelogd in `application_status_log`.

### Database Constraints voor Verplichte Velden

```sql
-- Check constraint: owner en next_action verplicht bij niet-final status
ALTER TABLE applications ADD CONSTRAINT check_workflow_fields
CHECK (
  status IN ('hired', 'rejected', 'reserve') 
  OR (owner_user_id IS NOT NULL AND next_action_at IS NOT NULL)
);
```

### Capacity Trigger met Overlap Check

```sql
CREATE OR REPLACE FUNCTION check_accommodation_capacity()
RETURNS TRIGGER AS $$
DECLARE
  max_capacity INTEGER;
  overlapping_count INTEGER;
BEGIN
  -- Haal capacity op
  SELECT capacity INTO max_capacity 
  FROM accommodations 
  WHERE id = NEW.accommodation_id;
  
  -- Tel overlappende actieve assignments in dezelfde periode
  SELECT COUNT(*) INTO overlapping_count 
  FROM accommodation_assignments 
  WHERE accommodation_id = NEW.accommodation_id 
    AND status = 'active'
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    -- Overlap check: bestaande assignment overlapt met nieuwe periode
    AND (
      -- Bestaande heeft geen end_date (loopt door)
      (end_date IS NULL AND (NEW.end_date IS NULL OR NEW.start_date <= NEW.end_date))
      OR
      -- Bestaande heeft end_date, check overlap
      (end_date IS NOT NULL AND NEW.start_date <= end_date 
       AND (NEW.end_date IS NULL OR NEW.end_date >= start_date))
    );
  
  IF overlapping_count >= max_capacity THEN
    RAISE EXCEPTION 'Accommodation is at full capacity for this period';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_accommodation_capacity
BEFORE INSERT OR UPDATE ON accommodation_assignments
FOR EACH ROW EXECUTE FUNCTION check_accommodation_capacity();
```

### Bezetting View

```sql
CREATE VIEW accommodation_occupancy AS
SELECT 
  a.id,
  a.name,
  a.location,
  a.capacity,
  COUNT(aa.id) FILTER (WHERE aa.status = 'active') as current_occupancy,
  a.capacity - COUNT(aa.id) FILTER (WHERE aa.status = 'active') as available_spots
FROM accommodations a
LEFT JOIN accommodation_assignments aa 
  ON a.id = aa.accommodation_id
  AND aa.status = 'active'
  AND (aa.end_date IS NULL OR aa.end_date >= CURRENT_DATE)
GROUP BY a.id, a.name, a.location, a.capacity;
```

---

## Toegangsbeheer

- `hr` rol toevoegen aan bestaande `app_role` enum
- Elke HR gebruiker krijgt eigen Supabase account
- RLS: alleen `admin` of `hr` heeft toegang tot HR tabellen
- Accountability: owner_user_id linkt naar echte gebruiker

---

## Routes

```text
/hr                    -> HR Inbox (hoofdscherm)
/hr/applicants         -> Volledige kandidatenlijst
/hr/applicants/:id     -> Kandidaat/Application detail
/hr/applicants/new     -> Nieuwe kandidaat + sollicitatie
/hr/housing            -> Housing planner
/hr/housing/:id        -> Woonruimte detail
/hr/templates          -> Document templates beheer
```

---

## UI Schermen

### A) HR Inbox (Hoofdscherm)

Drie tabs met harde definities:

| Tab | Query |
|-----|-------|
| Nieuw | `owner_user_id IS NULL` |
| Vandaag | `next_action_at::date = CURRENT_DATE` |
| Achterstallig | `(next_action_at < NOW() OR next_action_at IS NULL) AND status NOT IN ('hired', 'rejected', 'reserve')` |

Snelle stats onderaan:
- Aantal openstaand
- Interviews deze week
- Vrije slaapplaatsen

### B) Kandidaat Detail met Action Bar

Action Bar bevat knoppen die automatisch:
1. Log item aanmaken met action_type
2. `last_contact_at` updaten
3. Status wijzigen indien relevant
4. Modal tonen voor next_action_at (verplicht bij niet-final)

**Acties en hun effect:**

| Knop | Log Type | Status Update | Next Action Suggestie |
|------|----------|---------------|----------------------|
| Bel gedaan | call | - | +3 dagen |
| WhatsApp | whatsapp | - | +1 dag |
| Mail verstuurd | email | - | +3 dagen |
| Gesprek gepland | interview_scheduled | -> interview_scheduled | Gesprek datum |
| Proefdienst gepland | trial_scheduled | -> trial_scheduled | Proefdienst datum |
| Voorstel versturen | offer_sent | -> offer_sent | +5 dagen |
| Aangenomen | hired | -> hired | - (final) |
| Afgewezen | rejected | -> rejected | - (final) |
| Reserve | reserve | -> reserve | - (final) |

**Onboarding sectie** (alleen zichtbaar bij status = hired):
- Huisvesting toggle + toewijzen button
- Document genereren knoppen
- Contract status checkbox
- Startdatum picker

### C) Housing Planner

Tijdlijn-based view per woonruimte:
- Maanden op x-as
- Bewoners als horizontale balken
- Vrije periodes duidelijk zichtbaar
- Capaciteit indicator per woning
- Filter op locatie en beschikbaarheid

Bij toewijzen vanuit kandidaat:
- Modal toont alleen woningen met vrije capaciteit in gewenste periode
- Overlap wordt automatisch geblokkeerd door database trigger

### D) Document Generatie

Bij genereren:
1. Template selecteren
2. Placeholders worden ingevuld
3. Preview tonen
4. Channel kiezen (email/whatsapp/download)
5. Bij verzenden: snapshot opslaan in `generated_content`

Placeholders:
- `{candidate_name}`, `{candidate_first_name}`
- `{start_date}`, `{position}`
- `{location_name}`
- `{accommodation_name}`, `{accommodation_address}`

---

## Bestandsstructuur

```text
src/
├── pages/hr/
│   ├── HrInbox.tsx
│   ├── ApplicantDetail.tsx
│   ├── ApplicantForm.tsx
│   ├── HousingPlanner.tsx
│   ├── HousingDetail.tsx
│   ├── HousingForm.tsx
│   └── TemplatesManager.tsx
│
├── components/hr/
│   ├── ActionBar.tsx
│   ├── NextActionModal.tsx
│   ├── OnboardingChecklist.tsx
│   ├── ActivityLog.tsx
│   ├── HousingAssignModal.tsx
│   ├── DocumentGenerateModal.tsx
│   ├── InboxCard.tsx
│   ├── OccupancyTimeline.tsx
│   └── InboxTabs.tsx
│
├── hooks/hr/
│   ├── useCandidates.ts
│   ├── useApplications.ts
│   ├── useAccommodations.ts
│   ├── useActivityLog.ts
│   ├── useDocuments.ts
│   └── useInboxCounts.ts
│
└── types/hr.ts
```

---

## Implementatie Fases

### Fase 1: Database Setup
- Migratie voor alle tabellen met correcte constraints
- `application_status` enum
- `hr` rol toevoegen aan `app_role`
- Capacity trigger met overlap check
- Bezetting view
- RLS policies
- Storage bucket `hr-documents`

### Fase 2: Kandidaten & Applications
- TypeScript types
- CRUD hooks
- ApplicantForm met validation (owner + next_action verplicht)
- ApplicantDetail basis

### Fase 3: HR Inbox & Workflow
- HrInbox met 3 tabs
- InboxCard component
- useInboxCounts hook
- ActionBar met alle acties
- NextActionModal (verplicht bij niet-final)
- ActivityLog
- Constraint enforcement in UI

### Fase 4: Housing Planner
- useAccommodations met bezetting query
- HousingPlanner met tijdlijn
- OccupancyTimeline component
- HousingAssignModal met periode check
- HousingForm en HousingDetail

### Fase 5: Onboarding & Documenten
- OnboardingChecklist (alleen bij hired)
- TemplatesManager
- DocumentGenerateModal met channel selectie
- Content snapshot opslaan
- useDocuments hook

### Fase 6: Navigatie & Afronding
- AppSidebar uitbreiden (hr rol check)
- Routes in App.tsx
- Rol-based access check
- Testing workflows

---

## Technische Samenvatting

| Onderdeel | Aanpak |
|-----------|--------|
| Status model | 8 statussen, contact-acties naar log |
| Workflow enforcement | Database constraint + UI validation |
| Housing koppeling | Aan candidate, niet application |
| Capacity check | Trigger met datum overlap logica |
| Documenten | Channel + content snapshot opslaan |
| Inbox tabs | Nieuw/Vandaag/Achterstallig met harde queries |
| Toegang | Supabase auth per gebruiker, admin/hr rollen |
