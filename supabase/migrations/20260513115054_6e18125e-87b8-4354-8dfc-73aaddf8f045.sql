
CREATE TABLE public.waste_pickups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pickup_date date NOT NULL,
  source text NOT NULL CHECK (source IN ('tst','gemeente')),
  fraction text NOT NULL CHECK (fraction IN ('restafval','gft','papier')),
  location text NOT NULL DEFAULT 'Midsland',
  sluit_task_id uuid,
  tussen_task_id uuid,
  escalation_sent_at timestamptz,
  acknowledged_at timestamptz,
  acknowledged_by uuid,
  acknowledged_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(pickup_date, source, fraction, location)
);

CREATE INDEX idx_waste_pickups_date_loc ON public.waste_pickups(pickup_date, location);

ALTER TABLE public.waste_pickups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View waste pickups for own location"
ON public.waste_pickups FOR SELECT
USING (location = public.current_user_location());

CREATE POLICY "Managers can insert waste pickups"
ON public.waste_pickups FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(),'admin'::app_role)
  OR public.has_role(auth.uid(),'owner'::app_role)
  OR public.has_role(auth.uid(),'manager'::app_role)
);

CREATE POLICY "Managers can update waste pickups"
ON public.waste_pickups FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(),'admin'::app_role)
  OR public.has_role(auth.uid(),'owner'::app_role)
  OR public.has_role(auth.uid(),'manager'::app_role)
);

CREATE POLICY "Managers can delete waste pickups"
ON public.waste_pickups FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(),'admin'::app_role)
  OR public.has_role(auth.uid(),'owner'::app_role)
);

CREATE TRIGGER trg_waste_pickups_updated
BEFORE UPDATE ON public.waste_pickups
FOR EACH ROW EXECUTE FUNCTION public.update_profiles_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE public.waste_pickups;
