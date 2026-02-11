/*
  # Criar tabela de equipamentos

  1. Nova Tabela
    - `equipments` (equipamentos)
      - `id` (uuid, primary key)
      - `budget_id` (uuid, foreign key) - Referência ao orçamento
      - `name` (text) - Nome do equipamento
      - `brand` (text) - Marca
      - `quantity` (numeric) - Quantidade
      - `unit_value` (numeric) - Valor unitário
      - `total_value` (numeric) - Valor total
      - `amortization` (integer) - Amortização em meses
      - `monthly_value` (numeric) - Valor mensal calculado (total / amortização)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Segurança
    - Habilitar RLS na tabela
    - Política permissiva para todos (enquanto não há autenticação)
*/

CREATE TABLE IF NOT EXISTS equipments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  name text NOT NULL,
  brand text DEFAULT '',
  quantity numeric(10,2) DEFAULT 1,
  unit_value numeric(10,2) DEFAULT 0,
  total_value numeric(10,2) DEFAULT 0,
  amortization integer DEFAULT 12,
  monthly_value numeric(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE equipments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on equipments"
  ON equipments
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_equipments_budget_id ON equipments(budget_id);