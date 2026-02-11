/*
  # Adicionar campos de lance à tabela proposals

  1. Novos Campos
    - `lance_vencedor` (numeric) - Valor do lance vencedor
    - `nosso_lance` (numeric) - Valor do nosso lance
    - `empresa_vencedora` (text) - Nome da empresa vencedora
    - `percentual_vencedor` (text) - Percentual do lance vencedor em relação ao estimado
    - `percentual_nosso_lance` (text) - Percentual do nosso lance em relação ao estimado

  2. Alterações
    - Campos opcionais (nullable)
    - Valores numéricos com precisão para moeda
    - Campos de texto para percentuais formatados
*/

-- Adicionar colunas para lances e empresa vencedora
ALTER TABLE proposals 
ADD COLUMN IF NOT EXISTS lance_vencedor numeric(15,2),
ADD COLUMN IF NOT EXISTS nosso_lance numeric(15,2),
ADD COLUMN IF NOT EXISTS empresa_vencedora text,
ADD COLUMN IF NOT EXISTS percentual_vencedor text,
ADD COLUMN IF NOT EXISTS percentual_nosso_lance text;

-- Adicionar comentários para documentação
COMMENT ON COLUMN proposals.lance_vencedor IS 'Valor do lance vencedor da licitação';
COMMENT ON COLUMN proposals.nosso_lance IS 'Valor do nosso lance na licitação';
COMMENT ON COLUMN proposals.empresa_vencedora IS 'Nome da empresa que venceu a licitação';
COMMENT ON COLUMN proposals.percentual_vencedor IS 'Percentual do lance vencedor em relação ao valor estimado';
COMMENT ON COLUMN proposals.percentual_nosso_lance IS 'Percentual do nosso lance em relação ao valor estimado';