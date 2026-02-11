/*
  # Create Differentiated Benefits Table

  1. New Tables
    - `differentiated_benefits`
      - `id` (uuid, primary key)
      - `budget_id` (uuid, references budgets)
      - `function_id` (uuid, references budget_functions)
      - `name` (text) - Nome do benefício
      - `monthly_value` (numeric) - Valor mensal do benefício
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS
    - Add policies for authenticated users
*/

CREATE TABLE IF NOT EXISTS differentiated_benefits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id uuid NOT NULL,
  function_id text NOT NULL,
  name text NOT NULL,
  monthly_value numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE differentiated_benefits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for authenticated users"
  ON differentiated_benefits
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow all operations for anon users"
  ON differentiated_benefits
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);
