GRANT ALL ON public.sync_leases TO service_role;
GRANT SELECT, UPDATE ON public.sync_leases TO authenticated;
NOTIFY pgrst, 'reload schema';