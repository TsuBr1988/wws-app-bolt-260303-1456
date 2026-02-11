/*
  # Adiciona Ligação entre Orçamentos e Propostas

  1. Alterações
    - Adiciona coluna `budget_id` (text) à tabela `proposals`
    - Permite valores nulos (nem toda proposta vem de orçamento)

  2. Notas
    - Esta ligação permite rastrear qual orçamento originou uma proposta
    - O relacionamento é opcional (budget_id pode ser nulo)
    - Armazena o ID do orçamento como texto
*/

-- Adiciona coluna budget_id à tabela proposals
ALTER TABLE proposals
ADD COLUMN IF NOT EXISTS budget_id text;

-- Cria índice para melhorar performance de consultas
CREATE INDEX IF NOT EXISTS idx_proposals_budget_id ON proposals(budget_id);
