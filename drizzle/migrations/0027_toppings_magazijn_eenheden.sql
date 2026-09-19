-- Magazijn-toppings: zakken vs bakken gelijktrekken
update public.koelcel_check_items
set eenheid = 'bak'
where vestiging = 'West' and plek = 'magazijn'
  and product_sleutel in ('zonnebloempitten','hennepzaad','dukkah','dadelstukjes');

update public.koelcel_check_items
set eenheid = 'zak'
where vestiging = 'West' and plek = 'magazijn'
  and product_sleutel in ('seroendeng','gefruite-uitjes','broadbeans','cacao-nibs','chipotle','kokosschilfers-zak');

-- Naam opschonen: kokosschilfers wordt alleen nog per zak geteld
update public.koelcel_check_items
set naam = 'Kokosschilfers'
where id = 'b8e8df5f-8bb9-4019-94c6-fba4f12cdf8b';

-- Dubbele kokosschilfers-bak in het magazijn archiveren (geen hard delete)
update public.koelcel_check_items
set actief = false
where id = '541c7b24-9ea7-40d9-b2b3-b501bd98aea2';

insert into public.migratie_logboek (onderwerp, bron_tabel, bron_id, reden)
values (
  'Toppings magazijn: eenheden zak/bak gelijkgetrokken, dubbele kokosschilfers-bak gearchiveerd',
  'koelcel_check_items',
  '541c7b24-9ea7-40d9-b2b3-b501bd98aea2',
  'Kokosschilfers worden in het magazijn per zak geteld; de losse bak-regel is gearchiveerd.'
);