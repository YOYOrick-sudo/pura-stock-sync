-- Triggers eerst weg
DROP TRIGGER IF EXISTS personeel_people_b_protect_sensitive ON public.personeel_people;
DROP TRIGGER IF EXISTS personeel_people_a_protect_delete ON public.personeel_people;

-- Policies eerst weg (anders blokkeert dependency op is_personeel_manager)
DROP POLICY IF EXISTS "select_people" ON public.personeel_people;
DROP POLICY IF EXISTS "insert_people" ON public.personeel_people;
DROP POLICY IF EXISTS "update_people" ON public.personeel_people;
DROP POLICY IF EXISTS "delete_people" ON public.personeel_people;
DROP POLICY IF EXISTS "select_locations" ON public.personeel_locations;
DROP POLICY IF EXISTS "manage_locations" ON public.personeel_locations;
DROP POLICY IF EXISTS "select_teams" ON public.personeel_teams;
DROP POLICY IF EXISTS "manage_teams" ON public.personeel_teams;
DROP POLICY IF EXISTS "select_housing" ON public.personeel_housing;
DROP POLICY IF EXISTS "manage_housing" ON public.personeel_housing;

-- View weg (depends ook op functie)
DROP VIEW IF EXISTS public.personeel_people_full;

-- Nu functies droppen
DROP FUNCTION IF EXISTS public.personeel_protect_sensitive_fields();
DROP FUNCTION IF EXISTS public.personeel_protect_delete();
DROP FUNCTION IF EXISTS public.is_personeel_manager();

-- Grants resetten
REVOKE ALL ON public.personeel_people FROM authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.personeel_people TO authenticated;

-- View opnieuw, simpel
CREATE VIEW public.personeel_people_full AS
SELECT * FROM public.personeel_people WHERE deleted_at IS NULL;
GRANT SELECT ON public.personeel_people_full TO authenticated;

-- Nieuwe simpele RLS policies
CREATE POLICY "personeel_people_all" ON public.personeel_people
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "personeel_locations_all" ON public.personeel_locations
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "personeel_teams_all" ON public.personeel_teams
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "personeel_housing_all" ON public.personeel_housing
  FOR ALL TO authenticated USING (true) WITH CHECK (true);