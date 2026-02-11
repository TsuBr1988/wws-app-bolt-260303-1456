/*
  # Atualizar Sistema de Orçamentos - Informações do Cliente

  1. Alterações na Tabela `budgets`
    - `budget_number` (text) - Número sequencial no formato Ano-XXX
    - `client_name` (text) - Nome do cliente
    - `description` (text) - Descrição breve do orçamento
    - `status` (text) - Status do orçamento (open, closed)
    - `year` (integer) - Ano do orçamento
    - `sequence_number` (integer) - Número sequencial

  2. Função para gerar próximo número de orçamento
    - Cria função PL/pgSQL para gerar número sequencial automaticamente

  3. Índices para melhor performance
    - Índice em budget_number
    - Índice em status
*/

-- Adicionar novas colunas na tabela budgets
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'budgets' AND column_name = 'budget_number'
  ) THEN
    ALTER TABLE budgets ADD COLUMN budget_number text UNIQUE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'budgets' AND column_name = 'client_name'
  ) THEN
    ALTER TABLE budgets ADD COLUMN client_name text NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'budgets' AND column_name = 'description'
  ) THEN
    ALTER TABLE budgets ADD COLUMN description text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'budgets' AND column_name = 'status'
  ) THEN
    ALTER TABLE budgets ADD COLUMN status text DEFAULT 'open';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'budgets' AND column_name = 'year'
  ) THEN
    ALTER TABLE budgets ADD COLUMN year integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'budgets' AND column_name = 'sequence_number'
  ) THEN
    ALTER TABLE budgets ADD COLUMN sequence_number integer;
  END IF;
END $$;

-- Criar função para gerar próximo número de orçamento
CREATE OR REPLACE FUNCTION get_next_budget_number(p_year integer)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_sequence integer;
  v_budget_number text;
BEGIN
  -- Buscar o próximo número sequencial para o ano
  SELECT COALESCE(MAX(sequence_number), 0) + 1
  INTO v_sequence
  FROM budgets
  WHERE year = p_year;

  -- Formatar como Ano-XXX
  v_budget_number := p_year || '-' || LPAD(v_sequence::text, 3, '0');

  RETURN v_budget_number;
END;
$$;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_budgets_budget_number ON budgets(budget_number);
CREATE INDEX IF NOT EXISTS idx_budgets_status ON budgets(status);
CREATE INDEX IF NOT EXISTS idx_budgets_year ON budgets(year);
