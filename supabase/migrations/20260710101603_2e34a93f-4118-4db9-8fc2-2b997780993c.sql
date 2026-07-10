
-- Loze uren v2 — team-data fundament
ALTER TABLE public.uren_shifts ADD COLUMN IF NOT EXISTS team_id text;
CREATE INDEX IF NOT EXISTS uren_shifts_team_id_idx ON public.uren_shifts(team_id);

CREATE TABLE IF NOT EXISTS public.eitje_teams (
  id text PRIMARY KEY,
  naam text NOT NULL,
  environment_id integer,
  vestiging text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.eitje_teams TO authenticated;
GRANT ALL ON public.eitje_teams TO service_role;

ALTER TABLE public.eitje_teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Loonkosten-lezers zien teams"
  ON public.eitje_teams FOR SELECT
  TO authenticated
  USING (public.mag_loonkosten_zien(auth.uid()));

CREATE TRIGGER eitje_teams_set_updated_at
  BEFORE UPDATE ON public.eitje_teams
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
