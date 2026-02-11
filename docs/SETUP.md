# Setup (Local / Dev)

## Variáveis de ambiente
Este projeto é um **Vite + React** e usa Supabase.

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Regras importantes do Vite:
- Variáveis expostas no client precisam começar com `VITE_`.
- As variáveis são lidas **em build/dev time** (ou seja, precisam existir no ambiente no momento do `npm run dev` e do `npm run build`).

Crie um arquivo `.env` a partir de `.env.example`.

### Regras
- Qualquer coisa que seja **secreta** (service role, chaves privadas, tokens) fica em variável de ambiente.
- A página `/configuracoes` serve para parâmetros do sistema e integrações **não sensíveis** (ou sensíveis somente se você decidir e aplicar RLS/segurança, registrando em `docs/DECISIONS.md`).

## Banco de dados
Banco gerenciado pelo Supabase (Postgres).

### Migrações / schema
Defina suas tabelas no Supabase (SQL Editor / migrations do seu fluxo).

- Schema mínimo do template (config/roles): [SUPABASE_SCHEMA.md](SUPABASE_SCHEMA.md)
- Se você decidir versionar migrations no repo, registre o padrão em [DECISIONS.md](DECISIONS.md).

## Scripts úteis
- `npm run dev`: roda localmente
- `npm run build`: valida build de produção
- `npm run start`: roda servidor em modo produção
