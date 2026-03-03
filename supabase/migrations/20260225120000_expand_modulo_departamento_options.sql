-- Expand allowed values for modulo/departamento where the database enforces CHECK constraints.
--
-- This migration is intentionally defensive:
-- - If the table does not exist, it does nothing.
-- - If there is no CHECK constraint for the column, it does nothing (so we don't introduce new restrictions).
-- - If there is a CHECK constraint, it recreates it as a SUPerset of:
--     (a) existing distinct values already stored in the table
--     (b) the baseline options used in the UI
--     (c) the newly requested options (Marketing, TI)

do $$
declare
  c record;
  allowed_values text[];
  has_modulo_check boolean;
  has_departamento_check boolean;
begin
  -- TI: chamados (public.ti_chamados.modulo)
  if to_regclass('public.ti_chamados') is not null then
    select exists(
      select 1
      from pg_constraint pc
      where pc.conrelid = 'public.ti_chamados'::regclass
        and pc.contype = 'c'
        and pg_get_constraintdef(pc.oid) ilike '%modulo%'
        and (
          pg_get_constraintdef(pc.oid) ilike '% in (%'
          or pg_get_constraintdef(pc.oid) ilike '%= any%'
        )
    ) into has_modulo_check;

    if has_modulo_check then
      for c in
        select pc.conname
        from pg_constraint pc
        where pc.conrelid = 'public.ti_chamados'::regclass
          and pc.contype = 'c'
          and pg_get_constraintdef(pc.oid) ilike '%modulo%'
          and (
            pg_get_constraintdef(pc.oid) ilike '% in (%'
            or pg_get_constraintdef(pc.oid) ilike '%= any%'
          )
      loop
        execute format('alter table public.ti_chamados drop constraint %I', c.conname);
      end loop;

      -- Start with UI baseline
      allowed_values := array[
        'Home',
        'RH',
        'Operacional',
        'Comercial Público',
        'Comercial Privado',
        'Compras',
        'Finanças',
        'Qualidade',
        'Contratos',
        'Cultura',
        'Marketing',
        'Atas e Ações',
        'TI'
      ]::text[];

      -- Union with existing stored values (keeps migration non-breaking)
      select array_agg(distinct v order by v)
        into allowed_values
      from (
        select unnest(allowed_values) as v
        union
        select distinct modulo as v
        from public.ti_chamados
        where modulo is not null
      ) s;

      execute format(
        'alter table public.ti_chamados add constraint ti_chamados_modulo_chk check (modulo = any (%L::text[]))',
        allowed_values
      );
    end if;
  end if;

  -- Marketing: solicitações (public.marketing_solicitacoes.departamento)
  if to_regclass('public.marketing_solicitacoes') is not null then
    select exists(
      select 1
      from pg_constraint pc
      where pc.conrelid = 'public.marketing_solicitacoes'::regclass
        and pc.contype = 'c'
        and pg_get_constraintdef(pc.oid) ilike '%departamento%'
        and (
          pg_get_constraintdef(pc.oid) ilike '% in (%'
          or pg_get_constraintdef(pc.oid) ilike '%= any%'
        )
    ) into has_departamento_check;

    if has_departamento_check then
      for c in
        select pc.conname
        from pg_constraint pc
        where pc.conrelid = 'public.marketing_solicitacoes'::regclass
          and pc.contype = 'c'
          and pg_get_constraintdef(pc.oid) ilike '%departamento%'
          and (
            pg_get_constraintdef(pc.oid) ilike '% in (%'
            or pg_get_constraintdef(pc.oid) ilike '%= any%'
          )
      loop
        execute format('alter table public.marketing_solicitacoes drop constraint %I', c.conname);
      end loop;

      allowed_values := array[
        'RH',
        'Comercial Privado',
        'Comercial Público',
        'Compras',
        'TI',
        'Marketing',
        'Qualidade',
        'Financeiro',
        'Operacional'
      ]::text[];

      select array_agg(distinct v order by v)
        into allowed_values
      from (
        select unnest(allowed_values) as v
        union
        select distinct departamento as v
        from public.marketing_solicitacoes
        where departamento is not null
      ) s;

      execute format(
        'alter table public.marketing_solicitacoes add constraint marketing_solicitacoes_departamento_chk check (departamento = any (%L::text[]))',
        allowed_values
      );
    end if;
  end if;
end $$;
