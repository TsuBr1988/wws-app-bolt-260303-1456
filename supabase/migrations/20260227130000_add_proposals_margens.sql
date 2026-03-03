-- Adds manual margin fields for Comercial Público > Licitações
-- Table: public.proposals

alter table public.proposals
  add column if not exists margem_lucro numeric(5,2),
  add column if not exists margem_adm numeric(5,2);

-- Optional sanity checks (0..100)
alter table public.proposals
  drop constraint if exists proposals_margem_lucro_check;
alter table public.proposals
  add constraint proposals_margem_lucro_check
  check (margem_lucro is null or (margem_lucro >= 0 and margem_lucro <= 100));

alter table public.proposals
  drop constraint if exists proposals_margem_adm_check;
alter table public.proposals
  add constraint proposals_margem_adm_check
  check (margem_adm is null or (margem_adm >= 0 and margem_adm <= 100));
