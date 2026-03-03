# Marketing — Solicitações (chamados)

## Objetivo
Centralizar pedidos para o departamento de **Marketing** (materiais/publicações) em um fluxo de tickets semelhante ao módulo de TI.

## Onde fica
- Aba: **Marketing → Solicitações**
- Código (módulo): `src/components/Comercialprivado2/src/modules/marketing/solicitacoes/`

## Campos
Ao abrir uma solicitação:
- **Título** (obrigatório)
- **Tipo**: `Postagens` | `Materiais Físicos` | `Materiais Digitais`
- **Departamento solicitante** (obrigatório):
  - RH
  - Comercial Privado
  - Comercial Público
  - Compras
  - TI
  - Qualidade
  - Financeiro
  - Operacional
- **Prioridade**: Baixa | Média | Alta | Crítica
- **Pontuação Scrum** (opcional): 1 | 2 | 3 | 5 | 8 | N/A
- **Descrição** (obrigatório)
- **Solicitante**: preenchido automaticamente pelo usuário logado (`localStorage.app_user`)

## Workflow
Status (igual TI):
- `A fazer` → `Fazendo` → `Feito` → `Refação`

A aba suporta:
- **Lista + Kanban (drag-and-drop)**
- Busca e filtro de status (no modo lista)
- Visualização de arquivadas

## Permissões
Regra acordada:
- Qualquer usuário logado pode **ver** e **criar** solicitações.
- Apenas **Marketing** (ou **admin**) pode: **editar**, **mover status**, **arquivar**, **comentar**.

Implementação atual (client-side):
- `admin`: `app_user.is_admin === true`
- `Marketing editor`: existe registro em `public.marketing_roles` com `app_user_id = app_users.id` e `role = 'editor'`.

### Como cadastrar editores de Marketing
No Supabase SQL editor:

```sql
-- Descubra o ID do usuário
select id, name, email from public.app_users order by name;

-- Cadastre como editor
insert into public.marketing_roles (app_user_id, role)
values ('<APP_USER_UUID>', 'editor')
on conflict (app_user_id) do update set role = excluded.role;
```

## Banco de dados (Supabase)
Migration: `supabase/migrations/20260220120000_create_marketing_solicitacoes.sql`

Tabelas:
- `public.marketing_solicitacoes`
- `public.marketing_roles`

> Observação: se você habilitar RLS nessas tabelas, precisará criar políticas compatíveis com o seu modelo (o app não usa Supabase Auth no login; usa `app_users`).

## Troubleshooting

### Erro `42P01` / 404 em `/rest/v1/marketing_solicitacoes`
Significa que a tabela ainda **não existe** no Supabase do ambiente.

- Aplique a migration `supabase/migrations/20260220120000_create_marketing_solicitacoes.sql` no Supabase SQL Editor.
- Recarregue a página.

### Erro `permission denied for relation marketing_solicitacoes`
Se o seu projeto não estiver com *default privileges* liberando acesso para `anon`, você pode conceder permissões manualmente (ajuste conforme sua política de segurança):

```sql
grant select, insert, update, delete on table public.marketing_solicitacoes to anon;
grant select, insert, update, delete on table public.marketing_roles to anon;

-- Necessário para usar o identity default (o nome do sequence pode variar)
grant usage, select on sequence public.marketing_solicitacoes_solicitacao_numero_seq to anon;
```
