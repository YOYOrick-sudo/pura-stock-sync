CREATE OR REPLACE FUNCTION public.is_actief_teamlid()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND is_active = true)
$$;
REVOKE EXECUTE ON FUNCTION public.is_actief_teamlid() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_actief_teamlid() TO authenticated, service_role;

DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT tablename, policyname, cmd, qual, with_check FROM pg_policies
    WHERE schemaname='public' AND roles = '{authenticated}'::name[]
      AND (qual='true' OR with_check='true')
      AND tablename IN ('artikel_locaties','artikelen','drukte_kalender','fase2_vlag','foh_category_order','gerecht_allergeen_besluit','gerecht_kaart_vestiging','gerechten','halffabricaat_methodes','horeko_artikel_allergenen','horeko_artikelen','horeko_gerecht_verbruik','horeko_recept_allergenen','horeko_recept_declaratie','horeko_recept_regels','horeko_recepten','inkoop_order_regels','inkoop_orders','keten_instellingen','leverancier_artikelen','leverancier_keuze_regel','leverancier_levering','maintenance_tickets','mep_dagopbouw_log','mep_handelingen','mep_instellingen','mep_templates','ontvangst_instelling','ontvangst_pilot','personeel_locations','personeel_teams','prijs_waarneming','print_jobs','recept_ingredienten','recipes','sticker_producten','telronde_regels','telrondes','ticket_comments','verbruik_opslag_groep','vestiging_instellingen','vestiging_opendagen','vestiging_sluitdatums')
  LOOP
    IF p.qual = 'true' THEN
      EXECUTE format('ALTER POLICY %I ON public.%I USING (public.is_actief_teamlid())', p.policyname, p.tablename);
    END IF;
    IF p.with_check = 'true' THEN
      EXECUTE format('ALTER POLICY %I ON public.%I WITH CHECK (public.is_actief_teamlid())', p.policyname, p.tablename);
    END IF;
  END LOOP;
END $$;