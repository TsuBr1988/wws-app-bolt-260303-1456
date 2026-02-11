/*
  # Adicionar coluna status_planilha à tabela proposals

  1. Nova Coluna
    - `status_planilha` (text) - Status da planilha da licitação
    - Valores possíveis: 'Planilha a fazer', 'Planilha feita'
    - Valor padrão: 'Planilha a fazer'

  2. Atualização
    - Adiciona a coluna com valor padrão para registros existentes
    - Permite controlar o status da planilha de cada licitação
*/

-- Adicionar coluna status_planilha à tabela proposals
ALTER TABLE proposals 
ADD COLUMN IF NOT EXISTS status_planilha TEXT DEFAULT 'Planilha a fazer';

-- Comentário da coluna
COMMENT ON COLUMN proposals.status_planilha IS 'Status da planilha da licitação (Planilha a fazer, Planilha feita)';

-- Criar índice para performance nas consultas por status da planilha
CREATE INDEX IF NOT EXISTS idx_proposals_status_planilha 
ON proposals(status_planilha);