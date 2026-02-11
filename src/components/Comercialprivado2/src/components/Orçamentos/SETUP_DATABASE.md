# Configuração do Banco de Dados de Orçamentos

Este guia explica como aplicar as migrations ao banco de dados de orçamentos.

## Problema

O sistema de orçamentos usa um banco de dados separado (https://vehbyoihnkxzblsmlpdz.supabase.co) e as tabelas/funções precisam ser criadas nesse banco.

## Solução Rápida: Aplicar Migrations via Dashboard do Supabase

### Passo 1: Acessar o Supabase Dashboard

1. Acesse: https://supabase.com/dashboard
2. Selecione o projeto de orçamentos: **vehbyoihnkxzblsmlpdz**
3. Vá em **SQL Editor** no menu lateral

### Passo 2: Executar as Migrations na Ordem

Execute cada migration abaixo **NA ORDEM**, uma de cada vez:

#### Migration 1: Sistema Base (20260105161325_create_budgets_system.sql)
```sql
-- Copie e cole o conteúdo completo do arquivo:
-- src/components/Comercialprivado2/src/components/Orçamentos/supabase/migrations/20260105161325_create_budgets_system.sql
```

#### Migration 2: Informações do Cliente (20260105163040_update_budgets_add_client_info.sql)
```sql
-- Copie e cole o conteúdo completo do arquivo:
-- src/components/Comercialprivado2/src/components/Orçamentos/supabase/migrations/20260105163040_update_budgets_add_client_info.sql
```

#### Migration 3: Tabela de Cidades (20260105170107_create_cities_table.sql)
```sql
-- Copie e cole o conteúdo completo do arquivo
```

#### Migration 4: Tabela de Materiais (20260105174229_create_materials_table.sql)
```sql
-- Copie e cole o conteúdo completo do arquivo
```

#### Migration 5: Tabela de Equipamentos (20260105184947_create_equipments_table.sql)
```sql
-- Copie e cole o conteúdo completo do arquivo
```

#### Migration 6: Tabela de Uniformes (20260105190545_create_uniforms_table.sql)
```sql
-- Copie e cole o conteúdo completo do arquivo
```

#### Migration 7: Tabela de Cálculos (20260106000000_create_budget_calculations_table.sql)
```sql
-- Copie e cole o conteúdo completo do arquivo
```

#### Migration 8: Campos de Margem (20260106182000_add_margem_fields_to_budgets.sql)
```sql
-- Copie e cole o conteúdo completo do arquivo
```

#### Migration 9: Benefícios Diferenciados (20260107200000_create_differentiated_benefits_table.sql)
```sql
-- Copie e cole o conteúdo completo do arquivo
```

#### Migration 10: Campos VT e ISS (20260108190000_add_vt_value_city_iss_to_budget_functions.sql)
```sql
-- Copie e cole o conteúdo completo do arquivo
```

#### Migration 11: Tabela CAPEX (20260109000000_create_capex_table.sql)
```sql
-- Copie e cole o conteúdo completo do arquivo
```

## Verificação

Após aplicar todas as migrations, verifique se as tabelas foram criadas:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE 'budget%'
ORDER BY table_name;
```

Você deve ver:
- budgets
- budget_calculations
- budget_capex
- budget_cities
- budget_differentiated_benefits
- budget_equipments
- budget_functions
- budget_materials
- budget_uniforms

Verifique também se a função foi criada:

```sql
SELECT proname
FROM pg_proc
WHERE proname = 'get_next_budget_number';
```

## Teste

Após aplicar as migrations, teste gerando um novo número de orçamento:

```sql
SELECT get_next_budget_number(2026);
```

Deve retornar: `2026-001`

## Solução Alternativa: Script Automatizado

Se preferir usar um script, você pode executar:

```bash
cd src/components/Comercialprivado2/src/components/Orçamentos
node apply-migrations-manual.js
```

Mas você precisará ter a Service Role Key do banco de orçamentos.
