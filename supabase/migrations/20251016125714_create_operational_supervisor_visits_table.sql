/*
  # Create Operational Supervisor Visits Table

  1. New Tables
    - `operational_supervisor_visits`
      - `id` (uuid, primary key)
      - `company` (text) - Company name (WWS or Worldwide)
      - `supervisor_name` (text) - Name of the supervisor
      - `month_ym` (text) - Month in YYYY-MM format
      - `visits_count` (integer) - Number of visits made
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `operational_supervisor_visits` table
    - Add policies for authenticated users to manage supervisor visits data

  3. Indexes
    - Index on `company` for filtering
    - Index on `supervisor_name` for filtering
    - Index on `month_ym` for date range queries
*/

CREATE TABLE IF NOT EXISTS operational_supervisor_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company text NOT NULL CHECK (company IN ('WWS', 'Worldwide')),
  supervisor_name text NOT NULL,
  month_ym text NOT NULL,
  visits_count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_operational_supervisor_visits_company 
  ON operational_supervisor_visits(company);

CREATE INDEX IF NOT EXISTS idx_operational_supervisor_visits_supervisor 
  ON operational_supervisor_visits(supervisor_name);

CREATE INDEX IF NOT EXISTS idx_operational_supervisor_visits_month 
  ON operational_supervisor_visits(month_ym);

CREATE UNIQUE INDEX IF NOT EXISTS idx_operational_supervisor_visits_unique 
  ON operational_supervisor_visits(company, supervisor_name, month_ym);

ALTER TABLE operational_supervisor_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view supervisor visits"
  ON operational_supervisor_visits
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert supervisor visits"
  ON operational_supervisor_visits
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update supervisor visits"
  ON operational_supervisor_visits
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete supervisor visits"
  ON operational_supervisor_visits
  FOR DELETE
  TO authenticated
  USING (true);