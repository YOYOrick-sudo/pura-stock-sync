CREATE TABLE IF NOT EXISTS public.foh_category_order_backup_west AS
SELECT o.*, now() AS backup_at FROM public.foh_category_order o WHERE o.location = 'West';

GRANT ALL ON public.foh_category_order_backup_west TO service_role;

ALTER TABLE public.foh_category_order_backup_west ENABLE ROW LEVEL SECURITY;