/*
  # Adicionar campo cidade na tabela de contratos

  1. Alterações na tabela
    - Adicionar coluna `city` na tabela `contracts`
    - Campo opcional (nullable) para permitir contratos existentes sem cidade
    - Valor padrão vazio para compatibilidade

  2. Índices
    - Adicionar índice na coluna cidade para melhorar performance de filtros
*/

-- Adicionar coluna cidade na tabela contracts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contracts' AND column_name = 'city'
  ) THEN
    ALTER TABLE contracts ADD COLUMN city text DEFAULT '';
  END IF;
END $$;

-- Adicionar índice para melhorar performance dos filtros por cidade
CREATE INDEX IF NOT EXISTS idx_contracts_city ON contracts(city);