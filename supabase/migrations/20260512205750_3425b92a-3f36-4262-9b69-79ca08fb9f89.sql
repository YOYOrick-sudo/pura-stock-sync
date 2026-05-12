ALTER TABLE public.personeel_locations
ADD COLUMN IF NOT EXISTS color text NOT NULL DEFAULT '#A7D7C5';

UPDATE public.personeel_locations SET color = '#A7D7C5' WHERE name = 'Pura Midsland';
UPDATE public.personeel_locations SET color = '#F4C7A1' WHERE name = 'Pura West';