/*
  # Adicionar suporte para aditivos pontuais

  1. Modificações na Tabela
    - Adicionar coluna `is_punctual` (boolean) para marcar aditivos pontuais
    - Adicionar coluna `effective_start_date` (date) para início da vigência
    - Adicionar coluna `effective_end_date` (date) para fim da vigência
    - Adicionar coluna `is_active` (boolean) para controlar status

  2. Índices
    - Índice para consultas por vigência efetiva
    - Índice para consultas por status ativo

  3. Atualizações
    - Trigger para updated_at
    - Dados existentes marcados como não-pontuais e ativos
*/

-- Adicionar colunas para suporte a aditivos pontuais
DO $$
BEGIN
  -- Adicionar coluna is_punctual se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contract_addendums' AND column_name = 'is_punctual'
  ) THEN
    ALTER TABLE contract_addendums ADD COLUMN is_punctual boolean DEFAULT false NOT NULL;
  END IF;

  -- Adicionar coluna effective_start_date se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contract_addendums' AND column_name = 'effective_start_date'
  ) THEN
    ALTER TABLE contract_addendums ADD COLUMN effective_start_date date;
  END IF;

  -- Adicionar coluna effective_end_date se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contract_addendums' AND column_name = 'effective_end_date'
  ) THEN
    ALTER TABLE contract_addendums ADD COLUMN effective_end_date date;
  END IF;

  -- Adicionar coluna is_active se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contract_addendums' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE contract_addendums ADD COLUMN is_active boolean DEFAULT true NOT NULL;
  END IF;
END $$;

-- Atualizar dados existentes
UPDATE contract_addendums 
SET 
  is_punctual = false,
  effective_start_date = start_date,
  effective_end_date = end_date,
  is_active = true
WHERE is_punctual IS NULL OR effective_start_date IS NULL;

-- Criar índices para otimização
CREATE INDEX IF NOT EXISTS idx_contract_addendums_effective_dates 
ON contract_addendums (contract_id, effective_start_date, effective_end_date);

CREATE INDEX IF NOT EXISTS idx_contract_addendums_active 
ON contract_addendums (contract_id, is_active);

CREATE INDEX IF NOT EXISTS idx_contract_addendums_punctual 
ON contract_addendums (contract_id, is_punctual, effective_start_date);