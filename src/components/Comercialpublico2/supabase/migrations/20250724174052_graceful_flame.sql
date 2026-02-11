/*
  # Adicionar campo 'Posição atual' para licitações da Petrobras

  1. Mudanças na tabela
    - Adicionar coluna `posicao_atual` na tabela `proposals`
    - Campo texto opcional para registrar posição atual da empresa na licitação

  2. Aplicação
    - Campo será usado apenas para departamento Petrobras
    - Permite texto livre para descrever situação atual
*/

-- Adicionar coluna posicao_atual na tabela proposals
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'proposals' AND column_name = 'posicao_atual'
  ) THEN
    ALTER TABLE proposals ADD COLUMN posicao_atual text;
  END IF;
END $$;

-- Adicionar comentário para documentar o campo
DO $$
BEGIN
  EXECUTE 'COMMENT ON COLUMN proposals.posicao_atual IS ''Posição atual da empresa na licitação (usado principalmente para Petrobras)''';
EXCEPTION
  WHEN OTHERS THEN
    -- Ignore error if comment already exists
    NULL;
END $$;