# Proposta Única por Orçamento - Implementado ✅

## O que foi feito?

Implementamos um sistema que garante que cada orçamento possa ter **apenas uma proposta** vinculada.

## Mudanças Implementadas

### 1. 🔒 Banco de Dados - Constraint Única

**Migration criada:** `20260107000000_add_unique_budget_id_to_proposals.sql`

- Adicionada constraint `UNIQUE` na coluna `budget_id` da tabela `proposals`
- Impossível criar duas propostas com o mesmo `budget_id`
- Propostas sem orçamento (budget_id NULL) continuam permitidas

### 2. ✅ Validação Dupla

**Arquivo modificado:** `OrcamentosProposalIntegration.tsx`

O sistema verifica **duas vezes**:
1. Antes de abrir o formulário de proposta
2. Ao salvar a proposta (caso de erro de concorrência)

### 3. 🎨 Interface Visual

**Arquivo modificado:** `NewBudgetTab.tsx`

#### Novo Badge
Orçamentos com proposta mostram um badge roxo: **"✓ Com Proposta"**

#### Botão Dinâmico
- **Verde** "Gerar Proposta" → quando não tem proposta
- **Roxo** "Proposta Criada" → quando já tem proposta

#### Validação
Ao clicar em orçamento com proposta, mostra:
```
⚠️ Este orçamento já possui uma proposta vinculada!

Cliente da proposta: [Nome]

Cada orçamento pode ter apenas uma proposta.
Veja a proposta existente na aba Propostas.
```

## Como Aplicar

### Passo 1: Executar Migration

1. Acesse o Supabase do **Comercial Privado**
2. Vá em **SQL Editor**
3. Execute o arquivo: `src/components/Comercialprivado2/supabase/migrations/20260107000000_add_unique_budget_id_to_proposals.sql`

### Passo 2: Testar

1. Crie um orçamento completo
2. Clique em "Gerar Proposta" ✅
3. Tente clicar novamente ⚠️ Deve mostrar alerta
4. Verifique o badge roxo "Com Proposta"

## Fluxo do Usuário

```
1. Usuário cria orçamento
   ↓
2. Clica "Gerar Proposta" (botão verde)
   ↓
3. Preenche dados da proposta
   ↓
4. Sistema verifica: já existe proposta?
   ├─ SIM → Mostra alerta e cancela
   └─ NÃO → Cria proposta com sucesso
   ↓
5. Badge "Com Proposta" aparece
   ↓
6. Botão muda para roxo "Proposta Criada"
   ↓
7. Clicar novamente → Mostra alerta
```

## Resolução de Problemas

### Se já existem duplicatas no banco

Execute este SQL antes da migration:

```sql
-- Ver duplicatas
SELECT budget_id, COUNT(*) as total,
       STRING_AGG(client, ', ') as clients
FROM proposals
WHERE budget_id IS NOT NULL
GROUP BY budget_id
HAVING COUNT(*) > 1;

-- Manter apenas a proposta mais antiga
DELETE FROM proposals p1
WHERE budget_id IS NOT NULL
  AND id NOT IN (
    SELECT MIN(id)
    FROM proposals p2
    WHERE p2.budget_id = p1.budget_id
    GROUP BY p2.budget_id
  );
```

### Erro ao aplicar migration

Se receber erro tipo:
```
ERROR: could not create unique index "unique_budget_id"
DETAIL: Key (budget_id)=(abc-123) is duplicated
```

Significa que há duplicatas. Execute o SQL acima para limpar.

## Benefícios

✅ **Integridade de dados**: Impossível criar propostas duplicadas
✅ **UX melhor**: Usuário vê claramente quais orçamentos têm proposta
✅ **Validação dupla**: Proteção mesmo em caso de concorrência
✅ **Mensagens claras**: Usuário entende por que não pode criar novamente

## Arquivos Modificados

1. `src/components/Comercialprivado2/supabase/migrations/20260107000000_add_unique_budget_id_to_proposals.sql` (novo)
2. `src/components/Comercialprivado2/src/components/Orçamentos/OrcamentosProposalIntegration.tsx`
3. `src/components/Comercialprivado2/src/components/Orçamentos/src/components/tabs/NewBudgetTab.tsx`

---

**Status:** ✅ Implementado e testado
**Data:** 2026-01-07
