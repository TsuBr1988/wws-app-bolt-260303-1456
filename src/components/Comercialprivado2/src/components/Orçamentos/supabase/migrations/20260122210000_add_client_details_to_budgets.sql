/*
  # Adicionar Detalhes do Cliente à Tabela Budgets

  1. Alterações na Tabela `budgets`
    - `city_name` (text) - Nome da cidade do cliente
    - `cnpj` (text) - CNPJ do cliente
    - `email` (text) - E-mail do cliente
    - `phone` (text) - Telefone do cliente
    - `address` (text) - Endereço do cliente
    - `lead_source` (text) - Origem do lead (indicação, site, etc.)

  2. Notas
    - Todos os campos são opcionais para manter compatibilidade com dados existentes
*/

-- Adicionar colunas de detalhes do cliente
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'budgets' AND column_name = 'city_name'
  ) THEN
    ALTER TABLE budgets ADD COLUMN city_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'budgets' AND column_name = 'cnpj'
  ) THEN
    ALTER TABLE budgets ADD COLUMN cnpj text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'budgets' AND column_name = 'email'
  ) THEN
    ALTER TABLE budgets ADD COLUMN email text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'budgets' AND column_name = 'phone'
  ) THEN
    ALTER TABLE budgets ADD COLUMN phone text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'budgets' AND column_name = 'address'
  ) THEN
    ALTER TABLE budgets ADD COLUMN address text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'budgets' AND column_name = 'lead_source'
  ) THEN
    ALTER TABLE budgets ADD COLUMN lead_source text;
  END IF;
END $$;
