-- Finanças: Controle Orçamentário (Orçado x Realizado)

-- Necessário para gen_random_uuid()
create extension if not exists pgcrypto;

-- 1) Versões do orçamento
create table if not exists public.budget_versions (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  year integer not null,
  type text not null check (type in ('initial', 'forecast')),
  start_month integer null check (start_month between 1 and 12),
  company text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_budget_versions_company_year_created
  on public.budget_versions (company, year, created_at desc);

-- 2) Linhas do orçamento
create table if not exists public.budget_lines (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references public.budget_versions (id) on delete cascade,
  company text not null,
  cost_center text not null,
  coa_code text not null,
  year integer not null,
  month integer not null check (month between 1 and 12),
  amount numeric not null
);

create index if not exists idx_budget_lines_version
  on public.budget_lines (version_id);

create index if not exists idx_budget_lines_company_year_month
  on public.budget_lines (company, year, month);

create index if not exists idx_budget_lines_cost_center
  on public.budget_lines (cost_center);

create index if not exists idx_budget_lines_coa_code
  on public.budget_lines (coa_code);

-- Evita duplicatas por versão/competência
create unique index if not exists uq_budget_lines_version_company_cc_coa_year_month
  on public.budget_lines (version_id, company, cost_center, coa_code, year, month);

-- RLS (compatível com o uso via client/anon key neste app)
alter table public.budget_versions enable row level security;
alter table public.budget_lines enable row level security;

drop policy if exists "Public can view budget versions" on public.budget_versions;
drop policy if exists "Public can insert budget versions" on public.budget_versions;
drop policy if exists "Public can update budget versions" on public.budget_versions;
drop policy if exists "Public can delete budget versions" on public.budget_versions;

create policy "Public can view budget versions" on public.budget_versions
  for select to public
  using (true);

create policy "Public can insert budget versions" on public.budget_versions
  for insert to public
  with check (true);

create policy "Public can update budget versions" on public.budget_versions
  for update to public
  using (true);

create policy "Public can delete budget versions" on public.budget_versions
  for delete to public
  using (true);

drop policy if exists "Public can view budget lines" on public.budget_lines;
drop policy if exists "Public can insert budget lines" on public.budget_lines;
drop policy if exists "Public can update budget lines" on public.budget_lines;
drop policy if exists "Public can delete budget lines" on public.budget_lines;

create policy "Public can view budget lines" on public.budget_lines
  for select to public
  using (true);

create policy "Public can insert budget lines" on public.budget_lines
  for insert to public
  with check (true);

create policy "Public can update budget lines" on public.budget_lines
  for update to public
  using (true);

create policy "Public can delete budget lines" on public.budget_lines
  for delete to public
  using (true);

-- Evita erro de "schema cache" do PostgREST após criar as tabelas
select pg_notify('pgrst', 'reload schema');
