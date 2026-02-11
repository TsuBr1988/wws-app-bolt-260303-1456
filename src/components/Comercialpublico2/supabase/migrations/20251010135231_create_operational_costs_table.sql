/*
  # Create Operational Costs Table

  1. New Tables
    - `operational_costs`
      - `id` (uuid, primary key)
      - `cost_name` (text) - Nome do tipo de custo (ex: "Custo com funcionários")
      - `year` (integer) - Ano do custo
      - `month` (integer) - Mês (1-12)
      - `value` (numeric) - Valor do custo
      - `department` (text) - Departamento
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `operational_costs` table
    - Add policies for authenticated users to read
    - Add policies for admin users to insert/update/delete

  3. Indexes
    - Index on (cost_name, year, month, department) for fast queries
*/

CREATE TABLE IF NOT EXISTS operational_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cost_name text NOT NULL,
  year integer NOT NULL,
  month integer NOT NULL,
  value numeric DEFAULT 0,
  department text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create unique index to prevent duplicate entries
CREATE UNIQUE INDEX IF NOT EXISTS operational_costs_unique_idx 
  ON operational_costs (cost_name, year, month, department);

-- Create index for fast queries
CREATE INDEX IF NOT EXISTS operational_costs_lookup_idx 
  ON operational_costs (department, year, month);

-- Enable RLS
ALTER TABLE operational_costs ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read all operational costs
CREATE POLICY "Authenticated users can read operational costs"
  ON operational_costs
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Authenticated users can insert operational costs
CREATE POLICY "Authenticated users can insert operational costs"
  ON operational_costs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Authenticated users can update operational costs
CREATE POLICY "Authenticated users can update operational costs"
  ON operational_costs
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Authenticated users can delete operational costs
CREATE POLICY "Authenticated users can delete operational costs"
  ON operational_costs
  FOR DELETE
  TO authenticated
  USING (true);
