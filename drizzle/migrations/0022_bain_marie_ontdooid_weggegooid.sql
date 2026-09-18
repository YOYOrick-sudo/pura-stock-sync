alter table public.bain_marie_bakken
  add column if not exists ontdooid_datum date,
  add column if not exists weggegooid_op date;

comment on column public.bain_marie_bakken.ontdooid_datum is
  'Datum op de ontdooi-sticker van de gevacumeerde zak (alleen producten met vriezer-zak, bv. kip).';
comment on column public.bain_marie_bakken.weggegooid_op is
  'Datum waarop de bak bij sluit is weggegooid (laatste dag of te oud).';