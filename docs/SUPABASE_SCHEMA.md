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
