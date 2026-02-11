# Instruções para Corrigir a Função de Copiar Orçamento

## Problema
A função `copy_budget_as_new` está tentando acessar colunas que não existem nas tabelas.

## Solução

### Passo 1: Abrir o Supabase SQL Editor
1. Acesse: https://vehbyoihnkxzblsmlpdz.supabase.co
2. Vá em **SQL Editor**
3. Clique em **New Query**

### Passo 2: Executar o SQL
Copie e cole o conteúdo completo do arquivo `fix_copy_budget_complete.sql` e execute.

## O que o SQL faz:

### 1. Adiciona Colunas Faltantes
- `contact_name`, `contact_email`, `contact_phone` na tabela `budgets`
- `cnpj`, `margem_lucro`, `margem_adm` na tabela `budgets`

### 2. Garante a Função Auxiliar
- `get_next_budget_number()` para gerar números sequenciais

### 3. Remove Versões Antigas
- Dropa todas as versões antigas da função `copy_budget_as_new`

### 4. Cria a Função Correta
A nova função:
- ✅ Usa apenas as colunas que existem em cada tabela
- ✅ Trata `budget_id` como TEXT em `budget_function_benefit_overrides`
- ✅ Usa `custom_value`, `custom_formula`, `notes` em benefit overrides
- ✅ Usa `grupo_code`, `encargo_name`, `custom_rate` em encargos overrides
- ✅ Usa apenas `function_data`, `total_bdi`, `total_contract` em budget_calculations
- ✅ Usa `IF EXISTS` para copiar de tabelas opcionais

### 5. Copia Tudo Corretamente
- Orçamento base com todos os campos
- Funções do orçamento
- Materiais, Equipamentos, Uniformes
- CAPEX e Outros
- Benefícios diferenciados
- Overrides de benefícios por função
- Overrides de encargos
- Cálculos salvos

## Após Executar
Volte para a aplicação e tente copiar o orçamento novamente. Deve funcionar! 🎉
