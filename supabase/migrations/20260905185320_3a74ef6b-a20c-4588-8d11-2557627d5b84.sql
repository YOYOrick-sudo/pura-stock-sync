-- print_jobs uitbreiden met herkomstgegevens
ALTER TABLE public.print_jobs
  ADD COLUMN IF NOT EXISTS vestiging text,
  ADD COLUMN IF NOT EXISTS bron text;

CREATE INDEX IF NOT EXISTS print_jobs_status_created_idx ON public.print_jobs (status, created_at DESC);

-- hartslag van de printserver(s)
CREATE TABLE IF NOT EXISTS public.print_bridge_status (
  vestiging text NOT NULL PRIMARY KEY,
  laatste_claim timestamptz,
  laatste_print timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.print_bridge_status TO authenticated;
GRANT ALL ON public.print_bridge_status TO service_role;

ALTER TABLE public.print_bridge_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ingelogde gebruikers lezen printstatus"
  ON public.print_bridge_status FOR SELECT TO authenticated USING (true);

-- claim_next_print_job werkt de hartslag bij (service_role roept dit aan)
CREATE OR REPLACE FUNCTION public.claim_next_print_job()
RETURNS TABLE(id uuid, zpl text, label_omschrijving text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job public.print_jobs;
BEGIN
  UPDATE public.print_bridge_status s SET laatste_claim = now(), updated_at = now()
  WHERE s.vestiging = 'West';
  INSERT INTO public.print_bridge_status (vestiging, laatste_claim)
  VALUES ('West', now())
  ON CONFLICT (vestiging) DO NOTHING;

  SELECT * INTO v_job
  FROM public.print_jobs
  WHERE status = 'pending'
  ORDER BY created_at ASC
  LIMIT 1
  FOR UPDATE SKIP LOCKED;

  IF NOT FOUND THEN RETURN; END IF;

  UPDATE public.print_jobs SET status = 'printing' WHERE print_jobs.id = v_job.id;

  RETURN QUERY SELECT v_job.id, v_job.zpl, v_job.label_omschrijving;
END;
$$;

-- melding vanuit de bridge dat een sticker echt afgedrukt is
CREATE OR REPLACE FUNCTION public.print_bridge_mark_printed(_vestiging text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.print_bridge_status (vestiging, laatste_print, laatste_claim)
  VALUES (_vestiging, now(), now())
  ON CONFLICT (vestiging) DO UPDATE
    SET laatste_print = now(), laatste_claim = now(), updated_at = now();
END;
$$;