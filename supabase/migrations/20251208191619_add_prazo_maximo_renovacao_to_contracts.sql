/*
  # Adicionar Prazo Máximo de Renovação aos Contratos

  1. Alterações
    - Adiciona coluna `prazo_maximo_renovacao` à tabela `contracts`
      - Tipo: integer (número de meses)
      - Permite valores nulos para contratos antigos que não têm essa informação
      - Valores válidos: números positivos representando meses

  2. Importante
    - Contratos existentes terão este campo como NULL
    - Novos contratos podem ter este campo preenchido opcionalmente
    - Este campo indica por quantos meses o contrato pode ser renovado no máximo
*/

-- Add prazo_maximo_renovacao column to contracts table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contracts' AND column_name = 'prazo_maximo_renovacao'
  ) THEN
    ALTER TABLE contracts ADD COLUMN prazo_maximo_renovacao integer;
  END IF;
END $$;

-- Add check constraint to ensure positive values when not null
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'contracts_prazo_maximo_renovacao_check'
  ) THEN
    ALTER TABLE contracts
    ADD CONSTRAINT contracts_prazo_maximo_renovacao_check
    CHECK (prazo_maximo_renovacao IS NULL OR prazo_maximo_renovacao > 0);
  END IF;
END $$;