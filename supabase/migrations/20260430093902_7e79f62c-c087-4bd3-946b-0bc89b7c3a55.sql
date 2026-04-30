
-- 1. Create join table
CREATE TABLE IF NOT EXISTS public.personeel_people_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id uuid NOT NULL REFERENCES public.personeel_people(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES public.personeel_locations(id) ON DELETE RESTRICT,
  team_id uuid NOT NULL REFERENCES public.personeel_teams(id) ON DELETE RESTRICT,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(person_id, location_id)
);

CREATE INDEX IF NOT EXISTS idx_ppl_person ON public.personeel_people_locations(person_id);
CREATE INDEX IF NOT EXISTS idx_ppl_location ON public.personeel_people_locations(location_id);
CREATE INDEX IF NOT EXISTS idx_ppl_team ON public.personeel_people_locations(team_id);

-- 2. Enable RLS — same permissive pattern as other personeel tables
ALTER TABLE public.personeel_people_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "personeel_people_locations_all"
ON public.personeel_people_locations
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 3. Validate team belongs to location (reuse existing validation logic)
CREATE OR REPLACE FUNCTION public.personeel_validate_assignment_team_location()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE team_loc uuid;
BEGIN
  SELECT location_id INTO team_loc FROM public.personeel_teams WHERE id = NEW.team_id;
  IF team_loc IS NULL OR team_loc != NEW.location_id THEN
    RAISE EXCEPTION 'Team hoort niet bij deze vestiging';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_assignment_team_location ON public.personeel_people_locations;
CREATE TRIGGER trg_validate_assignment_team_location
BEFORE INSERT OR UPDATE ON public.personeel_people_locations
FOR EACH ROW EXECUTE FUNCTION public.personeel_validate_assignment_team_location();

-- 4. Migrate existing data: copy current location_id/team_id into the join table
INSERT INTO public.personeel_people_locations (person_id, location_id, team_id)
SELECT p.id, p.location_id, p.team_id
FROM public.personeel_people p
WHERE p.location_id IS NOT NULL
  AND p.team_id IS NOT NULL
  AND p.deleted_at IS NULL
ON CONFLICT (person_id, location_id) DO NOTHING;

-- 5. Make legacy columns nullable (keep for backwards compat / view fallback)
ALTER TABLE public.personeel_people ALTER COLUMN location_id DROP NOT NULL;
ALTER TABLE public.personeel_people ALTER COLUMN team_id DROP NOT NULL;

-- 6. Recreate personeel_people_full view to include assignments array
DROP VIEW IF EXISTS public.personeel_people_full;

CREATE VIEW public.personeel_people_full
WITH (security_invoker = true)
AS
SELECT
  p.id,
  p.name,
  p.user_id,
  p.location_id,
  p.team_id,
  p.housing_id,
  p.room_id,
  p.start_date,
  p.end_date,
  p.days_per_week,
  p.competence,
  p.pay,
  p.notes,
  p.deleted_at,
  p.updated_by,
  p.created_at,
  p.updated_at,
  COALESCE(
    (
      SELECT jsonb_agg(jsonb_build_object(
        'id', ppl.id,
        'location_id', ppl.location_id,
        'team_id', ppl.team_id
      ) ORDER BY ppl.created_at)
      FROM public.personeel_people_locations ppl
      WHERE ppl.person_id = p.id
    ),
    '[]'::jsonb
  ) AS assignments
FROM public.personeel_people p
WHERE p.deleted_at IS NULL;
