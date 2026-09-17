ALTER TABLE public.koelcel_check_items
  ADD COLUMN IF NOT EXISTS bestelpunt numeric,
  ADD COLUMN IF NOT EXISTS bestel_eenheid text,
  ADD COLUMN IF NOT EXISTS bestel_inhoud numeric;

INSERT INTO public.migratie_logboek (onderwerp, bron_tabel, reden)
VALUES (
  'Bestelpunt en besteleenheid voor ingekochte verse producten',
  'koelcel_check_items',
  'Tekorten gaan nu als hele inkoopverpakkingen (kist/doos/kilo) naar het bestelbord, en pas vanaf een bestelpunt.'
);