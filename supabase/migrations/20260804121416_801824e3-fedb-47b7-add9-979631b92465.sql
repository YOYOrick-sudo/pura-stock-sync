UPDATE public.foh_daily_templates SET department='samen', category='Binnenkomst', sort_order=85 WHERE location='West' AND phase='open' AND title='Inklokken';

UPDATE public.foh_tasks SET department='samen', category='Binnenkomst', sort_order=85 WHERE location='West' AND phase='open' AND title='Inklokken' AND archived=false AND due_date >= CURRENT_DATE;