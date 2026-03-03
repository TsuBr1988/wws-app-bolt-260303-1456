# Supabase — Schema mínimo (Configurações + Níveis de usuário)

Este template assume duas tabelas opcionais:
- `app_settings` para chaves/valores de configuração
- `user_profiles` para níveis/roles de usuário

## 1) app_settings
Use para configurações não sensíveis (URLs, flags, etc.).

```sql
create table if not exists public.app_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

-- Recomendações
-- 1) Se for usar dados sensíveis, considere o Supabase Vault/Secrets ou criptografia.
-- 2) Se habilitar leitura no client, aplique RLS bem restritiva.
```

## 2) user_profiles
Guarda nível do usuário (role) atrelado ao usuário do Supabase Auth.

```sql
create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'user',
  updated_at timestamptz not null default now()
);
```

## RLS (mínimo sugerido)
A política exata depende do seu modelo de segurança.

- `user_profiles`: normalmente o próprio usuário pode ler o seu profile; apenas admins podem escrever.
- `app_settings`: apenas admins podem ler/escrever, a menos que você decida expor alguma chave publicamente.

Registre decisões e exceções em [DECISIONS.md](DECISIONS.md).

## Observação do template
- A página `/configuracoes` funciona mesmo sem essas tabelas, mas vai mostrar mensagens de erro/status.
- Para gestão de usuários/roles, é necessário `SUPABASE_SERVICE_ROLE_KEY` (server-side).

---

# Permissões do app (WWS)

Este projeto usa um modelo de permissões “client-side” (login via `app_users`) com duas tabelas no banco do módulo `RH`:

## 1) user_permissions
Controla **acesso a páginas/abas** (nível booleano).

- Tabela: `public.user_permissions`
- Campos usados no app:
  - `user_id` (uuid/text, conforme o seu schema)
  - `page` (text)
  - `can_view` (boolean)

Exemplo (dar acesso à aba Marketing):

```sql
insert into public.user_permissions (user_id, page, can_view)
values ('<USER_ID>', 'marketing', true)
on conflict do nothing;
```

## 2) user_indicator_permissions
Controla permissões em formato **Não visualizar / Observar / Editar**.

- Tabela: `public.user_indicator_permissions`
- Campos usados no app:
  - `user_id`
  - `page` (text)
  - `indicator_name` (text)
  - `permission_level` (text: `none` | `view` | `edit`)

### Marketing (matriz)
As permissões do Marketing são geridas pela matriz em Configurações → Usuários → Gerenciar Permissões, no grupo `page = 'marketing'`.

Linhas (indicator_name) usadas atualmente:
- `Marketing`
- `Marketing > Solicitações`
- `Marketing > Comparativo de Plataformas`
- `Marketing > Planejamento`
- `Marketing > Tarefas`
- `Marketing > Atas`
- `Solicitações - Pedir`
- `Solicitações - Editar`
- `Atas - Pedir`
- `Atas - Editar`
- `Tarefas - Pedir`
- `Tarefas - Editar`

Exemplo (permitir abrir Solicitações e editar):

```sql
insert into public.user_indicator_permissions (user_id, page, indicator_name, permission_level)
values
  ('<USER_ID>', 'marketing', 'Marketing', 'view'),
  ('<USER_ID>', 'marketing', 'Marketing > Solicitações', 'view'),
  ('<USER_ID>', 'marketing', 'Solicitações - Pedir', 'view'),
  ('<USER_ID>', 'marketing', 'Solicitações - Editar', 'edit')
on conflict (user_id, page, indicator_name)
do update set permission_level = excluded.permission_level;
```

Observação: o app também mantém compatibilidade com o legado `public.marketing_roles` para gestão de Solicitações, mas o caminho oficial é a matriz acima.
