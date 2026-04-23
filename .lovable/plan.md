
# Plan — Personeelsmodule uitbreiding (definitief, met fixes)

Verwerkt feedback: data-reconciliatie in #6, `SECURITY DEFINER` weg bij validatie-trigger, sticky headers waar haalbaar.

## 1. Tijdlijn — start vandaag
`src/pages/personeel/Tijdlijn.tsx`:
- `DAYS_BEFORE = 0`, `DAYS_AFTER = 365`, `TOTAL_DAYS = 366`
- `todayOffset = 0` → vandaag-lijn helemaal links
- "Vandaag"-knop scrollt naar `left: 0`
- Date-label past zich automatisch aan via bestaande `windowStart`

## 2. Slaapplek klikbaar in Tijdlijn
Slaapplek-cel in namen-kolom: wikkel "dot + naam" in `<Link to="/personeel/wonen/:id">` met `hover:underline underline-offset-2` en `min-h-[40px]` flex-wrapper voor tap-target. Geen slaapplek → blijft `—`, geen link.

## 3. Wonen detail-view voor HR

### 3A. Migratie (housing kolommen)
```sql
ALTER TABLE public.personeel_housing
  ADD COLUMN address text,
  ADD COLUMN cost_per_month numeric(10,2),
  ADD COLUMN rooms integer,
  ADD COLUMN room_size_m2 numeric(5,1),
  ADD COLUMN contact_name text,
  ADD COLUMN facilities text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN description text,
  ADD COLUMN notes text;
```

### 3B. Nieuwe pagina + route
- Route in `App.tsx`: `<Route path="wonen/:id" element={<WonenDetail />} />` binnen `/personeel`
- `src/pages/personeel/WonenDetail.tsx`:
  - Header: titel + gekleurde bol + "Bewerken"-knop + back-link
  - Card "Basisinfo": adres, contactpersoon, kosten p/m (EUR), kamers, m², capaciteit
  - Facilities als `<Badge variant="secondary">` chips
  - Beschrijving (`prose text-sm`)
  - Notities (Card met `bg-muted/40`)
  - "Huidige bewoners" + "Komende bewoners" (volgende 90 dagen)

### 3C. HousingCard klikbaar
Wrap Card in `<Link>` met `hover:shadow-md transition`. Bestaande content blijft.

### 3D. HousingEditModal
`src/components/personeel/HousingEditModal.tsx` — Dialog max-w 650px met alle velden. Facilities als multi-select (presets: `wifi`, `wasmachine`, `parkeerplek`, `eigen badkamer`, `tuin`, `fiets`) + "andere" tekst-input. Opgeroepen vanuit WonenDetail én PersoneelSettings ("Meer details"-knop).

## 4. Collega's gegroepeerde tabs
`src/pages/personeel/Collegas.tsx`:
- `<Tabs>` met `Actief nu (N)` / `Toekomstig (N)` / `Afgelopen (N)` via `categorizeByDate`
- Tab-state in URL: `?view=actief|toekomstig|afgelopen`, default `actief`
- Per tab: groepeer per `location_id`, sorteer op `start_date asc`
- Group-header: probeer `sticky top-0` met `bg-muted/60` binnen een dedicated scroll-container. Als visueel rommelig (page-scroll i.p.v. table-scroll): fallback naar statische dividers tussen groepen.

## 5. PersoneelSettings — tabs
`<Tabs>` met `Vestigingen (N)` / `Teams (N)` / `Slaapplekken (N)`. Korte uitleg-regel onder elke tab. URL-state: `?tab=vestigingen|teams|slaapplekken`, default `vestigingen`. Bestaande sections worden tab-content.

## 6. Teams per vestiging (met data-reconciliatie)

### 6A. Migratie — definitieve volgorde
```sql
-- 1. Kolom nullable
ALTER TABLE public.personeel_teams
  ADD COLUMN location_id uuid REFERENCES public.personeel_locations(id) ON DELETE CASCADE;

-- 2. Backfill teams naar eerste vestiging
UPDATE public.personeel_teams
SET location_id = (SELECT id FROM public.personeel_locations ORDER BY sort_order LIMIT 1)
WHERE location_id IS NULL;

-- 3. NOT NULL
ALTER TABLE public.personeel_teams ALTER COLUMN location_id SET NOT NULL;

-- 4. Unique per vestiging (case-insensitive)
CREATE UNIQUE INDEX idx_personeel_teams_name_per_location
  ON public.personeel_teams (location_id, lower(name));

-- 5. Seed "Allround" voor Pura West (no-op als naam afwijkt)
INSERT INTO public.personeel_teams (name, location_id, sort_order)
SELECT 'Allround', id, 1 FROM public.personeel_locations
WHERE name = 'Pura West';

-- 5b. RECONCILIATIE: people.location_id volgt team.location_id
UPDATE public.personeel_people p
SET location_id = t.location_id
FROM public.personeel_teams t
WHERE p.team_id = t.id
  AND p.location_id != t.location_id;

-- 6. Validatie-functie (geen SECURITY DEFINER nodig)
CREATE OR REPLACE FUNCTION public.personeel_validate_team_location()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE team_loc uuid;
BEGIN
  SELECT location_id INTO team_loc FROM public.personeel_teams WHERE id = NEW.team_id;
  IF team_loc IS NULL OR team_loc != NEW.location_id THEN
    RAISE EXCEPTION 'Team hoort niet bij deze vestiging';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER personeel_people_c_validate_team
  BEFORE INSERT OR UPDATE ON public.personeel_people
  FOR EACH ROW EXECUTE FUNCTION public.personeel_validate_team_location();
```

### 6B. Types + hooks
- `src/types/personeel.ts`: `PersoneelTeam.location_id: string`; `PersoneelHousing` krijgt nieuwe optionele velden
- `src/hooks/personeel/useTeams.ts`: voeg `useTeamsByLocation(locationId: string | null)` toe (filter `useMemo` op cached teams). `useUpsertTeam` payload uitgebreid met `location_id`.
- `src/hooks/personeel/useHousing.ts`: payload uitgebreid met nieuwe velden
- `src/hooks/personeel/index.ts`: export `useTeamsByLocation`

### 6C. UI
- `PersonModal.tsx`: bij wijziging `locationId` → `setTeamId("")`. Team `<Select>` `disabled={!locationId}`, opties via `useTeamsByLocation(locationId)`. Placeholder: "Kies eerst vestiging".
- `PersoneelSettings.tsx` Teams-tab: groepeer per vestiging met sub-headers. "+ Nieuw team"-form: vestiging-picker + naam-input.
- `Collegas.tsx` filter-pills: team-labels `{team.name} ({locationName})` voor disambiguatie.

## Bestanden

**Nieuw:**
- `src/pages/personeel/WonenDetail.tsx`
- `src/components/personeel/HousingEditModal.tsx`
- 1 migratie-file (combineert #3A + #6A)

**Gewijzigd:**
- `src/App.tsx`
- `src/pages/personeel/Tijdlijn.tsx` (#1 + #2)
- `src/pages/personeel/Collegas.tsx` (#4 + #6)
- `src/pages/personeel/PersoneelSettings.tsx` (#5 + #6)
- `src/components/personeel/HousingCard.tsx` (#3C)
- `src/components/personeel/PersonModal.tsx` (#6)
- `src/types/personeel.ts`
- `src/hooks/personeel/useTeams.ts`
- `src/hooks/personeel/useHousing.ts`
- `src/hooks/personeel/index.ts`

## Volgorde van uitvoering
1. Migratie draaien (alle stappen #3A + #6A in één file)
2. Types updaten (na regenerate van `types.ts`)
3. Hooks aanpassen
4. UI-componenten + nieuwe pagina + modal
5. Routes registreren

## Aandachtspunten
- **Reconciliatie #5b** lost mismatch op vóór de trigger ervoor terugkomt
- **Sticky group-headers (#4)**: visueel testen, fallback naar statisch indien nodig
- **"Pura West" seed**: exact-match — als naam anders is, geen seed (handmatig aanvullen via UI)
