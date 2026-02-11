/*
  # Create uniforms table

  1. New Tables
    - `uniforms`
      - `id` (uuid, primary key) - Unique identifier for the uniform
      - `budget_id` (uuid, foreign key) - Reference to the budget
      - `name` (text) - Name of the uniform
      - `brand` (text) - Brand of the uniform
      - `quantity` (numeric) - Quantity of uniforms
      - `unit_value` (numeric) - Unit price of the uniform
      - `total_value` (numeric) - Total value (quantity × unit_value)
      - `amortization` (integer) - Amortization period in months
      - `monthly_value` (numeric) - Monthly amortized value
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Record update timestamp

  2. Security
    - Enable RLS on `uniforms` table
    - Permissive policy for all operations (until authentication is added)

  3. Important Notes
    - This table follows the same structure as materials and equipments tables
    - All monetary values are stored with 2 decimal precision
    - Foreign key constraint ensures data integrity with budgets table
*/

CREATE TABLE IF NOT EXISTS uniforms (
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

ALTER TABLE uniforms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on uniforms"
  ON uniforms
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_uniforms_budget_id ON uniforms(budget_id);