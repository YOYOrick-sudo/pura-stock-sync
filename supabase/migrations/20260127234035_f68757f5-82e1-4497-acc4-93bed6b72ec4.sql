
-- Fix Security Definer View by recreating with SECURITY INVOKER
DROP VIEW IF EXISTS public.accommodation_occupancy;

CREATE VIEW public.accommodation_occupancy 
WITH (security_invoker = true) AS
SELECT 
  a.id,
  a.name,
  a.location,
  a.capacity,
  COUNT(aa.id) FILTER (WHERE aa.status = 'active' AND (aa.end_date IS NULL OR aa.end_date >= CURRENT_DATE)) as current_occupancy,
  a.capacity - COUNT(aa.id) FILTER (WHERE aa.status = 'active' AND (aa.end_date IS NULL OR aa.end_date >= CURRENT_DATE)) as available_spots
FROM public.accommodations a
LEFT JOIN public.accommodation_assignments aa ON a.id = aa.accommodation_id
GROUP BY a.id, a.name, a.location, a.capacity;
