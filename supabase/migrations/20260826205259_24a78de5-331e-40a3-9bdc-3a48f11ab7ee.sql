-- ============ 1. HALFFABRICAAT METHODES (bedrijfsbreed) ============
CREATE TABLE public.halffabricaat_methodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recept_id uuid NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  type text NOT NULL,
  visuele_eenheid text NOT NULL,
  output_hoeveelheid numeric(10,2) NOT NULL DEFAULT 1,
  output_eenheid text NOT NULL DEFAULT 'stuks',
  standaard_duur integer NOT NULL DEFAULT 15,
  houdbaarheid integer,
  instructie text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.halffabricaat_methodes TO authenticated;
GRANT ALL ON public.halffabricaat_methodes TO service_role;
ALTER TABLE public.halffabricaat_methodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "methodes leesbaar voor ingelogde gebruikers"
  ON public.halffabricaat_methodes FOR SELECT TO authenticated USING (true);
CREATE POLICY "methodes beheer door managers"
  ON public.halffabricaat_methodes FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin'));

CREATE INDEX idx_hf_methodes_recept ON public.halffabricaat_methodes(recept_id);

CREATE OR REPLACE FUNCTION public.validate_halffabricaat_methode()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.type NOT IN ('Bereiden','Aanvullen','Snijden','Roosteren','Portioneren','Uithalen','Ontdooien','Opwarmen','Afmaken','Vacumeren','Overig') THEN
    RAISE EXCEPTION 'Ongeldig methode-type: %', NEW.type;
  END IF;
  IF NEW.output_hoeveelheid <= 0 THEN
    RAISE EXCEPTION 'output_hoeveelheid moet groter dan 0 zijn';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_validate_hf_methode
  BEFORE INSERT OR UPDATE ON public.halffabricaat_methodes
  FOR EACH ROW EXECUTE FUNCTION public.validate_halffabricaat_methode();

CREATE TRIGGER trg_hf_methodes_updated_at
  BEFORE UPDATE ON public.halffabricaat_methodes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ 2. MEP TAKEN ============
CREATE TABLE public.mep_taken (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vestiging text NOT NULL,
  titel text NOT NULL,
  categorie text NOT NULL DEFAULT 'Algemeen',
  taak_datum date NOT NULL DEFAULT CURRENT_DATE,
  deadline time,
  recept_id uuid REFERENCES public.recipes(id) ON DELETE SET NULL,
  methode_id uuid REFERENCES public.halffabricaat_methodes(id) ON DELETE SET NULL,
  doel_aantal numeric(10,2),
  doel_eenheid text,
  prioriteit integer NOT NULL DEFAULT 2,
  status text NOT NULL DEFAULT 'open',
  toegewezen_aan uuid,
  volgorde integer NOT NULL DEFAULT 0,
  notitie text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.mep_taken TO authenticated;
GRANT ALL ON public.mep_taken TO service_role;
ALTER TABLE public.mep_taken ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mep taken zichtbaar eigen vestiging"
  ON public.mep_taken FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin')
    OR vestiging = public.get_user_location(auth.uid())
  );
CREATE POLICY "mep taken beheren eigen vestiging"
  ON public.mep_taken FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin')
    OR vestiging = public.get_user_location(auth.uid())
  )
  WITH CHECK (
    public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin')
    OR vestiging = public.get_user_location(auth.uid())
  );

CREATE INDEX idx_mep_taken_vestiging_datum ON public.mep_taken(vestiging, taak_datum);
CREATE INDEX idx_mep_taken_toegewezen ON public.mep_taken(toegewezen_aan);

CREATE OR REPLACE FUNCTION public.validate_mep_taak()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.status NOT IN ('open','bezig','afgerond','geannuleerd') THEN
    RAISE EXCEPTION 'Ongeldige status: %', NEW.status;
  END IF;
  IF NEW.prioriteit NOT IN (1,2,3) THEN
    RAISE EXCEPTION 'Prioriteit moet 1, 2 of 3 zijn';
  END IF;
  IF NEW.vestiging NOT IN ('West','Midsland') THEN
    RAISE EXCEPTION 'Ongeldige vestiging: %', NEW.vestiging;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_validate_mep_taak
  BEFORE INSERT OR UPDATE ON public.mep_taken
  FOR EACH ROW EXECUTE FUNCTION public.validate_mep_taak();

CREATE TRIGGER trg_mep_taken_updated_at
  BEFORE UPDATE ON public.mep_taken
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ 3. PRODUCTIE BATCHES ============
CREATE TABLE public.productie_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vestiging text NOT NULL,
  batch_nummer text NOT NULL,
  recept_id uuid REFERENCES public.recipes(id) ON DELETE SET NULL,
  methode_id uuid REFERENCES public.halffabricaat_methodes(id) ON DELETE SET NULL,
  omschrijving text,
  hoeveelheid numeric(10,2),
  eenheid text,
  productie_datum date NOT NULL DEFAULT CURRENT_DATE,
  houdbaar_tot date,
  geproduceerd_door uuid,
  notitie text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.productie_batches TO authenticated;
GRANT ALL ON public.productie_batches TO service_role;
ALTER TABLE public.productie_batches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "batches zichtbaar eigen vestiging"
  ON public.productie_batches FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin')
    OR vestiging = public.get_user_location(auth.uid())
  );
CREATE POLICY "batches aanmaken eigen vestiging"
  ON public.productie_batches FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(),'manager') OR public.has_role(auth.uid(),'owner') OR public.has_role(auth.uid(),'admin')
    OR vestiging = public.get_user_location(auth.uid())
  );

CREATE UNIQUE INDEX uq_productie_batches_nummer ON public.productie_batches(vestiging, batch_nummer);
CREATE INDEX idx_productie_batches_datum ON public.productie_batches(vestiging, productie_datum);

-- ============ 4. AFRONDINGEN ============
CREATE TABLE public.mep_taak_afrondingen (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  taak_id uuid NOT NULL REFERENCES public.mep_taken(id) ON DELETE CASCADE,
  afgerond_door uuid,
  aantal_gemaakt numeric(10,2) NOT NULL DEFAULT 1,
  temperatuur numeric(5,1),
  batch_id uuid REFERENCES public.productie_batches(id) ON DELETE SET NULL,
  notitie text,
  afgerond_op timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.mep_taak_afrondingen TO authenticated;
GRANT ALL ON public.mep_taak_afrondingen TO service_role;
ALTER TABLE public.mep_taak_afrondingen ENABLE ROW LEVEL SECURITY;

CREATE POLICY "afrondingen zichtbaar via taak"
  ON public.mep_taak_afrondingen FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.mep_taken t WHERE t.id = taak_id));
CREATE POLICY "afrondingen aanmaken via taak"
  ON public.mep_taak_afrondingen FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.mep_taken t WHERE t.id = taak_id));
CREATE POLICY "afrondingen verwijderen via taak"
  ON public.mep_taak_afrondingen FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.mep_taken t WHERE t.id = taak_id));

CREATE INDEX idx_mep_afrondingen_taak ON public.mep_taak_afrondingen(taak_id);

-- ============ 5. BATCHNUMMER + AFROND-RPC ============
CREATE OR REPLACE FUNCTION public.mep_genereer_batchnummer(_vestiging text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_prefix text := CASE WHEN _vestiging = 'West' THEN 'WST' ELSE 'MSL' END;
  v_dag text := to_char(CURRENT_DATE, 'YYYYMMDD');
  v_nr int;
BEGIN
  SELECT COUNT(*) + 1 INTO v_nr
  FROM public.productie_batches
  WHERE vestiging = _vestiging AND productie_datum = CURRENT_DATE;
  RETURN v_prefix || '-' || v_dag || '-' || lpad(v_nr::text, 3, '0');
END $$;

GRANT EXECUTE ON FUNCTION public.mep_genereer_batchnummer(text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.mep_taak_afronden(
  _taak_id uuid,
  _aantal_gemaakt numeric DEFAULT 1,
  _temperatuur numeric DEFAULT NULL,
  _notitie text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_taak record;
  v_methode record;
  v_batch_nummer text;
  v_batch_id uuid;
  v_houdbaar_tot date;
  v_hoeveelheid numeric;
  v_eenheid text;
  v_afronding_id uuid;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Niet ingelogd' USING ERRCODE = '28000';
  END IF;
  IF _aantal_gemaakt IS NULL OR _aantal_gemaakt <= 0 THEN
    RAISE EXCEPTION 'Aantal moet groter dan 0 zijn';
  END IF;

  SELECT * INTO v_taak FROM public.mep_taken WHERE id = _taak_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'MEP-taak niet gevonden'; END IF;
  IF v_taak.status = 'afgerond' THEN RAISE EXCEPTION 'Deze taak is al afgerond'; END IF;

  IF v_taak.methode_id IS NOT NULL THEN
    SELECT * INTO v_methode FROM public.halffabricaat_methodes WHERE id = v_taak.methode_id;
  END IF;

  v_batch_nummer := public.mep_genereer_batchnummer(v_taak.vestiging);

  IF v_methode.id IS NOT NULL THEN
    v_hoeveelheid := v_methode.output_hoeveelheid * _aantal_gemaakt;
    v_eenheid := v_methode.output_eenheid;
    IF v_methode.houdbaarheid IS NOT NULL THEN
      v_houdbaar_tot := CURRENT_DATE + v_methode.houdbaarheid;
    END IF;
  ELSE
    v_hoeveelheid := _aantal_gemaakt;
    v_eenheid := COALESCE(v_taak.doel_eenheid, 'stuks');
  END IF;

  IF v_houdbaar_tot IS NULL AND v_taak.recept_id IS NOT NULL THEN
    SELECT CASE WHEN r.tht_dagen IS NOT NULL THEN CURRENT_DATE + r.tht_dagen END
      INTO v_houdbaar_tot FROM public.recipes r WHERE r.id = v_taak.recept_id;
  END IF;

  INSERT INTO public.productie_batches (
    vestiging, batch_nummer, recept_id, methode_id, omschrijving,
    hoeveelheid, eenheid, houdbaar_tot, geproduceerd_door, notitie
  ) VALUES (
    v_taak.vestiging, v_batch_nummer, v_taak.recept_id, v_taak.methode_id, v_taak.titel,
    v_hoeveelheid, v_eenheid, v_houdbaar_tot, v_user, _notitie
  ) RETURNING id INTO v_batch_id;

  INSERT INTO public.mep_taak_afrondingen (
    taak_id, afgerond_door, aantal_gemaakt, temperatuur, batch_id, notitie
  ) VALUES (
    _taak_id, v_user, _aantal_gemaakt, _temperatuur, v_batch_id, _notitie
  ) RETURNING id INTO v_afronding_id;

  UPDATE public.mep_taken
  SET status = 'afgerond', updated_at = now()
  WHERE id = _taak_id;

  RETURN jsonb_build_object(
    'batch_id', v_batch_id,
    'batch_nummer', v_batch_nummer,
    'afronding_id', v_afronding_id,
    'hoeveelheid', v_hoeveelheid,
    'eenheid', v_eenheid,
    'houdbaar_tot', v_houdbaar_tot
  );
END $$;

REVOKE ALL ON FUNCTION public.mep_taak_afronden(uuid, numeric, numeric, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mep_taak_afronden(uuid, numeric, numeric, text) TO authenticated;

-- heropenen (correctie)
CREATE OR REPLACE FUNCTION public.mep_taak_heropenen(_taak_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Niet ingelogd' USING ERRCODE = '28000'; END IF;
  DELETE FROM public.mep_taak_afrondingen WHERE taak_id = _taak_id;
  UPDATE public.mep_taken SET status = 'open', updated_at = now() WHERE id = _taak_id;
END $$;

REVOKE ALL ON FUNCTION public.mep_taak_heropenen(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mep_taak_heropenen(uuid) TO authenticated;