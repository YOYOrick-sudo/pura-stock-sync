-- 1) Voeg housing_not_needed kolom toe op personeel_people
ALTER TABLE public.personeel_people
ADD COLUMN IF NOT EXISTS housing_not_needed boolean NOT NULL DEFAULT false;

-- 2) Voeg function_group kolom toe op personeel_teams
ALTER TABLE public.personeel_teams
ADD COLUMN IF NOT EXISTS function_group text
  CHECK (function_group IN ('keuken','bediening'));

-- 3) Classificeer bestaande teams op basis van naam
UPDATE public.personeel_teams
SET function_group = CASE
  WHEN lower(name) ~ '(keuken|chef|kok|kitchen)' THEN 'keuken'
  ELSE 'bediening'
END
WHERE function_group IS NULL;