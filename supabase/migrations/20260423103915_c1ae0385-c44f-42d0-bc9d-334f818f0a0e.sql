-- ============================================
-- #3A: Housing kolommen uitbreiden
-- ============================================
ALTER TABLE public.personeel_housing
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS cost_per_month numeric(10,2),
  ADD COLUMN IF NOT EXISTS rooms integer,
  ADD COLUMN IF NOT EXISTS room_size_m2 numeric(5,1),
  ADD COLUMN IF NOT EXISTS contact_name text,
  ADD COLUMN IF NOT EXISTS facilities text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS notes text;

-- ============================================
-- #6A: Teams per vestiging
-- ============================================

-- 1. Kolom nullable
ALTER TABLE public.personeel_teams
  ADD COLUMN IF NOT EXISTS location_id uuid REFERENCES public.personeel_locations(id) ON DELETE CASCADE;

-- 2. Backfill teams naar eerste vestiging (sort_order ASC)
UPDATE public.personeel_teams
SET location_id = (SELECT id FROM public.personeel_locations ORDER BY sort_order ASC LIMIT 1)
WHERE location_id IS NULL;

-- 3. NOT NULL
ALTER TABLE public.personeel_teams ALTER COLUMN location_id SET NOT NULL;

-- 4. Unique per vestiging (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS idx_personeel_teams_name_per_location
  ON public.personeel_teams (location_id, lower(name));

-- 5. Seed "Allround" voor Pura West (no-op als naam afwijkt of al bestaat)
INSERT INTO public.personeel_teams (name, location_id, sort_order)
SELECT 'Allround', id, 1 FROM public.personeel_locations
WHERE name = 'Pura West'
ON CONFLICT DO NOTHING;

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

DROP TRIGGER IF EXISTS personeel_people_c_validate_team ON public.personeel_people;
CREATE TRIGGER personeel_people_c_validate_team
  BEFORE INSERT OR UPDATE ON public.personeel_people
  FOR EACH ROW EXECUTE FUNCTION public.personeel_validate_team_location();