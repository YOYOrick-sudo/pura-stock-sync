ALTER TABLE public.mep_taken ADD COLUMN IF NOT EXISTS handeling text;
CREATE INDEX IF NOT EXISTS mep_taken_handeling_idx ON public.mep_taken (vestiging, taak_datum, handeling);