create table public.dag_beleving (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  location text not null,
  ontbijt text check (ontbijt in ('rustig','gemiddeld','druk')),
  lunch text check (lunch in ('rustig','gemiddeld','druk')),
  diner text check (diner in ('rustig','gemiddeld','druk')),
  notitie text,
  created_by uuid,
  created_at timestamptz not null default now(),
  unique (date, location)
);

GRANT SELECT, INSERT, UPDATE ON public.dag_beleving TO authenticated;
GRANT ALL ON public.dag_beleving TO service_role;

ALTER TABLE public.dag_beleving ENABLE ROW LEVEL SECURITY;

create policy "dag_beleving_insert_eigen_vestiging"
on public.dag_beleving for insert to authenticated
with check (public.heeft_vestiging(auth.uid(), location));

create policy "dag_beleving_update_eigen_vestiging"
on public.dag_beleving for update to authenticated
using (public.heeft_vestiging(auth.uid(), location))
with check (public.heeft_vestiging(auth.uid(), location));

create policy "dag_beleving_select_managers"
on public.dag_beleving for select to authenticated
using (
  public.has_role(auth.uid(), 'owner')
  or public.has_role(auth.uid(), 'admin')
  or public.has_role(auth.uid(), 'manager')
  or public.heeft_vestiging(auth.uid(), location)
);