
-- 1) Personnel tables: restrict to HR/admin/manager/owner
DROP POLICY IF EXISTS "personeel_people_all" ON public.personeel_people;
CREATE POLICY "personeel_people_hr_admin" ON public.personeel_people
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'hr'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'hr'));

DROP POLICY IF EXISTS "personeel_history_all" ON public.personeel_history;
CREATE POLICY "personeel_history_hr_admin" ON public.personeel_history
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'hr'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'hr'));

DROP POLICY IF EXISTS "personeel_housing_all" ON public.personeel_housing;
CREATE POLICY "personeel_housing_hr_admin" ON public.personeel_housing
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'hr'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'hr'));

DROP POLICY IF EXISTS "personeel_rooms_all" ON public.personeel_rooms;
CREATE POLICY "personeel_rooms_hr_admin" ON public.personeel_rooms
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'hr'))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'hr'));

-- 2) Scope current_user_location() policies to authenticated only (block anon)
DROP POLICY IF EXISTS "Users can create suggestions for their location" ON public.ai_suggestions;
DROP POLICY IF EXISTS "Users can update suggestions for their location" ON public.ai_suggestions;
DROP POLICY IF EXISTS "Users can view suggestions for their location" ON public.ai_suggestions;
CREATE POLICY "ai_suggestions_select_auth" ON public.ai_suggestions FOR SELECT TO authenticated USING (location = public.current_user_location());
CREATE POLICY "ai_suggestions_insert_auth" ON public.ai_suggestions FOR INSERT TO authenticated WITH CHECK (location = public.current_user_location());
CREATE POLICY "ai_suggestions_update_auth" ON public.ai_suggestions FOR UPDATE TO authenticated USING (location = public.current_user_location());

DROP POLICY IF EXISTS "Users can create daily templates for their location" ON public.foh_daily_templates;
DROP POLICY IF EXISTS "Users can delete daily templates for their location" ON public.foh_daily_templates;
DROP POLICY IF EXISTS "Users can update daily templates for their location" ON public.foh_daily_templates;
DROP POLICY IF EXISTS "Users can view daily templates for their location" ON public.foh_daily_templates;
CREATE POLICY "foh_daily_templates_select_auth" ON public.foh_daily_templates FOR SELECT TO authenticated USING (location = public.current_user_location());
CREATE POLICY "foh_daily_templates_insert_auth" ON public.foh_daily_templates FOR INSERT TO authenticated WITH CHECK (location = public.current_user_location());
CREATE POLICY "foh_daily_templates_update_auth" ON public.foh_daily_templates FOR UPDATE TO authenticated USING (location = public.current_user_location());
CREATE POLICY "foh_daily_templates_delete_auth" ON public.foh_daily_templates FOR DELETE TO authenticated USING (location = public.current_user_location());

DROP POLICY IF EXISTS "Users can create employees for their location" ON public.foh_employees;
DROP POLICY IF EXISTS "Users can delete employees for their location" ON public.foh_employees;
DROP POLICY IF EXISTS "Users can update employees for their location" ON public.foh_employees;
DROP POLICY IF EXISTS "Users can view employees for their location" ON public.foh_employees;
CREATE POLICY "foh_employees_select_auth" ON public.foh_employees FOR SELECT TO authenticated USING (location = public.current_user_location());
CREATE POLICY "foh_employees_insert_auth" ON public.foh_employees FOR INSERT TO authenticated WITH CHECK (location = public.current_user_location());
CREATE POLICY "foh_employees_update_auth" ON public.foh_employees FOR UPDATE TO authenticated USING (location = public.current_user_location());
CREATE POLICY "foh_employees_delete_auth" ON public.foh_employees FOR DELETE TO authenticated USING (location = public.current_user_location());

DROP POLICY IF EXISTS "Users can create FOH tasks for their location" ON public.foh_tasks;
DROP POLICY IF EXISTS "Users can delete FOH tasks for their location" ON public.foh_tasks;
DROP POLICY IF EXISTS "Users can update FOH tasks for their location" ON public.foh_tasks;
DROP POLICY IF EXISTS "Users can view FOH tasks for their location" ON public.foh_tasks;
CREATE POLICY "foh_tasks_select_auth" ON public.foh_tasks FOR SELECT TO authenticated USING (location = public.current_user_location());
CREATE POLICY "foh_tasks_insert_auth" ON public.foh_tasks FOR INSERT TO authenticated WITH CHECK (location = public.current_user_location());
CREATE POLICY "foh_tasks_update_auth" ON public.foh_tasks FOR UPDATE TO authenticated USING (location = public.current_user_location());
CREATE POLICY "foh_tasks_delete_auth" ON public.foh_tasks FOR DELETE TO authenticated USING (location = public.current_user_location());

DROP POLICY IF EXISTS "Users can view memos for their location" ON public.handover_memos;
DROP POLICY IF EXISTS "Admins can manage memos" ON public.handover_memos;
CREATE POLICY "handover_memos_select_auth" ON public.handover_memos FOR SELECT TO authenticated USING (location = public.current_user_location());
CREATE POLICY "handover_memos_admin_manage" ON public.handover_memos FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "View waste pickups for own location" ON public.waste_pickups;
CREATE POLICY "waste_pickups_select_auth" ON public.waste_pickups FOR SELECT TO authenticated USING (location = public.current_user_location());

-- weather_data: keep public read (weather is not sensitive) but scope insert to authenticated
DROP POLICY IF EXISTS "System can insert weather data" ON public.weather_data;
CREATE POLICY "weather_data_insert_auth" ON public.weather_data FOR INSERT TO authenticated WITH CHECK (true);

-- 3) Fix mutable search_path on remaining functions
ALTER FUNCTION public.personeel_validate_team_location() SET search_path = public;
ALTER FUNCTION public.personeel_validate_assignment_team_location() SET search_path = public;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public;
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public;

-- 4) Revoke EXECUTE from anon on all public functions (block unauthenticated RPC surface)
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC, anon;

-- Re-grant to authenticated where the app/client needs to call directly
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_location(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_location() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_manager_same_location(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.foh_rename_category(text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ingredienten_merge(uuid, uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sticker_producten_bump(text, text, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_next_print_job() TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_order_number() TO authenticated;
