-- Toppings West kloppend maken + magazijnvoorraad (wekelijks op maandag)

-- 1. Oude toppings die niet meer in de lijst staan: bewaren, niet verwijderen
update public.koelcel_check_items
set actief = false, updated_at = now()
where vestiging = 'West' and plek = 'werkblad'
  and naam in ('Sesamzaad', 'Amandelschaafsel');

-- 2. Bestaande kokosschilfers-regel op het werkblad bijwerken
update public.koelcel_check_items
set naam = 'Kokosschilfers', product_sleutel = 'kokosschilfers', bron = 'magazijn',
    eenheid = 'bakje', formaat = null, doel_aantal = 1, doel_aantal_druk = null,
    categorie = 'Droog & overig', volgorde = 40, actief = true, updated_at = now()
where vestiging = 'West' and plek = 'werkblad' and naam = 'Kokosschilfers';

-- 3. De negen overige toppingbakjes in de keuken
insert into public.koelcel_check_items
  (vestiging, naam, doel_aantal, eenheid, type, plek, bron, categorie, product_sleutel, volgorde)
values
  ('West', 'Zonnebloempitten', 1, 'bakje', 'koelcel', 'werkblad', 'magazijn', 'Droog & overig', 'zonnebloempitten', 10),
  ('West', 'Seroendeng', 1, 'bakje', 'koelcel', 'werkblad', 'koelcel_inkoop', 'Droog & overig', 'seroendeng', 20),
  ('West', 'Gefruite uitjes', 1, 'bakje', 'koelcel', 'werkblad', 'koelcel_inkoop', 'Droog & overig', 'gefruite-uitjes', 30),
  ('West', 'Hennepzaad', 1, 'bakje', 'koelcel', 'werkblad', 'koelcel_inkoop', 'Droog & overig', 'hennepzaad', 50),
  ('West', 'Broadbeans', 1, 'bakje', 'koelcel', 'werkblad', 'koelcel_inkoop', 'Droog & overig', 'broadbeans', 60),
  ('West', 'Cacao nibs', 1, 'bakje', 'koelcel', 'werkblad', 'koelcel_inkoop', 'Droog & overig', 'cacao-nibs', 70),
  ('West', 'Dukkah', 1, 'bakje', 'koelcel', 'werkblad', 'midsland', 'Droog & overig', 'dukkah', 80),
  ('West', 'Dadelstukjes', 1, 'bakje', 'koelcel', 'werkblad', 'koelcel_inkoop', 'Droog & overig', 'dadelstukjes', 90),
  ('West', 'Chipotle', 1, 'bakje', 'koelcel', 'werkblad', 'koelcel_inkoop', 'Droog & overig', 'chipotle', 100);

-- 4. De magazijnvoorraad achter die toppings (alleen op maandag geteld)
insert into public.koelcel_check_items
  (vestiging, naam, doel_aantal, eenheid, type, plek, bron, categorie, product_sleutel,
   volgorde, bestelpunt, bestel_eenheid, bestel_inhoud, batch_aantal)
values
  ('West', 'Zonnebloempitten geroosterd', 1, 'bak', 'koelcel', 'magazijn', 'magazijn', 'Droog & overig', 'zonnebloempitten', 10, 0.25, null, null, 1),
  ('West', 'Seroendeng', 1, 'zak', 'koelcel', 'magazijn', 'koelcel_inkoop', 'Droog & overig', 'seroendeng', 20, 0.5, 'zak', 1, null),
  ('West', 'Gefruite uitjes', 1, 'zak', 'koelcel', 'magazijn', 'koelcel_inkoop', 'Droog & overig', 'gefruite-uitjes', 30, 0.5, 'zak', 1, null),
  ('West', 'Kokosschilfers geroosterd', 1, 'bak', 'koelcel', 'magazijn', 'magazijn', 'Droog & overig', 'kokosschilfers', 40, 0.25, null, null, 1),
  ('West', 'Kokosschilfers zakken', 2, 'zak', 'koelcel', 'magazijn', 'koelcel_inkoop', 'Droog & overig', 'kokosschilfers-zak', 45, 1.5, 'zak', 1, null),
  ('West', 'Hennepzaad', 1, 'bak', 'koelcel', 'magazijn', 'koelcel_inkoop', 'Droog & overig', 'hennepzaad', 50, 0.25, 'zak', 1, null),
  ('West', 'Broadbeans', 5, 'zak', 'koelcel', 'magazijn', 'koelcel_inkoop', 'Droog & overig', 'broadbeans', 60, 2, 'zak', 1, null),
  ('West', 'Cacao nibs', 1, 'zak', 'koelcel', 'magazijn', 'koelcel_inkoop', 'Droog & overig', 'cacao-nibs', 70, 0.25, 'zak', 1, null),
  ('West', 'Dukkah', 1, 'bak', 'koelcel', 'magazijn', 'midsland', 'Droog & overig', 'dukkah', 80, null, null, null, null),
  ('West', 'Dadelstukjes', 1, 'bak', 'koelcel', 'magazijn', 'koelcel_inkoop', 'Droog & overig', 'dadelstukjes', 90, 0.25, 'bak', 1, null),
  ('West', 'Chipotle kruidenzak', 1, 'zak', 'koelcel', 'magazijn', 'koelcel_inkoop', 'Droog & overig', 'chipotle', 100, 0.5, 'zak', 1, null);

insert into public.migratie_logboek (onderwerp, bron_tabel, reden)
values ('Toppings West en magazijnvoorraad', 'koelcel_check_items',
        'Toppinglijst vervangen door de tien werkelijke toppings en de magazijnvoorraad erachter toegevoegd; magazijn wordt wekelijks op maandag geteld. Sesamzaad en amandelschaafsel op inactief.');