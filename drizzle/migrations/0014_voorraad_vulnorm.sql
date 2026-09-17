ALTER TABLE public.koelcel_check_items
  ADD COLUMN IF NOT EXISTS vulnorm text NOT NULL DEFAULT 'vol';

ALTER TABLE public.koelcel_check_items
  DROP CONSTRAINT IF EXISTS koelcel_check_items_vulnorm_check;
ALTER TABLE public.koelcel_check_items
  ADD CONSTRAINT koelcel_check_items_vulnorm_check CHECK (vulnorm IN ('vol', 'half'));

-- Halve doelen worden een vulnorm; het doelaantal wordt weer een heel bakje.
UPDATE public.koelcel_check_items
SET vulnorm = 'half',
    doel_aantal = 1,
    doel_aantal_druk = CASE WHEN doel_aantal_druk IS NULL THEN NULL ELSE 1 END
WHERE plek = 'werkbank' AND doel_aantal < 1;

-- Alleen spreads en mayonaises hebben echt reservebakjes achter de hand.
UPDATE public.koelcel_check_items
SET reserve_doel = 0
WHERE plek = 'werkbank'
  AND coalesce(categorie, '') <> 'Spreads & mayonaises';