CREATE TABLE public.bestel_advies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vestiging text NOT NULL CHECK (vestiging IN ('West','Midsland')),
  datum date NOT NULL,
  leverdag date NOT NULL,
  artikel text NOT NULL,
  leverancier text,
  hoeveelheid numeric NOT NULL DEFAULT 0,
  eenheid text,
  verwacht_verbruik numeric,
  onzeker boolean DEFAULT false,
  reden text,
  artikel_id uuid NULL REFERENCES public.artikelen(id) ON DELETE SET NULL,
  artikel_vorm_id uuid NULL REFERENCES public.artikel_vormen(id) ON DELETE SET NULL,
  leverancier_id uuid NULL REFERENCES public.leveranciers(id) ON DELETE SET NULL,
  op_bord_regel_id uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT bestel_advies_uniek UNIQUE NULLS NOT DISTINCT (vestiging, leverdag, leverancier, artikel)
);
CREATE INDEX bestel_advies_vestiging_leverdag_idx ON public.bestel_advies (vestiging, leverdag);

GRANT SELECT ON public.bestel_advies TO authenticated;
GRANT UPDATE (op_bord_regel_id) ON public.bestel_advies TO authenticated;
GRANT ALL ON public.bestel_advies TO service_role;

ALTER TABLE public.bestel_advies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bestel_advies lezen" ON public.bestel_advies FOR SELECT TO authenticated
  USING (public.heeft_vestiging(auth.uid(), vestiging));
CREATE POLICY "bestel_advies op bord" ON public.bestel_advies FOR UPDATE TO authenticated
  USING (public.heeft_vestiging(auth.uid(), vestiging))
  WITH CHECK (public.heeft_vestiging(auth.uid(), vestiging));

CREATE TRIGGER set_updated_at_bestel_advies BEFORE UPDATE ON public.bestel_advies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.bestelbot_advies_vervangen(p_vestiging text, p_datum date, p_leverdag date, p_regels jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r jsonb;
  v_art uuid; v_lev uuid; v_vorm uuid;
  v_aantal int := 0; v_gekoppeld int := 0;
BEGIN
  IF NOT public.is_service_call() THEN RAISE EXCEPTION 'Alleen service role' USING ERRCODE='42501'; END IF;
  IF p_vestiging NOT IN ('West','Midsland') THEN RAISE EXCEPTION 'Ongeldige vestiging'; END IF;
  IF jsonb_typeof(p_regels) <> 'array' THEN RAISE EXCEPTION 'regels moet een lijst zijn'; END IF;

  CREATE TEMP TABLE _oud_bord ON COMMIT DROP AS
    SELECT lower(artikel) AS art, lower(coalesce(leverancier,'')) AS lev, op_bord_regel_id
    FROM public.bestel_advies
    WHERE vestiging = p_vestiging AND leverdag = p_leverdag AND op_bord_regel_id IS NOT NULL;

  DELETE FROM public.bestel_advies WHERE vestiging = p_vestiging AND leverdag = p_leverdag;

  FOR r IN SELECT * FROM jsonb_array_elements(p_regels) LOOP
    v_art := NULLIF(r->>'artikel_id','')::uuid;
    IF v_art IS NULL THEN
      SELECT a.id INTO v_art FROM public.artikelen a
      WHERE a.deleted_at IS NULL AND lower(a.naam) = lower(trim(r->>'artikel')) ORDER BY a.created_at LIMIT 1;
    END IF;
    v_lev := NULL;
    IF NULLIF(trim(r->>'leverancier'),'') IS NOT NULL THEN
      SELECT l.id INTO v_lev FROM public.leveranciers l
      WHERE l.deleted_at IS NULL AND lower(l.naam) = lower(trim(r->>'leverancier')) ORDER BY l.created_at LIMIT 1;
    END IF;
    v_vorm := NULLIF(r->>'artikel_vorm_id','')::uuid;
    IF v_vorm IS NULL AND v_art IS NOT NULL THEN
      SELECT v.id INTO v_vorm FROM public.artikel_vormen v
      WHERE v.artikel_id = v_art AND v.vestiging = p_vestiging AND v.deleted_at IS NULL
      ORDER BY (v_lev IS NOT NULL AND v.leverancier_id = v_lev) DESC, v.is_standaard DESC, v.keer_besteld DESC
      LIMIT 1;
    END IF;

    INSERT INTO public.bestel_advies (vestiging, datum, leverdag, artikel, leverancier, hoeveelheid, eenheid,
      verwacht_verbruik, onzeker, reden, artikel_id, artikel_vorm_id, leverancier_id, op_bord_regel_id)
    VALUES (p_vestiging, p_datum, p_leverdag, trim(r->>'artikel'), NULLIF(trim(r->>'leverancier'),''),
      coalesce((r->>'hoeveelheid')::numeric, 0), NULLIF(r->>'eenheid',''),
      (r->>'verwacht_verbruik')::numeric, coalesce((r->>'onzeker')::boolean, false), r->>'reden',
      v_art, v_vorm, v_lev,
      (SELECT o.op_bord_regel_id FROM _oud_bord o
        WHERE o.art = lower(trim(r->>'artikel')) AND o.lev = lower(coalesce(trim(r->>'leverancier'),'')) LIMIT 1));
    v_aantal := v_aantal + 1;
    IF v_art IS NOT NULL THEN v_gekoppeld := v_gekoppeld + 1; END IF;
  END LOOP;

  RETURN jsonb_build_object('aantal', v_aantal, 'gekoppeld', v_gekoppeld);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.bestelbot_advies_vervangen(text, date, date, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.bestelbot_advies_vervangen(text, date, date, jsonb) TO service_role;

GRANT SELECT ON public.horeko_artikelen, public.horeko_recepten, public.horeko_recept_regels, public.horeko_gerecht_verbruik TO authenticated;
GRANT SELECT ON public.horeko_artikelen, public.horeko_recepten, public.horeko_recept_regels, public.horeko_gerecht_verbruik TO service_role;