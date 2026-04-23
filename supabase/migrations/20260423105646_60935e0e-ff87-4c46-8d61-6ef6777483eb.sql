-- Nieuwe tabel: kamers binnen een woonruimte
CREATE TABLE public.personeel_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  housing_id uuid NOT NULL REFERENCES public.personeel_housing(id) ON DELETE CASCADE,
  name text NOT NULL,
  size_m2 numeric(5,1),
  capacity integer NOT NULL DEFAULT 1 CHECK (capacity > 0),
  sort_order integer NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_personeel_rooms_name_per_housing
  ON public.personeel_rooms (housing_id, lower(name));

CREATE INDEX idx_personeel_rooms_housing
  ON public.personeel_rooms (housing_id);

-- RLS consistent met andere personeel-tabellen
ALTER TABLE public.personeel_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "personeel_rooms_all" ON public.personeel_rooms
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.personeel_rooms;

-- updated_at trigger
CREATE TRIGGER personeel_rooms_updated_at
  BEFORE UPDATE ON public.personeel_rooms
  FOR EACH ROW EXECUTE FUNCTION public.update_hr_updated_at();

-- Kamer-koppeling op persoon
ALTER TABLE public.personeel_people
  ADD COLUMN room_id uuid REFERENCES public.personeel_rooms(id) ON DELETE SET NULL;

-- Validatie: kamer moet bij de gekozen slaapplek horen
CREATE OR REPLACE FUNCTION public.personeel_validate_room_housing()
RETURNS trigger LANGUAGE plpgsql AS $$
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

CREATE TRIGGER personeel_people_d_validate_room
  BEFORE INSERT OR UPDATE ON public.personeel_people
  FOR EACH ROW EXECUTE FUNCTION public.personeel_validate_room_housing();