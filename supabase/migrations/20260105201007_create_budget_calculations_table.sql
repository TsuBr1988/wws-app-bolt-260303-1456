-- Tabela de cálculos de orçamentos
CREATE TABLE IF NOT EXISTS budget_calculations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid NOT NULL UNIQUE REFERENCES budgets(id) ON DELETE CASCADE,
  function_data jsonb NOT NULL,
  total_bdi numeric(10,4) NOT NULL,
  total_contract numeric(15,2) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE budget_calculations ENABLE ROW LEVEL SECURITY;

-- Política permissiva para todos (enquanto não há autenticação)
CREATE POLICY "Allow all operations on budget_calculations"
  ON budget_calculations
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_budget_calculations_budget_id ON budget_calculations(budget_id);