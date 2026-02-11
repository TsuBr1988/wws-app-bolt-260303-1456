/*
  # Criar tabela de Capex (Capital Expenditure)

  1. Nova Tabela
    - `capex` - Investimentos de capital para os postos
      - `id` (uuid, primary key)
      - `budget_id` (uuid, foreign key) - Referência ao orçamento
      - `name` (text) - Nome do item de capex
      - `brand` (text) - Marca/Fornecedor
      - `quantity` (integer) - Quantidade
      - `unit_value` (numeric) - Valor unitário
      - `total_value` (numeric) - Valor total
      - `amortization` (integer) - Meses de amortização
      - `monthly_value` (numeric) - Valor mensal após amortização
      - `allocated_functions` (text[]) - IDs das funções alocadas
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Segurança
    - Habilitar RLS
    - Política permissiva para todos (preparado para autenticação futura)
*/

-- Criar tabela de capex
CREATE TABLE IF NOT EXISTS capex (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  name text NOT NULL,
  brand text,
  quantity integer DEFAULT 1,
  unit_value numeric(10,2) NOT NULL,
  total_value numeric(10,2) NOT NULL,
  amortization integer DEFAULT 12,
  monthly_value numeric(10,2) NOT NULL,
  allocated_functions text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE capex ENABLE ROW LEVEL SECURITY;

-- Política permissiva para todos
CREATE POLICY "Allow all operations on capex"
  ON capex
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_capex_budget_id ON capex(budget_id);
