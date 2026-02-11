/*
  # Create OKR KPI Tracking System
  
  1. New Tables
    - `okr_kpi_data`
      - `id` (uuid, primary key)
      - `okr_id` (integer, required) - ID do OKR (1-6)
      - `kpi_name` (text, required) - Nome do KPI
      - `date` (date, required) - Data da medição
      - `value` (text, required) - Valor do KPI (texto para flexibilidade)
      - `created_by` (uuid) - Usuário que criou
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on okr_kpi_data table
    - Add policies for authenticated users to read
    - Add policies for authenticated users to insert/update/delete
  
  3. Important Notes
    - Unique constraint on (okr_id, kpi_name, date) to prevent duplicates
    - Values stored as text for flexibility (percentages, numbers, etc)
*/

-- Create okr_kpi_data table
CREATE TABLE IF NOT EXISTS okr_kpi_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  okr_id integer NOT NULL,
  kpi_name text NOT NULL,
  date date NOT NULL,
  value text NOT NULL,
  created_by uuid REFERENCES app_users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(okr_id, kpi_name, date)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_okr_kpi_data_okr_id ON okr_kpi_data(okr_id);
CREATE INDEX IF NOT EXISTS idx_okr_kpi_data_date ON okr_kpi_data(date);
CREATE INDEX IF NOT EXISTS idx_okr_kpi_data_kpi_name ON okr_kpi_data(kpi_name);

-- Enable RLS
ALTER TABLE okr_kpi_data ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Authenticated users can view OKR KPI data"
  ON okr_kpi_data FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert OKR KPI data"
  ON okr_kpi_data FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update OKR KPI data"
  ON okr_kpi_data FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete OKR KPI data"
  ON okr_kpi_data FOR DELETE
  TO authenticated
  USING (true);

-- Allow public access as well (for compatibility with existing auth system)
CREATE POLICY "Public can view OKR KPI data"
  ON okr_kpi_data FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can insert OKR KPI data"
  ON okr_kpi_data FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can update OKR KPI data"
  ON okr_kpi_data FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public can delete OKR KPI data"
  ON okr_kpi_data FOR DELETE
  TO public
  USING (true);
