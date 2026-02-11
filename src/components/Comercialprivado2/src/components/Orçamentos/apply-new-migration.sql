-- Migration: Create Budget Function Benefit Overrides Table

CREATE TABLE IF NOT EXISTS budget_function_benefit_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id text NOT NULL,
  function_id text NOT NULL,
  benefit_code text NOT NULL,
  custom_value numeric NOT NULL DEFAULT 0,
  custom_formula text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(budget_id, function_id, benefit_code)
);

ALTER TABLE budget_function_benefit_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on benefit overrides"
  ON budget_function_benefit_overrides
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_budget_function_benefit_overrides_budget_id
  ON budget_function_benefit_overrides(budget_id);

CREATE INDEX IF NOT EXISTS idx_budget_function_benefit_overrides_function_id
  ON budget_function_benefit_overrides(budget_id, function_id);
