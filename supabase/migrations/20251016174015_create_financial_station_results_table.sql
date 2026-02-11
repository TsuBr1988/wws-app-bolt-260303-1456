/*
  # Create Financial Station Results Table

  1. New Tables
    - `financial_station_results`
      - `id` (uuid, primary key)
      - `company` (text) - Company name (WWS or Worldwide)
      - `contract_name` (text) - Name of the contract
      - `month_ym` (text) - Month in YYYY-MM format
      - `revenue` (numeric) - Faturamento (revenue for the month)
      - `payroll_ft` (numeric) - Folha + FT
      - `csv_total` (numeric) - CSV Total
      - `contribution_margin` (numeric) - Margem de contribuição
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `financial_station_results` table
    - Add policies for authenticated users to manage station results data

  3. Indexes
    - Index on `company` for filtering
    - Index on `contract_name` for filtering
    - Index on `month_ym` for date range queries
*/

CREATE TABLE IF NOT EXISTS financial_station_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company text NOT NULL CHECK (company IN ('WWS', 'Worldwide')),
  contract_name text NOT NULL,
  month_ym text NOT NULL,
  revenue numeric NOT NULL DEFAULT 0,
  payroll_ft numeric NOT NULL DEFAULT 0,
  csv_total numeric NOT NULL DEFAULT 0,
  contribution_margin numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_financial_station_results_company 
  ON financial_station_results(company);

CREATE INDEX IF NOT EXISTS idx_financial_station_results_contract 
  ON financial_station_results(contract_name);

CREATE INDEX IF NOT EXISTS idx_financial_station_results_month 
  ON financial_station_results(month_ym);

CREATE UNIQUE INDEX IF NOT EXISTS idx_financial_station_results_unique 
  ON financial_station_results(company, contract_name, month_ym);

ALTER TABLE financial_station_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view station results"
  ON financial_station_results
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert station results"
  ON financial_station_results
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update station results"
  ON financial_station_results
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete station results"
  ON financial_station_results
  FOR DELETE
  TO authenticated
  USING (true);