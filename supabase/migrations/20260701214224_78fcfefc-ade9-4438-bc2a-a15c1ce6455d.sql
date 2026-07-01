CREATE TABLE public.print_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id uuid REFERENCES public.recipes(id) ON DELETE SET NULL,
  zpl text NOT NULL,
  label_omschrijving text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','printing','done','error')),
  foutmelding text,
  aangemaakt_door uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  geprint_op timestamptz
);

CREATE INDEX idx_print_jobs_status ON public.print_jobs(status, created_at);

GRANT SELECT, INSERT ON public.print_jobs TO authenticated;
GRANT ALL ON public.print_jobs TO service_role;

ALTER TABLE public.print_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can create print jobs"
  ON public.print_jobs FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = aangemaakt_door OR aangemaakt_door IS NULL);

CREATE POLICY "Authenticated can view print jobs"
  ON public.print_jobs FOR SELECT TO authenticated
  USING (true);