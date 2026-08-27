ALTER TABLE public.halffabricaat_methodes
  ADD COLUMN output_gaat_op_voorraad boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.halffabricaat_methodes.output_gaat_op_voorraad IS
  'true = output is een voorraad-artikel (halffabricaat, bv. hummus); false = direct verkoop (bv. croissant afbakken), geen voorraadmutatie in stap 2 (grootboek).';