/*
# Criar tabela de cidades com ISS e corrigir city_id em budget_posts

1. Tabelas Criadas
   - `budget_cities_iss` - Cidades brasileiras com percentual de ISS
   
2. Colunas Adicionadas
   - `budget_posts.city_id` - Referência para cidade (ISS)

3. Segurança
   - Habilitar RLS em budget_posts
   - Políticas de SELECT livre para budget_posts

4. Performance
   - Índice em city_id para otimização
*/

-- 1) Criar tabela de Cidades/ISS se ainda não existir
create table if not exists public.budget_cities_iss (
  id           uuid      primary key default gen_random_uuid(),
  city_name    text      not null,
  iss_percent  numeric   not null,
  is_active    boolean   default true,
  created_at   timestamp default now()
);

-- Inserir cidades brasileiras com ISS se a tabela estiver vazia
insert into public.budget_cities_iss (city_name, iss_percent, is_active)
select * from (values
  ('São Paulo', 5.0, true),
  ('Rio de Janeiro', 4.5, true),
  ('Belo Horizonte', 4.0, true),
  ('Salvador', 3.5, true),
  ('Brasília', 3.0, true),
  ('Fortaleza', 3.5, true),
  ('Manaus', 2.5, true),
  ('Curitiba', 3.5, true),
  ('Recife', 4.0, true),
  ('Porto Alegre', 3.0, true),
  ('Goiânia', 2.5, true),
  ('Belém', 3.0, true),
  ('Guarulhos', 5.0, true),
  ('Campinas', 4.0, true),
  ('São Luís', 3.0, true),
  ('São Gonçalo', 4.5, true),
  ('Maceió', 3.5, true),
  ('Duque de Caxias', 4.5, true),
  ('Natal', 3.0, true),
  ('Campo Grande', 2.5, true)
) as new_cities(city_name, iss_percent, is_active)
where not exists (select 1 from public.budget_cities_iss limit 1);

-- 2) Adicionar coluna city_id em budget_posts (se ainda não existir)
alter table public.budget_posts
  add column if not exists city_id uuid
    references public.budget_cities_iss(id);

-- 3) Habilitar RLS em budget_posts e garantir SELECT livre
alter table public.budget_posts enable row level security;

drop policy if exists "Allow select budget_posts" on public.budget_posts;
create policy "Allow select budget_posts"
  on public.budget_posts
  for select
  using (true);

drop policy if exists "Allow insert budget_posts" on public.budget_posts;
create policy "Allow insert budget_posts"
  on public.budget_posts
  for insert
  with check (true);

drop policy if exists "Allow update budget_posts" on public.budget_posts;
create policy "Allow update budget_posts"
  on public.budget_posts
  for update
  using (true)
  with check (true);

-- 4) (Opcional) índice em city_id para performance
create index if not exists idx_budget_posts_city_id
  on public.budget_posts(city_id);