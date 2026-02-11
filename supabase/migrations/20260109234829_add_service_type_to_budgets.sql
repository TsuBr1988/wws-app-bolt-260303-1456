/*
  # Adicionar tipo de serviço aos orçamentos

  1. Mudanças na Tabela budgets
    - Adicionar coluna `service_type` (text) - Tipo de serviço: 'facilities' ou 'vigilancia'
    - Adicionar índice para facilitar filtros
*/

-- Adicionar coluna service_type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'budgets' AND column_name = 'service_type'
  ) THEN
    ALTER TABLE budgets ADD COLUMN service_type text DEFAULT 'facilities';
  END IF;
END $$;

-- Criar índice para melhor performance em filtros
CREATE INDEX IF NOT EXISTS idx_budgets_service_type ON budgets(service_type);