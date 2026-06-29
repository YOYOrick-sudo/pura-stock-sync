
ALTER TABLE public.foh_daily_templates DISABLE TRIGGER USER;

UPDATE public.foh_daily_templates SET template_name='Sluit' WHERE location='West' AND department='achterkant' AND phase='sluit';
UPDATE public.foh_daily_templates SET department='voorkant' WHERE location='West' AND department='achterkant';

ALTER TABLE public.foh_daily_templates ENABLE TRIGGER USER;

UPDATE public.foh_tasks SET department='voorkant' WHERE location='West' AND department='achterkant' AND archived=false;

UPDATE public.foh_category_order SET department='voorkant', sort_order=110 WHERE location='West' AND department='achterkant' AND category='Keuken';
UPDATE public.foh_category_order SET department='voorkant', sort_order=120 WHERE location='West' AND department='achterkant' AND category='Ontdooien (vriezer → koelcel)';
DELETE FROM public.foh_category_order WHERE location='West' AND department='achterkant';
