/*
  # Adicionar coluna numero_pregao à tabela proposals

  1. Nova Coluna
    - `numero_pregao` (text, opcional)
      - Armazena o número do pregão (ex: "165/2025")
      - Campo opcional para permitir licitações sem número definido

  2. Índice
    - Adiciona índice na coluna numero_pregao para consultas mais rápidas

  3. Observações
    - Campo pode ser nulo para permitir flexibilidade
    - Valores existentes não serão afetados
*/

-- Adicionar coluna numero_pregao à tabela proposals
ALTER TABLE proposals 
ADD COLUMN IF NOT EXISTS numero_pregao text;

-- Adicionar índice para melhorar performance nas consultas
CREATE INDEX IF NOT EXISTS idx_proposals_numero_pregao 
ON proposals(numero_pregao);

-- Comentário na coluna para documentação
COMMENT ON COLUMN proposals.numero_pregao IS 'Número do pregão/licitação (ex: 165/2025)';