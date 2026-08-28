-- 1. Herkomst van bestelregels
ALTER TABLE public.inkoop_order_regels
  ADD COLUMN IF NOT EXISTS bron text NOT NULL DEFAULT 'systeem',
  ADD COLUMN IF NOT EXISTS handmatig_aangepast boolean NOT NULL DEFAULT false;
ALTER TABLE public.inkoop_order_regels
  DROP CONSTRAINT IF EXISTS inkoop_order_regels_bron_check;
ALTER TABLE public.inkoop_order_regels
  ADD CONSTRAINT inkoop_order_regels_bron_check CHECK (bron IN ('systeem','handmatig'));

ALTER TABLE public.internal_order_items
  ADD COLUMN IF NOT EXISTS bron text NOT NULL DEFAULT 'systeem',
  ADD COLUMN IF NOT EXISTS handmatig_aangepast boolean NOT NULL DEFAULT false;
ALTER TABLE public.internal_order_items
  DROP CONSTRAINT IF EXISTS internal_order_items_bron_check;
ALTER TABLE public.internal_order_items
  ADD CONSTRAINT internal_order_items_bron_check CHECK (bron IN ('systeem','handmatig'));

-- Bestaande regels zijn met de hand gemaakt: nooit opruimen
UPDATE public.internal_order_items SET bron = 'handmatig' WHERE bron = 'systeem';

-- 2. Hulpfunctie: is de huidige aanroep manager/owner?
CREATE OR REPLACE FUNCTION public.is_inkoop_beheerder()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL AND (
    has_role(auth.uid(), 'owner'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'manager'::app_role)
  )
$$;

CREATE OR REPLACE FUNCTION public.is_service_call()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT coalesce(
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role',
    current_user
  ) IN ('service_role','postgres','supabase_admin')
$$;

-- 3. Guard op inkoop_orders: welke statusovergang mag wie zetten?
CREATE OR REPLACE FUNCTION public.inkoop_orders_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_service_call() THEN
    RETURN NEW;
  END IF;

  -- Kanaal api: "besteld" komt uitsluitend uit de leverancierskoppeling
  IF NEW.status = 'besteld' AND OLD.status IS DISTINCT FROM 'besteld' AND NEW.kanaal = 'api' THEN
    RAISE EXCEPTION 'Bij deze leverancier wordt "besteld" automatisch gezet na een geslaagde verzending.';
  END IF;

  IF public.is_inkoop_beheerder() THEN
    RETURN NEW;
  END IF;

  -- Teamleden: alleen besteld-markeren (portal/mail) en ontvangst
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status = 'besteld' THEN
      IF NEW.kanaal NOT IN ('portal','mail') OR OLD.status NOT IN ('concept','verzonden') THEN
        RAISE EXCEPTION 'Je account mag deze bestelling niet als besteld markeren.';
      END IF;
    ELSIF NEW.status IN ('deels_ontvangen','ontvangen') THEN
      IF OLD.status NOT IN ('verzonden','besteld','deels_ontvangen','ontvangen') THEN
        RAISE EXCEPTION 'Deze bestelling is nog niet verstuurd; ontvangst kan nog niet worden vastgelegd.';
      END IF;
    ELSE
      RAISE EXCEPTION 'Alleen een manager kan deze bestelling op status "%" zetten.', NEW.status;
    END IF;
  END IF;

  IF NEW.vestiging IS DISTINCT FROM OLD.vestiging
     OR NEW.leverancier_id IS DISTINCT FROM OLD.leverancier_id
     OR NEW.bestelnummer IS DISTINCT FROM OLD.bestelnummer
     OR NEW.kanaal IS DISTINCT FROM OLD.kanaal
     OR NEW.leverdatum IS DISTINCT FROM OLD.leverdatum
     OR NEW.deleted_at IS DISTINCT FROM OLD.deleted_at THEN
    RAISE EXCEPTION 'Alleen een manager kan de gegevens van deze bestelling wijzigen.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS inkoop_orders_guard_trg ON public.inkoop_orders;
CREATE TRIGGER inkoop_orders_guard_trg
BEFORE UPDATE ON public.inkoop_orders
FOR EACH ROW EXECUTE FUNCTION public.inkoop_orders_guard();

-- 4. Guard op regels: teamleden mogen alleen ontvangst-velden zetten
CREATE OR REPLACE FUNCTION public.inkoop_order_regels_guard()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_service_call() OR public.is_inkoop_beheerder() THEN
    RETURN NEW;
  END IF;

  IF NEW.order_id IS DISTINCT FROM OLD.order_id
     OR NEW.artikel_id IS DISTINCT FROM OLD.artikel_id
     OR NEW.artikelnummer IS DISTINCT FROM OLD.artikelnummer
     OR NEW.omschrijving IS DISTINCT FROM OLD.omschrijving
     OR NEW.besteleenheid_id IS DISTINCT FROM OLD.besteleenheid_id
     OR NEW.besteleenheid_code IS DISTINCT FROM OLD.besteleenheid_code
     OR NEW.inhoud_per_besteleenheid IS DISTINCT FROM OLD.inhoud_per_besteleenheid THEN
    RAISE EXCEPTION 'Alleen een manager kan deze bestelregel wijzigen.';
  END IF;

  -- Aantal aanpassen mag zolang de bestelling nog concept is
  IF NEW.aantal IS DISTINCT FROM OLD.aantal THEN
    IF NOT EXISTS (SELECT 1 FROM inkoop_orders o WHERE o.id = NEW.order_id AND o.status = 'concept') THEN
      RAISE EXCEPTION 'Het aantal kan alleen worden aangepast zolang de bestelling nog niet verstuurd is.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS inkoop_order_regels_guard_trg ON public.inkoop_order_regels;
CREATE TRIGGER inkoop_order_regels_guard_trg
BEFORE UPDATE ON public.inkoop_order_regels
FOR EACH ROW EXECUTE FUNCTION public.inkoop_order_regels_guard();

-- 5. RLS verruimen: iedereen mag bijwerken, de guard bepaalt wat
DROP POLICY IF EXISTS "inkoop_orders beheren" ON public.inkoop_orders;
CREATE POLICY "inkoop_orders aanmaken door beheer" ON public.inkoop_orders
  FOR INSERT TO authenticated WITH CHECK (public.is_inkoop_beheerder());
CREATE POLICY "inkoop_orders bijwerken" ON public.inkoop_orders
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "inkoop_orders verwijderen door beheer" ON public.inkoop_orders
  FOR DELETE TO authenticated USING (public.is_inkoop_beheerder());

DROP POLICY IF EXISTS "inkoop_order_regels beheren" ON public.inkoop_order_regels;
CREATE POLICY "inkoop_order_regels aanmaken door beheer" ON public.inkoop_order_regels
  FOR INSERT TO authenticated WITH CHECK (public.is_inkoop_beheerder());
CREATE POLICY "inkoop_order_regels bijwerken" ON public.inkoop_order_regels
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "inkoop_order_regels verwijderen door beheer" ON public.inkoop_order_regels
  FOR DELETE TO authenticated USING (public.is_inkoop_beheerder());

-- 6. Interne orderregels: bijwerken door beide betrokken vestigingen (ontvangst, aantal)
DROP POLICY IF EXISTS "Users can update order items" ON public.internal_order_items;
CREATE POLICY "Users can update order items" ON public.internal_order_items
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM internal_orders o
    WHERE o.id = internal_order_items.order_id
      AND (o.from_location = get_user_location(auth.uid()) OR o.to_location = get_user_location(auth.uid()))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM internal_orders o
    WHERE o.id = internal_order_items.order_id
      AND (o.from_location = get_user_location(auth.uid()) OR o.to_location = get_user_location(auth.uid()))
  ));

-- 7. Voorstel-RPC: alleen systeemregels vervangen
CREATE OR REPLACE FUNCTION public.rpc_genereer_bestelvoorstel(p_vestiging text, p_datum date DEFAULT NULL::date)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_datum date := coalesce(p_datum, (now() AT TIME ZONE 'Europe/Amsterdam')::date);
  v_ronde record;
  v_rij record;
  v_order_id uuid;
  v_leverdatum date;
  v_nummer text;
  v_regels int;
  v_orders jsonb := '[]'::jsonb;
  v_niet_geteld jsonb := '[]'::jsonb;
  v_geen_lev jsonb := '[]'::jsonb;
BEGIN
  IF p_vestiging NOT IN ('West','Midsland') THEN
    RAISE EXCEPTION 'Onbekende vestiging: %', p_vestiging;
  END IF;

  FOR v_ronde IN
    SELECT * FROM telrondes
    WHERE vestiging = p_vestiging AND datum = v_datum AND status = 'afgerond' AND deleted_at IS NULL
  LOOP
    v_order_id := NULL;
    v_leverdatum := NULL;

    IF v_ronde.route_type = 'leverancier' THEN
      SELECT v_datum + coalesce(bd.leverdag_offset, 1) INTO v_leverdatum
      FROM leverancier_besteldagen bd
      WHERE bd.leverancier_id = v_ronde.leverancier_id
        AND bd.actief AND bd.deleted_at IS NULL
        AND (bd.vestiging IS NULL OR bd.vestiging = p_vestiging)
        AND bd.weekdag = EXTRACT(dow FROM v_datum)::smallint
      ORDER BY bd.vestiging NULLS LAST
      LIMIT 1;

      SELECT id INTO v_order_id FROM inkoop_orders
      WHERE vestiging = p_vestiging AND leverancier_id = v_ronde.leverancier_id
        AND status = 'concept' AND deleted_at IS NULL
        AND (telronde_id = v_ronde.id
             OR coalesce(leverdatum, '1900-01-01') = coalesce(v_leverdatum, '1900-01-01'))
      ORDER BY (telronde_id = v_ronde.id) DESC
      LIMIT 1;

      IF v_order_id IS NULL THEN
        v_nummer := 'INK-' || to_char(v_datum,'YYYY') || '-' || lpad(nextval('inkoop_bestelnummer_seq')::text, 4, '0');
        INSERT INTO inkoop_orders (vestiging, leverancier_id, bestelnummer, kanaal, leverdatum, telronde_id)
        SELECT p_vestiging, v_ronde.leverancier_id, v_nummer, l.kanaal, v_leverdatum, v_ronde.id
        FROM leveranciers l WHERE l.id = v_ronde.leverancier_id
        RETURNING id INTO v_order_id;
      ELSE
        UPDATE inkoop_orders
           SET telronde_id = v_ronde.id, leverdatum = coalesce(v_leverdatum, leverdatum)
         WHERE id = v_order_id;
        -- Handwerk blijft staan: alleen onaangeraakte systeemregels verdwijnen
        DELETE FROM inkoop_order_regels
         WHERE order_id = v_order_id AND bron = 'systeem' AND handmatig_aangepast = false;
      END IF;

      SELECT count(*) INTO v_regels FROM inkoop_order_regels WHERE order_id = v_order_id;

      FOR v_rij IN
        SELECT a.id AS artikel_id, a.naam,
               al.min_voorraad, al.max_voorraad,
               tr.id AS telregel_id,
               coalesce(tr.geteld_basis, tr.geteld_aantal) AS geteld,
               la.id AS lev_artikel_id, la.artikelnummer,
               coalesce(la.inhoud_per_besteleenheid, 1) AS inhoud,
               la.besteleenheid_id, e.code AS besteleenheid_code
        FROM artikel_locaties al
        JOIN artikelen a ON a.id = al.artikel_id AND a.deleted_at IS NULL
        LEFT JOIN leverancier_artikelen la
          ON la.artikel_id = al.artikel_id AND la.leverancier_id = v_ronde.leverancier_id
         AND la.actief AND la.deleted_at IS NULL
        LEFT JOIN eenheden e ON e.id = la.besteleenheid_id
        LEFT JOIN telronde_regels tr ON tr.telronde_id = v_ronde.id AND tr.artikel_id = al.artikel_id
        WHERE al.vestiging = p_vestiging AND al.aanvul_bron = 'leverancier'
          AND al.is_actief AND al.deleted_at IS NULL
          AND (la.id IS NOT NULL OR tr.id IS NOT NULL)
        ORDER BY al.tel_volgorde
      LOOP
        -- Artikel dat de mens zelf op de order heeft gezet of aangepast: niet aanraken
        CONTINUE WHEN EXISTS (
          SELECT 1 FROM inkoop_order_regels r
          WHERE r.order_id = v_order_id AND r.artikel_id = v_rij.artikel_id
            AND (r.bron = 'handmatig' OR r.handmatig_aangepast)
        );

        IF v_rij.lev_artikel_id IS NULL THEN
          v_geen_lev := v_geen_lev || jsonb_build_object('artikel_id', v_rij.artikel_id, 'naam', v_rij.naam);
          CONTINUE;
        END IF;

        IF v_rij.telregel_id IS NULL THEN
          v_niet_geteld := v_niet_geteld || jsonb_build_object('artikel_id', v_rij.artikel_id, 'naam', v_rij.naam, 'route', 'leverancier');
          CONTINUE;
        END IF;

        CONTINUE WHEN v_rij.geteld > coalesce(v_rij.min_voorraad, 0);

        DECLARE
          v_onderweg numeric := 0;
          v_behoefte numeric;
          v_aantal numeric;
        BEGIN
          SELECT coalesce(sum(greatest(r.aantal * coalesce(r.inhoud_per_besteleenheid,1)
                 - coalesce(r.ontvangen_aantal,0) * coalesce(r.inhoud_per_besteleenheid,1), 0)), 0)
          INTO v_onderweg
          FROM inkoop_order_regels r
          JOIN inkoop_orders o ON o.id = r.order_id
          WHERE r.artikel_id = v_rij.artikel_id AND o.vestiging = p_vestiging
            AND o.deleted_at IS NULL AND o.status IN ('verzonden','besteld','deels_ontvangen');

          v_behoefte := coalesce(v_rij.max_voorraad,0) - v_rij.geteld - v_onderweg;
          CONTINUE WHEN v_behoefte <= 0;

          v_aantal := ceil(v_behoefte / greatest(v_rij.inhoud, 0.0001));

          INSERT INTO inkoop_order_regels
            (order_id, artikel_id, artikelnummer, omschrijving, aantal, besteleenheid_id, besteleenheid_code, inhoud_per_besteleenheid, bron)
          VALUES (v_order_id, v_rij.artikel_id, v_rij.artikelnummer, v_rij.naam, v_aantal,
                  v_rij.besteleenheid_id, v_rij.besteleenheid_code, v_rij.inhoud, 'systeem');
          v_regels := v_regels + 1;
        END;
      END LOOP;

      IF v_regels = 0 THEN
        DELETE FROM inkoop_orders WHERE id = v_order_id AND status = 'concept';
      ELSE
        v_orders := v_orders || jsonb_build_object('type','inkoop','order_id',v_order_id,'regels',v_regels,'leverdatum',v_leverdatum);
      END IF;

    ELSE
      SELECT v_datum + 1 INTO v_leverdatum;
      SELECT v_datum + 1 INTO v_leverdatum
      FROM interne_leverdagen il
      WHERE il.van_vestiging = v_ronde.bron_vestiging AND il.naar_vestiging = p_vestiging
        AND il.actief AND il.deleted_at IS NULL
      LIMIT 1;

      SELECT id INTO v_order_id FROM internal_orders
      WHERE from_location = p_vestiging AND to_location = v_ronde.bron_vestiging AND status = 'concept'
      LIMIT 1;

      IF v_order_id IS NULL THEN
        INSERT INTO internal_orders (from_location, to_location, status, delivery_date)
        VALUES (p_vestiging, v_ronde.bron_vestiging, 'concept', v_leverdatum)
        RETURNING id INTO v_order_id;
      ELSE
        DELETE FROM internal_order_items
         WHERE order_id = v_order_id AND bron = 'systeem' AND handmatig_aangepast = false;
      END IF;

      SELECT count(*) INTO v_regels FROM internal_order_items WHERE order_id = v_order_id;

      FOR v_rij IN
        SELECT a.id AS artikel_id, a.naam, al.min_voorraad, al.max_voorraad,
               tr.id AS telregel_id, coalesce(tr.geteld_basis, tr.geteld_aantal) AS geteld,
               a.basis_eenheid_id, coalesce(e.code,'stuk') AS eenheid_code
        FROM artikel_locaties al
        JOIN artikelen a ON a.id = al.artikel_id AND a.deleted_at IS NULL
        LEFT JOIN eenheden e ON e.id = a.basis_eenheid_id
        LEFT JOIN telronde_regels tr ON tr.telronde_id = v_ronde.id AND tr.artikel_id = al.artikel_id
        WHERE al.vestiging = p_vestiging AND al.aanvul_bron = 'interne_order'
          AND al.bron_vestiging = v_ronde.bron_vestiging
          AND al.is_actief AND al.deleted_at IS NULL
        ORDER BY al.tel_volgorde
      LOOP
        CONTINUE WHEN EXISTS (
          SELECT 1 FROM internal_order_items i
          WHERE i.order_id = v_order_id AND i.artikel_id = v_rij.artikel_id
            AND (i.bron = 'handmatig' OR i.handmatig_aangepast)
        );

        IF v_rij.telregel_id IS NULL THEN
          v_niet_geteld := v_niet_geteld || jsonb_build_object('artikel_id', v_rij.artikel_id, 'naam', v_rij.naam, 'route','intern');
          CONTINUE;
        END IF;

        CONTINUE WHEN v_rij.geteld > coalesce(v_rij.min_voorraad, 0);

        DECLARE
          v_onderweg numeric := 0;
          v_behoefte numeric;
        BEGIN
          SELECT coalesce(sum(greatest(i.quantity - coalesce(i.ontvangen_aantal,0), 0)), 0)
          INTO v_onderweg
          FROM internal_order_items i
          JOIN internal_orders o ON o.id = i.order_id
          WHERE i.artikel_id = v_rij.artikel_id AND o.from_location = p_vestiging
            AND o.status IN ('pending','approved');

          v_behoefte := coalesce(v_rij.max_voorraad,0) - v_rij.geteld - v_onderweg;
          CONTINUE WHEN v_behoefte <= 0;

          INSERT INTO internal_order_items (order_id, artikel_id, eenheid_id, product_name, unit, quantity, bron)
          VALUES (v_order_id, v_rij.artikel_id, v_rij.basis_eenheid_id, v_rij.naam, v_rij.eenheid_code, ceil(v_behoefte), 'systeem');
          v_regels := v_regels + 1;
        END;
      END LOOP;

      IF v_regels = 0 THEN
        DELETE FROM internal_orders WHERE id = v_order_id AND status = 'concept';
      ELSE
        v_orders := v_orders || jsonb_build_object('type','intern','order_id',v_order_id,'regels',v_regels,'leverdatum',v_leverdatum);
      END IF;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'vestiging', p_vestiging,
    'datum', v_datum,
    'orders', v_orders,
    'niet_geteld', v_niet_geteld,
    'geen_leverancier', v_geen_lev
  );
END;
$function$;

-- 8. Ad-hoc extra bestellen op elke route
CREATE OR REPLACE FUNCTION public.rpc_extra_bestellen(
  p_vestiging text,
  p_route_type text,
  p_route_id text,
  p_artikel_id uuid,
  p_aantal numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_datum date := (now() AT TIME ZONE 'Europe/Amsterdam')::date;
  v_order_id uuid;
  v_leverdatum date;
  v_nummer text;
  v_regel_id uuid;
  v_naam text;
  v_melding text := NULL;
  v_la record;
  v_eenheid_id uuid;
  v_eenheid_code text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Niet ingelogd.';
  END IF;
  IF p_aantal IS NULL OR p_aantal <= 0 THEN
    RAISE EXCEPTION 'Vul een aantal groter dan nul in.';
  END IF;

  SELECT naam INTO v_naam FROM artikelen WHERE id = p_artikel_id AND deleted_at IS NULL;
  IF v_naam IS NULL THEN
    RAISE EXCEPTION 'Onbekend artikel.';
  END IF;

  IF p_route_type = 'leverancier' THEN
    SELECT (v_datum + coalesce(bd.leverdag_offset,1))::date INTO v_leverdatum
    FROM leverancier_besteldagen bd
    WHERE bd.leverancier_id = p_route_id::uuid AND bd.actief AND bd.deleted_at IS NULL
      AND (bd.vestiging IS NULL OR bd.vestiging = p_vestiging)
      AND ((bd.weekdag - EXTRACT(dow FROM v_datum)::int) + 7) % 7 >= 0
    ORDER BY ((bd.weekdag - EXTRACT(dow FROM v_datum)::int) + 7) % 7, bd.vestiging NULLS LAST
    LIMIT 1;

    IF v_leverdatum IS NULL THEN
      v_melding := 'Geen besteldag ingesteld voor deze leverancier — de bestelling heeft nog geen leverdatum.';
    END IF;

    SELECT id INTO v_order_id FROM inkoop_orders
    WHERE vestiging = p_vestiging AND leverancier_id = p_route_id::uuid
      AND status = 'concept' AND deleted_at IS NULL
    ORDER BY created_at DESC LIMIT 1;

    IF v_order_id IS NULL THEN
      v_nummer := 'INK-' || to_char(v_datum,'YYYY') || '-' || lpad(nextval('inkoop_bestelnummer_seq')::text, 4, '0');
      INSERT INTO inkoop_orders (vestiging, leverancier_id, bestelnummer, kanaal, leverdatum)
      SELECT p_vestiging, l.id, v_nummer, l.kanaal, v_leverdatum
      FROM leveranciers l WHERE l.id = p_route_id::uuid
      RETURNING id INTO v_order_id;
    END IF;

    SELECT la.artikelnummer, la.besteleenheid_id, coalesce(la.inhoud_per_besteleenheid,1) AS inhoud, e.code
      INTO v_la
    FROM leverancier_artikelen la
    LEFT JOIN eenheden e ON e.id = la.besteleenheid_id
    WHERE la.leverancier_id = p_route_id::uuid AND la.artikel_id = p_artikel_id
      AND la.actief AND la.deleted_at IS NULL
    LIMIT 1;

    SELECT id INTO v_regel_id FROM inkoop_order_regels
    WHERE order_id = v_order_id AND artikel_id = p_artikel_id LIMIT 1;

    IF v_regel_id IS NULL THEN
      INSERT INTO inkoop_order_regels
        (order_id, artikel_id, artikelnummer, omschrijving, aantal, besteleenheid_id, besteleenheid_code,
         inhoud_per_besteleenheid, bron, handmatig_aangepast)
      VALUES (v_order_id, p_artikel_id, v_la.artikelnummer, v_naam, p_aantal, v_la.besteleenheid_id,
              v_la.code, coalesce(v_la.inhoud,1), 'handmatig', true)
      RETURNING id INTO v_regel_id;
    ELSE
      UPDATE inkoop_order_regels
         SET aantal = aantal + p_aantal, handmatig_aangepast = true
       WHERE id = v_regel_id;
    END IF;

    RETURN jsonb_build_object('type','inkoop','order_id',v_order_id,'regel_id',v_regel_id,'melding',v_melding);
  END IF;

  -- interne route
  SELECT (v_datum + 1)::date INTO v_leverdatum
  FROM interne_leverdagen il
  WHERE il.van_vestiging = p_route_id AND il.naar_vestiging = p_vestiging
    AND il.actief AND il.deleted_at IS NULL
  LIMIT 1;

  IF v_leverdatum IS NULL THEN
    v_melding := 'Geen interne leverdag ingesteld — de bestelling heeft nog geen leverdatum.';
  END IF;

  SELECT id INTO v_order_id FROM internal_orders
  WHERE from_location = p_vestiging AND to_location = p_route_id AND status = 'concept'
  ORDER BY created_at DESC LIMIT 1;

  IF v_order_id IS NULL THEN
    INSERT INTO internal_orders (from_location, to_location, status, delivery_date, requested_by)
    VALUES (p_vestiging, p_route_id, 'concept', v_leverdatum, auth.uid())
    RETURNING id INTO v_order_id;
  END IF;

  SELECT a.basis_eenheid_id, coalesce(e.code,'stuk') INTO v_eenheid_id, v_eenheid_code
  FROM artikelen a LEFT JOIN eenheden e ON e.id = a.basis_eenheid_id
  WHERE a.id = p_artikel_id;

  SELECT id INTO v_regel_id FROM internal_order_items
  WHERE order_id = v_order_id AND artikel_id = p_artikel_id LIMIT 1;

  IF v_regel_id IS NULL THEN
    INSERT INTO internal_order_items
      (order_id, artikel_id, eenheid_id, product_name, unit, quantity, bron, handmatig_aangepast)
    VALUES (v_order_id, p_artikel_id, v_eenheid_id, v_naam, v_eenheid_code, p_aantal, 'handmatig', true)
    RETURNING id INTO v_regel_id;
  ELSE
    UPDATE internal_order_items
       SET quantity = quantity + p_aantal, handmatig_aangepast = true
     WHERE id = v_regel_id;
  END IF;

  RETURN jsonb_build_object('type','intern','order_id',v_order_id,'regel_id',v_regel_id,'melding',v_melding);
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_extra_bestellen(text, text, text, uuid, numeric) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_inkoop_beheerder() TO authenticated;