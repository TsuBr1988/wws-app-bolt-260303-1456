/*
  # Migrar colocacao_atual para posicao_atual

  1. Migração de Dados
    - Migrar dados de colocacao_atual para posicao_atual (se existir)
    - Remover coluna colocacao_atual se ela existir
    
  2. Limpeza
    - Garantir que apenas posicao_atual seja usado
    - Manter compatibilidade com dados existentes
*/

-- Migrar dados de colocacao_atual para posicao_atual se a coluna existir
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'proposals' AND column_name = 'colocacao_atual'
  ) THEN
    -- Migrar dados onde posicao_atual está vazio mas colocacao_atual tem valor
    UPDATE proposals
    SET posicao_atual = COALESCE(posicao_atual, colocacao_atual)
    WHERE colocacao_atual IS NOT NULL
      AND (posicao_atual IS NULL OR posicao_atual = '');
    
    -- Remover coluna colocacao_atual
    ALTER TABLE proposals DROP COLUMN colocacao_atual;
    
    RAISE NOTICE 'Coluna colocacao_atual migrada para posicao_atual e removida';
  ELSE
    RAISE NOTICE 'Coluna colocacao_atual não existe, nenhuma migração necessária';
  END IF;
END $$;

-- Garantir que posicao_atual existe
ALTER TABLE proposals 
ADD COLUMN IF NOT EXISTS posicao_atual text;

-- Comentário na coluna
COMMENT ON COLUMN proposals.posicao_atual IS 'Posição/colocação atual da empresa na licitação (ex: 1º lugar, 2º colocado, etc.)';