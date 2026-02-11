
# INSTRUÇÕES PARA APLICAR A CORREÇÃO

## Problema Identificado
A função `copy_budget_as_new` no banco de orçamentos está tentando copiar
colunas que não existem na tabela `budget_calculations` (total_payroll,
total_benefits, total_encargos).

## Solução
Aplicar o arquivo `docs/legacy/fix_copy_budget_orcamentos.sql` no banco de orçamentos.

## Banco de Dados Alvo
- URL: https://vehbyoihnkxzblsmlpdz.supabase.co
- Este é o banco de ORÇAMENTOS (não o banco principal)

## Como Aplicar

### Opção 1: Via Dashboard do Supabase (RECOMENDADO)
1. Acesse: https://supabase.com/dashboard/project/vehbyoihnkxzblsmlpdz
2. Faça login com suas credenciais
3. Vá para a seção "SQL Editor" no menu lateral
4. Clique em "New Query"
5. Copie todo o conteúdo do arquivo `docs/legacy/fix_copy_budget_orcamentos.sql`
6. Cole no editor
7. Clique em "RUN" ou pressione Ctrl+Enter
8. Aguarde a mensagem de sucesso: "✅ Função copy_budget_as_new criada/atualizada com sucesso!"

### Opção 2: Via Linha de Comando (psql)
Se você tem acesso via psql:

```bash
psql "postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres" < docs/legacy/fix_copy_budget_orcamentos.sql
```

Substitua:
- [PROJECT-REF] pelo ref do projeto: vehbyoihnkxzblsmlpdz
- [PASSWORD] pela senha do banco

## O que o Script Faz
1. Cria/atualiza a função auxiliar `get_next_budget_number`
2. Remove a versão antiga da função `copy_budget_as_new`
3. Cria a versão correta que NÃO tenta copiar `budget_calculations`
4. Valida que a função foi criada corretamente

## Após Aplicar
Teste copiando um orçamento no sistema. O erro não deve mais ocorrer.

## Observações Importantes
- ⚠️  Execute este script APENAS no banco de orçamentos
- ⚠️  NÃO execute no banco principal do projeto
- ✅  É seguro executar múltiplas vezes (idempotente)
- ✅  Não afeta dados existentes, apenas atualiza a função
