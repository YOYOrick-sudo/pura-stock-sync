CREATE OR REPLACE FUNCTION public.personeel_validate_room_housing()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE room_housing uuid;
BEGIN
  IF NEW.room_id IS NOT NULL THEN
    SELECT housing_id INTO room_housing FROM public.personeel_rooms WHERE id = NEW.room_id;
    IF room_housing IS NULL OR room_housing != NEW.housing_id THEN
      RAISE EXCEPTION 'Kamer hoort niet bij deze slaapplek';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;