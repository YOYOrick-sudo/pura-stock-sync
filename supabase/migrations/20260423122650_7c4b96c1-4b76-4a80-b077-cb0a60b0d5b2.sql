DROP TRIGGER IF EXISTS personeel_people_d_validate_room ON public.personeel_people;

CREATE TRIGGER personeel_people_d_validate_room
  BEFORE INSERT OR UPDATE ON public.personeel_people
  FOR EACH ROW EXECUTE FUNCTION public.personeel_validate_room_housing();