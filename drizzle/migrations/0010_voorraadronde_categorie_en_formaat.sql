ALTER TABLE public.koelcel_check_items
  ADD COLUMN IF NOT EXISTS categorie text,
  ADD COLUMN IF NOT EXISTS formaat text;

ALTER TABLE public.koelcel_checks
  ADD COLUMN IF NOT EXISTS geteld_aantal numeric;

UPDATE public.koelcel_check_items SET categorie = 'Eiwitten'
 WHERE product_sleutel IN ('forel','gerookte-zalm','kip','doner-kebab','falafel','tempeh','gekookte-eieren','eimengsel');

UPDATE public.koelcel_check_items SET categorie = 'Zuivel & kaas'
 WHERE product_sleutel IN ('kaas-belegen','feta','kokosyoghurt','vegan-roomkaas','h-ttenk-se');

UPDATE public.koelcel_check_items SET categorie = 'Spreads & mayonaises'
 WHERE product_sleutel IN ('avocado-spread','tomatenrelish','tomatenjam','wortelspread','chimichurrimayonaise','zeewiermayonaise','knoflook-kurkumamayonaise','hummus','mayonaises-flessen-bijvullen-','cranberry-compote','zeewier');

UPDATE public.koelcel_check_items SET categorie = 'Groente & fruit'
 WHERE product_sleutel IN ('gesneden-bloemkool','gesneden-paprika','blauwe-bessen','verse-avocados','granaatappelpitjes','rode-peper','zoetzure-gember','rode-kool','aubergine','geroosterde-groenten');

UPDATE public.koelcel_check_items SET categorie = 'Soep'
 WHERE product_sleutel IN ('vissoep','tom-yum');

UPDATE public.koelcel_check_items SET categorie = 'Brood'
 WHERE product_sleutel IN ('brioche','zuurdesem-stokbrood-in-3en-snijden-','broodbakken-pita-brioche-deugniet-');

UPDATE public.koelcel_check_items SET categorie = 'Zoet'
 WHERE product_sleutel IN ('wortel-walnoot','sinaasappelcheesecake','notenbar','bananencake','koffiebrownie','kokosmakroon','witte-chocolade-kokos','muffin-wortel-kaneel','muffin-banaan-amandel','appeltaart','madeleine','vegan-boterkoek','choco-bounty','bananenpannenkoeken');

UPDATE public.koelcel_check_items SET categorie = 'Droog & overig'
 WHERE categorie IS NULL;

UPDATE public.koelcel_check_items SET eenheid = CASE lower(trim(eenheid))
    WHEN 'pakjes' THEN 'pakje'
    WHEN 'zakken' THEN 'zak'
    WHEN 'bakken' THEN 'bak'
    WHEN 'pakken' THEN 'pak'
    WHEN 'potten' THEN 'pot'
    WHEN 'stuks per soort' THEN 'stuks'
    ELSE lower(trim(eenheid))
  END;

UPDATE public.koelcel_check_items SET formaat = CASE lower(trim(coalesce(bak_maat,'')))
    WHEN '' THEN NULL
    WHEN 'hoge 1/9e' THEN 'GN 1/9 hoog'
    WHEN 'midden 1/9e' THEN 'GN 1/9 midden'
    WHEN 'volle midden 1/9' THEN 'GN 1/9 midden, vol'
    WHEN 'midden 1/9, 1/3 gevuld' THEN 'GN 1/9 midden, 1/3 vol'
    WHEN 'hoge 1/6' THEN 'GN 1/6 hoog'
    WHEN 'hoge 1/6 vol' THEN 'GN 1/6 hoog, vol'
    WHEN 'volle hoge 1/6' THEN 'GN 1/6 hoog, vol'
    WHEN 'midden 1/6' THEN 'GN 1/6 midden'
    WHEN 'volle midden 1/6' THEN 'GN 1/6 midden, vol'
    WHEN 'midden 1/6 halfvol' THEN 'GN 1/6 midden, half vol'
    WHEN 'halve 1/6' THEN 'GN 1/6, half vol'
    WHEN 'midden 1/3' THEN 'GN 1/3 midden'
    WHEN 'volle 1/4' THEN 'GN 1/4, vol'
    WHEN 'halve 1/4' THEN 'GN 1/4, half vol'
    WHEN 'halfhoge 1/4' THEN 'GN 1/4 halfhoog'
    WHEN 'restant zak 1,5 kg' THEN 'zak 1,5 kg'
    WHEN 'bak (maat nog bepalen)' THEN 'bak'
    WHEN 'paprika''s (aantal nog bepalen)' THEN NULL
    ELSE trim(bak_maat)
  END;

INSERT INTO public.migratie_logboek (onderwerp, bron_tabel, bron_id, reden, ruwe_waarde)
SELECT 'voorraadronde-normalisatie', 'koelcel_check_items', id,
       'Categorie en formaat gezet, eenheid genormaliseerd', coalesce(bak_maat,'')
  FROM public.koelcel_check_items WHERE actief;