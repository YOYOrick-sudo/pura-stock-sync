-- ============================================
-- HELPER FUNCTIE
-- ============================================
CREATE OR REPLACE FUNCTION public.is_personeel_manager()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'owner'::app_role)
      OR public.has_role(auth.uid(), 'manager'::app_role)
      OR public.has_role(auth.uid(), 'admin'::app_role);
$$;

-- ============================================
-- LOOKUP TABELLEN
-- ============================================
CREATE TABLE public.personeel_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.personeel_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.personeel_housing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  color text NOT NULL DEFAULT '#9CA3AF',
  capacity integer CHECK (capacity IS NULL OR capacity >= 0),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================
-- HOOFDTABEL
-- ============================================
CREATE TABLE public.personeel_people (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  location_id uuid NOT NULL REFERENCES public.personeel_locations(id) ON DELETE RESTRICT,
  team_id uuid NOT NULL REFERENCES public.personeel_teams(id) ON DELETE RESTRICT,
  housing_id uuid REFERENCES public.personeel_housing(id) ON DELETE SET NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  days_per_week integer CHECK (days_per_week IS NULL OR (days_per_week BETWEEN 1 AND 7)),
  competence text CHECK (competence IS NULL OR competence IN ('sterk','gemiddeld','zwak')),
  pay text,
  notes text,
  deleted_at timestamptz,
  updated_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (end_date >= start_date)
);

CREATE INDEX idx_personeel_people_dates ON public.personeel_people (start_date, end_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_personeel_people_location ON public.personeel_people (location_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_personeel_people_housing ON public.personeel_people (housing_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_personeel_people_user ON public.personeel_people (user_id) WHERE deleted_at IS NULL;

-- ============================================
-- COLUMN-LEVEL GRANTS
-- ============================================
REVOKE ALL ON public.personeel_people FROM authenticated;
GRANT SELECT (id, name, user_id, location_id, team_id, housing_id,
              start_date, end_date, days_per_week, notes,
              deleted_at, updated_by, created_at, updated_at)
  ON public.personeel_people TO authenticated;
GRANT INSERT, DELETE ON public.personeel_people TO authenticated;
GRANT UPDATE (name, user_id, location_id, team_id, housing_id,
              start_date, end_date, days_per_week, notes, deleted_at)
  ON public.personeel_people TO authenticated;

-- ============================================
-- TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION public.personeel_protect_sensitive_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_personeel_manager() THEN
    IF TG_OP = 'INSERT' AND (NEW.competence IS NOT NULL OR NEW.pay IS NOT NULL) THEN
      RAISE EXCEPTION 'Alleen managers mogen competentie of betaling instellen';
    END IF;
    IF TG_OP = 'UPDATE' THEN
      IF NEW.competence IS DISTINCT FROM OLD.competence THEN
        RAISE EXCEPTION 'Alleen managers mogen competentie wijzigen';
      END IF;
      IF NEW.pay IS DISTINCT FROM OLD.pay THEN
        RAISE EXCEPTION 'Alleen managers mogen betaling wijzigen';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.personeel_protect_delete()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'DELETE' AND NOT public.is_personeel_manager() THEN
    RAISE EXCEPTION 'Alleen managers mogen collega''s verwijderen';
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.deleted_at IS NOT NULL
     AND OLD.deleted_at IS NULL AND NOT public.is_personeel_manager() THEN
    RAISE EXCEPTION 'Alleen managers mogen collega''s archiveren';
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.personeel_set_audit_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.updated_by := auth.uid();
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER personeel_people_a_protect_delete
  BEFORE DELETE OR UPDATE ON public.personeel_people
  FOR EACH ROW EXECUTE FUNCTION public.personeel_protect_delete();

CREATE TRIGGER personeel_people_b_protect_sensitive
  BEFORE INSERT OR UPDATE ON public.personeel_people
  FOR EACH ROW EXECUTE FUNCTION public.personeel_protect_sensitive_fields();

CREATE TRIGGER personeel_people_z_audit
  BEFORE INSERT OR UPDATE ON public.personeel_people
  FOR EACH ROW EXECUTE FUNCTION public.personeel_set_audit_fields();

CREATE TRIGGER personeel_locations_updated_at
  BEFORE UPDATE ON public.personeel_locations
  FOR EACH ROW EXECUTE FUNCTION public.update_hr_updated_at();
CREATE TRIGGER personeel_teams_updated_at
  BEFORE UPDATE ON public.personeel_teams
  FOR EACH ROW EXECUTE FUNCTION public.update_hr_updated_at();
CREATE TRIGGER personeel_housing_updated_at
  BEFORE UPDATE ON public.personeel_housing
  FOR EACH ROW EXECUTE FUNCTION public.update_hr_updated_at();

-- ============================================
-- VIEW (geen security_invoker, draait als owner met CASE-NULLs)
-- ============================================
CREATE OR REPLACE VIEW public.personeel_people_full AS
SELECT
  p.id, p.name, p.user_id, p.location_id, p.team_id, p.housing_id,
  p.start_date, p.end_date, p.days_per_week, p.notes,
  p.deleted_at, p.updated_by, p.created_at, p.updated_at,
  CASE WHEN public.is_personeel_manager() THEN p.competence ELSE NULL END AS competence,
  CASE WHEN public.is_personeel_manager() THEN p.pay        ELSE NULL END AS pay
FROM public.personeel_people p
WHERE p.deleted_at IS NULL OR public.is_personeel_manager();

GRANT SELECT ON public.personeel_people_full TO authenticated;

-- ============================================
-- RLS
-- ============================================
ALTER TABLE public.personeel_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personeel_teams     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personeel_housing   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personeel_people    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "select_locations" ON public.personeel_locations FOR SELECT TO authenticated USING (true);
CREATE POLICY "manage_locations" ON public.personeel_locations FOR ALL TO authenticated
  USING (public.is_personeel_manager()) WITH CHECK (public.is_personeel_manager());

CREATE POLICY "select_teams" ON public.personeel_teams FOR SELECT TO authenticated USING (true);
CREATE POLICY "manage_teams" ON public.personeel_teams FOR ALL TO authenticated
  USING (public.is_personeel_manager()) WITH CHECK (public.is_personeel_manager());

CREATE POLICY "select_housing" ON public.personeel_housing FOR SELECT TO authenticated USING (true);
CREATE POLICY "manage_housing" ON public.personeel_housing FOR ALL TO authenticated
  USING (public.is_personeel_manager()) WITH CHECK (public.is_personeel_manager());

CREATE POLICY "select_people" ON public.personeel_people FOR SELECT TO authenticated
  USING (deleted_at IS NULL OR public.is_personeel_manager());
CREATE POLICY "insert_people" ON public.personeel_people FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "update_people" ON public.personeel_people FOR UPDATE TO authenticated USING (true);
CREATE POLICY "delete_people" ON public.personeel_people FOR DELETE TO authenticated
  USING (public.is_personeel_manager());

-- ============================================
-- REALTIME
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.personeel_locations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.personeel_teams;
ALTER PUBLICATION supabase_realtime ADD TABLE public.personeel_housing;
ALTER PUBLICATION supabase_realtime ADD TABLE public.personeel_people;

-- ============================================
-- SEED
-- ============================================
INSERT INTO public.personeel_locations (name, sort_order) VALUES
  ('Pura Midsland', 1), ('Pura West', 2), ('Hoofdweg', 3);

INSERT INTO public.personeel_teams (name, sort_order) VALUES
  ('Bediening', 1), ('Keuken', 2), ('Bar', 3), ('Management', 4);

INSERT INTO public.personeel_housing (name, color, capacity, sort_order) VALUES
  ('Midsland',         '#4ea24a', NULL, 1),
  ('Hoofdweg',         '#d9363e', NULL, 2),
  ('Caravan - Jeroen', '#e58a1b', NULL, 3),
  ('Extern',           '#f4c93c', NULL, 4),
  ('Helga',            '#6fa8dc', NULL, 5),
  ('Carvan pura',      '#e64bb6', NULL, 6),
  ('Tuinhuis',         '#26a69a', NULL, 7),
  ('OPEN',             '#b0bec5', NULL, 8);