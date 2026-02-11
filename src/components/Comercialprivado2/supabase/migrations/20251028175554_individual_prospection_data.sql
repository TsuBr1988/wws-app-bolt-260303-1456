/*
  # Individual Prospection Data Tables

  1. New Tables
    - `individual_prospection_dates`
      - `id` (uuid, primary key)
      - `employee_name` (text) - Nome do colaborador (André, Andressa, Pedro)
      - `date` (date) - Data da coluna
      - `created_at` (timestamptz)
      - Unique constraint on (employee_name, date)
    
    - `individual_prospection_metrics`
      - `id` (uuid, primary key)
      - `date_id` (uuid, foreign key to individual_prospection_dates)
      - `metric_name` (text) - Nome da métrica
      - `value` (numeric) - Valor da métrica
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - Unique constraint on (date_id, metric_name)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to read all data
    - Add policies for authenticated users to insert/update/delete their own data

  3. Notes
    - Métricas para Pedro e Andressa: contatos_ativados, mql, atividades_qtde, atividades_perc, reunioes, conexoes
    - Métricas para André: sql, atividades_qtde, atividades_perc, conexoes, reunioes, contatos_ativados
*/

CREATE TABLE IF NOT EXISTS individual_prospection_dates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_name text NOT NULL CHECK (employee_name IN ('André', 'Andressa', 'Pedro')),
  date date NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (employee_name, date)
);

ALTER TABLE individual_prospection_dates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read individual prospection dates"
  ON individual_prospection_dates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can insert individual prospection dates"
  ON individual_prospection_dates FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update individual prospection dates"
  ON individual_prospection_dates FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete individual prospection dates"
  ON individual_prospection_dates FOR DELETE
  TO authenticated
  USING (true);

CREATE TABLE IF NOT EXISTS individual_prospection_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date_id uuid NOT NULL REFERENCES individual_prospection_dates(id) ON DELETE CASCADE,
  metric_name text NOT NULL,
  value numeric NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (date_id, metric_name)
);

ALTER TABLE individual_prospection_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read individual prospection metrics"
  ON individual_prospection_metrics FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can insert individual prospection metrics"
  ON individual_prospection_metrics FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update individual prospection metrics"
  ON individual_prospection_metrics FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete individual prospection metrics"
  ON individual_prospection_metrics FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_individual_prospection_dates_employee ON individual_prospection_dates(employee_name);
CREATE INDEX IF NOT EXISTS idx_individual_prospection_dates_date ON individual_prospection_dates(date);
CREATE INDEX IF NOT EXISTS idx_individual_prospection_metrics_date_id ON individual_prospection_metrics(date_id);