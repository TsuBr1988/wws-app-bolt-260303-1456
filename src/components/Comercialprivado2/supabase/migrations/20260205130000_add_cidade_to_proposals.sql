/*
  # Adicionar campo Cidade às Propostas

  1. Alterações
    - Adiciona coluna `cidade` (text) na tabela `proposals`
    - Campo opcional para armazenar a cidade da proposta

  2. Detalhes
    - Tipo: TEXT
    - NULL: Permitido (campo opcional)
    - Default: NULL
*/

-- Adicionar coluna cidade
ALTER TABLE proposals
ADD COLUMN IF NOT EXISTS cidade text;
