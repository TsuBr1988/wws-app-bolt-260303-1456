/*
  # Adicionar campo data_proxima_acao à tabela proposals

  1. Alterações na Tabela
    - Adiciona coluna `data_proxima_acao` (date, nullable)
    - Campo para armazenar a próxima data de ação no pregão

  2. Funcionalidade
    - Campo opcional para controle de cronograma
    - Permite ordenação por data da próxima ação
    - Editável através da interface
*/

-- Adicionar coluna data_proxima_acao à tabela proposals
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'proposals' AND column_name = 'data_proxima_acao'
  ) THEN
    ALTER TABLE proposals ADD COLUMN data_proxima_acao date;
  END IF;
END $$;

-- Criar índice para melhorar performance de ordenação
CREATE INDEX IF NOT EXISTS idx_proposals_data_proxima_acao 
  ON proposals (data_proxima_acao);

-- Comentário na coluna
COMMENT ON COLUMN proposals.data_proxima_acao IS 'Data da próxima ação no pregão (ex: abertura, recursos, etc)';