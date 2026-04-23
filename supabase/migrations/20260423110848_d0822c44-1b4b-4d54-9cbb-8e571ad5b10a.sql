-- 1. Schema-uitbreiding personeel_rooms
ALTER TABLE public.personeel_rooms
  ADD COLUMN IF NOT EXISTS cost_per_person numeric(10,2),
  ADD COLUMN IF NOT EXISTS cost_private numeric(10,2);

-- ============================================
-- MIDSLAND — 2 kamers + 1 studio
-- ============================================
DO $$
DECLARE v_housing_id uuid;
BEGIN
  SELECT id INTO v_housing_id FROM public.personeel_housing WHERE name = 'Midsland';
  IF v_housing_id IS NULL THEN RETURN; END IF;

  UPDATE public.personeel_housing
  SET capacity = 5,
      description = COALESCE(description, 'Huisvesting in Midsland met twee 2-persoonskamers en een aparte studio.')
  WHERE id = v_housing_id;

  INSERT INTO public.personeel_rooms (housing_id, name, capacity, cost_per_person, cost_private, sort_order)
  SELECT v_housing_id, 'Kamer 1', 2, 250, 475, 1
  WHERE NOT EXISTS (SELECT 1 FROM public.personeel_rooms WHERE housing_id = v_housing_id AND lower(name) = 'kamer 1');

  INSERT INTO public.personeel_rooms (housing_id, name, capacity, cost_per_person, cost_private, sort_order)
  SELECT v_housing_id, 'Kamer 2', 2, 250, 475, 2
  WHERE NOT EXISTS (SELECT 1 FROM public.personeel_rooms WHERE housing_id = v_housing_id AND lower(name) = 'kamer 2');

  INSERT INTO public.personeel_rooms (housing_id, name, capacity, cost_per_person, cost_private, sort_order, notes)
  SELECT v_housing_id, 'Studio', 1, 750, NULL, 3, 'Eénpersoonsstudio, geen gedeeld gebruik'
  WHERE NOT EXISTS (SELECT 1 FROM public.personeel_rooms WHERE housing_id = v_housing_id AND lower(name) = 'studio');
END $$;

-- ============================================
-- CARAVAN — JEROEN
-- ============================================
DO $$
DECLARE v_housing_id uuid;
BEGIN
  SELECT id INTO v_housing_id FROM public.personeel_housing WHERE name = 'Caravan - Jeroen';
  IF v_housing_id IS NULL THEN RETURN; END IF;

  UPDATE public.personeel_housing
  SET capacity = 4,
      contact_name = COALESCE(contact_name, 'Jeroen'),
      description = COALESCE(description, 'Caravan met twee slaapkamers, elk geschikt voor 1 of 2 personen.')
  WHERE id = v_housing_id;

  INSERT INTO public.personeel_rooms (housing_id, name, capacity, cost_per_person, sort_order)
  SELECT v_housing_id, 'Slaapkamer 1', 2, 275, 1
  WHERE NOT EXISTS (SELECT 1 FROM public.personeel_rooms WHERE housing_id = v_housing_id AND lower(name) = 'slaapkamer 1');

  INSERT INTO public.personeel_rooms (housing_id, name, capacity, cost_per_person, sort_order)
  SELECT v_housing_id, 'Slaapkamer 2', 2, 275, 2
  WHERE NOT EXISTS (SELECT 1 FROM public.personeel_rooms WHERE housing_id = v_housing_id AND lower(name) = 'slaapkamer 2');
END $$;

-- ============================================
-- PEA — 3 slaapkamers
-- ============================================
DO $$
DECLARE v_housing_id uuid;
BEGIN
  SELECT id INTO v_housing_id FROM public.personeel_housing WHERE name = 'Pea';
  IF v_housing_id IS NULL THEN
    INSERT INTO public.personeel_housing (name, color, capacity, sort_order, description)
    VALUES ('Pea', '#F8BBD0', 4, 9, 'Huisvesting Pea met drie slaapkamers: twee grote en één kleinere.')
    RETURNING id INTO v_housing_id;
  ELSE
    UPDATE public.personeel_housing
    SET capacity = 4,
        description = COALESCE(description, 'Huisvesting Pea met drie slaapkamers: twee grote en één kleinere.')
    WHERE id = v_housing_id;
  END IF;

  INSERT INTO public.personeel_rooms (housing_id, name, capacity, cost_per_person, sort_order)
  SELECT v_housing_id, 'Grote kamer 1', 1, 400, 1
  WHERE NOT EXISTS (SELECT 1 FROM public.personeel_rooms WHERE housing_id = v_housing_id AND lower(name) = 'grote kamer 1');

  INSERT INTO public.personeel_rooms (housing_id, name, capacity, cost_per_person, sort_order)
  SELECT v_housing_id, 'Grote kamer 2', 1, 400, 2
  WHERE NOT EXISTS (SELECT 1 FROM public.personeel_rooms WHERE housing_id = v_housing_id AND lower(name) = 'grote kamer 2');

  INSERT INTO public.personeel_rooms (housing_id, name, capacity, cost_per_person, sort_order)
  SELECT v_housing_id, 'Kleine kamer', 1, 375, 3
  WHERE NOT EXISTS (SELECT 1 FROM public.personeel_rooms WHERE housing_id = v_housing_id AND lower(name) = 'kleine kamer');
END $$;