ALTER TABLE public.sync_leases DROP CONSTRAINT IF EXISTS sync_leases_bron_check;
ALTER TABLE public.sync_leases ADD CONSTRAINT sync_leases_bron_check
  CHECK (bron = ANY (ARRAY['lightspeed'::text, 'eitje'::text, 'ls-job:midsland'::text, 'ls-job:west'::text]));

INSERT INTO public.sync_leases (bron) VALUES ('ls-job:midsland'), ('ls-job:west')
  ON CONFLICT (bron) DO NOTHING;