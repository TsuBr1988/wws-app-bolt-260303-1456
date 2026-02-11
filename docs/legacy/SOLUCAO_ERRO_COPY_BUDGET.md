# 🔧 Solução: Erro ao Copiar Orçamento

## 📋 Resumo do Problema

**Erro encontrado:**
```
column "total_payroll" of relation "budget_calculations" does not exist (Código: 42703)
```

**Causa raiz:**
- A função `copy_budget_as_new` no banco de orçamentos está desatualizada
- Ela tenta copiar colunas que não existem mais na tabela `budget_calculations`
- As colunas problemáticas: `total_payroll`, `total_benefits`, `total_encargos`

**Por que aconteceu:**
- O banco de orçamentos (`vehbyoihnkxzblsmlpdz.supabase.co`) é **diferente** do banco principal
- As migrações de correção foram aplicadas no banco principal, mas não no banco de orçamentos
- A versão antiga da função ficou no banco de orçamentos

---

## ✅ Solução (Passo a Passo)

### 🎯 Opção 1: Via Dashboard do Supabase (MAIS FÁCIL)

1. **Acesse o Dashboard:**
   - URL: https://supabase.com/dashboard/project/vehbyoihnkxzblsmlpdz
   - Faça login com suas credenciais

2. **Abra o SQL Editor:**
   - No menu lateral esquerdo, clique em **"SQL Editor"**
   - Clique em **"New Query"** (nova consulta)

3. **Cole o Script de Correção:**
   - Abra o arquivo: `fix_copy_budget_orcamentos.sql`
   - Copie **TODO** o conteúdo (Ctrl+A, Ctrl+C)
   - Cole no editor SQL do Supabase (Ctrl+V)

4. **Execute:**
   - Clique no botão **"RUN"** ou pressione **Ctrl+Enter**
   - Aguarde a execução (leva alguns segundos)

5. **Verifique o Sucesso:**
   - Você deve ver a mensagem: `✅ Função copy_budget_as_new criada/atualizada com sucesso!`
   - Se aparecer qualquer erro, anote a mensagem e me avise

6. **Teste:**
   - Volte ao sistema de orçamentos
   - Tente copiar um orçamento novamente
   - O erro não deve mais aparecer

---

### 🖥️ Opção 2: Via Linha de Comando (psql)

Se você tem acesso ao PostgreSQL via terminal:

```bash
# No diretório do projeto, execute:
psql "postgresql://postgres.vehbyoihnkxzblsmlpdz:[SUA-SENHA]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres" < fix_copy_budget_orcamentos.sql
```

**Substitua `[SUA-SENHA]`** pela senha do banco de dados de orçamentos.

---

## 🎓 Entendendo a Correção

O script `fix_copy_budget_orcamentos.sql` faz o seguinte:

1. **Atualiza função auxiliar** `get_next_budget_number`:
   - Gera números sequenciais para novos orçamentos (ex: 2026-001, 2026-002)

2. **Remove a função antiga** `copy_budget_as_new`:
   - A versão que tentava copiar colunas inexistentes

3. **Cria a função nova e correta**:
   - Copia o orçamento completo
   - Copia funções, materiais, equipamentos, uniformes, etc.
   - **NÃO copia** `budget_calculations` (é recalculado automaticamente)

4. **Valida a instalação**:
   - Verifica se a função foi criada com sucesso

---

## 📁 Arquivos Criados

- ✅ `fix_copy_budget_orcamentos.sql` - Script SQL de correção
- ✅ `docs/legacy/apply-fix-orcamentos.js` - Script Node.js auxiliar
- ✅ `INSTRUCOES_FIX_COPY_BUDGET.md` - Instruções detalhadas
- ✅ `SOLUCAO_ERRO_COPY_BUDGET.md` - Este documento

---

## ⚠️ Importante

- ✅ Execute **APENAS** no banco de orçamentos (vehbyoihnkxzblsmlpdz)
- ✅ **NÃO** execute no banco principal
- ✅ É seguro executar múltiplas vezes (idempotente)
- ✅ Não afeta dados existentes
- ✅ Não requer downtime ou manutenção

---

## 🆘 Se Encontrar Problemas

1. **Erro de permissão:**
   - Verifique se está logado no Supabase com a conta correta
   - Use a conta que tem permissões de admin no projeto

2. **Erro "function does not exist":**
   - Verifique se está executando no banco correto (vehbyoihnkxzblsmlpdz)
   - Confira se o projeto URL está correto

3. **Erro de sintaxe SQL:**
   - Certifique-se de copiar TODO o conteúdo do arquivo
   - Não copie parcialmente ou pule linhas

4. **Ainda não funciona após aplicar:**
   - Limpe o cache do navegador (Ctrl+Shift+R)
   - Faça logout e login novamente no sistema
   - Tente copiar um orçamento diferente

---

## 📞 Próximos Passos

Após aplicar a correção:

1. Teste copiando um orçamento
2. Verifique se os dados foram copiados corretamente
3. Confirme que o novo orçamento tem um número sequencial válido
4. Se tudo funcionar, considere fazer um backup do banco de dados

---

## 📊 Informações Técnicas

**Banco de Dados:**
- URL: `https://vehbyoihnkxzblsmlpdz.supabase.co`
- Tipo: PostgreSQL via Supabase
- Uso: Sistema de Orçamentos (módulo do Comercial Privado)

**Função Corrigida:**
- Nome: `copy_budget_as_new`
- Tipo: PL/pgSQL
- Segurança: SECURITY DEFINER
- Parâmetros: 9 (budget_id + 8 campos opcionais)

**Tabelas Afetadas:**
- `budgets` (principal)
psql "postgresql://postgres.vehbyoihnkxzblsmlpdz:[SUA-SENHA]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres" < docs/legacy/fix_copy_budget_orcamentos.sql
- `materials`, `equipments`, `uniforms`, `capex`, `others`
- `differentiated_benefits`
- `budget_function_benefit_overrides`
- `budget_encargos_overrides`

---

**Criado em:** 2026-01-30
**Versão:** 1.0
**Status:** ✅ Pronto para aplicar
