-- Zorg dat de Vitrine-categorie bestaat in de juiste sectie
INSERT INTO public.foh_category_order (location, department, phase, category, sort_order)
VALUES ('West', 'samen', 'sluit', 'Vitrine', 60)
ON CONFLICT (location, department, phase, category) DO UPDATE SET sort_order = EXCLUDED.sort_order;

-- Voeg de nieuwe taak toe aan het actieve template
INSERT INTO public.foh_daily_templates (
  location, phase, department, category, title, description, foto_url,
  priority, repeat_type, template_name, is_active, sort_order
) VALUES (
  'West', 'sluit', 'samen', 'Vitrine', 'Schoonmaakgerei door de vaat',
  'Alle kleine schoonmaakspullen bij de spoelbak (borstels, sponsjes, mini-gardes, rasp) in het witte bakje door de vaatwasser doen. Bakje zelf schoonmaken.',
  '/__l5e/assets-v1/199ff7ed-bd66-47d8-b5ca-58a71b038aa9/schoonmaakgerei-vaat.png',
  2, 'daily', 'Sluit', true, 10
);

-- Maak de taak meteen actief voor vandaag
INSERT INTO public.foh_tasks (
  location, phase, department, category, title, description, foto_url,
  priority, due_date, completed, archived, sort_order
)
SELECT
  location, phase, department, category, title, description, foto_url,
  priority,
  (CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Amsterdam')::date,
  false, false, sort_order
FROM public.foh_daily_templates
WHERE location = 'West' AND phase = 'sluit' AND title = 'Schoonmaakgerei door de vaat';