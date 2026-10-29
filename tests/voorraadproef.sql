-- Run with privileged data tools. Fixture subtransaction always rolls back.
DO $$
DECLARE a uuid:=gen_random_uuid(); b uuid:=gen_random_uuid(); t1 uuid; t2 uuid; t3 uuid; x record; v numeric; n int; failed boolean;
BEGIN
 BEGIN
 INSERT INTO public.voorraad_artikel(id,vestiging,naam,tel_eenheid,opslagplekken,verbruiksopslag_pct) VALUES
 (a,'West','TEST voorraadproef – verwijderen','fles','[{"naam":"los","eenheid":"fles","factor":1}]',10),
 (b,'West','TEST voorraadproef – verwijderen sluit','fles','[{"naam":"los","eenheid":"fles","factor":1}]',0);
 INSERT INTO public.voorraad_verbruik_koppeling(voorraad_artikel_id,lightspeed_product_id,factor) VALUES(a,'TEST-voorraadproef',1),(b,'TEST-voorraadproef-sluit',1);
 IF (SELECT stand FROM public.voorraad_stand_berekenen(a,'2026-10-28')) IS NOT NULL THEN RAISE EXCEPTION '2: geen telling moet NULL zijn'; END IF;
 IF public.voorraad_teldeadline('2026-10-28 04:59:00Z')<>'2026-10-21' OR public.voorraad_teldeadline('2026-10-28 05:00:00Z')<>'2026-10-28' THEN RAISE EXCEPTION '6: woensdagdeadline'; END IF;
 IF public.voorraad_hertellen_nodig(120,100) OR NOT public.voorraad_hertellen_nodig(120.01,100) OR public.voorraad_hertellen_nodig(7,5) OR NOT public.voorraad_hertellen_nodig(7.01,5) THEN RAISE EXCEPTION '3: drempel 20pct/2'; END IF;
 INSERT INTO public.voorraad_telling(voorraad_artikel_id,datum,moment,per_plek,totaal,bron_ref) VALUES(a,'2026-10-20','voor_opening','{"los":100}',100,'TEST-voorraadproef-1') RETURNING id INTO t1;
 INSERT INTO public.kassa_verkoop_dag(vestiging,datum,lightspeed_product_id,productnaam,aantal,omzet_excl,omzet_incl) VALUES('West','2026-10-20','TEST-voorraadproef','TEST voorraadproef – verwijderen',10,0,0),('West','2026-10-21','TEST-voorraadproef','TEST voorraadproef – verwijderen',-2,0,0),('West','2026-10-22','TEST-voorraadproef','TEST voorraadproef – verwijderen',10,0,0),('West','2026-10-23','TEST-voorraadproef','TEST voorraadproef – verwijderen',10,0,0);
 INSERT INTO public.voorraad_correctie(voorraad_artikel_id,datum,hoeveelheid,soort,notitie,bron_ref) VALUES(a,'2026-10-20',5,'transfer','TEST voorraadproef – verwijderen','TEST-corr-1');
 SELECT * INTO x FROM public.voorraad_stand_berekenen(a,'2026-10-21');
 IF x.kassa<>8 OR x.correcties<>5 OR x.opslag<>0.8 OR x.stand<>96.2 THEN RAISE EXCEPTION '6: handmatige som/retour/opslag %',x; END IF;
 INSERT INTO public.voorraad_telling(voorraad_artikel_id,datum,moment,per_plek,totaal,bron_ref) VALUES(a,'2026-10-22','voor_opening','{"los":50}',50,'TEST-voorraadproef-2') RETURNING id INTO t2;
 SELECT * INTO x FROM public.voorraad_telling WHERE id=t2;
 IF x.betrouwbaar OR x.berekend_op_moment<>96.2 THEN RAISE EXCEPTION '3: vorig anker/snapshot'; END IF;
 INSERT INTO public.voorraad_telling(voorraad_artikel_id,datum,moment,per_plek,totaal,hertelling_van,bron_ref) VALUES(a,'2026-10-22','voor_opening','{"los":55}',55,t2,'TEST-voorraadproef-3') RETURNING id INTO t3;
 IF NOT (SELECT betrouwbaar FROM public.voorraad_telling WHERE id=t3) THEN RAISE EXCEPTION '3: tweede telling leidend'; END IF;
 failed:=false; BEGIN INSERT INTO public.voorraad_telling(voorraad_artikel_id,datum,moment,per_plek,totaal,bron_ref) VALUES(a,'2026-10-22','voor_opening','{"los":55}',55,'TEST-voorraadproef-3'); EXCEPTION WHEN unique_violation THEN failed:=true; END;
 IF NOT failed THEN RAISE EXCEPTION '4: duplicate ref toegestaan'; END IF;
 INSERT INTO public.voorraad_telling(voorraad_artikel_id,datum,moment,per_plek,totaal,bron_ref) VALUES(a,'2026-10-23','voor_opening','{"los":44}',44,'TEST-voorraadproef-4'),(a,'2026-10-24','voor_opening','{"los":33}',33,'TEST-voorraadproef-5');
 INSERT INTO public.voorraad_telling(voorraad_artikel_id,datum,moment,per_plek,totaal,bron_ref) VALUES(b,'2026-10-20','na_sluiting','{"los":10}',10,'TEST-voorraadproef-sluit');
 INSERT INTO public.voorraad_correctie(voorraad_artikel_id,datum,hoeveelheid,soort,notitie,bron_ref) VALUES(b,'2026-10-20',5,'transfer','TEST voorraadproef – verwijderen','TEST-corr-sluit');
 IF (SELECT stand FROM public.voorraad_stand_berekenen(b,'2026-10-20'))<>10 THEN RAISE EXCEPTION '6: na sluit moet zelfde dag uitsluiten'; END IF;
 FOR n IN 1..4 LOOP INSERT INTO public.advies_log(vestiging,datum,leverdag,artikel,advies,eenheid,methode_versie,gegevens) VALUES('West','2026-10-19',date '2026-10-20'+n,'TEST voorraadproef – verwijderen advies',20,'fles','TEST-v1',jsonb_build_object('kassa_ids',jsonb_build_array(jsonb_build_object('id','TEST-voorraadproef','per_eenheid',1)),'periode_van','2026-10-22','periode_tot','2026-10-22')); END LOOP;
 INSERT INTO public.advies_log(vestiging,datum,leverdag,artikel,advies,eenheid,methode_versie,gegevens) VALUES('West','2026-10-19','2026-10-25','TEST voorraadproef – verwijderen advies',20,'fles','TEST-v1','{"kassa_ids":[{"id":"TEST-voorraadproef","per_eenheid":1}],"periode_van":"2026-10-26","periode_tot":"2026-10-26"}'),('West','2026-10-19','2026-10-26','TEST voorraadproef – verwijderen ontbreekt',20,'fles',NULL,'{}');
 PERFORM public.leercurve_bijwerken();
 SELECT * INTO x FROM public.v_advies_nauwkeurigheid WHERE artikel='TEST voorraadproef – verwijderen advies';
 IF x.n<>4 OR x.mape<>100 OR x.nulverbruik<>1 THEN RAISE EXCEPTION '7: MAPE/nulverbruik %',x; END IF;
 IF (SELECT count(*) FROM public.voorraad_periode WHERE voorraad_artikel_id=a)<>3 OR NOT EXISTS(SELECT 1 FROM public.leer_voorstel WHERE voorraad_artikel_id=a AND soort='verbruiksopslag_pct') OR NOT EXISTS(SELECT 1 FROM public.leer_voorstel WHERE voorraad_artikel_id=a AND soort='onderzoeken') OR NOT EXISTS(SELECT 1 FROM public.leer_voorstel WHERE onderwerp='TEST voorraadproef – verwijderen advies' AND soort='advies_controleren') THEN RAISE EXCEPTION '7: voorstelregels'; END IF;
 SELECT * INTO x FROM public.voorraad_periode WHERE begin_telling_id=t1;
 IF x.correcties<>5 OR x.kassa<>8 OR x.onverklaard<>42 THEN RAISE EXCEPTION '6: periode daggrens/geen dubbele opslag %',x; END IF;
 SELECT count(*) INTO n FROM public.leer_voorstel WHERE onderwerp LIKE 'TEST voorraadproef%';
 PERFORM public.leercurve_bijwerken();
 IF (SELECT count(*) FROM public.leer_voorstel WHERE onderwerp LIKE 'TEST voorraadproef%')<>n THEN RAISE EXCEPTION '7: nachtjob verdubbelt'; END IF;
 UPDATE public.leer_voorstel SET status='akkoord' WHERE voorraad_artikel_id=a AND soort='verbruiksopslag_pct';
 IF (SELECT verbruiksopslag_pct FROM public.voorraad_artikel WHERE id=a)<>10 THEN RAISE EXCEPTION '7: akkoord wijzigt opslag'; END IF;
 RAISE EXCEPTION USING ERRCODE='P9999',MESSAGE='rollback_fixture';
 EXCEPTION WHEN SQLSTATE 'P9999' THEN NULL;
 END;
END $$;
SELECT 'voorraadproef SQL assertions passed; fixture rolled back' resultaat;