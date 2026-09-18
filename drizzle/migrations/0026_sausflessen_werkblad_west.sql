-- Groepen buiten de kast (flessen op het werkblad) krijgen positie 0.
alter table public.voorraad_lades drop constraint if exists voorraad_lades_kolom_check;
alter table public.voorraad_lades drop constraint if exists voorraad_lades_rij_check;
alter table public.voorraad_lades add constraint voorraad_lades_kolom_check check (kolom between 0 and 3);
alter table public.voorraad_lades add constraint voorraad_lades_rij_check check (rij between 0 and 3);

with nieuwe_lade as (
  insert into public.voorraad_lades (vestiging, plek, naam, kolom, rij, volgorde, actief, rol)
  values ('West', 'werkbank', 'Flessen op het werkblad', 0, 0, 5, true, 'werk')
  returning id
)
insert into public.koelcel_check_items
  (vestiging, naam, doel_aantal, eenheid, type, volgorde, actief, bron, plek, product_sleutel,
   categorie, formaat, lade_id, reserve_doel, vulnorm)
select 'West', v.naam, 1, 'fles', 'koelcel', v.volgorde, true, 'zelf_west', 'werkbank', v.sleutel,
       'Spreads & mayonaises', 'fles', nieuwe_lade.id, 0, 'half'
from nieuwe_lade,
     (values
       ('Chimichurrimayonaise (fles)', 'chimichurrimayonaise', 1),
       ('Zeewier-algenmayonaise (fles)', 'zeewiermayonaise', 2),
       ('Knoflook-kurkumamayonaise (fles)', 'knoflook-kurkumamayonaise', 3)
     ) as v(naam, sleutel, volgorde);

update public.koelcel_check_items
set actief = false
where id = '06a50a18-04fc-427f-a7b8-bcccea68b2e5';