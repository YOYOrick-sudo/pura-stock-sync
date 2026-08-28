-- 1. Nieuwe controle: hoort deze vestiging bij deze gebruiker?
CREATE OR REPLACE FUNCTION public.heeft_vestiging(_user_id uuid, _loc text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND ur.is_active
      AND ur.location = _loc
  )
$$;

GRANT EXECUTE ON FUNCTION public.heeft_vestiging(uuid, text) TO authenticated, service_role;

-- 2. Bestaande helpers deterministisch maken (blijven in gebruik als fallback)
CREATE OR REPLACE FUNCTION public.current_user_location()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ur.location
  FROM user_roles ur
  WHERE ur.user_id = auth.uid() AND ur.is_active
  ORDER BY ur.location
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.get_user_location(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT location
  FROM public.user_roles
  WHERE user_id = _user_id AND is_active
  ORDER BY location
  LIMIT 1
$$;

-- 3. ai_suggestions
DROP POLICY IF EXISTS ai_suggestions_select_auth ON public.ai_suggestions;
CREATE POLICY ai_suggestions_select_auth ON public.ai_suggestions FOR SELECT TO authenticated
  USING (public.heeft_vestiging(auth.uid(), location));
DROP POLICY IF EXISTS ai_suggestions_update_auth ON public.ai_suggestions;
CREATE POLICY ai_suggestions_update_auth ON public.ai_suggestions FOR UPDATE TO authenticated
  USING (public.heeft_vestiging(auth.uid(), location));
DROP POLICY IF EXISTS ai_suggestions_insert_auth ON public.ai_suggestions;
CREATE POLICY ai_suggestions_insert_auth ON public.ai_suggestions FOR INSERT TO authenticated
  WITH CHECK (public.heeft_vestiging(auth.uid(), location));

-- 4. foh_daily_templates
DROP POLICY IF EXISTS foh_daily_templates_select_auth ON public.foh_daily_templates;
CREATE POLICY foh_daily_templates_select_auth ON public.foh_daily_templates FOR SELECT TO authenticated
  USING (public.heeft_vestiging(auth.uid(), location));
DROP POLICY IF EXISTS foh_daily_templates_insert_auth ON public.foh_daily_templates;
CREATE POLICY foh_daily_templates_insert_auth ON public.foh_daily_templates FOR INSERT TO authenticated
  WITH CHECK (public.heeft_vestiging(auth.uid(), location));
DROP POLICY IF EXISTS foh_daily_templates_update_auth ON public.foh_daily_templates;
CREATE POLICY foh_daily_templates_update_auth ON public.foh_daily_templates FOR UPDATE TO authenticated
  USING (public.heeft_vestiging(auth.uid(), location));
DROP POLICY IF EXISTS foh_daily_templates_delete_auth ON public.foh_daily_templates;
CREATE POLICY foh_daily_templates_delete_auth ON public.foh_daily_templates FOR DELETE TO authenticated
  USING (public.heeft_vestiging(auth.uid(), location));

-- 5. foh_employees
DROP POLICY IF EXISTS foh_employees_select_auth ON public.foh_employees;
CREATE POLICY foh_employees_select_auth ON public.foh_employees FOR SELECT TO authenticated
  USING (public.heeft_vestiging(auth.uid(), location));
DROP POLICY IF EXISTS foh_employees_insert_auth ON public.foh_employees;
CREATE POLICY foh_employees_insert_auth ON public.foh_employees FOR INSERT TO authenticated
  WITH CHECK (public.heeft_vestiging(auth.uid(), location));
DROP POLICY IF EXISTS foh_employees_update_auth ON public.foh_employees;
CREATE POLICY foh_employees_update_auth ON public.foh_employees FOR UPDATE TO authenticated
  USING (public.heeft_vestiging(auth.uid(), location));
DROP POLICY IF EXISTS foh_employees_delete_auth ON public.foh_employees;
CREATE POLICY foh_employees_delete_auth ON public.foh_employees FOR DELETE TO authenticated
  USING (public.heeft_vestiging(auth.uid(), location));

-- 6. foh_tasks
DROP POLICY IF EXISTS foh_tasks_select_auth ON public.foh_tasks;
CREATE POLICY foh_tasks_select_auth ON public.foh_tasks FOR SELECT TO authenticated
  USING (public.heeft_vestiging(auth.uid(), location));
DROP POLICY IF EXISTS foh_tasks_insert_auth ON public.foh_tasks;
CREATE POLICY foh_tasks_insert_auth ON public.foh_tasks FOR INSERT TO authenticated
  WITH CHECK (public.heeft_vestiging(auth.uid(), location));
DROP POLICY IF EXISTS foh_tasks_update_auth ON public.foh_tasks;
CREATE POLICY foh_tasks_update_auth ON public.foh_tasks FOR UPDATE TO authenticated
  USING (public.heeft_vestiging(auth.uid(), location));
DROP POLICY IF EXISTS foh_tasks_delete_auth ON public.foh_tasks;
CREATE POLICY foh_tasks_delete_auth ON public.foh_tasks FOR DELETE TO authenticated
  USING (public.heeft_vestiging(auth.uid(), location));

-- 7. handover_memos
DROP POLICY IF EXISTS handover_memos_select_auth ON public.handover_memos;
CREATE POLICY handover_memos_select_auth ON public.handover_memos FOR SELECT TO authenticated
  USING (public.heeft_vestiging(auth.uid(), location));
DROP POLICY IF EXISTS handover_memos_insert_own_location ON public.handover_memos;
CREATE POLICY handover_memos_insert_own_location ON public.handover_memos FOR INSERT TO authenticated
  WITH CHECK (public.heeft_vestiging(auth.uid(), location) AND created_by = auth.uid());
DROP POLICY IF EXISTS handover_memos_update_own_location ON public.handover_memos;
CREATE POLICY handover_memos_update_own_location ON public.handover_memos FOR UPDATE TO authenticated
  USING (public.heeft_vestiging(auth.uid(), location))
  WITH CHECK (public.heeft_vestiging(auth.uid(), location));

-- 8. internal_orders
DROP POLICY IF EXISTS "Users can view orders involving their location" ON public.internal_orders;
CREATE POLICY "Users can view orders involving their location" ON public.internal_orders FOR SELECT
  USING (public.heeft_vestiging(auth.uid(), from_location) OR public.heeft_vestiging(auth.uid(), to_location));
DROP POLICY IF EXISTS "Users can update orders for their location" ON public.internal_orders;
CREATE POLICY "Users can update orders for their location" ON public.internal_orders FOR UPDATE
  USING (public.heeft_vestiging(auth.uid(), from_location) OR public.heeft_vestiging(auth.uid(), to_location));
DROP POLICY IF EXISTS "Users can create orders from their location" ON public.internal_orders;
CREATE POLICY "Users can create orders from their location" ON public.internal_orders FOR INSERT
  WITH CHECK (public.heeft_vestiging(auth.uid(), from_location) AND auth.uid() = requested_by);

-- 9. internal_order_items
DROP POLICY IF EXISTS "Users can view order items" ON public.internal_order_items;
CREATE POLICY "Users can view order items" ON public.internal_order_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.internal_orders o WHERE o.id = internal_order_items.order_id
    AND (public.heeft_vestiging(auth.uid(), o.from_location) OR public.heeft_vestiging(auth.uid(), o.to_location))));
DROP POLICY IF EXISTS "Users can update order items" ON public.internal_order_items;
CREATE POLICY "Users can update order items" ON public.internal_order_items FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.internal_orders o WHERE o.id = internal_order_items.order_id
    AND (public.heeft_vestiging(auth.uid(), o.from_location) OR public.heeft_vestiging(auth.uid(), o.to_location))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.internal_orders o WHERE o.id = internal_order_items.order_id
    AND (public.heeft_vestiging(auth.uid(), o.from_location) OR public.heeft_vestiging(auth.uid(), o.to_location))));
DROP POLICY IF EXISTS "Users can create order items" ON public.internal_order_items;
CREATE POLICY "Users can create order items" ON public.internal_order_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.internal_orders o WHERE o.id = internal_order_items.order_id
    AND public.heeft_vestiging(auth.uid(), o.from_location) AND o.requested_by = auth.uid()));

-- 10. kassa_afdrachten
DROP POLICY IF EXISTS "Authenticated kan eigen locatie indienen" ON public.kassa_afdrachten;
CREATE POLICY "Authenticated kan eigen locatie indienen" ON public.kassa_afdrachten FOR INSERT TO authenticated
  WITH CHECK (created_by = auth.uid() AND public.heeft_vestiging(auth.uid(), location));

-- 11. kitchen_tasks
DROP POLICY IF EXISTS "Users can view tasks for their location" ON public.kitchen_tasks;
CREATE POLICY "Users can view tasks for their location" ON public.kitchen_tasks FOR SELECT
  USING (public.heeft_vestiging(auth.uid(), location));
DROP POLICY IF EXISTS "Users can update tasks for their location" ON public.kitchen_tasks;
CREATE POLICY "Users can update tasks for their location" ON public.kitchen_tasks FOR UPDATE
  USING (public.heeft_vestiging(auth.uid(), location));
DROP POLICY IF EXISTS "Users can create tasks" ON public.kitchen_tasks;
CREATE POLICY "Users can create tasks" ON public.kitchen_tasks FOR INSERT
  WITH CHECK (public.heeft_vestiging(auth.uid(), location));

-- 12. mep_planning
DROP POLICY IF EXISTS "Users can view MEP for their location" ON public.mep_planning;
CREATE POLICY "Users can view MEP for their location" ON public.mep_planning FOR SELECT
  USING (public.heeft_vestiging(auth.uid(), location));
DROP POLICY IF EXISTS "Users can update MEP for their location" ON public.mep_planning;
CREATE POLICY "Users can update MEP for their location" ON public.mep_planning FOR UPDATE
  USING (public.heeft_vestiging(auth.uid(), location));
DROP POLICY IF EXISTS "Users can create MEP entries" ON public.mep_planning;
CREATE POLICY "Users can create MEP entries" ON public.mep_planning FOR INSERT
  WITH CHECK (public.heeft_vestiging(auth.uid(), location));

-- 13. mep_taken
DROP POLICY IF EXISTS "mep taken zichtbaar eigen vestiging" ON public.mep_taken;
CREATE POLICY "mep taken zichtbaar eigen vestiging" ON public.mep_taken FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'manager') OR has_role(auth.uid(),'owner') OR has_role(auth.uid(),'admin')
    OR public.heeft_vestiging(auth.uid(), vestiging));
DROP POLICY IF EXISTS "mep taken beheren eigen vestiging" ON public.mep_taken;
CREATE POLICY "mep taken beheren eigen vestiging" ON public.mep_taken FOR ALL TO authenticated
  USING (has_role(auth.uid(),'manager') OR has_role(auth.uid(),'owner') OR has_role(auth.uid(),'admin')
    OR public.heeft_vestiging(auth.uid(), vestiging))
  WITH CHECK (has_role(auth.uid(),'manager') OR has_role(auth.uid(),'owner') OR has_role(auth.uid(),'admin')
    OR public.heeft_vestiging(auth.uid(), vestiging));

-- 14. productie_batches
DROP POLICY IF EXISTS "batches zichtbaar eigen vestiging" ON public.productie_batches;
CREATE POLICY "batches zichtbaar eigen vestiging" ON public.productie_batches FOR SELECT TO authenticated
  USING (has_role(auth.uid(),'manager') OR has_role(auth.uid(),'owner') OR has_role(auth.uid(),'admin')
    OR public.heeft_vestiging(auth.uid(), vestiging));
DROP POLICY IF EXISTS "batches aanmaken eigen vestiging" ON public.productie_batches;
CREATE POLICY "batches aanmaken eigen vestiging" ON public.productie_batches FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(),'manager') OR has_role(auth.uid(),'owner') OR has_role(auth.uid(),'admin')
    OR public.heeft_vestiging(auth.uid(), vestiging));

-- 15. recipes + recipe_steps
DROP POLICY IF EXISTS "Anyone can view recipes for their location" ON public.recipes;
CREATE POLICY "Anyone can view recipes for their location" ON public.recipes FOR SELECT
  USING (public.heeft_vestiging(auth.uid(), location) OR location = 'Both');
DROP POLICY IF EXISTS "Anyone can view recipe steps" ON public.recipe_steps;
CREATE POLICY "Anyone can view recipe steps" ON public.recipe_steps FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.recipes r WHERE r.id = recipe_steps.recipe_id
    AND (public.heeft_vestiging(auth.uid(), r.location) OR r.location = 'Both')));

-- 16. staff_members
DROP POLICY IF EXISTS "Users can view staff for their location" ON public.staff_members;
CREATE POLICY "Users can view staff for their location" ON public.staff_members FOR SELECT
  USING (public.heeft_vestiging(auth.uid(), location));
DROP POLICY IF EXISTS "Users can update staff for their location" ON public.staff_members;
CREATE POLICY "Users can update staff for their location" ON public.staff_members FOR UPDATE
  USING (public.heeft_vestiging(auth.uid(), location));
DROP POLICY IF EXISTS "Users can create staff for their location" ON public.staff_members;
CREATE POLICY "Users can create staff for their location" ON public.staff_members FOR INSERT
  WITH CHECK (public.heeft_vestiging(auth.uid(), location) AND created_by = auth.uid());

-- 17. waste_pickups + weather_data
DROP POLICY IF EXISTS waste_pickups_select_auth ON public.waste_pickups;
CREATE POLICY waste_pickups_select_auth ON public.waste_pickups FOR SELECT TO authenticated
  USING (public.heeft_vestiging(auth.uid(), location));
DROP POLICY IF EXISTS "Users can view weather data for their location" ON public.weather_data;
CREATE POLICY "Users can view weather data for their location" ON public.weather_data FOR SELECT
  USING (public.heeft_vestiging(auth.uid(), location));