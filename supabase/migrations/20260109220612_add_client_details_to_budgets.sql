/*
  # Adicionar Detalhes do Cliente à Tabela Budgets

  1. Alterações na Tabela `budgets`
    - `client` (text) - Nome do cliente
    - `project_name` (text) - Nome do projeto
    - `email` (text) - E-mail do cliente
    - `phone` (text) - Telefone do cliente
    - `address` (text) - Endereço do cliente
    - `total_value` (numeric) - Valor total do orçamento

  2. Segurança
    - Manter RLS habilitado
    - Políticas já existentes continuam válidas
*/

-- Adicionar novas colunas na tabela budgets
DO $$
BEGIN
  -- Adicionar coluna client (se não existir)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'budgets' AND column_name = 'client'
  ) THEN
    ALTER TABLE budgets ADD COLUMN client text;
  END IF;

  -- Adicionar coluna project_name (se não existir)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'budgets' AND column_name = 'project_name'
  ) THEN
    ALTER TABLE budgets ADD COLUMN project_name text;
  END IF;

  -- Adicionar coluna email (se não existir)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'budgets' AND column_name = 'email'
  ) THEN
    ALTER TABLE budgets ADD COLUMN email text;
  END IF;

  -- Adicionar coluna phone (se não existir)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'budgets' AND column_name = 'phone'
  ) THEN
    ALTER TABLE budgets ADD COLUMN phone text;
  END IF;

  -- Adicionar coluna address (se não existir)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'budgets' AND column_name = 'address'
  ) THEN
    ALTER TABLE budgets ADD COLUMN address text;
  END IF;

  -- Adicionar coluna total_value (se não existir)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'budgets' AND column_name = 'total_value'
  ) THEN
    ALTER TABLE budgets ADD COLUMN total_value numeric(12,2) DEFAULT 0;
  END IF;
END $$;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_budgets_client ON budgets(client);
CREATE INDEX IF NOT EXISTS idx_budgets_email ON budgets(email);
