ALTER TABLE public.waste_pickups DROP CONSTRAINT IF EXISTS waste_pickups_fraction_check;
ALTER TABLE public.waste_pickups ADD CONSTRAINT waste_pickups_fraction_check
  CHECK (fraction = ANY (ARRAY['restafval'::text, 'gft'::text, 'papier'::text, 'glas'::text, 'klein_tuinafval'::text]));