
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

      -- Idempotent: eerst op telronde matchen, anders op leverdatum
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
           SET telronde_id = v_ronde.id, leverdatum = v_leverdatum
         WHERE id = v_order_id;
        DELETE FROM inkoop_order_regels WHERE order_id = v_order_id;
      END IF;

      v_regels := 0;

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
            (order_id, artikel_id, artikelnummer, omschrijving, aantal, besteleenheid_id, besteleenheid_code, inhoud_per_besteleenheid)
          VALUES (v_order_id, v_rij.artikel_id, v_rij.artikelnummer, v_rij.naam, v_aantal,
                  v_rij.besteleenheid_id, v_rij.besteleenheid_code, v_rij.inhoud);
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
        DELETE FROM internal_order_items WHERE order_id = v_order_id;
      END IF;

      v_regels := 0;

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

          INSERT INTO internal_order_items (order_id, artikel_id, eenheid_id, product_name, unit, quantity)
          VALUES (v_order_id, v_rij.artikel_id, v_rij.basis_eenheid_id, v_rij.naam, v_rij.eenheid_code, ceil(v_behoefte));
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
