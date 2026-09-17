do $$
declare
  v_lb uuid; v_lm uuid; v_lo uuid; v_mb uuid; v_mm uuid; v_mo uuid; v_rb uuid; v_rm uuid; v_ro uuid;
begin
  select id into v_lb from public.voorraad_lades where vestiging='West' and naam='Links boven';
  select id into v_lm from public.voorraad_lades where vestiging='West' and naam='Links midden';
  select id into v_lo from public.voorraad_lades where vestiging='West' and naam='Links onder';
  select id into v_mb from public.voorraad_lades where vestiging='West' and naam='Midden boven';
  select id into v_mm from public.voorraad_lades where vestiging='West' and naam='Midden midden';
  select id into v_mo from public.voorraad_lades where vestiging='West' and naam='Midden onder';
  select id into v_rb from public.voorraad_lades where vestiging='West' and naam='Rechts boven';
  select id into v_rm from public.voorraad_lades where vestiging='West' and naam='Rechts midden';
  select id into v_ro from public.voorraad_lades where vestiging='West' and naam='Rechts onder';

  update public.voorraad_lades set rol='reserve'
   where vestiging='West' and naam in ('Midden midden','Midden onder');

  update public.koelcel_check_items i set lade_id = case
      when i.naam in ('Falafel','Döner kebab','Gekookte eieren (bio)','Eimengsel (scrambled eggs)') then v_lb
      when i.naam in ('Forel','Gerookte zalm','Tempeh') then v_lm
      when i.categorie = 'Spreads & mayonaises' then v_mb
      when i.naam in ('Gesneden paprika','Rode peper','Verse avocado''s','Blauwe bessen') then v_rb
      when i.categorie = 'Groente & fruit' then v_rm
      when i.categorie in ('Zuivel & kaas','Brood') then v_ro
      else v_lo
    end
   where i.vestiging='West' and i.plek='werkbank' and i.actief and i.lade_id is null;

  insert into public.migratie_logboek (onderwerp, bron_tabel, reden)
  values ('Koelwerkbank startindeling lades', 'koelcel_check_items',
          'Alle actieve West-werkbankitems een startlade gegeven zodat ze zichtbaar blijven in de voorraadronde; team kan verslepen.');
end $$;