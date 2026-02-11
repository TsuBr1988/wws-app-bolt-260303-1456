/*
  # Adiciona Restrição Única para budget_id em Propostas

  1. Alterações
    - Adiciona constraint UNIQUE na coluna `budget_id` da tabela `proposals`
    - Garante que cada orçamento possa ter no máximo uma proposta associada

  2. Notas
    - A constraint permite valores NULL (propostas sem orçamento)
    - Apenas budget_id não-nulos precisam ser únicos
    - Se já existirem duplicatas, a migration falhará e você precisará resolver manualmente
*/

-- Primeiro, verificar se há duplicatas
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO duplicate_count
  FROM (
    SELECT budget_id, COUNT(*) as cnt
    FROM proposals
    WHERE budget_id IS NOT NULL
    GROUP BY budget_id
    HAVING COUNT(*) > 1
  ) duplicates;

  IF duplicate_count > 0 THEN
    RAISE NOTICE 'ATENÇÃO: Existem % orçamentos com múltiplas propostas. Resolva manualmente antes de aplicar a constraint.', duplicate_count;
    RAISE NOTICE 'Execute: SELECT budget_id, COUNT(*) FROM proposals WHERE budget_id IS NOT NULL GROUP BY budget_id HAVING COUNT(*) > 1;';
  END IF;
END $$;

-- Adiciona a constraint UNIQUE
ALTER TABLE proposals
ADD CONSTRAINT unique_budget_id UNIQUE (budget_id);

-- Criar índice para melhorar performance (se ainda não existir)
CREATE INDEX IF NOT EXISTS idx_proposals_budget_id_not_null ON proposals(budget_id) WHERE budget_id IS NOT NULL;
