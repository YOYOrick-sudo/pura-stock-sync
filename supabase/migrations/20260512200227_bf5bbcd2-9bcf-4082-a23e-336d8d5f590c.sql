CREATE OR REPLACE VIEW public.personeel_people_full
WITH (security_invoker = true)
AS
SELECT
  p.id,
  p.name,
  p.user_id,
  p.location_id,
  p.team_id,
  p.housing_id,
  p.room_id,
  p.start_date,
  p.end_date,
  p.days_per_week,
  p.competence,
  p.pay,
  p.notes,
  p.deleted_at,
  p.updated_by,
  p.created_at,
  p.updated_at,
  COALESCE((
    SELECT jsonb_agg(
      jsonb_build_object('id', ppl.id, 'location_id', ppl.location_id, 'team_id', ppl.team_id)
      ORDER BY ppl.created_at
    )
    FROM public.personeel_people_locations ppl
    WHERE ppl.person_id = p.id
  ), '[]'::jsonb) AS assignments,
  p.housing_not_needed
FROM public.personeel_people p
WHERE p.deleted_at IS NULL;