/*
  # Corrigir tabelas e colunas faltantes para sistema de orçamentos

  1. Novas Tabelas
    - `budget_cities_iss` - Cidades com percentuais de ISS
    - `budget_uniforms` - Uniformes com vida útil e valores

  2. Alterações em Tabelas Existentes
    - Adicionar colunas `turn` e `city_id` em `budget_posts`

  3. Segurança
    - Habilitar RLS na tabela `budget_uniforms`
    - Adicionar políticas básicas de CRUD

  4. Dados Iniciais
    - 20 cidades brasileiras com ISS de 2% a 5%
    - 10 uniformes padrão com vida útil e quantidades
*/

-- 1) Criar tabela de cidades com ISS, se não existir
create table if not exists public.budget_cities_iss (
  id           uuid      primary key default gen_random_uuid(),
  city_name    text      not null,
  iss_percent  numeric   not null,
  is_active    boolean   default true,
  created_at   timestamp default now()
);

-- 2) Adicionar colunas faltantes em budget_posts
alter table public.budget_posts
  add column if not exists turn text null,                       -- 'diurno' ou 'noturno'
  add column if not exists city_id uuid references public.budget_cities_iss(id);

-- 3) Criar tabela de uniformes (budget_uniforms) se não existir
create table if not exists public.budget_uniforms (
  id                   uuid      primary key default gen_random_uuid(),
  item_name            text      not null,
  life_time_months     numeric   not null,
  qty_per_collaborator numeric   not null,
  unit_value           numeric   not null,
  is_active            boolean   default true,
  created_at           timestamp default now()
);

-- 4) Habilitar RLS e políticas básicas para budget_uniforms
alter table public.budget_uniforms enable row level security;

drop policy if exists "Allow select budget_uniforms" on public.budget_uniforms;
create policy "Allow select budget_uniforms"
  on public.budget_uniforms for select using (true);

drop policy if exists "Allow insert budget_uniforms" on public.budget_uniforms;
create policy "Allow insert budget_uniforms"
  on public.budget_uniforms for insert with check (true);

drop policy if exists "Allow update budget_uniforms" on public.budget_uniforms;
create policy "Allow update budget_uniforms"
  on public.budget_uniforms for update using (true) with check (true);

-- 5) Habilitar RLS e políticas para budget_cities_iss
alter table public.budget_cities_iss enable row level security;

drop policy if exists "Allow select budget_cities_iss" on public.budget_cities_iss;
create policy "Allow select budget_cities_iss"
  on public.budget_cities_iss for select using (true);

drop policy if exists "Allow insert budget_cities_iss" on public.budget_cities_iss;
create policy "Allow insert budget_cities_iss"
  on public.budget_cities_iss for insert with check (true);

drop policy if exists "Allow update budget_cities_iss" on public.budget_cities_iss;
create policy "Allow update budget_cities_iss"
  on public.budget_cities_iss for update using (true) with check (true);

-- 6) Inserir dados iniciais de cidades com ISS (se a tabela estiver vazia)
insert into public.budget_cities_iss (city_name, iss_percent)
select * from (values
  ('São Paulo - SP', 5.0),
  ('Rio de Janeiro - RJ', 5.0),
  ('Belo Horizonte - MG', 5.0),
  ('Brasília - DF', 5.0),
  ('Salvador - BA', 5.0),
  ('Fortaleza - CE', 5.0),
  ('Curitiba - PR', 5.0),
  ('Recife - PE', 5.0),
  ('Porto Alegre - RS', 5.0),
  ('Goiânia - GO', 5.0),
  ('Belém - PA', 3.0),
  ('Guarulhos - SP', 5.0),
  ('Campinas - SP', 5.0),
  ('São Luís - MA', 3.0),
  ('São Gonçalo - RJ', 3.0),
  ('Maceió - AL', 3.0),
  ('Duque de Caxias - RJ', 3.0),
  ('Campo Grande - MS', 2.0),
  ('Natal - RN', 4.0),
  ('Teresina - PI', 3.0)
) as cities(city_name, iss_percent)
where not exists (select 1 from public.budget_cities_iss limit 1);

-- 7) Inserir dados iniciais de uniformes (se a tabela estiver vazia)
insert into public.budget_uniforms (item_name, life_time_months, qty_per_collaborator, unit_value)
select * from (values
  ('Camisa social', 12, 3, 45.00),
  ('Calça social', 12, 3, 65.00),
  ('Sapato social', 6, 1, 120.00),
  ('Gravata', 24, 2, 25.00),
  ('Cinto', 18, 1, 35.00),
  ('Blazer/Paletó', 24, 1, 180.00),
  ('Crachá de identificação', 12, 1, 15.00),
  ('Colete refletivo', 12, 1, 35.00),
  ('Boné/Chapéu', 12, 1, 25.00),
  ('Meias sociais', 6, 6, 12.00)
) as uniforms(item_name, life_time_months, qty_per_collaborator, unit_value)
where not exists (select 1 from public.budget_uniforms limit 1);

-- 8) Atualizar função de trigger para usar a nova estrutura
create or replace function public.calculate_budget_total_value()
returns trigger as $$
begin
  -- Recalcular o valor total do orçamento baseado na soma dos custos dos postos
  update public.budgets
  set 
    total_value = (
      select coalesce(sum(bp.total_cost), 0)
      from public.budget_posts bp
      where bp.budget_id = coalesce(new.budget_id, old.budget_id)
    ),
    updated_at = now()
  where id = coalesce(new.budget_id, old.budget_id);
  
  return coalesce(new, old);
end;
$$ language plpgsql;

-- 9) Recrear o trigger para garantir que está funcionando
drop trigger if exists update_budget_total_value_trigger on public.budget_posts;
create trigger update_budget_total_value_trigger
  after insert or update or delete on public.budget_posts
  for each row execute function public.calculate_budget_total_value();