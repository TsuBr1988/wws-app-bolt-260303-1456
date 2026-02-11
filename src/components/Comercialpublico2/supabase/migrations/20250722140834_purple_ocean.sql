/*
  # Adicionar coluna months à tabela proposals

  1. Alterações na tabela
    - Adicionar coluna `months` (integer) com valor padrão 12
    - Permite especificar a duração do contrato em meses
    - Usado para calcular valor mensal correto (total_value / months)

  2. Notas importantes
    - Valor padrão: 12 meses (padrão para contratos anuais)
    - Não pode ser NULL
    - Mínimo 1 mês para evitar divisão por zero
*/

-- Adicionar coluna months se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'proposals' AND column_name = 'months'
  ) THEN
    ALTER TABLE proposals ADD COLUMN months integer NOT NULL DEFAULT 12;
  END IF;
END $$;

-- Adicionar constraint para garantir que months seja positivo
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'proposals_months_positive'
  ) THEN
    ALTER TABLE proposals ADD CONSTRAINT proposals_months_positive CHECK (months > 0);
  END IF;
END $$;

-- Atualizar registros existentes que possam ter months = 0
UPDATE proposals SET months = 12 WHERE months IS NULL OR months <= 0;