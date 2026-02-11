/*
  # Criar tabela de outros itens

  1. Nova Tabela
    - `others` (outros itens)
      - `id` (uuid, primary key)
      - `budget_id` (uuid, foreign key) - Referência ao orçamento
      - `name` (text) - Nome do item
      - `brand` (text) - Marca
      - `quantity` (numeric) - Quantidade
      - `unit_value` (numeric) - Valor unitário
      - `total_value` (numeric) - Valor total
      - `amortization` (integer) - Amortização em meses
      - `monthly_value` (numeric) - Valor mensal calculado (total / amortização)
      - `allocated_functions` (text[]) - IDs das funções alocadas
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Segurança
    - Habilitar RLS na tabela
    - Política permissiva para todos (enquanto não há autenticação)
*/

CREATE TABLE IF NOT EXISTS others (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  name text NOT NULL,
  brand text DEFAULT '',
  quantity numeric(10,2) DEFAULT 1,
  unit_value numeric(10,2) DEFAULT 0,
  total_value numeric(10,2) DEFAULT 0,
  amortization integer DEFAULT 12,
  monthly_value numeric(10,2) DEFAULT 0,
  allocated_functions text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE others ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on others"
  ON others
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_others_budget_id ON others(budget_id);
