-- Horeko-export 29-10-2026: alleen nieuwe tabellen, raakt niets bestaands.
create table if not exists public.horeko_artikelen (
  horeko_id integer primary key, naam text not null, leverancier text, leverancier_artnr text, ean text,
  basis_eenheid text check (basis_eenheid in ('g','ml','st')), inhoud_per_product numeric, prijs_per_product numeric,
  prijs_per_basis numeric, in_gebruik boolean,
  artikel_id uuid references public.artikelen(id) on delete set null,
  match_methode text, match_score integer, match_status text check (match_status in ('zeker','onzeker','geen')),
  created_at timestamptz default now());
create table if not exists public.horeko_recepten (
  horeko_key text primary key,             -- 'G<id>' gerecht, 'H<id>' halfproduct
  type text not null check (type in ('gerecht','halfproduct')), naam text not null, map text,
  kassanummer text, lightspeed_product_id text, aantal_personen numeric, kaartprijs numeric, kosten_horeko numeric,
  opbrengst numeric, opbrengst_eenheid text check (opbrengst_eenheid in ('g','ml','st')), dagen_houdbaar numeric,
  recipe_id uuid references public.recipes(id) on delete set null,
  gerecht_id uuid references public.gerechten(id) on delete set null,
  match_status text, gewijzigd_in_horeko text, created_at timestamptz default now());
create table if not exists public.horeko_recept_regels (
  id bigserial primary key, recept_key text not null references public.horeko_recepten(horeko_key) on delete cascade,
  volgorde integer, regel text, hoeveelheid numeric, eenheid text check (eenheid in ('g','ml','st')),
  component_type text check (component_type in ('halfproduct','ingredient','onbekend')),
  component_recept_key text references public.horeko_recepten(horeko_key),
  component_artikel_id integer references public.horeko_artikelen(horeko_id), match_score numeric);
create table if not exists public.horeko_gerecht_verbruik (
  gerecht_key text not null references public.horeko_recepten(horeko_key) on delete cascade,
  horeko_artikel_id integer not null references public.horeko_artikelen(horeko_id),
  artikel_id uuid references public.artikelen(id) on delete set null,
  hoeveelheid_per_portie numeric not null, eenheid text, kosten_per_portie numeric,
  primary key (gerecht_key, horeko_artikel_id));
create index if not exists horeko_regels_recept_idx on public.horeko_recept_regels(recept_key);
create index if not exists horeko_verbruik_artikel_idx on public.horeko_gerecht_verbruik(artikel_id);
alter table public.horeko_artikelen enable row level security;
alter table public.horeko_recepten enable row level security;
alter table public.horeko_recept_regels enable row level security;
alter table public.horeko_gerecht_verbruik enable row level security;
create policy "horeko_artikelen lezen" on public.horeko_artikelen for select to authenticated using (true);
create policy "horeko_recepten lezen" on public.horeko_recepten for select to authenticated using (true);
create policy "horeko_recept_regels lezen" on public.horeko_recept_regels for select to authenticated using (true);
create policy "horeko_gerecht_verbruik lezen" on public.horeko_gerecht_verbruik for select to authenticated using (true);