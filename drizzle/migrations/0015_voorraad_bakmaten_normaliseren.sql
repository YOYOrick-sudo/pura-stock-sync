-- Bakmaten overal dezelfde schrijfwijze: "GN x/y <hoogte>" en eenheid bak/bakje in plaats van stuks.
update public.koelcel_check_items
set formaat = 'GN 1/6 hoog'
where formaat ~* '^gn\s*1/6\s*$' and naam in ('Forel', 'Gerookte zalm');

update public.koelcel_check_items
set formaat = regexp_replace(formaat, 'halfhoog', 'midden', 'i')
where formaat ~* 'halfhoog';

update public.koelcel_check_items
set formaat = regexp_replace(trim(formaat), '^gn\s*(\d/\d).*$', 'GN \1 midden', 'i')
where formaat ~* '^gn\s*\d/\d\s*$';

update public.koelcel_check_items
set formaat = regexp_replace(trim(formaat), '^gn\s*(\d/\d)\s*(laag|midden|hoog)$', 'GN \1 \2', 'i')
where formaat ~* '^gn\s*\d/\d\s*(laag|midden|hoog)$';

update public.koelcel_check_items
set eenheid = case when formaat ~* '^gn\s*1/(1|2)\b' then 'bak' else 'bakje' end
where formaat ~* '^gn\s*\d/\d'
  and coalesce(eenheid, '') <> case when formaat ~* '^gn\s*1/(1|2)\b' then 'bak' else 'bakje' end;

insert into public.migratie_logboek (onderwerp, bron_tabel, reden)
values ('0015_voorraad_bakmaten', 'koelcel_check_items',
        'Bakmaten genormaliseerd naar "GN x/y <hoogte>" (ontbrekende hoogte = midden, Forel/Gerookte zalm = hoog) en eenheid stuks -> bak/bakje bij GN-formaten.');