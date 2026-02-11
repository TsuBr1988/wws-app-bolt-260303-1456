/*
  # Adicionar campo colocacao_atual

  1. Nova Coluna
    - `colocacao_atual` (text, opcional)
      - Armazena a posição/colocação atual da empresa na licitação
      - Campo editável no card da licitação
      - Útil para acompanhar o status competitivo

  2. Segurança
    - Campo público, sem restrições RLS específicas
*/

ALTER TABLE proposals 
ADD COLUMN IF NOT EXISTS colocacao_atual text;

COMMENT ON COLUMN proposals.colocacao_atual IS 'Posição/colocação atual da empresa na licitação (ex: 1º lugar, 2º colocado, etc.)';