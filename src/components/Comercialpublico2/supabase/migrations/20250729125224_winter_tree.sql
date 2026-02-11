/*
  # Adicionar coluna plataforma na tabela proposals

  1. Nova Coluna
    - `plataforma` (text, opcional)
      - Armazena o nome da plataforma da licitação
      - Ex: 'Comprasnet', 'Licitacoes-e', 'BLL', 'Portal Nacional'

  2. Atualização
    - Adiciona a coluna na tabela proposals existente
    - Permite valores nulos para compatibilidade com dados existentes
*/

-- Adicionar coluna plataforma na tabela proposals
ALTER TABLE proposals 
ADD COLUMN IF NOT EXISTS plataforma text;

-- Adicionar comentário para documentação
COMMENT ON COLUMN proposals.plataforma IS 'Plataforma onde a licitação está sendo realizada (ex: Comprasnet, Licitacoes-e, BLL, Portal Nacional)';

-- Criar índice para melhorar performance de consultas por plataforma
CREATE INDEX IF NOT EXISTS idx_proposals_plataforma 
ON proposals(plataforma);