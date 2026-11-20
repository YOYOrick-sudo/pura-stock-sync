CREATE OR REPLACE FUNCTION public.externe_bestelling_bewaak()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.modus IS DISTINCT FROM OLD.modus THEN
    RAISE EXCEPTION 'modus is onveranderlijk';
  END IF;
  IF NEW.modus = 'test' AND NEW.status IN ('verzenden','verzonden','uitkomst_onbekend','geweigerd','gepland') THEN
    RAISE EXCEPTION 'testbestelling mag niet naar de kassa';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER externe_bestelling_bewaak BEFORE INSERT OR UPDATE ON public.externe_bestellingen
FOR EACH ROW EXECUTE FUNCTION public.externe_bestelling_bewaak();