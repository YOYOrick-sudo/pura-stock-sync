-- Besteldeadline per leverancier (deadline_tijd in leverancier_besteldagen, NL-tijd).
-- Een besteldag telt vandaag alleen nog als de NL-tijd vóór deadline_tijd ligt; anders de eerstvolgende actieve besteldag.
-- deadline_tijd NULL = geen deadline. Leveranciers zonder rijen werken als voorheen.

CREATE OR REPLACE FUNCTION public.bestel_verwachte_levering(_vestiging text, _leverancier_id uuid, _besteld_op timestamp with time zone)
 RETURNS date
 LANGUAGE plpgsql
 STABLE
 SET search_path TO 'public'
AS $function$
DECLARE
  v_lokaal timestamp := (_besteld_op AT TIME ZONE 'Europe/Amsterdam');
  v_basis date := v_lokaal::date;
  v_tijd time := v_lokaal::time;
  v_levering date;
  v_guard int := 0;
BEGIN
  IF _leverancier_id IS NOT NULL THEN
    -- eerstvolgende besteldag (weekdag = extract(dow), 0=zondag) + leverdag_offset;
    -- vandaag telt alleen als de NL-tijd nog vóór deadline_tijd ligt
    SELECT min(v_basis + d.n + COALESCE(b.leverdag_offset, 0)) INTO v_levering
    FROM public.leverancier_besteldagen b
    CROSS JOIN LATERAL (
      SELECT CASE
               WHEN ((b.weekdag - EXTRACT(dow FROM v_basis)::int + 7) % 7) = 0
                    AND b.deadline_tijd IS NOT NULL AND v_tijd >= b.deadline_tijd THEN 7
               ELSE ((b.weekdag - EXTRACT(dow FROM v_basis)::int + 7) % 7)
             END AS n
    ) d
    WHERE b.leverancier_id = _leverancier_id AND b.vestiging = _vestiging AND b.actief AND b.deleted_at IS NULL;
  END IF;
  IF v_levering IS NULL THEN v_levering := v_basis + 1; END IF;
  WHILE v_guard < 14 AND NOT public.mep_is_open(_vestiging, v_levering) LOOP
    v_levering := v_levering + 1;
    v_guard := v_guard + 1;
  END LOOP;
  RETURN v_levering;
END
$function$;

CREATE OR REPLACE FUNCTION public.rpc_extra_bestellen(p_vestiging text, p_route_type text, p_route_id text, p_artikel_id uuid, p_aantal numeric)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    -- eerstvolgende besteldag; vandaag telt alleen vóór deadline_tijd (NL-tijd)
    SELECT (v_datum + d.n + coalesce(bd.leverdag_offset,1))::date INTO v_leverdatum
    FROM leverancier_besteldagen bd
    CROSS JOIN LATERAL (
      SELECT CASE
               WHEN ((bd.weekdag - EXTRACT(dow FROM v_datum)::int) + 7) % 7 = 0
                    AND bd.deadline_tijd IS NOT NULL
                    AND (now() AT TIME ZONE 'Europe/Amsterdam')::time >= bd.deadline_tijd THEN 7
               ELSE ((bd.weekdag - EXTRACT(dow FROM v_datum)::int) + 7) % 7
             END AS n
    ) d
    WHERE bd.leverancier_id = p_route_id::uuid AND bd.actief AND bd.deleted_at IS NULL
      AND (bd.vestiging IS NULL OR bd.vestiging = p_vestiging)
    ORDER BY d.n, bd.vestiging NULLS LAST
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
$function$;

CREATE OR REPLACE FUNCTION public.rpc_genereer_bestelvoorstel(p_vestiging text, p_datum date DEFAULT NULL::date)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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
    SELECT DISTINCT ON (route_type, coalesce(leverancier_id::text, bron_vestiging)) *
    FROM telrondes
    WHERE vestiging = p_vestiging AND datum = v_datum AND status = 'afgerond' AND deleted_at IS NULL
    ORDER BY route_type, coalesce(leverancier_id::text, bron_vestiging),
             coalesce(afgerond_op, created_at) DESC
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

      -- deadline: is vandaag (NL) de besteldeadline al voorbij, dan geldt de eerstvolgende actieve besteldag
      IF v_leverdatum IS NOT NULL AND v_datum = (now() AT TIME ZONE 'Europe/Amsterdam')::date
         AND EXISTS (
           SELECT 1 FROM leverancier_besteldagen bd
           WHERE bd.leverancier_id = v_ronde.leverancier_id
             AND bd.actief AND bd.deleted_at IS NULL
             AND (bd.vestiging IS NULL OR bd.vestiging = p_vestiging)
             AND bd.weekdag = EXTRACT(dow FROM v_datum)::smallint
             AND bd.deadline_tijd IS NOT NULL
             AND (now() AT TIME ZONE 'Europe/Amsterdam')::time >= bd.deadline_tijd
         ) THEN
        SELECT v_datum + d.n + coalesce(bd.leverdag_offset, 1) INTO v_leverdatum
        FROM leverancier_besteldagen bd
        CROSS JOIN LATERAL (
          SELECT CASE WHEN ((bd.weekdag - EXTRACT(dow FROM v_datum)::int) + 7) % 7 = 0 THEN 7
                      ELSE ((bd.weekdag - EXTRACT(dow FROM v_datum)::int) + 7) % 7 END AS n
        ) d
        WHERE bd.leverancier_id = v_ronde.leverancier_id
          AND bd.actief AND bd.deleted_at IS NULL
          AND (bd.vestiging IS NULL OR bd.vestiging = p_vestiging)
        ORDER BY d.n, bd.vestiging NULLS LAST
        LIMIT 1;
      END IF;

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
        INSERT INTO internal_orders (from_location, to_location, status, delivery_date, requested_by)
        VALUES (p_vestiging, v_ronde.bron_vestiging, 'concept', v_leverdatum,
                coalesce(auth.uid(), v_ronde.afgerond_door, v_ronde.aangemaakt_door))
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