/*
  # Create Operational Client Visits Table

  1. New Tables
    - `operational_client_visits`
      - `id` (uuid, primary key)
      - `company` (text) - Company name (WWS or Worldwide)
      - `contract_name` (text) - Name of the client contract
      - `month_ym` (text) - Month in YYYY-MM format
      - `visits_count` (integer) - Number of visits made
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `operational_client_visits` table
    - Add policies for authenticated users to manage client visits data

  3. Indexes
    - Index on `company` for filtering
    - Index on `contract_name` for filtering
    - Index on `month_ym` for date range queries
*/

CREATE TABLE IF NOT EXISTS operational_client_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company text NOT NULL CHECK (company IN ('WWS', 'Worldwide')),
  contract_name text NOT NULL,
  month_ym text NOT NULL,
  visits_count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_operational_client_visits_company 
  ON operational_client_visits(company);

CREATE INDEX IF NOT EXISTS idx_operational_client_visits_contract 
  ON operational_client_visits(contract_name);

CREATE INDEX IF NOT EXISTS idx_operational_client_visits_month 
  ON operational_client_visits(month_ym);

CREATE UNIQUE INDEX IF NOT EXISTS idx_operational_client_visits_unique 
  ON operational_client_visits(company, contract_name, month_ym);

ALTER TABLE operational_client_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view client visits"
  ON operational_client_visits
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert client visits"
  ON operational_client_visits
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update client visits"
  ON operational_client_visits
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete client visits"
  ON operational_client_visits
  FOR DELETE
  TO authenticated
  USING (true);