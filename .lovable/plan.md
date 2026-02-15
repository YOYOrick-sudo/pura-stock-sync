

# Plan: Employee Documents Tabel Migration

## Huidige Situatie

De drie tabellen `schedules`, `time_registrations` en `leave_requests` bestaan al in de database met correcte kolommen en RLS policies. Alleen de vierde tabel `employee_documents` ontbreekt.

## Wat wordt aangemaakt

### 1. Tabel: `employee_documents`

| Kolom | Type | Details |
|-------|------|---------|
| id | uuid | PK, default gen_random_uuid() |
| user_id | uuid | FK auth.users(id), NOT NULL |
| type | text | NOT NULL, check in ('contract','id','certificate','other') |
| file_url | text | NOT NULL |
| file_name | text | NOT NULL |
| uploaded_by | uuid | FK auth.users(id) |
| expires_at | date | nullable |
| created_at | timestamptz | default now() |

### 2. RLS Policies op `employee_documents`

- **SELECT eigen documenten**: medewerkers zien hun eigen documenten (`auth.uid() = user_id`)
- **SELECT locatie**: managers/owners/admins zien documenten van medewerkers in hun locatie (via `is_manager_same_location`)
- **INSERT**: managers/owners/admins kunnen documenten uploaden
- **UPDATE**: managers/owners/admins kunnen documenten bewerken
- **DELETE**: managers/owners/admins kunnen documenten verwijderen

## Geen verdere wijzigingen

Er worden geen frontend wijzigingen doorgevoerd. De bestaande drie tabellen worden niet aangepast.

