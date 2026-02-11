# Setup Rápido - Banco de Dados de Orçamentos

## O Problema

O sistema de orçamentos não está funcionando porque as tabelas ainda não existem no banco de dados.

**Erros:**
- `Could not find the table 'public.budgets' in the schema cache`
- `Could not find the function public.get_next_budget_number(p_year) in the schema cache`

## A Solução (2 minutos)

### Passo 1: Acessar o Supabase Dashboard

1. Acesse: https://supabase.com/dashboard/project/vehbyoihnkxzblsmlpdz
2. No menu lateral, clique em **SQL Editor**
3. Clique em **+ New Query**

### Passo 2: Executar o Script de Setup

1. Abra o arquivo: `ALL_MIGRATIONS.sql` (nesta pasta)
2. Copie TODO o conteúdo (Ctrl+A, Ctrl+C)
3. Cole no SQL Editor do Supabase
4. Clique em **Run** (ou pressione Ctrl+Enter)

### Passo 3: Aguardar

O script vai criar:
- 9 tabelas (budgets, budget_functions, budget_materials, etc.)
- 1 função (get_next_budget_number)
- Índices e políticas de segurança

**Tempo estimado:** 10-30 segundos

### Passo 4: Verificar

Execute no SQL Editor:

```sql
-- Verificar tabelas criadas
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'budget%'
ORDER BY table_name;

-- Verificar função
SELECT get_next_budget_number(2026);
```

Deve mostrar 9 tabelas e retornar `2026-001`.

## Pronto!

Depois de executar o script, volte para a aplicação e:

1. Recarregue a página (F5)
2. Clique em "+ Novo Orçamento"
3. O número do orçamento deve aparecer automaticamente
4. Os orçamentos salvos devem aparecer na lista

## O que foi Corrigido no Código

1. **Arquivo atualizado:** `src/lib/supabase.ts`
   - Agora usa o banco correto: `VITE_BUDGETS_SUPABASE_URL`
   - Antes usava o banco antigo: `VITE_SUPABASE_URL`

2. **Variáveis de ambiente no .env:**
   ```
   VITE_BUDGETS_SUPABASE_URL=https://vehbyoihnkxzblsmlpdz.supabase.co
   VITE_BUDGETS_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

## Troubleshooting

### Erro: "Missing Budgets Supabase environment variables"

**Solução:** Verifique se as variáveis estão no arquivo `.env` na raiz do projeto.

### Erro: "permission denied for table budgets"

**Solução:** O script inclui políticas de segurança (RLS) que permitem acesso público. Se ainda der erro, execute:

```sql
ALTER TABLE budgets DISABLE ROW LEVEL SECURITY;
ALTER TABLE budget_functions DISABLE ROW LEVEL SECURITY;
-- Repita para todas as tabelas budget_*
```

### Tabelas já existem

Se as tabelas já existem e você quer recriar:

```sql
-- CUIDADO: Isso apaga todos os dados!
DROP TABLE IF EXISTS budget_capex CASCADE;
DROP TABLE IF EXISTS budget_differentiated_benefits CASCADE;
DROP TABLE IF EXISTS budget_equipments CASCADE;
DROP TABLE IF EXISTS budget_materials CASCADE;
DROP TABLE IF EXISTS budget_uniforms CASCADE;
DROP TABLE IF EXISTS budget_cities CASCADE;
DROP TABLE IF EXISTS budget_calculations CASCADE;
DROP TABLE IF EXISTS budget_functions CASCADE;
DROP TABLE IF EXISTS budgets CASCADE;
DROP FUNCTION IF EXISTS get_next_budget_number(integer);

-- Depois execute o ALL_MIGRATIONS.sql novamente
```
