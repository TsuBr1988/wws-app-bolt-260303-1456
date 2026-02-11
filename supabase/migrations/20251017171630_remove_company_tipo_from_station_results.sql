/*
  # Remover colunas company e tipo da tabela financial_station_results

  1. Changes
    - Remove coluna `company` da tabela `financial_station_results`
    - Remove coluna `tipo` da tabela `financial_station_results`
    - Os dados de empresa, tipo e cidade agora vêm do cadastro de clientes

  2. Notas
    - Dados históricos de company e tipo serão perdidos
    - A relação será feita através do contract_name
*/

-- Remover coluna company
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'financial_station_results' AND column_name = 'company'
  ) THEN
    ALTER TABLE financial_station_results DROP COLUMN company;
  END IF;
END $$;

-- Remover coluna tipo
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'financial_station_results' AND column_name = 'tipo'
  ) THEN
    ALTER TABLE financial_station_results DROP COLUMN tipo;
  END IF;
END $$;