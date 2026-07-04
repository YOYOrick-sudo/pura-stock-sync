DROP POLICY IF EXISTS handover_memos_admin_manage ON public.handover_memos;
CREATE POLICY handover_memos_insert_own_location ON public.handover_memos
  FOR INSERT TO authenticated
  WITH CHECK (location = public.current_user_location() AND created_by = auth.uid());
CREATE POLICY handover_memos_update_own_location ON public.handover_memos
  FOR UPDATE TO authenticated
  USING (location = public.current_user_location())
  WITH CHECK (location = public.current_user_location());
CREATE POLICY handover_memos_delete_admin ON public.handover_memos
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'owner'::app_role) OR public.has_role(auth.uid(), 'admin'::app_role));