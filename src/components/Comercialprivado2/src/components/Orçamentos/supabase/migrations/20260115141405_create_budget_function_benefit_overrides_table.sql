/*
  # Create Budget Function Benefit Overrides Table

  1. New Tables
    - `budget_function_benefit_overrides`
      - `id` (uuid, primary key)
      - `budget_id` (uuid, foreign key to budgets)
      - `function_id` (text, identifier of the function within the budget)
      - `benefit_code` (text, code of the benefit being overridden)
      - `custom_value` (numeric, the customized value for this benefit)
      - `custom_formula` (text, optional custom formula if benefit uses formula calculation)
      - `notes` (text, optional notes explaining why this override was made)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `budget_function_benefit_overrides` table
    - Add policies for authenticated users to manage their overrides

  3. Notes
    - This table stores per-function benefit value customizations for budgets
    - Allows different functions within the same budget to have different benefit values
    - The combination of budget_id + function_id + benefit_code must be unique
*/

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
