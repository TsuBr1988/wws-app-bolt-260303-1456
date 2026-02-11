/*
  # Create Financial Contract Margin Table

  1. New Tables
    - `financial_contract_margin`
      - `id` (uuid, primary key)
      - `company` (text) - Company name (WWS or Worldwide)
      - `contract_name` (text) - Name of the contract
      - `budget_2025` (numeric) - Total budgeted amount for 2025
      - `month_ym` (text) - Month in YYYY-MM format
      - `amount_spent` (numeric) - Amount spent in the month
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `financial_contract_margin` table
    - Add policies for authenticated users to manage contract margin data

  3. Indexes
    - Index on `company` for filtering
    - Index on `contract_name` for filtering
    - Index on `month_ym` for date range queries
*/

CREATE TABLE IF NOT EXISTS financial_contract_margin (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company text NOT NULL CHECK (company IN ('WWS', 'Worldwide')),
  contract_name text NOT NULL,
  budget_2025 numeric NOT NULL DEFAULT 0,
  month_ym text NOT NULL,
  amount_spent numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_financial_contract_margin_company 
  ON financial_contract_margin(company);

CREATE INDEX IF NOT EXISTS idx_financial_contract_margin_contract 
  ON financial_contract_margin(contract_name);

CREATE INDEX IF NOT EXISTS idx_financial_contract_margin_month 
  ON financial_contract_margin(month_ym);

CREATE UNIQUE INDEX IF NOT EXISTS idx_financial_contract_margin_unique 
  ON financial_contract_margin(company, contract_name, month_ym);

ALTER TABLE financial_contract_margin ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view contract margin"
  ON financial_contract_margin
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert contract margin"
  ON financial_contract_margin
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update contract margin"
  ON financial_contract_margin
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete contract margin"
  ON financial_contract_margin
  FOR DELETE
  TO authenticated
  USING (true);