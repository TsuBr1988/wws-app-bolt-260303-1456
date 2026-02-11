/*
  # Adicionar coluna data_assinatura para licitações

  1. Alterações na tabela
    - Adicionar coluna `data_assinatura` na tabela `proposals`
    - Coluna do tipo `date` para armazenar apenas a data (sem hora)
    - Nullable pois nem todos os contratos terão data de assinatura

  2. Funcionalidade
    - Quando um contrato for marcado como "Contrato assinado"
    - A data escolhida pelo usuário será salva nesta coluna
    - Esta data será considerada como data oficial de fechamento
*/

-- Adicionar coluna data_assinatura na tabela proposals
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'proposals' AND column_name = 'data_assinatura'
  ) THEN
    ALTER TABLE proposals ADD COLUMN data_assinatura date;
  END IF;
END $$;

-- Adicionar comentário para documentar a coluna
COMMENT ON COLUMN proposals.data_assinatura IS 'Data oficial de assinatura do contrato (quando situação = Contrato assinado)';